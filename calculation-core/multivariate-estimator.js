(function initialiseMultivariateEstimatorCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ATHMultivariateEstimator = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMultivariateEstimatorCore() {
  'use strict';

  const EPSILON = 1e-9;
  const MODEL_REGISTRY = Object.freeze({
    linear: Object.freeze({
      id: 'linear',
      label: 'Linear regression',
      featureFamily: 'linear',
      selectionThreshold: 1,
      termSummary: 'linear terms',
      interpretation: 'Simplest and easiest to explain'
    }),
    ridge: Object.freeze({
      id: 'ridge',
      label: 'Ridge regression',
      featureFamily: 'linear',
      selectionThreshold: 0.995,
      termSummary: 'linear terms with coefficient penalty',
      interpretation: 'Stable linear estimate for correlated inputs'
    }),
    lasso: Object.freeze({
      id: 'lasso',
      label: 'Lasso regression',
      featureFamily: 'linear',
      selectionThreshold: 0.995,
      termSummary: 'linear terms with coefficient selection penalty',
      interpretation: 'Sparse linear estimate that can reduce weak input effects'
    }),
    robust: Object.freeze({
      id: 'robust',
      label: 'Robust regression',
      featureFamily: 'linear',
      selectionThreshold: 0.995,
      termSummary: 'linear terms with outlier-resistant weighting',
      interpretation: 'Linear estimate with reduced influence from unusual observations'
    }),
    polynomial: Object.freeze({
      id: 'polynomial',
      label: 'Polynomial degree 2',
      featureFamily: 'polynomial',
      selectionThreshold: 0.98,
      termSummary: 'terms including squares and interactions',
      interpretation: 'Most flexible; higher overfitting risk'
    }),
    knn: Object.freeze({
      id: 'knn',
      label: 'k-Nearest Neighbour estimator',
      featureFamily: 'distance',
      selectionThreshold: 0.99,
      termSummary: 'nearest-neighbour distance weights',
      interpretation: 'Local estimate based on the most similar historical observations'
    })
  });
  const AUTO_SELECT_MODEL_IDS = Object.freeze(['linear', 'ridge', 'lasso', 'robust', 'polynomial', 'knn']);

  function getModelDefinition(modelType) {
    return MODEL_REGISTRY[modelType] || MODEL_REGISTRY.linear;
  }

  function availableModels() {
    return AUTO_SELECT_MODEL_IDS.map((id) => MODEL_REGISTRY[id]);
  }

  function toNumber(value, label) {
    if (value === null || value === undefined || String(value).trim() === '') {
      throw new Error(`${label} is required.`);
    }
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${label} must be numeric.`);
    return number;
  }

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function variance(values) {
    const avg = mean(values);
    return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / Math.max(1, values.length - 1);
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function transpose(matrix) {
    return matrix[0].map((_, column) => matrix.map((row) => row[column]));
  }

  function multiplyMatrices(a, b) {
    return a.map((row) => b[0].map((_, column) => row.reduce((sum, value, index) => sum + value * b[index][column], 0)));
  }

  function multiplyMatrixVector(matrix, vector) {
    return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
  }

  function solveLinearSystem(inputMatrix, inputVector) {
    const n = inputMatrix.length;
    const matrix = inputMatrix.map((row, index) => [...row, inputVector[index]]);
    for (let column = 0; column < n; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < n; row += 1) {
        if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
      }
      if (Math.abs(matrix[pivot][column]) < EPSILON) throw new Error('The regression system is singular. Remove duplicate or highly collinear inputs.');
      [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
      const divisor = matrix[column][column];
      for (let c = column; c <= n; c += 1) matrix[column][c] /= divisor;
      for (let row = 0; row < n; row += 1) {
        if (row === column) continue;
        const factor = matrix[row][column];
        for (let c = column; c <= n; c += 1) matrix[row][c] -= factor * matrix[column][c];
      }
    }
    return matrix.map((row) => row[n]);
  }

  function combinations(items, size) {
    const result = [];
    function walk(start, chosen) {
      if (chosen.length === size) {
        result.push([...chosen]);
        return;
      }
      for (let index = start; index <= items.length - (size - chosen.length); index += 1) {
        chosen.push(items[index]);
        walk(index + 1, chosen);
        chosen.pop();
      }
    }
    walk(0, []);
    return result;
  }

  function createFeatureSpec(inputNames, modelType) {
    const definition = getModelDefinition(modelType);
    const terms = [{ type: 'intercept', label: 'Intercept' }];
    inputNames.forEach((name, index) => terms.push({ type: 'linear', indexes: [index], label: name }));
    if (definition.featureFamily === 'polynomial') {
      inputNames.forEach((name, index) => terms.push({ type: 'square', indexes: [index], label: `${name}^2` }));
      for (let i = 0; i < inputNames.length; i += 1) {
        for (let j = i + 1; j < inputNames.length; j += 1) {
          terms.push({ type: 'interaction', indexes: [i, j], label: `${inputNames[i]} x ${inputNames[j]}` });
        }
      }
    }
    return terms;
  }

  function transformRow(inputs, terms) {
    return terms.map((term) => {
      if (term.type === 'intercept') return 1;
      if (term.type === 'linear') return inputs[term.indexes[0]];
      if (term.type === 'square') return inputs[term.indexes[0]] ** 2;
      return inputs[term.indexes[0]] * inputs[term.indexes[1]];
    });
  }

  function standardiseInputs(rows, stats) {
    return rows.map((row) => row.map((value, index) => (value - stats[index].mean) / stats[index].sd));
  }

  function modelDisplayName(modelType) {
    return getModelDefinition(modelType).label;
  }

  function fitOutputModel(featureMatrix, y, options = {}) {
    const xT = transpose(featureMatrix);
    const xTx = multiplyMatrices(xT, featureMatrix);
    const xTy = multiplyMatrixVector(xT, y);
    const lambda = Number.isFinite(options.penalty) ? options.penalty : 1e-8;
    for (let i = 1; i < xTx.length; i += 1) xTx[i][i] += lambda;
    return solveLinearSystem(xTx, xTy);
  }

  function fitWeightedOutputModel(featureMatrix, y, weights, options = {}) {
    const lambda = Number.isFinite(options.penalty) ? options.penalty : 1e-8;
    const p = featureMatrix[0].length;
    const xTx = Array.from({ length: p }, () => Array(p).fill(0));
    const xTy = Array(p).fill(0);
    featureMatrix.forEach((features, rowIndex) => {
      const weight = weights[rowIndex];
      for (let i = 0; i < p; i += 1) {
        xTy[i] += weight * features[i] * y[rowIndex];
        for (let j = 0; j < p; j += 1) {
          xTx[i][j] += weight * features[i] * features[j];
        }
      }
    });
    for (let i = 1; i < xTx.length; i += 1) xTx[i][i] += lambda;
    return solveLinearSystem(xTx, xTy);
  }

  function softThreshold(value, lambda) {
    if (value > lambda) return value - lambda;
    if (value < -lambda) return value + lambda;
    return 0;
  }

  function fitLassoOutputModel(featureMatrix, y, penalty) {
    const coefficients = Array(featureMatrix[0].length).fill(0);
    coefficients[0] = mean(y);
    const z = coefficients.map((_, column) => featureMatrix.reduce((sum, row) => sum + row[column] ** 2, 0));
    for (let iteration = 0; iteration < 250; iteration += 1) {
      let maxChange = 0;
      coefficients[0] = mean(y.map((value, rowIndex) => {
        const nonIntercept = coefficients.slice(1).reduce((sum, coefficient, index) => sum + coefficient * featureMatrix[rowIndex][index + 1], 0);
        return value - nonIntercept;
      }));
      for (let column = 1; column < coefficients.length; column += 1) {
        let rho = 0;
        for (let row = 0; row < featureMatrix.length; row += 1) {
          const predictedWithoutColumn = coefficients.reduce((sum, coefficient, index) => (
            index === column ? sum : sum + coefficient * featureMatrix[row][index]
          ), 0);
          rho += featureMatrix[row][column] * (y[row] - predictedWithoutColumn);
        }
        const next = softThreshold(rho, penalty) / Math.max(z[column], EPSILON);
        maxChange = Math.max(maxChange, Math.abs(next - coefficients[column]));
        coefficients[column] = next;
      }
      if (maxChange < 1e-8) break;
    }
    return coefficients;
  }

  function fitRobustOutputModel(featureMatrix, y, options = {}) {
    let coefficients = fitOutputModel(featureMatrix, y, { penalty: options.penalty || 1e-8 });
    for (let iteration = 0; iteration < 20; iteration += 1) {
      const residuals = featureMatrix.map((features, index) => y[index] - predictRow(coefficients, features));
      const centre = median(residuals);
      const mad = median(residuals.map((residual) => Math.abs(residual - centre)));
      const scale = Math.max(1.4826 * mad, Math.sqrt(residuals.reduce((sum, residual) => sum + residual ** 2, 0) / residuals.length), EPSILON);
      const delta = 1.345 * scale;
      const weights = residuals.map((residual) => {
        const magnitude = Math.abs(residual);
        return magnitude <= delta ? 1 : delta / magnitude;
      });
      const next = fitWeightedOutputModel(featureMatrix, y, weights, { penalty: options.penalty || 1e-8 });
      const change = next.reduce((max, coefficient, index) => Math.max(max, Math.abs(coefficient - coefficients[index])), 0);
      coefficients = next;
      if (change < 1e-7) break;
    }
    return coefficients;
  }

  function predictRow(coefficients, features) {
    return coefficients.reduce((sum, coefficient, index) => sum + coefficient * features[index], 0);
  }

  function chooseK(rowCount) {
    return Math.max(1, Math.min(5, Math.round(Math.sqrt(rowCount))));
  }

  function kNearestPrediction(trainingFeatures, outputValues, scenarioFeatures, k) {
    const neighbours = trainingFeatures.map((features, index) => ({
      index,
      distance: Math.sqrt(features.reduce((sum, value, column) => sum + (value - scenarioFeatures[column]) ** 2, 0))
    })).sort((a, b) => a.distance - b.distance || a.index - b.index).slice(0, k);
    if (neighbours[0]?.distance <= EPSILON) {
      return { estimate: outputValues[neighbours[0].index], neighbours: [neighbours[0]] };
    }
    const weights = neighbours.map((neighbour) => 1 / Math.max(neighbour.distance, EPSILON));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    const estimate = neighbours.reduce((sum, neighbour, index) => sum + outputValues[neighbour.index] * weights[index] / totalWeight, 0);
    return { estimate, neighbours };
  }

  function metrics(actual, predicted, parameterCount) {
    const n = actual.length;
    const avg = mean(actual);
    const sse = actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0);
    const sae = actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0);
    const sst = actual.reduce((sum, value) => sum + (value - avg) ** 2, 0);
    const rSquared = sst <= EPSILON ? 1 : 1 - (sse / sst);
    const adjustedRSquared = n - parameterCount <= 0
      ? null
      : 1 - ((1 - rSquared) * (n - 1) / (n - parameterCount));
    return {
      rSquared,
      adjustedRSquared,
      rmse: Math.sqrt(sse / n),
      mae: sae / n
    };
  }

  function buildFolds(n, foldCount) {
    const folds = Array.from({ length: foldCount }, () => []);
    for (let index = 0; index < n; index += 1) folds[index % foldCount].push(index);
    return folds;
  }

  function crossValidatedRmse(dataset, modelType, outputIndex) {
    const foldCount = Math.min(5, dataset.rows.length);
    const folds = buildFolds(dataset.rows.length, foldCount);
    const predictions = [];
    const actual = [];
    folds.forEach((fold) => {
      const trainRows = dataset.rows.filter((_, index) => !fold.includes(index));
      const testRows = dataset.rows.filter((_, index) => fold.includes(index));
      const model = fitModel({ ...dataset, rows: trainRows }, modelType, { singleOutputIndex: outputIndex, skipValidation: true });
      testRows.forEach((row) => {
        const estimated = estimateScenario(model, row.inputs);
        predictions.push(estimated.outputs[0].estimate);
        actual.push(row.outputs[outputIndex]);
      });
    });
    const error = actual.reduce((sum, value, index) => sum + (value - predictions[index]) ** 2, 0);
    return Math.sqrt(error / actual.length);
  }

  function validateDataset(config) {
    const inputNames = (config.inputNames || []).map((name) => String(name || '').trim()).filter(Boolean);
    const outputNames = (config.outputNames || []).map((name) => String(name || '').trim()).filter(Boolean);
    if (inputNames.length < 1) throw new Error('Select at least one input column.');
    if (outputNames.length < 1) throw new Error('Select at least one output column.');
    if (inputNames.length > 8 || outputNames.length > 6) throw new Error('This browser tool supports up to 8 inputs and 6 outputs.');
    if (!Array.isArray(config.rows) || config.rows.length < 5) throw new Error('At least five complete observations are required.');

    const rows = config.rows.map((row, rowIndex) => {
      const label = String(row.label || `Observation ${rowIndex + 1}`).trim();
      const inputs = inputNames.map((name, index) => toNumber(row.inputs?.[index], `${label}: ${name}`));
      const outputs = outputNames.map((name, index) => toNumber(row.outputs?.[index], `${label}: ${name}`));
      return { label, inputs, outputs };
    });

    inputNames.forEach((name, index) => {
      const values = rows.map((row) => row.inputs[index]);
      if (Math.max(...values) - Math.min(...values) <= EPSILON) throw new Error(`Input ${name} is constant and cannot explain output variation.`);
    });
    outputNames.forEach((name, index) => {
      const values = rows.map((row) => row.outputs[index]);
      if (Math.max(...values) - Math.min(...values) <= EPSILON) throw new Error(`Output ${name} is constant. Use a varying output measure.`);
    });

    return { inputNames, outputNames, rows };
  }

  function fitModel(config, requestedModel = 'linear', options = {}) {
    const dataset = options.skipValidation ? config : validateDataset(config);
    const inputStats = dataset.inputNames.map((_, index) => {
      const values = dataset.rows.map((row) => row.inputs[index]);
      const sd = Math.sqrt(variance(values));
      return { mean: mean(values), sd: sd > EPSILON ? sd : 1 };
    });
    const standardisedInputs = standardiseInputs(dataset.rows.map((row) => row.inputs), inputStats);
    const modelType = getModelDefinition(requestedModel).id;
    const terms = createFeatureSpec(dataset.inputNames, modelType);
    if (modelType !== 'knn' && dataset.rows.length <= terms.length) {
      throw new Error(`${modelDisplayName(modelType)} needs more observations than model terms.`);
    }
    const featureMatrix = standardisedInputs.map((row) => transformRow(row, terms));
    const penalty = modelType === 'ridge'
      ? Math.max(0.1, dataset.rows.length * 0.08)
      : modelType === 'lasso'
        ? Math.max(0.05, dataset.rows.length * 0.05)
        : 1e-8;
    const outputIndexes = options.singleOutputIndex !== undefined ? [options.singleOutputIndex] : dataset.outputNames.map((_, index) => index);
    const k = chooseK(dataset.rows.length);
    const outputs = outputIndexes.map((outputIndex) => {
      const y = dataset.rows.map((row) => row.outputs[outputIndex]);
      const coefficients = modelType === 'knn'
        ? null
        : modelType === 'lasso'
          ? fitLassoOutputModel(featureMatrix, y, penalty)
          : modelType === 'robust'
            ? fitRobustOutputModel(featureMatrix, y, { penalty })
            : fitOutputModel(featureMatrix, y, { penalty });
      const predicted = modelType === 'knn'
        ? featureMatrix.map((features, rowIndex) => {
          const trainingFeatures = featureMatrix.filter((_, index) => index !== rowIndex);
          const trainingOutput = y.filter((_, index) => index !== rowIndex);
          return kNearestPrediction(trainingFeatures, trainingOutput, features, chooseK(trainingFeatures.length)).estimate;
        })
        : featureMatrix.map((features) => predictRow(coefficients, features));
      const result = {
        name: dataset.outputNames[outputIndex],
        outputIndex,
        coefficients,
        predicted,
        actual: y,
        ...metrics(y, predicted, modelType === 'knn' ? 0 : terms.length)
      };
      if (modelType === 'knn') result.adjustedRSquared = null;
      return result;
    });
    return {
      modelType,
      inputNames: dataset.inputNames,
      outputNames: outputIndexes.map((index) => dataset.outputNames[index]),
      rows: dataset.rows,
      inputStats,
      terms,
      penalty: modelType === 'ridge' || modelType === 'lasso' ? penalty : 0,
      k: modelType === 'knn' ? k : null,
      outputs,
      warnings: dataset.rows.length < terms.length * 5
        ? [`The ${modelDisplayName(modelType)} model uses ${terms.length} terms with ${dataset.rows.length} observations. Treat diagnostics cautiously and prefer cross-validation over fitted R-squared.`]
        : []
    };
  }

  function autoSelectModel(config) {
    const dataset = validateDataset(config);
    const fitErrors = {};
    const candidateModels = AUTO_SELECT_MODEL_IDS.map((modelType) => {
      try {
        return fitModel(dataset, modelType, { skipValidation: true });
      } catch (error) {
        fitErrors[modelType] = error.message;
        return null;
      }
    }).filter(Boolean);

    function attachCv(model) {
      model.outputs.forEach((output) => {
        output.crossValidatedRmse = crossValidatedRmse(dataset, model.modelType, output.outputIndex);
      });
      model.averageCvRmse = mean(model.outputs.map((output) => output.crossValidatedRmse));
      return model;
    }

    const candidates = candidateModels.map((model) => {
      try {
        return attachCv(model);
      } catch (error) {
        fitErrors[model.modelType] = error.message;
        return null;
      }
    }).filter(Boolean);
    const linear = candidates.find((model) => model.modelType === 'linear');
    if (!linear) throw new Error(`Linear regression could not be fitted: ${fitErrors.linear || 'unknown error'}`);
    const selected = candidates.reduce((best, model) => {
      const needsMaterialGain = getModelDefinition(model.modelType).selectionThreshold;
      return model.averageCvRmse < best.averageCvRmse * needsMaterialGain ? model : best;
    }, linear);
    const unavailable = Object.entries(fitErrors)
      .map(([modelType, message]) => `${modelDisplayName(modelType)} could not be fitted: ${message}`)
      .join('; ');
    const reasonMap = {
      polynomial: 'Polynomial regression was selected because its cross-validated RMSE was materially lower than the simpler models.',
      ridge: 'Ridge regression was selected because its cross-validated RMSE was lower while keeping a stable linear form.',
      lasso: 'Lasso regression was selected because its cross-validated RMSE was lower while keeping a sparse linear form.',
      robust: 'Robust regression was selected because its cross-validated RMSE was lower while reducing the influence of unusual observations.',
      knn: 'k-Nearest Neighbour was selected because local historical neighbours produced materially lower cross-validated RMSE.',
      linear: `Linear regression was selected because it had comparable or better cross-validated RMSE${unavailable ? `; ${unavailable}` : ' and is simplest to interpret.'}`
    };
    return {
      selected,
      candidates: candidates.map((model) => ({
        modelType: model.modelType,
        label: modelDisplayName(model.modelType),
        averageCvRmse: model.averageCvRmse,
        penalty: model.penalty,
        available: true
      })),
      unavailableCandidates: Object.entries(fitErrors).map(([modelType, message]) => ({
        modelType,
        label: modelDisplayName(modelType),
        reason: message
      })),
      reason: reasonMap[selected.modelType]
    };
  }

  function analyse(config) {
    const requested = config.modelType || 'linear';
    if (requested === 'auto') return autoSelectModel(config);
    const dataset = validateDataset(config);
    const selected = fitModel(dataset, requested, { skipValidation: true });
    selected.outputs.forEach((output) => {
      try {
        output.crossValidatedRmse = crossValidatedRmse(dataset, selected.modelType, output.outputIndex);
      } catch (_) {
        output.crossValidatedRmse = NaN;
      }
    });
    const finiteCv = selected.outputs.map((output) => output.crossValidatedRmse).filter(Number.isFinite);
    selected.averageCvRmse = finiteCv.length ? mean(finiteCv) : NaN;
    if (!finiteCv.length) {
      selected.warnings.push('Cross-validation could not be calculated because the training folds do not have enough observations for this model size.');
    }
    return {
      selected,
      candidates: [{
        modelType: selected.modelType,
        label: modelDisplayName(selected.modelType),
        averageCvRmse: selected.averageCvRmse,
        penalty: selected.penalty,
        available: true
      }],
      unavailableCandidates: [],
      reason: `${modelDisplayName(selected.modelType)} was selected by the user. Cross-validated RMSE is shown to support judgement.`
    };
  }

  function convexHullMembership(points, scenario) {
    const dimension = scenario.length;
    if (dimension === 1) {
      const min = Math.min(...points.map((point) => point[0]));
      const max = Math.max(...points.map((point) => point[0]));
      return { attempted: true, inside: scenario[0] >= min - EPSILON && scenario[0] <= max + EPSILON, method: 'one-dimensional range hull' };
    }
    if (dimension > 5 || points.length > 35 || points.length < dimension + 1) {
      return { attempted: false, inside: false, method: 'nearest-neighbour fallback because the input space is high-dimensional or sparse' };
    }
    const indexes = points.map((_, index) => index);
    const subsets = combinations(indexes, dimension + 1);
    for (const subset of subsets) {
      const base = points[subset[dimension]];
      const matrix = [];
      const vector = scenario.map((value, index) => value - base[index]);
      for (let row = 0; row < dimension; row += 1) {
        matrix[row] = [];
        for (let column = 0; column < dimension; column += 1) {
          matrix[row][column] = points[subset[column]][row] - base[row];
        }
      }
      try {
        const lambdas = solveLinearSystem(matrix, vector);
        const lastLambda = 1 - lambdas.reduce((sum, value) => sum + value, 0);
        if ([...lambdas, lastLambda].every((value) => value >= -1e-7 && value <= 1 + 1e-7)) {
          return { attempted: true, inside: true, method: 'convex-hull membership using historical input combinations' };
        }
      } catch (_) {
        // Degenerate subset; try another.
      }
    }
    return { attempted: true, inside: false, method: 'convex-hull membership using historical input combinations' };
  }

  function assessScenarioSupport(model, rawScenarioInputs) {
    const scenarioInputs = model.inputNames.map((name, index) => toNumber(rawScenarioInputs[index], `Scenario ${name}`));
    const historical = standardiseInputs(model.rows.map((row) => row.inputs), model.inputStats);
    const scenario = standardiseInputs([scenarioInputs], model.inputStats)[0];
    const distances = historical.map((point, index) => ({
      label: model.rows[index].label,
      distance: Math.sqrt(point.reduce((sum, value, i) => sum + (value - scenario[i]) ** 2, 0))
    })).sort((a, b) => a.distance - b.distance);
    const historicalDistances = [];
    for (let i = 0; i < historical.length; i += 1) {
      let nearest = Infinity;
      for (let j = 0; j < historical.length; j += 1) {
        if (i === j) continue;
        const distance = Math.sqrt(historical[i].reduce((sum, value, k) => sum + (value - historical[j][k]) ** 2, 0));
        nearest = Math.min(nearest, distance);
      }
      historicalDistances.push(nearest);
    }
    historicalDistances.sort((a, b) => a - b);
    const median = historicalDistances[Math.floor(historicalDistances.length / 2)] || 0;
    const upper = historicalDistances[Math.floor(historicalDistances.length * 0.8)] || median;
    const hull = convexHullMembership(historical, scenario);
    let classification = 'LIMITED HISTORICAL SUPPORT';
    let level = 'limited';
    if (hull.attempted && !hull.inside) {
      classification = 'EXTRAPOLATION';
      level = 'extrapolation';
    } else if (distances[0].distance <= Math.max(upper, median * 1.5, 0.4)) {
      classification = 'INTERPOLATION';
      level = 'interpolation';
    }
    if (!hull.attempted && distances[0].distance > Math.max(upper * 1.75, median * 2, 1)) {
      classification = 'EXTRAPOLATION';
      level = 'extrapolation';
    }
    return {
      scenarioInputs,
      classification,
      level,
      nearest: distances.slice(0, 3),
      nearestDistance: distances[0].distance,
      localSupportThreshold: upper,
      hull
    };
  }

  function estimateScenario(model, rawScenarioInputs) {
    const support = assessScenarioSupport(model, rawScenarioInputs);
    const standardised = standardiseInputs([support.scenarioInputs], model.inputStats)[0];
    const features = transformRow(standardised, model.terms);
    if (model.modelType === 'knn') {
      const trainingFeatures = standardiseInputs(model.rows.map((row) => row.inputs), model.inputStats)
        .map((row) => transformRow(row, model.terms));
      return {
        support,
        outputs: model.outputs.map((output) => {
          const prediction = kNearestPrediction(trainingFeatures, output.actual, features, model.k || chooseK(model.rows.length));
          return {
            name: output.name,
            estimate: prediction.estimate,
            crossValidatedRmse: output.crossValidatedRmse,
            rmse: output.rmse,
            neighbours: prediction.neighbours.map((neighbour) => ({
              label: model.rows[neighbour.index].label,
              distance: neighbour.distance
            }))
          };
        })
      };
    }
    return {
      support,
      outputs: model.outputs.map((output) => ({
        name: output.name,
        estimate: predictRow(output.coefficients, features),
        crossValidatedRmse: output.crossValidatedRmse,
        rmse: output.rmse
      }))
    };
  }

  function formatEquation(output, terms, inputNames) {
    if (!output.coefficients) return `${output.name} = distance-weighted average of nearest historical observations`;
    const pieces = output.coefficients.map((coefficient, index) => {
      const sign = coefficient >= 0 ? '+' : '-';
      const value = Math.abs(coefficient).toFixed(4);
      if (index === 0) return coefficient.toFixed(4);
      return `${sign} ${value}*${terms[index].label}`;
    });
    return `${output.name} = ${pieces.join(' ')}`.replace(/\+ -/g, '- ');
  }

  function diagnoseEstimator(analysis, estimate) {
    const model = analysis?.selected || analysis;
    const diagnostics = [];
    if (!model) return diagnostics;
    const observations = model.rows?.length || 0;
    const predictorCount = model.inputNames?.length || 0;
    const termCount = model.terms?.length || predictorCount + 1;
    if (observations < Math.max(10, termCount * 2)) {
      diagnostics.push({
        level: observations <= termCount ? 'high-risk' : 'caution',
        title: 'Limited observations for model complexity',
        detected: `${observations} observations for ${termCount} fitted term${termCount === 1 ? '' : 's'}.`,
        why: 'Small samples can fit historical rows but perform poorly for new scenarios.',
        consider: 'Use simpler models, add more comparable observations, or treat scenario estimates as directional.'
      });
    }
    if (model.modelType === 'polynomial' && observations < termCount * 4) {
      diagnostics.push({
        level: 'caution',
        title: 'Polynomial overfitting risk',
        detected: `Degree-2 model uses ${termCount} terms with ${observations} observations.`,
        why: 'Squared and interaction terms can capture noise when there are few rows.',
        consider: 'Compare cross-validated RMSE against linear, ridge, robust, lasso, and kNN estimates.'
      });
    }
    if (['ridge', 'lasso'].includes(model.modelType)) {
      diagnostics.push({
        level: 'info',
        title: `${model.modelType === 'ridge' ? 'Ridge' : 'Lasso'} tuning note`,
        detected: `Penalty parameter ${Number(model.penalty || 0).toFixed(3)} is selected by the browser tool.`,
        why: 'Penalised models trade a small amount of fitted accuracy for more stable coefficients.',
        consider: 'Use the candidate comparison table to confirm the penalty improves cross-validated error.'
      });
    }
    if (model.modelType === 'knn') {
      diagnostics.push({
        level: 'info',
        title: 'kNN local-support note',
        detected: `${model.k || 0} nearest historical observations are used for each output estimate.`,
        why: 'kNN has no coefficient equation and depends strongly on local historical similarity.',
        consider: 'Review nearest neighbours and scenario support before using the estimate for planning.'
      });
    }
    const weakOutputs = (model.outputs || []).filter((output) => Number.isFinite(output.rSquared) && output.rSquared < 0.35);
    if (weakOutputs.length) {
      diagnostics.push({
        level: 'caution',
        title: 'Weak fitted relationship',
        detected: `${weakOutputs.map((output) => output.name).join(', ')} has low fitted R-squared.`,
        why: 'The selected inputs explain only a limited share of historical output variation.',
        consider: 'Add relevant operational drivers, segment the data, or avoid using the estimate as a planning target.'
      });
    }
    if (estimate?.support?.level === 'extrapolation') {
      diagnostics.push({
        level: 'high-risk',
        title: 'Scenario extrapolation',
        detected: 'The scenario is outside the historical multivariate input space.',
        why: 'Predictions beyond observed operating conditions are less reliable than interpolation.',
        consider: 'Adjust the scenario toward observed conditions or collect comparable historical examples.'
      });
    } else if (estimate?.support?.level === 'limited') {
      diagnostics.push({
        level: 'caution',
        title: 'Limited local support',
        detected: 'Few similar historical observations are close to this scenario.',
        why: 'The estimate may depend on distant comparison rows.',
        consider: 'Review nearest neighbours and use a planning range rather than a single point estimate.'
      });
    }
    diagnostics.push({
      level: 'info',
      title: 'Interpretation boundary',
      detected: 'This is a supervised estimator.',
      why: 'Regression and kNN estimate relationships in historical data; they do not prove causality or operational efficiency.',
      consider: 'Use DEA for relative efficiency benchmarking and this estimator for expected-output planning.'
    });
    return diagnostics;
  }

  return {
    analyse,
    estimateScenario,
    validateDataset,
    createFeatureSpec,
    availableModels,
    getModelDefinition,
    modelDisplayName,
    formatEquation,
    diagnoseEstimator
  };
}));

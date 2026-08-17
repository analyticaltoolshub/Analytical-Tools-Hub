(function initialiseMultivariateEstimatorCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ATHMultivariateEstimator = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMultivariateEstimatorCore() {
  'use strict';

  const EPSILON = 1e-9;

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
    const terms = [{ type: 'intercept', label: 'Intercept' }];
    inputNames.forEach((name, index) => terms.push({ type: 'linear', indexes: [index], label: name }));
    if (modelType === 'polynomial') {
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

  function fitOutputModel(featureMatrix, y) {
    const xT = transpose(featureMatrix);
    const xTx = multiplyMatrices(xT, featureMatrix);
    const xTy = multiplyMatrixVector(xT, y);
    const lambda = 1e-8;
    for (let i = 1; i < xTx.length; i += 1) xTx[i][i] += lambda;
    return solveLinearSystem(xTx, xTy);
  }

  function predictRow(coefficients, features) {
    return coefficients.reduce((sum, coefficient, index) => sum + coefficient * features[index], 0);
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
    const modelType = requestedModel === 'polynomial' ? 'polynomial' : 'linear';
    const terms = createFeatureSpec(dataset.inputNames, modelType);
    if (dataset.rows.length <= terms.length) {
      throw new Error(`${modelType === 'polynomial' ? 'Polynomial' : 'Linear'} regression needs more observations than model terms.`);
    }
    const featureMatrix = standardisedInputs.map((row) => transformRow(row, terms));
    const outputIndexes = options.singleOutputIndex !== undefined ? [options.singleOutputIndex] : dataset.outputNames.map((_, index) => index);
    const outputs = outputIndexes.map((outputIndex) => {
      const y = dataset.rows.map((row) => row.outputs[outputIndex]);
      const coefficients = fitOutputModel(featureMatrix, y);
      const predicted = featureMatrix.map((features) => predictRow(coefficients, features));
      return {
        name: dataset.outputNames[outputIndex],
        outputIndex,
        coefficients,
        predicted,
        actual: y,
        ...metrics(y, predicted, terms.length)
      };
    });
    return {
      modelType,
      inputNames: dataset.inputNames,
      outputNames: outputIndexes.map((index) => dataset.outputNames[index]),
      rows: dataset.rows,
      inputStats,
      terms,
      outputs,
      warnings: dataset.rows.length < terms.length * 5
        ? [`The ${modelType} model uses ${terms.length} terms with ${dataset.rows.length} observations. Treat diagnostics cautiously and prefer cross-validation over fitted R-squared.`]
        : []
    };
  }

  function autoSelectModel(config) {
    const dataset = validateDataset(config);
    const linear = fitModel(dataset, 'linear', { skipValidation: true });
    let polynomial = null;
    let polynomialError = null;
    try {
      polynomial = fitModel(dataset, 'polynomial', { skipValidation: true });
    } catch (error) {
      polynomialError = error.message;
    }

    function attachCv(model) {
      model.outputs.forEach((output) => {
        output.crossValidatedRmse = crossValidatedRmse(dataset, model.modelType, output.outputIndex);
      });
      model.averageCvRmse = mean(model.outputs.map((output) => output.crossValidatedRmse));
      return model;
    }

    attachCv(linear);
    if (polynomial) {
      try {
        attachCv(polynomial);
      } catch (error) {
        polynomialError = error.message;
        polynomial = null;
      }
    }
    const selected = polynomial && polynomial.averageCvRmse < linear.averageCvRmse * 0.98 ? polynomial : linear;
    return {
      selected,
      candidates: [linear, polynomial].filter(Boolean).map((model) => ({ modelType: model.modelType, averageCvRmse: model.averageCvRmse })),
      reason: selected.modelType === 'polynomial'
        ? 'Polynomial regression was selected because its cross-validated RMSE was materially lower than the linear model.'
        : `Linear regression was selected because it had comparable or better cross-validated RMSE${polynomialError ? `; polynomial could not be fitted: ${polynomialError}` : ' and is simpler to interpret.'}`
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
      candidates: [{ modelType: selected.modelType, averageCvRmse: selected.averageCvRmse }],
      reason: `${selected.modelType === 'polynomial' ? 'Polynomial' : 'Linear'} regression was selected by the user. Cross-validated RMSE is shown to support judgement.`
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
    const pieces = output.coefficients.map((coefficient, index) => {
      const sign = coefficient >= 0 ? '+' : '-';
      const value = Math.abs(coefficient).toFixed(4);
      if (index === 0) return coefficient.toFixed(4);
      return `${sign} ${value}*${terms[index].label}`;
    });
    return `${output.name} = ${pieces.join(' ')}`.replace(/\+ -/g, '- ');
  }

  return {
    analyse,
    estimateScenario,
    validateDataset,
    createFeatureSpec,
    formatEquation
  };
}));

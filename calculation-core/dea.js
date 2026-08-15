(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ATHDea = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EPSILON = 1e-8;
  const MAX_ITERATIONS = 10000;

  function assertFiniteNonNegative(value, label) {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      throw new Error(`${label} is required.`);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      throw new Error(`${label} must be a finite, non-negative number.`);
    }
    return number;
  }

  function assessSampleAdequacy(dmuCount, inputCount, outputCount) {
    const units = Number(dmuCount);
    const inputs = Number(inputCount);
    const outputs = Number(outputCount);
    if (![units, inputs, outputs].every(Number.isInteger) || units < 0 || inputs < 1 || outputs < 1) {
      throw new Error('Sample adequacy requires a non-negative DMU count and positive input and output counts.');
    }
    const recommendedMinimum = Math.max(inputs * outputs, 3 * (inputs + outputs));
    return {
      dmuCount: units,
      measureCount: inputs + outputs,
      recommendedMinimum,
      meetsHeuristic: units >= recommendedMinimum
    };
  }

  function calculateScaleEfficiency(ccrEfficiency, bccEfficiency) {
    const ccr = Number(ccrEfficiency);
    const bcc = Number(bccEfficiency);
    if (!Number.isFinite(ccr) || !Number.isFinite(bcc) || ccr < 0 || bcc <= 0) {
      throw new Error('Scale efficiency requires a non-negative CCR efficiency and a positive BCC efficiency.');
    }
    if (ccr > bcc + 1e-6) {
      throw new Error('CCR efficiency cannot materially exceed BCC efficiency for the same data and orientation.');
    }
    return Math.min(1, ccr / bcc);
  }

  function validateDataset(dmus, inputNames, outputNames) {
    if (!Array.isArray(dmus) || dmus.length < 2) throw new Error('DEA requires at least two decision-making units.');
    if (!Array.isArray(inputNames) || inputNames.length < 1) throw new Error('DEA requires at least one input.');
    if (!Array.isArray(outputNames) || outputNames.length < 1) throw new Error('DEA requires at least one output.');
    if (dmus.length > 100) throw new Error('DEA is limited to 100 decision-making units in this browser tool.');
    if (inputNames.length > 8 || outputNames.length > 8) throw new Error('DEA is limited to eight inputs and eight outputs.');

    const names = new Set();
    const clean = dmus.map((dmu, dmuIndex) => {
      const name = String(dmu.name || '').trim();
      if (!name) throw new Error(`DMU ${dmuIndex + 1} needs a name.`);
      if (names.has(name.toLowerCase())) throw new Error(`DMU names must be unique. Duplicate: ${name}.`);
      names.add(name.toLowerCase());
      if (!Array.isArray(dmu.inputs) || dmu.inputs.length !== inputNames.length) {
        throw new Error(`${name} must contain ${inputNames.length} input value(s).`);
      }
      if (!Array.isArray(dmu.outputs) || dmu.outputs.length !== outputNames.length) {
        throw new Error(`${name} must contain ${outputNames.length} output value(s).`);
      }
      return {
        name,
        inputs: dmu.inputs.map((value, index) => assertFiniteNonNegative(value, `${name}: ${inputNames[index]}`)),
        outputs: dmu.outputs.map((value, index) => assertFiniteNonNegative(value, `${name}: ${outputNames[index]}`))
      };
    });

    inputNames.forEach((name, index) => {
      if (!clean.some((dmu) => dmu.inputs[index] > EPSILON)) throw new Error(`Input ${name} contains no positive values.`);
    });
    outputNames.forEach((name, index) => {
      if (!clean.some((dmu) => dmu.outputs[index] > EPSILON)) throw new Error(`Output ${name} contains no positive values.`);
    });
    clean.forEach((dmu) => {
      if (!dmu.inputs.some((value) => value > EPSILON)) throw new Error(`${dmu.name} must have at least one positive input.`);
      if (!dmu.outputs.some((value) => value > EPSILON)) throw new Error(`${dmu.name} must have at least one positive output.`);
    });
    return clean;
  }

  function pivot(tableau, pivotRow, pivotColumn) {
    const value = tableau[pivotRow][pivotColumn];
    for (let column = 0; column < tableau[pivotRow].length; column += 1) tableau[pivotRow][column] /= value;
    for (let row = 0; row < tableau.length; row += 1) {
      if (row === pivotRow) continue;
      const factor = tableau[row][pivotColumn];
      if (Math.abs(factor) <= EPSILON) continue;
      for (let column = 0; column < tableau[row].length; column += 1) {
        tableau[row][column] -= factor * tableau[pivotRow][column];
      }
    }
  }

  function optimise(tableau, basis) {
    const objectiveRow = tableau.length - 1;
    const rhsColumn = tableau[0].length - 1;
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration += 1) {
      let entering = -1;
      let mostNegative = -EPSILON;
      for (let column = 0; column < rhsColumn; column += 1) {
        if (tableau[objectiveRow][column] < mostNegative) {
          mostNegative = tableau[objectiveRow][column];
          entering = column;
        }
      }
      if (entering < 0) return;

      let leaving = -1;
      let smallestRatio = Infinity;
      for (let row = 0; row < objectiveRow; row += 1) {
        const coefficient = tableau[row][entering];
        if (coefficient <= EPSILON) continue;
        const ratio = tableau[row][rhsColumn] / coefficient;
        if (ratio < smallestRatio - EPSILON || (Math.abs(ratio - smallestRatio) <= EPSILON && basis[row] > basis[leaving])) {
          smallestRatio = ratio;
          leaving = row;
        }
      }
      if (leaving < 0) throw new Error('The DEA model is unbounded. Check the selected inputs and outputs.');
      pivot(tableau, leaving, entering);
      basis[leaving] = entering;
    }
    throw new Error('The DEA solver exceeded its iteration limit. Review the dataset for degeneracy.');
  }

  function solveLinearProgram(objective, constraints) {
    const normalised = constraints.map((constraint) => {
      let coefficients = constraint.coefficients.slice();
      let sense = constraint.sense;
      let rhs = Number(constraint.rhs);
      if (rhs < 0) {
        coefficients = coefficients.map((value) => -value);
        rhs *= -1;
        sense = sense === '<=' ? '>=' : sense === '>=' ? '<=' : '=';
      }
      return { coefficients, sense, rhs };
    });

    const originalCount = objective.length;
    let columnCount = originalCount;
    const rowMetadata = normalised.map((constraint) => {
      if (constraint.sense === '<=') return { slack: columnCount++, artificial: -1 };
      if (constraint.sense === '>=') return { surplus: columnCount++, artificial: columnCount++ };
      if (constraint.sense === '=') return { artificial: columnCount++ };
      throw new Error(`Unsupported constraint type: ${constraint.sense}.`);
    });
    const artificialColumns = new Set(rowMetadata.map((metadata) => metadata.artificial).filter((index) => index >= 0));
    const tableau = normalised.map((constraint, row) => {
      const values = Array(columnCount + 1).fill(0);
      constraint.coefficients.forEach((value, column) => { values[column] = value; });
      const metadata = rowMetadata[row];
      if (metadata.slack !== undefined) values[metadata.slack] = 1;
      if (metadata.surplus !== undefined) values[metadata.surplus] = -1;
      if (metadata.artificial >= 0) values[metadata.artificial] = 1;
      values[columnCount] = constraint.rhs;
      return values;
    });
    const basis = rowMetadata.map((metadata) => metadata.slack ?? metadata.artificial);

    function setObjective(coefficients) {
      const row = Array(columnCount + 1).fill(0);
      coefficients.forEach((value, column) => { row[column] = -value; });
      basis.forEach((basicColumn, constraintRow) => {
        const basicCost = coefficients[basicColumn] || 0;
        if (Math.abs(basicCost) <= EPSILON) return;
        for (let column = 0; column <= columnCount; column += 1) row[column] += basicCost * tableau[constraintRow][column];
      });
      if (tableau.length === normalised.length + 1) tableau[tableau.length - 1] = row;
      else tableau.push(row);
    }

    const phaseOneObjective = Array(columnCount).fill(0);
    artificialColumns.forEach((column) => { phaseOneObjective[column] = -1; });
    setObjective(phaseOneObjective);
    optimise(tableau, basis);
    if (tableau[tableau.length - 1][columnCount] < -1e-6) throw new Error('The DEA model is infeasible for at least one DMU.');

    for (let row = basis.length - 1; row >= 0; row -= 1) {
      if (!artificialColumns.has(basis[row])) continue;
      let replacement = -1;
      for (let column = 0; column < columnCount; column += 1) {
        if (!artificialColumns.has(column) && Math.abs(tableau[row][column]) > EPSILON) {
          replacement = column;
          break;
        }
      }
      if (replacement >= 0) {
        pivot(tableau, row, replacement);
        basis[row] = replacement;
      } else {
        tableau.splice(row, 1);
        basis.splice(row, 1);
      }
    }

    const keepColumns = [];
    for (let column = 0; column < columnCount; column += 1) {
      if (!artificialColumns.has(column)) keepColumns.push(column);
    }
    const oldToNew = new Map(keepColumns.map((column, index) => [column, index]));
    const reducedTableau = tableau.slice(0, -1).map((row) => [...keepColumns.map((column) => row[column]), row[columnCount]]);
    basis.forEach((column, row) => { basis[row] = oldToNew.get(column); });
    tableau.length = 0;
    reducedTableau.forEach((row) => tableau.push(row));
    columnCount = keepColumns.length;

    const phaseTwoObjective = keepColumns.map((column) => objective[column] || 0);
    setObjective(phaseTwoObjective);
    optimise(tableau, basis);

    const solution = Array(originalCount).fill(0);
    const rhsColumn = tableau[0].length - 1;
    basis.forEach((column, row) => {
      const originalColumn = keepColumns[column];
      if (originalColumn < originalCount) solution[originalColumn] = Math.abs(tableau[row][rhsColumn]) <= EPSILON ? 0 : tableau[row][rhsColumn];
    });
    return { solution, objective: tableau[tableau.length - 1][rhsColumn] };
  }

  function validateEvaluatedDmu(dmu, inputNames, outputNames) {
    const name = String(dmu && dmu.name || '').trim();
    if (!name) throw new Error('The scenario DMU needs a name.');
    if (!Array.isArray(dmu.inputs) || dmu.inputs.length !== inputNames.length) {
      throw new Error(`${name} must contain ${inputNames.length} input value(s).`);
    }
    if (!Array.isArray(dmu.outputs) || dmu.outputs.length !== outputNames.length) {
      throw new Error(`${name} must contain ${outputNames.length} output value(s).`);
    }
    const clean = {
      name,
      inputs: dmu.inputs.map((value, index) => assertFiniteNonNegative(value, `${name}: ${inputNames[index]}`)),
      outputs: dmu.outputs.map((value, index) => assertFiniteNonNegative(value, `${name}: ${outputNames[index]}`))
    };
    if (!clean.inputs.some((value) => value > EPSILON)) throw new Error(`${name} must have at least one positive input.`);
    if (!clean.outputs.some((value) => value > EPSILON)) throw new Error(`${name} must have at least one positive output.`);
    return clean;
  }

  function solveAgainstFrontier(referenceDmus, evaluated, model, orientation, options = {}) {
    const count = referenceDmus.length;
    const radialIndex = count;
    const objective = Array(count + 1).fill(0);
    objective[radialIndex] = orientation === 'input' ? -1 : 1;
    const constraints = [];

    if (orientation === 'input') {
      evaluated.inputs.forEach((input, inputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.inputs[inputIndex]), -input],
          sense: '<=', rhs: 0
        });
      });
      evaluated.outputs.forEach((output, outputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.outputs[outputIndex]), 0],
          sense: '>=', rhs: output
        });
      });
      constraints.push({ coefficients: [...Array(count).fill(0), 1], sense: '<=', rhs: 1 });
    } else {
      evaluated.inputs.forEach((input, inputIndex) => {
        constraints.push({ coefficients: [...referenceDmus.map((dmu) => dmu.inputs[inputIndex]), 0], sense: '<=', rhs: input });
      });
      evaluated.outputs.forEach((output, outputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.outputs[outputIndex]), -output],
          sense: '>=', rhs: 0
        });
      });
      if (options.requireObservedDominance) {
        constraints.push({ coefficients: [...Array(count).fill(0), 1], sense: '>=', rhs: 1 });
      }
    }
    const scaleRestriction = options.scaleRestriction || (model === 'bcc' ? 'vrs' : 'crs');
    if (scaleRestriction === 'vrs') constraints.push({ coefficients: [...Array(count).fill(1), 0], sense: '=', rhs: 1 });
    if (scaleRestriction === 'nirs') constraints.push({ coefficients: [...Array(count).fill(1), 0], sense: '<=', rhs: 1 });

    const solved = solveLinearProgram(objective, constraints);
    const lambdas = solved.solution.slice(0, count).map((value) => Math.max(0, value));
    const radial = Math.max(EPSILON, solved.solution[radialIndex]);
    const efficiency = Math.min(1, orientation === 'input' ? radial : 1 / radial);
    const referenceInputs = evaluated.inputs.map((_, index) => lambdas.reduce((sum, lambda, j) => sum + lambda * referenceDmus[j].inputs[index], 0));
    const referenceOutputs = evaluated.outputs.map((_, index) => lambdas.reduce((sum, lambda, j) => sum + lambda * referenceDmus[j].outputs[index], 0));
    const inputTargets = orientation === 'input'
      ? evaluated.inputs.map((value) => radial * value)
      : evaluated.inputs.slice();
    const outputTargets = orientation === 'output'
      ? evaluated.outputs.map((value) => radial * value)
      : evaluated.outputs.slice();
    const inputSlacks = inputTargets.map((value, index) => Math.max(0, value - referenceInputs[index]));
    const outputSlacks = referenceOutputs.map((value, index) => Math.max(0, value - outputTargets[index]));

    return {
      name: evaluated.name,
      efficiency,
      radialFactor: radial,
      efficient: efficiency >= 1 - 1e-6 && inputSlacks.every((value) => value <= 1e-5) && outputSlacks.every((value) => value <= 1e-5),
      peers: lambdas.map((lambda, index) => ({ name: referenceDmus[index].name, lambda })).filter((peer) => peer.lambda > 1e-6),
      lambdas,
      inputTargets: referenceInputs,
      outputTargets: referenceOutputs,
      inputSlacks,
      outputSlacks
    };
  }

  function solveDmu(dmus, dmuIndex, model, orientation) {
    return solveAgainstFrontier(dmus, dmus[dmuIndex], model, orientation);
  }

  function tryScenarioSolve(referenceDmus, scenario, model, orientation, options) {
    try {
      return { feasible: true, result: solveAgainstFrontier(referenceDmus, scenario, model, orientation, options), error: '' };
    } catch (error) {
      if (!/infeasible/i.test(error.message)) throw error;
      return { feasible: false, result: null, error: error.message };
    }
  }

  function classifyReturnsToScale(ccr, bcc, nirs) {
    if (!ccr.feasible || !bcc.feasible || !nirs.feasible) return 'Not available';
    if (Math.abs(ccr.result.efficiency - bcc.result.efficiency) <= 1e-5) return 'Constant returns to scale';
    if (Math.abs(nirs.result.efficiency - bcc.result.efficiency) <= 1e-5) return 'Decreasing returns to scale';
    return 'Increasing returns to scale';
  }

  function evaluateScenario(config) {
    const inputNames = (config.inputNames || []).map((name) => String(name || '').trim());
    const outputNames = (config.outputNames || []).map((name) => String(name || '').trim());
    if (inputNames.some((name) => !name) || outputNames.some((name) => !name)) throw new Error('Every input and output needs a name.');
    if (!['ccr', 'bcc'].includes(config.model)) throw new Error('DEA model must be CCR or BCC.');
    if (!['input', 'output'].includes(config.orientation)) throw new Error('DEA orientation must be input or output.');

    const referenceDmus = validateDataset(config.referenceDmus, inputNames, outputNames);
    const scenario = validateEvaluatedDmu(config.scenario, inputNames, outputNames);
    if (referenceDmus.some((dmu) => dmu.name.toLowerCase() === scenario.name.toLowerCase())) {
      throw new Error('The scenario DMU name must differ from every historical reference DMU name.');
    }
    const options = { requireObservedDominance: true };
    const ccr = tryScenarioSolve(referenceDmus, scenario, 'ccr', config.orientation, options);
    const bcc = tryScenarioSolve(referenceDmus, scenario, 'bcc', config.orientation, options);
    const selected = config.model === 'bcc' ? bcc : ccr;
    const outputRangeWarnings = outputNames.map((name, index) => {
      const maximum = Math.max(...referenceDmus.map((dmu) => dmu.outputs[index]));
      return scenario.outputs[index] > maximum + EPSILON ? { name, value: scenario.outputs[index], maximum } : null;
    }).filter(Boolean);
    let scaleEfficiency = null;
    if (ccr.feasible && bcc.feasible) {
      scaleEfficiency = calculateScaleEfficiency(ccr.result.efficiency, bcc.result.efficiency);
    }
    let returnsToScale = 'Available for input-oriented scenarios only';
    if (config.orientation === 'input') {
      const nirs = tryScenarioSolve(referenceDmus, scenario, 'ccr', 'input', { ...options, scaleRestriction: 'nirs' });
      returnsToScale = classifyReturnsToScale(ccr, bcc, nirs);
    }
    return {
      model: config.model,
      orientation: config.orientation,
      inputNames,
      outputNames,
      referenceDmus,
      scenario,
      selected,
      ccr,
      bcc,
      scaleEfficiency,
      returnsToScale,
      outputRangeWarnings,
      referenceCount: referenceDmus.length
    };
  }

  function solveBenchmarkGenerator(referenceDmus, values, model, mode, inputNames, outputNames) {
    const count = referenceDmus.length;
    const radialIndex = count;
    const objective = Array(count + 1).fill(0);
    const constraints = [];
    const maxInputs = inputNames.map((_, index) => Math.max(...referenceDmus.map((dmu) => dmu.inputs[index])));
    const maxOutputs = outputNames.map((_, index) => Math.max(...referenceDmus.map((dmu) => dmu.outputs[index])));

    maxInputs.forEach((value, index) => {
      if (value <= EPSILON) throw new Error(`Input ${inputNames[index]} contains no positive historical reference values.`);
    });
    maxOutputs.forEach((value, index) => {
      if (value <= EPSILON) throw new Error(`Output ${outputNames[index]} contains no positive historical reference values.`);
    });

    if (mode === 'inputRequirement') {
      objective[radialIndex] = -1;
      values.forEach((output, outputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.outputs[outputIndex]), 0],
          sense: '>=',
          rhs: output
        });
      });
      maxInputs.forEach((maximum, inputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.inputs[inputIndex]), -maximum],
          sense: '<=',
          rhs: 0
        });
      });
    } else {
      objective[radialIndex] = 1;
      values.forEach((input, inputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.inputs[inputIndex]), 0],
          sense: '<=',
          rhs: input
        });
      });
      maxOutputs.forEach((maximum, outputIndex) => {
        constraints.push({
          coefficients: [...referenceDmus.map((dmu) => dmu.outputs[outputIndex]), -maximum],
          sense: '>=',
          rhs: 0
        });
      });
    }

    if (model === 'bcc') {
      constraints.push({ coefficients: [...Array(count).fill(1), 0], sense: '=', rhs: 1 });
    }

    const solved = solveLinearProgram(objective, constraints);
    const lambdas = solved.solution.slice(0, count).map((value) => Math.max(0, value));
    const radial = Math.max(0, solved.solution[radialIndex]);
    const generatedInputs = inputNames.map((_, index) => lambdas.reduce((sum, lambda, j) => sum + lambda * referenceDmus[j].inputs[index], 0));
    const generatedOutputs = outputNames.map((_, index) => lambdas.reduce((sum, lambda, j) => sum + lambda * referenceDmus[j].outputs[index], 0));

    return {
      radialFactor: radial,
      generatedInputs,
      generatedOutputs,
      peers: lambdas.map((lambda, index) => ({ name: referenceDmus[index].name, lambda })).filter((peer) => peer.lambda > 1e-6),
      lambdas
    };
  }

  function tryBenchmarkGenerator(referenceDmus, values, model, mode, inputNames, outputNames) {
    try {
      const result = solveBenchmarkGenerator(referenceDmus, values, model, mode, inputNames, outputNames);
      const hasPeer = result.peers.length > 0;
      const hasUsefulScale = mode === 'inputRequirement' ? result.generatedInputs.some((value) => value > EPSILON) : result.generatedOutputs.some((value) => value > EPSILON);
      return { feasible: hasPeer && hasUsefulScale, result: hasPeer && hasUsefulScale ? result : null, error: hasPeer && hasUsefulScale ? '' : 'No positive historical peer combination supports this scenario.' };
    } catch (error) {
      if (!/infeasible|unbounded/i.test(error.message)) throw error;
      return { feasible: false, result: null, error: error.message };
    }
  }

  function evaluateScenarioBenchmark(config) {
    const inputNames = (config.inputNames || []).map((name) => String(name || '').trim());
    const outputNames = (config.outputNames || []).map((name) => String(name || '').trim());
    if (inputNames.some((name) => !name) || outputNames.some((name) => !name)) throw new Error('Every input and output needs a name.');
    if (!['ccr', 'bcc'].includes(config.model)) throw new Error('DEA model must be CCR or BCC.');
    if (!['inputRequirement', 'outputRequirement'].includes(config.mode)) throw new Error('Choose Generate Input Requirement or Generate Output Requirement.');

    const referenceDmus = validateDataset(config.referenceDmus, inputNames, outputNames);
    const rawValues = Array.isArray(config.values) ? config.values : [];
    const expectedNames = config.mode === 'inputRequirement' ? outputNames : inputNames;
    if (rawValues.length !== expectedNames.length) throw new Error(`The scenario needs ${expectedNames.length} ${config.mode === 'inputRequirement' ? 'target output' : 'available input'} value(s).`);
    const values = rawValues.map((value, index) => assertFiniteNonNegative(value, `Scenario ${expectedNames[index]}`));
    if (!values.some((value) => value > EPSILON)) throw new Error(`Enter at least one positive ${config.mode === 'inputRequirement' ? 'target output' : 'available input'} value.`);

    const selected = tryBenchmarkGenerator(referenceDmus, values, config.model, config.mode, inputNames, outputNames);
    const ccr = tryBenchmarkGenerator(referenceDmus, values, 'ccr', config.mode, inputNames, outputNames);
    const bcc = tryBenchmarkGenerator(referenceDmus, values, 'bcc', config.mode, inputNames, outputNames);

    const warnings = [];
    if (config.mode === 'inputRequirement') {
      outputNames.forEach((name, index) => {
        const maximum = Math.max(...referenceDmus.map((dmu) => dmu.outputs[index]));
        if (values[index] > maximum + EPSILON) warnings.push({ type: 'outputRange', name, value: values[index], maximum });
      });
    } else {
      inputNames.forEach((name, index) => {
        const minimum = Math.min(...referenceDmus.map((dmu) => dmu.inputs[index]));
        const maximum = Math.max(...referenceDmus.map((dmu) => dmu.inputs[index]));
        if (values[index] < minimum - EPSILON || values[index] > maximum + EPSILON) warnings.push({ type: 'inputRange', name, value: values[index], minimum, maximum });
      });
    }
    if (config.model === 'bcc' && !selected.feasible) warnings.push({ type: 'bccFeasibility' });

    return {
      mode: config.mode,
      model: config.model,
      inputNames,
      outputNames,
      referenceDmus,
      values,
      selected,
      ccr,
      bcc,
      warnings,
      referenceCount: referenceDmus.length
    };
  }

  function analyseDea(config) {
    const inputNames = (config.inputNames || []).map((name) => String(name || '').trim());
    const outputNames = (config.outputNames || []).map((name) => String(name || '').trim());
    if (inputNames.some((name) => !name) || outputNames.some((name) => !name)) throw new Error('Every input and output needs a name.');
    if (!['ccr', 'bcc'].includes(config.model)) throw new Error('DEA model must be CCR or BCC.');
    if (!['input', 'output'].includes(config.orientation)) throw new Error('DEA orientation must be input or output.');
    const model = config.model;
    const orientation = config.orientation;
    const dmus = validateDataset(config.dmus, inputNames, outputNames);
    const results = dmus.map((_, index) => solveDmu(dmus, index, model, orientation));
    const ranked = results.slice().sort((a, b) => b.efficiency - a.efficiency || a.name.localeCompare(b.name));
    ranked.forEach((result, index) => {
      result.rank = index > 0 && Math.abs(result.efficiency - ranked[index - 1].efficiency) <= EPSILON
        ? ranked[index - 1].rank
        : index + 1;
    });
    const rankByName = new Map(ranked.map((result) => [result.name, result.rank]));
    results.forEach((result) => { result.rank = rankByName.get(result.name); });
    return {
      model,
      orientation,
      inputNames,
      outputNames,
      dmus,
      results,
      adequacy: assessSampleAdequacy(dmus.length, inputNames.length, outputNames.length),
      summary: {
        dmuCount: results.length,
        efficientCount: results.filter((result) => result.efficient).length,
        averageEfficiency: results.reduce((sum, result) => sum + result.efficiency, 0) / results.length,
        lowestEfficiency: Math.min(...results.map((result) => result.efficiency))
      }
    };
  }

  return { analyseDea, evaluateScenario, evaluateScenarioBenchmark, assessSampleAdequacy, calculateScaleEfficiency, solveLinearProgram };
}));

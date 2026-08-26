(function initialiseMonteCarloCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHMonteCarlo = api;
    root.MonteCarloEngine = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createMonteCarloCore() {
  function createRng(seed) {
    let state = (Number(seed) >>> 0) || 12345;
    return function rng() {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function normalSample(rng) {
    const u1 = Math.max(rng(), Number.EPSILON);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rng());
  }

  function sampleVariable(variable, rng) {
    const p = variable.params || {};
    if (variable.distribution === "fixed") return Number(p.value);
    if (variable.distribution === "uniform") return Number(p.min) + rng() * (Number(p.max) - Number(p.min));
    if (variable.distribution === "triangular") {
      const min = Number(p.min);
      const mode = Number(p.mode);
      const max = Number(p.max);
      const u = rng();
      const c = (mode - min) / (max - min);
      return u < c
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
    if (variable.distribution === "normal") {
      const mean = Number(p.mean);
      const sd = Number(p.sd);
      const min = p.min === "" || p.min === null || p.min === undefined ? -Infinity : Number(p.min);
      const max = p.max === "" || p.max === null || p.max === undefined ? Infinity : Number(p.max);
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const value = mean + sd * normalSample(rng);
        if (value >= min && value <= max) return value;
      }
      return Math.min(max, Math.max(min, mean));
    }
    if (variable.distribution === "lognormal") {
      const value = Math.exp(Number(p.meanLog) + Number(p.sdLog) * normalSample(rng));
      const max = p.max === "" || p.max === null || p.max === undefined ? Infinity : Number(p.max);
      return Math.min(value, max);
    }
    if (variable.distribution === "discrete") {
      const rows = variable.discrete || [];
      const total = rows.reduce((sum, row) => sum + Number(row.probability), 0);
      let threshold = rng() * total;
      for (const row of rows) {
        threshold -= Number(row.probability);
        if (threshold <= 0) return Number(row.value);
      }
      return Number(rows[rows.length - 1]?.value || 0);
    }
    throw new Error(`Unsupported distribution for ${variable.name}.`);
  }

  function tokenize(expression) {
    const tokens = [];
    let index = 0;
    while (index < expression.length) {
      const char = expression[index];
      if (/\s/.test(char)) { index += 1; continue; }
      if (/[+\-*/()]/.test(char)) { tokens.push({ type: char }); index += 1; continue; }
      if (/[0-9.]/.test(char)) {
        if (char === "." && !/[0-9]/.test(expression[index + 1] || "")) throw new Error('Formula contains an unsupported character near ".".');
        let value = char;
        index += 1;
        while (index < expression.length && /[0-9.]/.test(expression[index])) { value += expression[index]; index += 1; }
        if (!Number.isFinite(Number(value))) throw new Error(`Invalid number "${value}" in formula.`);
        tokens.push({ type: "number", value: Number(value) });
        continue;
      }
      if (/[A-Za-z_]/.test(char)) {
        let name = char;
        index += 1;
        while (index < expression.length && /[A-Za-z0-9_]/.test(expression[index])) { name += expression[index]; index += 1; }
        tokens.push({ type: "variable", value: name });
        continue;
      }
      throw new Error(`Formula contains an unsupported character near "${char}".`);
    }
    return tokens;
  }

  function toRpn(tokens, variableIds) {
    const output = [];
    const operators = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "u+": 3, "u-": 3 };
    const rightAssociative = new Set(["u+", "u-"]);
    let previous = null;

    tokens.forEach((sourceToken) => {
      let token = sourceToken;
      if (token.type === "number") output.push(token);
      else if (token.type === "variable") {
        if (!variableIds.has(token.value)) throw new Error(`Unknown formula variable "${token.value}".`);
        output.push(token);
      } else if (["+", "-", "*", "/"].includes(token.type)) {
        const isUnary = ["+", "-"].includes(token.type) && (!previous || ["+", "-", "*", "/", "("].includes(previous.type));
        if (isUnary) token = { type: `u${token.type}` };
        while (operators.length) {
          const top = operators[operators.length - 1];
          if (!precedence[top.type]) break;
          const shouldPop = rightAssociative.has(token.type)
            ? precedence[top.type] > precedence[token.type]
            : precedence[top.type] >= precedence[token.type];
          if (!shouldPop) break;
          output.push(operators.pop());
        }
        operators.push(token);
      } else if (token.type === "(") {
        operators.push(token);
      } else if (token.type === ")") {
        while (operators.length && operators[operators.length - 1].type !== "(") output.push(operators.pop());
        if (!operators.length) throw new Error("Formula parentheses are not balanced.");
        operators.pop();
      }
      previous = sourceToken;
    });
    while (operators.length) {
      const operator = operators.pop();
      if (operator.type === "(" || operator.type === ")") throw new Error("Formula parentheses are not balanced.");
      output.push(operator);
    }
    return output;
  }

  function evaluateRpn(rpn, values) {
    const stack = [];
    rpn.forEach((token) => {
      if (token.type === "number") stack.push(token.value);
      else if (token.type === "variable") stack.push(values[token.value]);
      else if (token.type === "u+" || token.type === "u-") {
        const value = stack.pop();
        if (value === undefined) throw new Error("Formula is incomplete.");
        stack.push(token.type === "u-" ? -value : value);
      } else {
        const right = stack.pop();
        const left = stack.pop();
        if (left === undefined || right === undefined) throw new Error("Formula is incomplete.");
        if (token.type === "+") stack.push(left + right);
        if (token.type === "-") stack.push(left - right);
        if (token.type === "*") stack.push(left * right);
        if (token.type === "/") stack.push(Math.abs(right) < 1e-12 ? NaN : left / right);
      }
    });
    if (stack.length !== 1) throw new Error("Formula is incomplete.");
    return stack[0];
  }

  function evaluateFormula(expression, values) {
    return evaluateRpn(toRpn(tokenize(expression), new Set(Object.keys(values))), values);
  }

  function percentile(sorted, p) {
    if (!sorted.length) return NaN;
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  function buildHistogram(sorted, bins = 32) {
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    if (min === max) return [{ min, max, count: sorted.length }];
    const width = (max - min) / bins;
    const result = Array.from({ length: bins }, (_, index) => ({ min: min + index * width, max: min + (index + 1) * width, count: 0 }));
    sorted.forEach((value) => { result[Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)))].count += 1; });
    return result;
  }

  function pearson(x, y) {
    if (!x.length || x.length !== y.length) return 0;
    const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
    const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
    let numerator = 0;
    let varianceX = 0;
    let varianceY = 0;
    for (let index = 0; index < x.length; index += 1) {
      const dx = x[index] - meanX;
      const dy = y[index] - meanY;
      numerator += dx * dy;
      varianceX += dx * dx;
      varianceY += dy * dy;
    }
    const denominator = Math.sqrt(varianceX * varianceY);
    return denominator ? numerator / denominator : 0;
  }

  function targetPass(value, target, condition) {
    if (condition === "gt") return value > target;
    if (condition === "gte") return value >= target;
    if (condition === "lt") return value < target;
    if (condition === "lte") return value <= target;
    return false;
  }

  function diagnoseConfig(config) {
    const diagnostics = [];
    const variables = config.variables || [];
    const iterations = Number(config.iterations);
    if (!Number.isFinite(iterations) || iterations < 1000) {
      diagnostics.push({
        level: "caution",
        title: "Low simulation count",
        detected: `${Number.isFinite(iterations) ? iterations : 0} iterations selected.`,
        why: "Small runs can make tail percentiles and target probabilities unstable.",
        consider: "Use at least 10,000 iterations for practical planning when browser performance allows.",
      });
    }
    variables.forEach((variable) => {
      const p = variable.params || {};
      if (variable.distribution === "triangular") {
        const min = Number(p.min);
        const mode = Number(p.mode);
        const max = Number(p.max);
        if (!(Number.isFinite(min) && Number.isFinite(mode) && Number.isFinite(max) && min <= mode && mode <= max && min < max)) {
          diagnostics.push({
            level: "high-risk",
            title: "Invalid triangular distribution",
            detected: `${variable.name || variable.id} does not satisfy minimum <= most likely <= maximum.`,
            why: "Triangular sampling needs ordered bounds to represent the intended uncertainty.",
            consider: "Correct the minimum, most likely, and maximum values before running the simulation.",
          });
        }
      }
      if (variable.distribution === "normal" && Number(p.sd) <= 0) {
        diagnostics.push({
          level: "high-risk",
          title: "Invalid Normal uncertainty",
          detected: `${variable.name || variable.id} has a non-positive standard deviation.`,
          why: "Normal sampling requires a positive standard deviation.",
          consider: "Enter a positive standard deviation or use a fixed value.",
        });
      }
      if (variable.distribution === "uniform" && Number(p.max) <= Number(p.min)) {
        diagnostics.push({
          level: "high-risk",
          title: "Invalid Uniform range",
          detected: `${variable.name || variable.id} has maximum less than or equal to minimum.`,
          why: "Uniform sampling requires a positive interval.",
          consider: "Correct the range before running the simulation.",
        });
      }
    });
    if (variables.length > 1) {
      diagnostics.push({
        level: "info",
        title: "Independent input assumption",
        detected: `${variables.length} uncertain inputs are sampled independently.`,
        why: "The current tool does not model correlations between uncertain variables.",
        consider: "If inputs move together, compare scenarios or use conservative ranges before acting on the result.",
      });
    }
    return diagnostics;
  }

  async function runSimulation(config, emit = () => {}, isCancelled = () => false) {
    const variables = config.variables || [];
    const rpn = toRpn(tokenize(config.formula || ""), new Set(variables.map((variable) => variable.id)));
    const rng = createRng(config.seed);
    const iterations = Number(config.iterations);
    const outputs = [];
    const samplesById = Object.fromEntries(variables.map((variable) => [variable.id, []]));
    let invalidCount = 0;
    let targetHits = 0;
    const target = Number(config.targetValue);
    const started = Date.now();
    const chunkSize = Math.max(250, Math.floor(iterations / 50));
    for (let start = 0; start < iterations; start += chunkSize) {
      if (isCancelled()) { emit({ type: "cancelled", message: "Simulation cancelled." }); return null; }
      const end = Math.min(iterations, start + chunkSize);
      for (let index = start; index < end; index += 1) {
        const values = {};
        variables.forEach((variable) => { values[variable.id] = sampleVariable(variable, rng); });
        const output = evaluateRpn(rpn, values);
        if (!Number.isFinite(output)) { invalidCount += 1; continue; }
        outputs.push(output);
        variables.forEach((variable) => samplesById[variable.id].push(values[variable.id]));
        if (targetPass(output, target, config.targetCondition)) targetHits += 1;
      }
      emit({ type: "progress", progress: Math.round((end / iterations) * 100) });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (!outputs.length) throw new Error("No valid simulation results were produced. Check the formula and distribution parameters.");
    const sorted = outputs.slice().sort((a, b) => a - b);
    const valid = outputs.length;
    const mean = outputs.reduce((sum, value) => sum + value, 0) / valid;
    const variance = valid > 1 ? outputs.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (valid - 1) : 0;
    const percentiles = {};
    [5, 10, 25, 50, 75, 80, 90, 95].forEach((p) => { percentiles[`P${p}`] = percentile(sorted, p); });
    const lowerP = (100 - Number(config.confidenceLevel)) / 2;
    const upperP = 100 - lowerP;
    const result = {
      modelName: config.modelName,
      outputName: config.outputName,
      targetValue: target,
      targetCondition: config.targetCondition,
      iterations,
      valid,
      invalidCount,
      elapsedMs: Date.now() - started,
      summary: { mean, median: percentiles.P50, standardDeviation: Math.sqrt(variance), min: sorted[0], max: sorted[sorted.length - 1], targetProbability: targetHits / valid, notTargetProbability: 1 - (targetHits / valid) },
      percentiles,
      confidenceRange: { lowerPercentile: lowerP, upperPercentile: upperP, lower: percentile(sorted, lowerP), upper: percentile(sorted, upperP) },
      histogram: buildHistogram(sorted, 32),
      cumulative: [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map((p) => ({ percentile: p, value: percentile(sorted, p) })),
      sensitivity: variables.map((variable) => ({ id: variable.id, name: variable.name, correlation: pearson(samplesById[variable.id], outputs) })).sort((left, right) => Math.abs(right.correlation) - Math.abs(left.correlation)),
      samplePreview: sorted.filter((_, index) => index % Math.max(1, Math.floor(sorted.length / 200)) === 0).slice(0, 200),
    };
    emit({ type: "result", result });
    return result;
  }

  return { createRng, normalSample, sampleVariable, tokenize, toRpn, evaluateRpn, evaluateFormula, percentile, buildHistogram, pearson, targetPass, diagnoseConfig, runSimulation };
}));

'use strict';

let cancelled = false;
const isWorkerContext = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

if (isWorkerContext) {
  self.onmessage = (event) => {
    const { type, config } = event.data || {};
    if (type === 'cancel') {
      cancelled = true;
      return;
    }
    if (type === 'run') {
      cancelled = false;
      runSimulation(config).catch((error) => {
        self.postMessage({ type: 'error', message: error.message || 'Simulation failed.' });
      });
    }
  };
}

function createRng(seed) {
  let state = (Number(seed) >>> 0) || 12345;
  return function rng() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalSample(rng) {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function sampleVariable(variable, rng) {
  const p = variable.params || {};
  if (variable.distribution === 'fixed') return Number(p.value);
  if (variable.distribution === 'uniform') return Number(p.min) + rng() * (Number(p.max) - Number(p.min));
  if (variable.distribution === 'triangular') {
    const min = Number(p.min);
    const mode = Number(p.mode);
    const max = Number(p.max);
    const u = rng();
    const c = (mode - min) / (max - min);
    return u < c
      ? min + Math.sqrt(u * (max - min) * (mode - min))
      : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
  if (variable.distribution === 'normal') {
    const mean = Number(p.mean);
    const sd = Number(p.sd);
    const hasMin = p.min !== '' && p.min !== null && p.min !== undefined;
    const hasMax = p.max !== '' && p.max !== null && p.max !== undefined;
    const min = hasMin ? Number(p.min) : -Infinity;
    const max = hasMax ? Number(p.max) : Infinity;
    for (let i = 0; i < 120; i += 1) {
      const value = mean + sd * normalSample(rng);
      if (value >= min && value <= max) return value;
    }
    return Math.min(max, Math.max(min, mean));
  }
  if (variable.distribution === 'lognormal') {
    const value = Math.exp(Number(p.meanLog) + Number(p.sdLog) * normalSample(rng));
    const max = p.max !== '' && p.max !== null && p.max !== undefined ? Number(p.max) : Infinity;
    return Math.min(value, max);
  }
  if (variable.distribution === 'discrete') {
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
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (/[+\-*/()]/.test(char)) {
      tokens.push({ type: char });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      if (char === '.' && !/[0-9]/.test(expression[i + 1] || '')) {
        throw new Error('Formula contains an unsupported character near ".".');
      }
      let value = char;
      i += 1;
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        value += expression[i];
        i += 1;
      }
      if (!Number.isFinite(Number(value))) throw new Error(`Invalid number "${value}" in formula.`);
      tokens.push({ type: 'number', value: Number(value) });
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      let name = char;
      i += 1;
      while (i < expression.length && /[A-Za-z0-9_]/.test(expression[i])) {
        name += expression[i];
        i += 1;
      }
      tokens.push({ type: 'variable', value: name });
      continue;
    }
    throw new Error(`Formula contains an unsupported character near "${char}".`);
  }
  return tokens;
}

function toRpn(tokens, variableIds) {
  const output = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  let previous = null;
  tokens.forEach((token) => {
    if (token.type === 'number') output.push(token);
    else if (token.type === 'variable') {
      if (!variableIds.has(token.value)) throw new Error(`Unknown formula variable "${token.value}".`);
      output.push(token);
    } else if (['+', '-', '*', '/'].includes(token.type)) {
      if (token.type === '-' && (!previous || ['+', '-', '*', '/', '('].includes(previous.type))) {
        output.push({ type: 'number', value: 0 });
      }
      while (operators.length) {
        const top = operators[operators.length - 1];
        if (!precedence[top.type] || precedence[top.type] < precedence[token.type]) break;
        output.push(operators.pop());
      }
      operators.push(token);
    } else if (token.type === '(') {
      operators.push(token);
    } else if (token.type === ')') {
      while (operators.length && operators[operators.length - 1].type !== '(') output.push(operators.pop());
      if (!operators.length) throw new Error('Formula parentheses are not balanced.');
      operators.pop();
    }
    previous = token;
  });
  while (operators.length) {
    const operator = operators.pop();
    if (operator.type === '(' || operator.type === ')') throw new Error('Formula parentheses are not balanced.');
    output.push(operator);
  }
  return output;
}

function evaluateRpn(rpn, values) {
  const stack = [];
  rpn.forEach((token) => {
    if (token.type === 'number') stack.push(token.value);
    else if (token.type === 'variable') stack.push(values[token.value]);
    else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Formula is incomplete.');
      if (token.type === '+') stack.push(a + b);
      if (token.type === '-') stack.push(a - b);
      if (token.type === '*') stack.push(a * b);
      if (token.type === '/') {
        if (Math.abs(b) < 1e-12) stack.push(NaN);
        else stack.push(a / b);
      }
    }
  });
  if (stack.length !== 1) throw new Error('Formula is incomplete.');
  return stack[0];
}

function percentile(sorted, p) {
  if (!sorted.length) return NaN;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function buildHistogram(sorted, bins = 32) {
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) return [{ min, max, count: sorted.length }];
  const width = (max - min) / bins;
  const result = Array.from({ length: bins }, (_, index) => ({
    min: min + index * width,
    max: min + (index + 1) * width,
    count: 0
  }));
  sorted.forEach((value) => {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)));
    result[index].count += 1;
  });
  return result;
}

function pearson(x, y) {
  const n = x.length;
  if (!n || n !== y.length) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += x[i];
    sy += y[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let numerator = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const xv = x[i] - mx;
    const yv = y[i] - my;
    numerator += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
  }
  const denominator = Math.sqrt(dx * dy);
  return denominator ? numerator / denominator : 0;
}

function targetPass(value, target, condition) {
  if (condition === 'gt') return value > target;
  if (condition === 'gte') return value >= target;
  if (condition === 'lt') return value < target;
  if (condition === 'lte') return value <= target;
  return false;
}

async function runSimulation(
  config,
  emit = (message) => self.postMessage(message),
  isCancelled = () => cancelled
) {
  const variables = config.variables || [];
  const ids = new Set(variables.map((variable) => variable.id));
  const rpn = toRpn(tokenize(config.formula || ''), ids);
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
    if (isCancelled()) {
      emit({ type: 'cancelled', message: 'Simulation cancelled.' });
      return;
    }
    const end = Math.min(iterations, start + chunkSize);
    for (let i = start; i < end; i += 1) {
      const values = {};
      for (const variable of variables) {
        const value = sampleVariable(variable, rng);
        values[variable.id] = value;
      }
      const output = evaluateRpn(rpn, values);
      if (!Number.isFinite(output)) {
        invalidCount += 1;
        continue;
      }
      outputs.push(output);
      variables.forEach((variable) => samplesById[variable.id].push(values[variable.id]));
      if (targetPass(output, target, config.targetCondition)) targetHits += 1;
    }
    emit({ type: 'progress', progress: Math.round((end / iterations) * 100) });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (!outputs.length) throw new Error('No valid simulation results were produced. Check the formula and distribution parameters.');
  const sorted = outputs.slice().sort((a, b) => a - b);
  const valid = outputs.length;
  const mean = outputs.reduce((sum, value) => sum + value, 0) / valid;
  const variance = valid > 1 ? outputs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (valid - 1) : 0;
  const percentiles = {};
  [5, 10, 25, 50, 75, 80, 90, 95].forEach((p) => { percentiles[`P${p}`] = percentile(sorted, p); });
  const lowerP = (100 - Number(config.confidenceLevel)) / 2;
  const upperP = 100 - lowerP;
  const sensitivity = variables.map((variable) => ({
    id: variable.id,
    name: variable.name,
    correlation: pearson(samplesById[variable.id], outputs)
  })).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  const histogram = buildHistogram(sorted, 32);
  const cumulative = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map((p) => ({ percentile: p, value: percentile(sorted, p) }));

  emit({
    type: 'result',
    result: {
      modelName: config.modelName,
      outputName: config.outputName,
      targetValue: target,
      targetCondition: config.targetCondition,
      iterations,
      valid,
      invalidCount,
      elapsedMs: Date.now() - started,
      summary: {
        mean,
        median: percentiles.P50,
        standardDeviation: Math.sqrt(variance),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        targetProbability: targetHits / valid,
        notTargetProbability: 1 - targetHits / valid
      },
      percentiles,
      confidenceRange: {
        lowerPercentile: lowerP,
        upperPercentile: upperP,
        lower: percentile(sorted, lowerP),
        upper: percentile(sorted, upperP)
      },
      histogram,
      cumulative,
      sensitivity,
      samplePreview: sorted.filter((_, index) => index % Math.max(1, Math.floor(sorted.length / 200)) === 0).slice(0, 200)
    }
  });
}

if (!isWorkerContext) {
  window.MonteCarloEngine = Object.freeze({ runSimulation });
}

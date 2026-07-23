'use strict';

const distributionGuidance = {
  fixed: 'Use when the value is known, such as a confirmed contract price or committed quantity.',
  uniform: 'Use when every value inside a credible minimum-to-maximum range is considered equally plausible.',
  triangular: 'Use when evidence or experts can provide a minimum, most likely, and maximum estimate.',
  normal: 'Use for approximately symmetric variation around an average. Add bounds when negative values are impossible.',
  lognormal: 'Use for positive, right-skewed variables such as some costs, durations, and lead times.',
  discrete: 'Use when only specific outcomes can occur and each outcome has an assigned probability.'
};

const templates = {
  profit: {
    name: 'Profit and Break-Even Risk',
    outputName: 'Annual Profit',
    unitType: 'currency',
    unitSymbol: '£',
    formula: '(Selling_Price - Variable_Cost) * Demand - Fixed_Cost',
    targetValue: 100000,
    targetCondition: 'gte',
    variables: [
      { name: 'Selling Price', id: 'Selling_Price', unit: '£/unit', distribution: 'triangular', params: { min: 48, mode: 52, max: 58 }, description: 'Estimated selling price per unit.' },
      { name: 'Variable Cost', id: 'Variable_Cost', unit: '£/unit', distribution: 'triangular', params: { min: 29, mode: 32, max: 38 }, description: 'Estimated variable cost per unit.' },
      { name: 'Demand', id: 'Demand', unit: 'units', distribution: 'normal', params: { mean: 12000, sd: 1800, min: 0, max: '' }, description: 'Annual demand uncertainty.' },
      { name: 'Fixed Cost', id: 'Fixed_Cost', unit: '£', distribution: 'uniform', params: { min: 160000, max: 200000 }, description: 'Annual fixed cost range.' }
    ]
  },
  cost: {
    name: 'Project Cost Risk',
    outputName: 'Total Project Cost',
    unitType: 'currency',
    unitSymbol: '£',
    formula: 'Labour_Cost + Material_Cost + Equipment_Cost + Contingency_Cost',
    targetValue: 500000,
    targetCondition: 'lte',
    variables: [
      { name: 'Labour Cost', id: 'Labour_Cost', unit: '£', distribution: 'triangular', params: { min: 140000, mode: 165000, max: 210000 }, description: 'Internal and contracted labour cost.' },
      { name: 'Material Cost', id: 'Material_Cost', unit: '£', distribution: 'normal', params: { mean: 190000, sd: 25000, min: 0, max: '' }, description: 'Material purchase uncertainty.' },
      { name: 'Equipment Cost', id: 'Equipment_Cost', unit: '£', distribution: 'uniform', params: { min: 85000, max: 120000 }, description: 'Equipment and tooling cost.' },
      { name: 'Contingency Cost', id: 'Contingency_Cost', unit: '£', distribution: 'triangular', params: { min: 25000, mode: 45000, max: 85000 }, description: 'Known risk contingency range.' }
    ]
  },
  inventory: {
    name: 'Demand and Inventory Risk',
    outputName: 'Ending Inventory',
    unitType: 'units',
    unitSymbol: 'units',
    formula: 'Opening_Inventory + Replenishment_Quantity - Demand',
    targetValue: 0,
    targetCondition: 'gte',
    variables: [
      { name: 'Demand', id: 'Demand', unit: 'units', distribution: 'normal', params: { mean: 5200, sd: 850, min: 0, max: '' }, description: 'Demand during the review period.' },
      { name: 'Replenishment Quantity', id: 'Replenishment_Quantity', unit: 'units', distribution: 'fixed', params: { value: 5000 }, description: 'Planned replenishment quantity.' },
      { name: 'Opening Inventory', id: 'Opening_Inventory', unit: 'units', distribution: 'uniform', params: { min: 700, max: 1300 }, description: 'Opening inventory uncertainty.' }
    ]
  },
  duration: {
    name: 'Project Completion Risk',
    outputName: 'Total Duration',
    unitType: 'days',
    unitSymbol: 'days',
    formula: 'Planning_Duration + Procurement_Duration + Implementation_Duration + Testing_Duration',
    targetValue: 180,
    targetCondition: 'lte',
    variables: [
      { name: 'Planning Duration', id: 'Planning_Duration', unit: 'days', distribution: 'triangular', params: { min: 18, mode: 25, max: 36 }, description: 'Planning phase duration.' },
      { name: 'Procurement Duration', id: 'Procurement_Duration', unit: 'days', distribution: 'lognormal', params: { meanLog: 3.55, sdLog: 0.22, max: 75 }, description: 'Right-skewed procurement lead time.' },
      { name: 'Implementation Duration', id: 'Implementation_Duration', unit: 'days', distribution: 'triangular', params: { min: 70, mode: 90, max: 128 }, description: 'Implementation phase estimate.' },
      { name: 'Testing Duration', id: 'Testing_Duration', unit: 'days', distribution: 'uniform', params: { min: 18, max: 34 }, description: 'Testing and stabilization duration.' }
    ]
  },
  custom: {
    name: 'Custom Model',
    outputName: 'Custom Outcome',
    unitType: 'custom',
    unitSymbol: 'units',
    formula: 'A + B',
    targetValue: 15,
    targetCondition: 'gte',
    variables: [
      { name: 'A', id: 'A', unit: 'units', distribution: 'fixed', params: { value: 10 }, description: 'First custom variable.' },
      { name: 'B', id: 'B', unit: 'units', distribution: 'fixed', params: { value: 5 }, description: 'Second custom variable.' }
    ]
  }
};

const state = {
  templateKey: 'profit',
  variables: [],
  dirty: false,
  worker: null,
  fallbackCancelled: false,
  fallbackActive: false,
  runWatchdog: null,
  running: false,
  lastConfig: null,
  lastResult: null,
  scenarios: [],
  modalReturnFocus: null
};

const $ = (selector) => document.querySelector(selector);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeIdentifier(name, existing = new Set()) {
  let base = String(name || 'Variable').trim().replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  if (!base || /^[0-9]/.test(base)) base = `Variable_${base || '1'}`;
  let id = base;
  let suffix = 2;
  while (existing.has(id)) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  return id;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(Number(value))) return 'Not available';
  return Number(value).toLocaleString('en-GB', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function formatValue(value) {
  const type = state.lastConfig?.unitType || $('#outputUnitType')?.value || 'currency';
  const unit = state.lastConfig?.unitSymbol || $('#unitSymbol')?.value || '';
  const formatted = formatNumber(value, Math.abs(value) >= 100 ? 0 : 2);
  if (type === 'currency') return `${unit}${formatted}`;
  if (type === 'percentage') return `${formatted}%`;
  return `${formatted} ${unit}`.trim();
}

function errorTarget(message) {
  const text = String(message).toLowerCase();
  if (text.includes('formula')) return '#advanced-settings';
  if (text.includes('target') || text.includes('iteration') || text.includes('seed')) return '#configure-simulation';
  return '#define-inputs';
}

function setError(messages, focusRunSummary = false) {
  const list = Array.isArray(messages) ? messages : [messages];
  const content = list.length
    ? `<strong>Please fix the following:</strong><ul>${list.map((message) => `<li><a href="${errorTarget(message)}">${escapeHtml(message)}</a></li>`).join('')}</ul>`
    : '';
  [$('#errorSummary'), $('#runErrorSummary')].forEach((box) => {
    if (!box) return;
    box.hidden = !list.length;
    box.innerHTML = content;
  });
  if (list.length && focusRunSummary) {
    $('#runErrorSummary')?.scrollIntoView({ block: 'center' });
  }
}

function setWorkflowStep(step) {
  document.querySelectorAll('[data-workflow-step]').forEach((item) => {
    const itemStep = Number(item.dataset.workflowStep);
    item.classList.toggle('active', itemStep === step);
    item.classList.toggle('complete', itemStep < step);
    if (itemStep === step) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
}

function markDirty() {
  state.dirty = true;
  if (state.lastResult) {
    $('#results').classList.add('results-stale');
    $('#resultSubtitle').textContent = 'Inputs have changed. Run the simulation again before using or exporting these results.';
    ['saveScenarioButton', 'exportCsvButton', 'saveHistogramButton', 'saveCumulativeButton'].forEach((id) => {
      $(`#${id}`).disabled = true;
    });
  }
}

function applyTemplate(key) {
  const template = templates[key] || templates.profit;
  state.templateKey = key;
  state.variables = clone(template.variables);
  $('#outputName').value = template.outputName;
  $('#outputUnitType').value = template.unitType;
  $('#unitSymbol').value = template.unitSymbol;
  $('#formula').value = template.formula;
  $('#targetValue').value = template.targetValue;
  $('#targetCondition').value = template.targetCondition;
  $('#iterations').value = '10000';
  $('#seed').value = '12345';
  $('#confidenceLevel').value = '90';
  document.querySelectorAll('[name="modelTemplate"]').forEach((input) => { input.checked = input.value === key; });
  renderVariables();
  clearResults();
  setError([]);
  setWorkflowStep(1);
  state.dirty = false;
}

function renderVariables() {
  const target = $('#variableEditor');
  if (!target) return;
  target.innerHTML = '';
  state.variables.forEach((variable, index) => {
    if (variable.distribution === 'discrete' && !variable.discrete?.length) {
      variable.discrete = [{ value: 0, probability: 0.5 }, { value: 10, probability: 0.5 }];
    }
    const card = document.createElement('article');
    card.className = 'variable-card';
    card.dataset.index = index;
    card.setAttribute('aria-labelledby', `variable-title-${index}`);
    card.innerHTML = `
      <div class="variable-card-header">
        <strong id="variable-title-${index}">${escapeHtml(variable.name || `Variable ${index + 1}`)}</strong>
        <button class="reset remove-variable" type="button" aria-label="Remove ${escapeHtml(variable.name || `variable ${index + 1}`)}">Remove variable</button>
      </div>
      <div class="variable-body">
        <div class="variable-grid">
          <label><span>Variable name</span><input data-field="name" type="text" value="${escapeHtml(variable.name)}"></label>
          <label><span>Unit</span><input data-field="unit" type="text" value="${escapeHtml(variable.unit || '')}"></label>
          <label><span>Distribution</span><select data-field="distribution" aria-describedby="distribution-help-${index}">
            ${['fixed', 'uniform', 'triangular', 'normal', 'lognormal', 'discrete'].map((type) => `<option value="${type}"${variable.distribution === type ? ' selected' : ''}>${type[0].toUpperCase()}${type.slice(1)}</option>`).join('')}
          </select></label>
        </div>
        <p class="distribution-help" id="distribution-help-${index}">${escapeHtml(distributionGuidance[variable.distribution] || '')}</p>
        <div class="param-grid">${renderParamFields(variable)}</div>
        ${variable.distribution === 'discrete' ? renderDiscreteRows(variable) : ''}
        <label><span>Description</span><textarea data-field="description" rows="2">${escapeHtml(variable.description || '')}</textarea></label>
      </div>
    `;
    target.appendChild(card);
  });
  renderFormulaButtons();
}

function renderParamFields(variable) {
  const p = variable.params || {};
  const field = (key, label, value = '') => `<label><span>${label}</span><input data-param="${key}" type="number" step="0.0001" value="${escapeHtml(value ?? '')}"></label>`;
  if (variable.distribution === 'fixed') return field('value', 'Value', p.value);
  if (variable.distribution === 'uniform') return field('min', 'Minimum', p.min) + field('max', 'Maximum', p.max);
  if (variable.distribution === 'triangular') return field('min', 'Minimum', p.min) + field('mode', 'Most likely', p.mode) + field('max', 'Maximum', p.max);
  if (variable.distribution === 'normal') return field('mean', 'Mean', p.mean) + field('sd', 'Standard deviation', p.sd) + field('min', 'Minimum truncation', p.min) + field('max', 'Maximum truncation', p.max);
  if (variable.distribution === 'lognormal') return field('meanLog', 'Mean of underlying normal', p.meanLog) + field('sdLog', 'SD of underlying normal', p.sdLog) + field('max', 'Optional maximum bound', p.max);
  return '';
}

function renderDiscreteRows(variable) {
  const rows = variable.discrete?.length ? variable.discrete : [{ value: 0, probability: 0.5 }, { value: 10, probability: 0.5 }];
  const total = rows.reduce((sum, row) => sum + Number(row.probability || 0), 0);
  return `
    <div class="discrete-table">
      <strong>Discrete outcomes</strong>
      ${rows.map((row, rowIndex) => `
        <div class="discrete-row" data-row="${rowIndex}">
          <label><span>Value</span><input data-discrete="value" type="number" step="0.0001" value="${escapeHtml(row.value)}"></label>
          <label><span>Probability</span><input data-discrete="probability" type="number" step="0.0001" value="${escapeHtml(row.probability)}"></label>
          <button class="reset remove-discrete-row" type="button">Remove</button>
        </div>
      `).join('')}
      <button class="add-discrete-row" type="button">Add outcome</button>
      <span class="probability-total ${Math.abs(total - 1) < 0.0001 || Math.abs(total - 100) < 0.0001 ? 'is-valid' : 'is-invalid'}">Probability total: ${formatNumber(total, 4)}</span>
    </div>
  `;
}

function renderFormulaButtons() {
  const target = $('#formulaVariableButtons');
  if (!target) return;
  target.innerHTML = '';
  state.variables.forEach((variable) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = variable.id;
    button.addEventListener('click', () => {
      const formula = $('#formula');
      const start = formula.selectionStart || formula.value.length;
      const end = formula.selectionEnd || formula.value.length;
      formula.value = `${formula.value.slice(0, start)}${variable.id}${formula.value.slice(end)}`;
      formula.focus();
      formula.selectionStart = formula.selectionEnd = start + variable.id.length;
      markDirty();
    });
    target.appendChild(button);
  });
}

function updateVariableFromCard(card) {
  const index = Number(card.dataset.index);
  const variable = state.variables[index];
  if (!variable) return;
  const existing = new Set(state.variables.filter((_, itemIndex) => itemIndex !== index).map((item) => item.id));
  card.querySelectorAll('[data-field]').forEach((field) => {
    if (field.dataset.field === 'name') {
      variable.name = field.value;
      variable.id = sanitizeIdentifier(field.value, existing);
    } else if (field.dataset.field === 'distribution') {
      if (variable.distribution !== field.value) variable.params = {};
      variable.distribution = field.value;
    } else {
      variable[field.dataset.field] = field.value;
    }
  });
  variable.params = variable.params || {};
  card.querySelectorAll('[data-param]').forEach((field) => {
    variable.params[field.dataset.param] = field.value;
  });
  if (variable.distribution === 'discrete') {
    variable.discrete = Array.from(card.querySelectorAll('.discrete-row')).map((row) => ({
      value: row.querySelector('[data-discrete="value"]').value,
      probability: row.querySelector('[data-discrete="probability"]').value
    }));
  }
  markDirty();
}

function addVariable() {
  const existing = new Set(state.variables.map((item) => item.id));
  const id = sanitizeIdentifier(`Variable ${state.variables.length + 1}`, existing);
  state.variables.push({ name: id.replaceAll('_', ' '), id, unit: '', distribution: 'triangular', params: { min: 0, mode: 5, max: 10 }, description: '' });
  renderVariables();
  markDirty();
  setWorkflowStep(2);
}

function validateVariable(variable, names) {
  const errors = [];
  if (!variable.name.trim()) errors.push('Each variable needs a name.');
  if (names.has(variable.name.trim().toLowerCase())) errors.push(`Duplicate variable name: ${variable.name}.`);
  names.add(variable.name.trim().toLowerCase());
  const p = variable.params || {};
  const finite = (value) => value !== '' && Number.isFinite(Number(value));
  if (variable.distribution === 'fixed' && !finite(p.value)) errors.push(`${variable.name}: fixed value is required.`);
  if (variable.distribution === 'uniform') {
    if (!finite(p.min) || !finite(p.max)) errors.push(`${variable.name}: minimum and maximum are required.`);
    else if (Number(p.max) <= Number(p.min)) errors.push(`${variable.name}: maximum must be greater than minimum.`);
  }
  if (variable.distribution === 'triangular') {
    if (!finite(p.min) || !finite(p.mode) || !finite(p.max)) errors.push(`${variable.name}: minimum, most likely, and maximum are required.`);
    else if (!(Number(p.min) <= Number(p.mode) && Number(p.mode) <= Number(p.max))) errors.push(`${variable.name}: minimum must be <= most likely <= maximum.`);
  }
  if (variable.distribution === 'normal') {
    if (!finite(p.mean) || !finite(p.sd)) errors.push(`${variable.name}: mean and standard deviation are required.`);
    else if (Number(p.sd) <= 0) errors.push(`${variable.name}: standard deviation must be greater than zero.`);
    if (finite(p.min) && finite(p.max) && Number(p.max) <= Number(p.min)) errors.push(`${variable.name}: maximum truncation must exceed minimum truncation.`);
  }
  if (variable.distribution === 'lognormal') {
    if (!finite(p.meanLog) || !finite(p.sdLog)) errors.push(`${variable.name}: underlying normal mean and standard deviation are required.`);
    else if (Number(p.sdLog) <= 0) errors.push(`${variable.name}: underlying normal standard deviation must be greater than zero.`);
  }
  if (variable.distribution === 'discrete') {
    if (!variable.discrete?.length) errors.push(`${variable.name}: add at least one discrete outcome.`);
    const total = (variable.discrete || []).reduce((sum, row) => {
      if (!finite(row.value)) errors.push(`${variable.name}: each discrete row needs a numeric value.`);
      if (!finite(row.probability) || Number(row.probability) < 0) errors.push(`${variable.name}: probabilities must be non-negative numbers.`);
      return sum + Number(row.probability || 0);
    }, 0);
    if (Math.abs(total - 1) > 0.0001 && Math.abs(total - 100) > 0.0001) errors.push(`${variable.name}: probabilities must total 1.0 or 100%.`);
    if (Math.abs(total - 100) <= 0.0001) variable.discrete = variable.discrete.map((row) => ({ ...row, probability: Number(row.probability) / 100 }));
  }
  return errors;
}

function buildConfig() {
  const names = new Set();
  const variables = clone(state.variables);
  const errors = variables.flatMap((variable) => validateVariable(variable, names));
  const formula = $('#formula').value.trim();
  const variableIds = new Set(variables.map((variable) => variable.id));
  const formulaIdentifiers = formula.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  const targetValue = Number($('#targetValue').value);
  if (!Number.isFinite(targetValue)) errors.push('Target value must be a valid number.');
  if (!formula) errors.push('Formula is required.');
  [...new Set(formulaIdentifiers.filter((identifier) => !variableIds.has(identifier)))].forEach((identifier) => {
    errors.push(`Formula contains an unknown variable: ${identifier}.`);
  });
  variables.filter((variable) => !formulaIdentifiers.includes(variable.id)).forEach((variable) => {
    errors.push(`${variable.name} is not used in the formula.`);
  });
  if (!variables.length) errors.push('Add at least one variable.');
  if (errors.length) {
    setError(errors, true);
    return null;
  }
  setError([]);
  return {
    templateKey: state.templateKey,
    modelName: templates[state.templateKey]?.name || 'Custom Model',
    variables,
    formula,
    iterations: Number($('#iterations').value),
    seed: Number($('#seed').value),
    confidenceLevel: Number($('#confidenceLevel').value),
    targetCondition: $('#targetCondition').value,
    targetValue,
    outputName: $('#outputName').value || 'Outcome',
    unitType: $('#outputUnitType').value,
    unitSymbol: $('#unitSymbol').value || ''
  };
}

function runSimulation() {
  const config = buildConfig();
  if (!config || state.running) return;
  state.lastConfig = config;
  state.running = true;
  setSimulationInputsDisabled(true);
  $('#runSimulationButton').disabled = true;
  $('#cancelSimulationButton').disabled = false;
  $('#simulationProgress').value = 0;
  $('#simulationProgressText').textContent = '0%';
  $('#simulationStatus').textContent = 'Simulation running...';
  state.fallbackCancelled = false;
  setWorkflowStep(4);

  const handleSimulationMessage = (data) => {
    const { type, progress, result, message } = data || {};
    if (type === 'progress') {
      $('#simulationProgress').value = progress;
      $('#simulationProgressText').textContent = `${progress}%`;
      $('#simulationStatus').textContent = `Simulation running: ${progress}% complete.`;
    }
    if (type === 'result') {
      finishRun();
      state.lastResult = result;
      $('#simulationProgress').value = 100;
      $('#simulationProgressText').textContent = '100%';
      $('#simulationStatus').textContent = `Simulation complete in ${formatNumber(result.elapsedMs / 1000, 2)} seconds.`;
      renderResults(result);
    }
    if (type === 'error') {
      finishRun();
      setError(message || 'Simulation failed. Check the model inputs and formula.');
      $('#simulationStatus').textContent = 'Simulation failed.';
      setWorkflowStep(3);
    }
    if (type === 'cancelled') {
      finishRun();
      $('#simulationStatus').textContent = message || 'Simulation cancelled.';
      setWorkflowStep(3);
    }
  };

  const runInPage = () => {
    if (state.fallbackActive) return;
    if (!window.MonteCarloEngine) {
      finishRun();
      setError('The simulation engine could not be loaded. Refresh the page and try again.');
      $('#simulationStatus').textContent = 'Simulation could not start.';
      setWorkflowStep(3);
      return;
    }
    state.fallbackActive = true;
    if (state.runWatchdog) {
      window.clearTimeout(state.runWatchdog);
      state.runWatchdog = null;
    }
    $('#simulationStatus').textContent = 'Simulation running locally: 0% complete.';
    window.setTimeout(() => {
      window.MonteCarloEngine.runSimulation(
        config,
        handleSimulationMessage,
        () => state.fallbackCancelled
      ).catch((error) => {
        finishRun();
        setError(error.message || 'Simulation failed. Check the model inputs and formula.');
        $('#simulationStatus').textContent = 'Simulation failed.';
        setWorkflowStep(3);
      });
    }, 0);
  };

  if (window.location.protocol === 'file:') {
    runInPage();
    return;
  }

  try {
    state.worker = new Worker(new URL('monte-carlo-worker.js', window.location.href));
    state.worker.onmessage = (event) => handleSimulationMessage(event.data);
    state.worker.onerror = () => {
      if (!state.running) return;
      if (state.worker) {
        state.worker.terminate();
        state.worker = null;
      }
      runInPage();
    };
    state.worker.postMessage({ type: 'run', config });
    state.runWatchdog = window.setTimeout(() => {
      if (!state.running || Number($('#simulationProgress').value) > 0) return;
      if (state.worker) {
        state.worker.terminate();
        state.worker = null;
      }
      runInPage();
    }, 5000);
  } catch (error) {
    state.worker = null;
    runInPage();
  }
}

function finishRun() {
  if (state.runWatchdog) {
    window.clearTimeout(state.runWatchdog);
    state.runWatchdog = null;
  }
  state.running = false;
  state.fallbackActive = false;
  setSimulationInputsDisabled(false);
  $('#runSimulationButton').disabled = false;
  $('#cancelSimulationButton').disabled = true;
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
}

function setSimulationInputsDisabled(disabled) {
  document.querySelectorAll(
    '#choose-model input, #choose-model button, #define-inputs input, #define-inputs select, #define-inputs textarea, #define-inputs button, #configure-simulation input, #configure-simulation select, #configure-simulation textarea, #configure-simulation button'
  ).forEach((control) => {
    control.disabled = disabled;
  });
}

function cancelSimulation() {
  if (state.worker) state.worker.postMessage({ type: 'cancel' });
  else state.fallbackCancelled = true;
  $('#simulationStatus').textContent = 'Cancelling simulation...';
}

function renderResults(result) {
  $('#results').classList.remove('hidden');
  $('#results').classList.remove('results-stale');
  $('#resultSubtitle').textContent = 'Review the decision outlook before exploring the supporting distribution and percentile detail.';
  ['saveScenarioButton', 'exportCsvButton', 'saveHistogramButton', 'saveCumulativeButton'].forEach((id) => {
    $(`#${id}`).disabled = false;
  });
  renderMetricCards(result);
  renderPercentiles(result);
  renderHistogram(result);
  renderCumulative(result);
  renderSensitivity(result);
  renderInterpretation(result);
  renderScenarioTable();
  setWorkflowStep(5);
  $('#resultsAnnouncement').textContent = `Simulation complete. ${formatNumber(result.summary.targetProbability * 100, 1)} percent probability of meeting the target.`;
  $('#results-heading').focus({ preventScroll: false });
}

function renderMetricCards(result) {
  const s = result.summary;
  const templateKey = state.lastConfig?.templateKey;
  const usesDownside = templateKey === 'profit' || templateKey === 'inventory';
  const planningKey = usesDownside ? 'P10' : 'P90';
  const planningLabel = usesDownside ? 'Downside planning value (P10)' : 'Conservative planning value (P90)';
  const mainDriver = result.sensitivity[0]?.name || 'No clear driver';
  const cards = [
    ['Probability of meeting target', `${formatNumber(s.targetProbability * 100, 1)}%`, true],
    ['Median', formatValue(s.median)],
    [planningLabel, formatValue(result.percentiles[planningKey])],
    [`Central ${state.lastConfig?.confidenceLevel || 90}% range`, `${formatValue(result.confidenceRange.lower)} – ${formatValue(result.confidenceRange.upper)}`],
    ['Standard deviation', formatValue(s.standardDeviation)],
    ['Main outcome driver', mainDriver]
  ];
  $('#metricCards').innerHTML = cards.map(([label, value, primary]) => `<article class="metric-card ${primary ? 'primary' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
}

function renderPercentiles(result) {
  const rows = Object.entries(result.percentiles).map(([key, value]) => `<tr><th>${key}</th><td>${formatValue(value)}</td></tr>`).join('');
  $('#percentileTable').innerHTML = `<thead><tr><th>Percentile</th><th>Value</th></tr></thead><tbody>${rows}</tbody>`;
}

function scaleX(value, min, max, width, pad) {
  if (max === min) return pad + width / 2;
  return pad + ((value - min) / (max - min)) * width;
}

function renderHistogram(result) {
  const bins = result.histogram;
  const min = bins[0].min;
  const max = bins[bins.length - 1].max;
  const maxCount = Math.max(...bins.map((bin) => bin.count));
  const width = 760;
  const height = 300;
  const pad = 46;
  const plotW = width - pad * 2;
  const plotH = height - pad * 1.6;
  const barW = plotW / bins.length;
  const markers = [
    ['Mean', result.summary.mean, '#1f6feb'],
    ['Median', result.summary.median, '#06172b'],
    ['Target', result.targetValue, '#e11d48'],
    [`P${result.confidenceRange.lowerPercentile}`, result.confidenceRange.lower, '#f59e0b'],
    [`P${result.confidenceRange.upperPercentile}`, result.confidenceRange.upper, '#f59e0b']
  ];
  const bars = bins.map((bin, index) => {
    const h = maxCount ? (bin.count / maxCount) * plotH : 0;
    return `<rect x="${pad + index * barW}" y="${height - pad - h}" width="${Math.max(1, barW - 2)}" height="${h}" fill="#dcebff" stroke="#1f6feb"><title>${formatValue(bin.min)} to ${formatValue(bin.max)}: ${bin.count} simulations</title></rect>`;
  }).join('');
  const markerLines = markers.map(([label, value, color]) => {
    const x = scaleX(value, min, max, plotW, pad);
    return `<line x1="${x}" y1="${pad / 2}" x2="${x}" y2="${height - pad}" stroke="${color}" stroke-width="2" stroke-dasharray="5 5"/><text x="${x + 4}" y="${pad / 2 + 12}" fill="${color}" font-size="12" font-weight="700">${label}</text>`;
  }).join('');
  $('#histogramChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-labelledby="histTitle histDesc"><title id="histTitle">Histogram of simulated outcomes</title><desc id="histDesc">Bars show simulated outcome frequency, with mean, median, target, and selected percentile markers.</desc><line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#475467"/><line x1="${pad}" y1="${pad / 2}" x2="${pad}" y2="${height - pad}" stroke="#475467"/>${bars}${markerLines}</svg>`;
  $('#histogramSummary').textContent = `The simulated outcomes range from ${formatValue(result.summary.min)} to ${formatValue(result.summary.max)}. Mean, median, target, and selected percentile boundaries are marked on the chart.`;
}

function renderCumulative(result) {
  const points = result.cumulative;
  const width = 760;
  const height = 300;
  const pad = 46;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const plotW = width - pad * 2;
  const plotH = height - pad * 1.6;
  const d = points.map((point, index) => {
    const x = scaleX(point.value, min, max, plotW, pad);
    const y = height - pad - (point.percentile / 100) * plotH;
    return `${index ? 'L' : 'M'}${x},${y}`;
  }).join(' ');
  const labels = points.filter((point) => [50, 80, 90, 95].includes(point.percentile)).map((point) => {
    const x = scaleX(point.value, min, max, plotW, pad);
    const y = height - pad - (point.percentile / 100) * plotH;
    return `<circle cx="${x}" cy="${y}" r="4" fill="#1f6feb"/><text x="${x + 6}" y="${y - 6}" font-size="12" fill="#06172b">P${point.percentile}</text>`;
  }).join('');
  $('#cumulativeChart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-labelledby="cumTitle cumDesc"><title id="cumTitle">Cumulative probability chart</title><desc id="cumDesc">Line shows the value associated with selected confidence percentiles.</desc><line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#475467"/><line x1="${pad}" y1="${pad / 2}" x2="${pad}" y2="${height - pad}" stroke="#475467"/><path d="${d}" fill="none" stroke="#1f6feb" stroke-width="4" stroke-linecap="round"/>${labels}</svg>`;
  $('#cumulativeSummary').textContent = `The median is ${formatValue(result.percentiles.P50)}. P80 is ${formatValue(result.percentiles.P80)}, P90 is ${formatValue(result.percentiles.P90)}, and P95 is ${formatValue(result.percentiles.P95)}.`;
}

function renderSensitivity(result) {
  const rows = result.sensitivity;
  $('#sensitivityBars').innerHTML = rows.map((row) => {
    const width = `${Math.min(100, Math.abs(row.correlation) * 100)}%`;
    return `<div class="sensitivity-row"><strong>${escapeHtml(row.name)}</strong><span class="sensitivity-track"><i class="sensitivity-fill ${row.correlation < 0 ? 'negative' : ''}" style="--width:${width}"></i></span><span>${row.correlation >= 0 ? '+' : ''}${formatNumber(row.correlation, 2)}</span></div>`;
  }).join('');
  $('#sensitivityTable').innerHTML = `<thead><tr><th>Rank</th><th>Variable</th><th>Correlation</th><th>Direction</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.name)}</td><td>${row.correlation >= 0 ? '+' : ''}${formatNumber(row.correlation, 3)}</td><td>${row.correlation >= 0 ? 'Positive relationship' : 'Negative relationship'}</td></tr>`).join('')}</tbody>`;
}

function renderInterpretation(result) {
  const probability = result.summary.targetProbability * 100;
  const riskLabel = probability >= 80 ? 'Lower target risk' : probability >= 60 ? 'Moderate target risk' : 'Higher target risk';
  const riskClass = probability >= 80 ? 'lower' : probability >= 60 ? 'moderate' : 'higher';
  const driver = result.sensitivity[0]?.name || 'No clear driver';
  const second = result.sensitivity[1]?.name;
  const conditionText = { gt: 'greater than', gte: 'greater than or equal to', lt: 'less than', lte: 'less than or equal to' }[result.targetCondition];
  const higherIsBetter = result.targetCondition === 'gt' || result.targetCondition === 'gte';
  const favourableGap = higherIsBetter
    ? result.summary.median - result.targetValue
    : result.targetValue - result.summary.median;
  const gapText = favourableGap >= 0
    ? `The median is ${formatValue(Math.abs(favourableGap))} on the favourable side of the target.`
    : `The median misses the target by ${formatValue(Math.abs(favourableGap))}.`;
  const templateKey = state.lastConfig?.templateKey || 'custom';
  const modelGuidance = {
    profit: {
      planning: `Use P10 (${formatValue(result.percentiles.P10)}) as a downside profit reference rather than relying only on the average.`,
      action: probability >= 80
        ? `Validate the assumptions for ${driver} and confirm that the downside profit remains acceptable before committing the plan.`
        : `Review ${driver}, then test pricing, variable-cost, fixed-cost, or demand actions that could improve the probability of achieving the profit target.`
    },
    cost: {
      planning: `Use P90 (${formatValue(result.percentiles.P90)}) as a conservative project-cost planning value under the current assumptions.`,
      action: probability >= 80
        ? `Retain appropriate contingency and monitor ${driver}, the input most closely related to total cost.`
        : `Review the budget, contingency, and the assumption for ${driver} before approving the project baseline.`
    },
    inventory: {
      planning: `Use P10 (${formatValue(result.percentiles.P10)}) to review downside ending-inventory exposure and potential stockout risk.`,
      action: probability >= 80
        ? `Validate the demand and replenishment assumptions, then monitor ${driver} during the review period.`
        : `Test a higher replenishment quantity, earlier order timing, or a demand-risk response before accepting the inventory plan.`
    },
    duration: {
      planning: `Use P90 (${formatValue(result.percentiles.P90)}) as a conservative completion-duration reference under the current activity estimates.`,
      action: probability >= 80
        ? `Protect the schedule by monitoring ${driver} and retaining time contingency around the main driver.`
        : `Review the deadline, activity estimates, and mitigation options for ${driver} before committing the schedule.`
    },
    custom: {
      planning: `Review the median and central outcome range together; select a planning percentile that matches whether higher or lower outcomes are more conservative.`,
      action: `Challenge the assumption for ${driver}, compare alternative scenarios, and document why the selected target probability is acceptable.`
    }
  }[templateKey];

  const badge = $('#decisionRiskBadge');
  badge.textContent = riskLabel;
  badge.className = `risk-badge risk-${riskClass}`;
  $('#interpretationText').innerHTML = `
    <p class="decision-lead">There is a <strong>${formatNumber(probability, 1)}%</strong> probability that ${escapeHtml(result.outputName)} will be ${conditionText} ${formatValue(result.targetValue)} under the current assumptions.</p>
    <dl class="decision-detail-list">
      <div><dt>Target position</dt><dd>${escapeHtml(gapText)}</dd></div>
      <div><dt>Planning view</dt><dd>${escapeHtml(modelGuidance.planning)}</dd></div>
      <div><dt>Main driver</dt><dd><strong>${escapeHtml(driver)}</strong>${second ? ` has the strongest linear relationship with the outcome, followed by ${escapeHtml(second)}.` : ' has the strongest linear relationship with the outcome.'}</dd></div>
    </dl>
    <div class="recommendation-callout"><strong>Recommended next action</strong><p>${escapeHtml(modelGuidance.action)}</p></div>
  `;
}

function saveScenario() {
  if (!state.lastResult) return;
  if (state.scenarios.length >= 3) {
    $('#scenarioStatus').textContent = 'Three scenarios are already saved. Remove one before saving another.';
    return;
  }
  const baseline = state.scenarios[0];
  if (baseline && (
    baseline.modelName !== state.lastConfig?.modelName
    || baseline.targetCondition !== state.lastConfig?.targetCondition
    || baseline.targetValue !== state.lastConfig?.targetValue
  )) {
    $('#scenarioStatus').textContent = 'Clear the current comparison before saving a different model or target.';
    return;
  }
  const enteredName = $('#scenarioName').value.trim();
  const name = enteredName || `${state.lastConfig?.modelName || 'Scenario'} ${state.scenarios.length + 1}`;
  const r = state.lastResult;
  state.scenarios.push({
    name,
    modelName: state.lastConfig?.modelName || 'Custom Model',
    unitType: state.lastConfig?.unitType || 'custom',
    unitSymbol: state.lastConfig?.unitSymbol || '',
    targetCondition: state.lastConfig?.targetCondition,
    targetValue: state.lastConfig?.targetValue,
    mean: r.summary.mean,
    median: r.summary.median,
    probability: r.summary.targetProbability,
    p10: r.percentiles.P10,
    p90: r.percentiles.P90,
    driver: r.sensitivity[0]?.name || 'None'
  });
  $('#scenarioName').value = '';
  $('#scenarioStatus').textContent = `${state.scenarios.length} of 3 scenarios saved in this browser session.`;
  renderScenarioTable();
}

function formatScenarioValue(value, scenario) {
  const formatted = formatNumber(value, Math.abs(value) >= 100 ? 0 : 2);
  if (scenario.unitType === 'currency') return `${scenario.unitSymbol}${formatted}`;
  if (scenario.unitType === 'percentage') return `${formatted}%`;
  return `${formatted} ${scenario.unitSymbol}`.trim();
}

function renderScenarioTable() {
  const section = $('#scenarioComparison');
  if (!state.scenarios.length) {
    section.hidden = true;
    $('#saveScenarioButton').disabled = false;
    $('#scenarioStatus').textContent = 'Save up to three scenarios for comparison.';
    return;
  }
  section.hidden = false;
  $('#saveScenarioButton').disabled = state.scenarios.length >= 3;
  const baseline = state.scenarios[0];
  $('#scenarioTable').innerHTML = `<thead><tr><th>Scenario</th><th>Model</th><th>Median</th><th>Target Probability</th><th>Difference vs Baseline</th><th>P10</th><th>P90</th><th>Main Driver</th><th>Action</th></tr></thead><tbody>${state.scenarios.map((item, index) => {
    const delta = (item.probability - baseline.probability) * 100;
    const deltaText = index === 0 ? 'Baseline' : `${delta >= 0 ? '+' : ''}${formatNumber(delta, 1)} percentage points`;
    return `<tr><td><label class="sr-only" for="scenario-name-${index}">Edit scenario name</label><input class="scenario-name-edit" id="scenario-name-${index}" data-scenario-index="${index}" type="text" maxlength="60" value="${escapeHtml(item.name)}">${index === 0 ? '<span class="baseline-label">Baseline</span>' : ''}</td><td>${escapeHtml(item.modelName)}</td><td>${escapeHtml(formatScenarioValue(item.median, item))}</td><td>${formatNumber(item.probability * 100, 1)}%</td><td>${escapeHtml(deltaText)}</td><td>${escapeHtml(formatScenarioValue(item.p10, item))}</td><td>${escapeHtml(formatScenarioValue(item.p90, item))}</td><td>${escapeHtml(item.driver)}</td><td><button class="reset remove-scenario" type="button" data-scenario-index="${index}" aria-label="Remove ${escapeHtml(item.name)}">Remove</button></td></tr>`;
  }).join('')}</tbody>`;
}

function clearScenarios() {
  state.scenarios = [];
  renderScenarioTable();
}

function exportCsv() {
  if (!state.lastResult || !state.lastConfig) return;
  const rows = [
    ['Model', state.lastConfig.modelName],
    ['Output', state.lastConfig.outputName],
    ['Iterations', state.lastConfig.iterations],
    ['Seed', state.lastConfig.seed],
    ['Target condition', state.lastConfig.targetCondition],
    ['Target value', state.lastConfig.targetValue],
    [],
    ['Variables'],
    ['Name', 'Identifier', 'Distribution', 'Unit', 'Parameters']
  ];
  state.lastConfig.variables.forEach((variable) => rows.push([variable.name, variable.id, variable.distribution, variable.unit, JSON.stringify(variable.params || variable.discrete || {})]));
  rows.push([], ['Summary'], ...Object.entries(state.lastResult.summary), [], ['Percentiles'], ...Object.entries(state.lastResult.percentiles), [], ['Outcome Drivers'], ['Variable', 'Correlation']);
  state.lastResult.sensitivity.forEach((row) => rows.push([row.name, row.correlation]));
  download(`monte-carlo-results-${Date.now()}.csv`, rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv');
}

function download(filename, content, type) {
  downloadBlob(filename, new Blob([content], { type }));
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveSvgChartAsPng(containerId, filename) {
  const svg = $(`#${containerId}`)?.querySelector('svg');
  if (!svg) return;

  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || 760;
  const height = viewBox.height || 300;
  const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 1));
  const exportSvg = svg.cloneNode(true);
  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = 'text { font-family: Inter, Arial, sans-serif; }';
  exportSvg.prepend(style);
  const source = new XMLSerializer().serializeToString(exportSvg);
  const sourceUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    context.scale(scale, scale);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(filename, blob);
      URL.revokeObjectURL(sourceUrl);
    }, 'image/png');
  };

  image.onerror = () => URL.revokeObjectURL(sourceUrl);
  image.src = sourceUrl;
}

function clearResults() {
  state.lastResult = null;
  state.lastConfig = null;
  $('#results')?.classList.add('hidden');
  $('#simulationProgress') && ($('#simulationProgress').value = 0);
  $('#simulationProgressText') && ($('#simulationProgressText').textContent = '0%');
  $('#simulationStatus') && ($('#simulationStatus').textContent = 'Ready to run the selected sample model.');
  $('#resultsAnnouncement') && ($('#resultsAnnouncement').textContent = '');
  if (!state.running) setWorkflowStep(1);
}

function openResetModal() {
  state.modalReturnFocus = document.activeElement;
  $('#confirmModal').hidden = false;
  $('#confirmResetButton').focus();
}

function closeResetModal() {
  $('#confirmModal').hidden = true;
  state.modalReturnFocus?.focus?.();
  state.modalReturnFocus = null;
}

function handleModalKeydown(event) {
  const modal = $('#confirmModal');
  if (modal.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeResetModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initEvents() {
  document.querySelectorAll('[name="modelTemplate"]').forEach((input) => {
    input.addEventListener('change', () => applyTemplate(input.value));
  });
  $('#addVariableButton').addEventListener('click', addVariable);
  $('#generateSeedButton').addEventListener('click', () => {
    $('#seed').value = Math.floor(Math.random() * 100000000);
    markDirty();
    setWorkflowStep(3);
  });
  $('#runSimulationButton').addEventListener('click', runSimulation);
  $('#cancelSimulationButton').addEventListener('click', cancelSimulation);
  $('#clearResultsButton').addEventListener('click', () => {
    clearResults();
    setWorkflowStep(3);
  });
  $('#saveScenarioButton').addEventListener('click', saveScenario);
  $('#clearScenariosButton').addEventListener('click', clearScenarios);
  $('#scenarioTable').addEventListener('click', (event) => {
    const button = event.target.closest('.remove-scenario');
    if (!button) return;
    state.scenarios.splice(Number(button.dataset.scenarioIndex), 1);
    $('#scenarioStatus').textContent = state.scenarios.length
      ? `${state.scenarios.length} of 3 scenarios saved in this browser session.`
      : 'Save up to three scenarios for comparison.';
    renderScenarioTable();
  });
  $('#scenarioTable').addEventListener('change', (event) => {
    const input = event.target.closest('.scenario-name-edit');
    if (!input) return;
    const scenario = state.scenarios[Number(input.dataset.scenarioIndex)];
    if (!scenario) return;
    scenario.name = input.value.trim() || scenario.name;
    input.value = scenario.name;
    input.closest('tr')?.querySelector('.remove-scenario')?.setAttribute('aria-label', `Remove ${scenario.name}`);
    $('#scenarioStatus').textContent = 'Scenario name updated for this browser session.';
  });
  $('#exportCsvButton').addEventListener('click', exportCsv);
  $('#saveHistogramButton').addEventListener('click', () => saveSvgChartAsPng('histogramChart', 'monte-carlo-outcome-histogram.png'));
  $('#saveCumulativeButton').addEventListener('click', () => saveSvgChartAsPng('cumulativeChart', 'monte-carlo-cumulative-probability.png'));
  ['outputName', 'outputUnitType', 'unitSymbol', 'formula', 'iterations', 'seed', 'confidenceLevel', 'targetCondition', 'targetValue'].forEach((id) => {
    $(`#${id}`).addEventListener('input', () => {
      markDirty();
      setWorkflowStep(3);
    });
  });
  $('#variableEditor').addEventListener('input', (event) => {
    const card = event.target.closest('.variable-card');
    if (!card) return;
    updateVariableFromCard(card);
    renderFormulaButtons();
    setWorkflowStep(2);
  });
  $('#variableEditor').addEventListener('change', (event) => {
    const card = event.target.closest('.variable-card');
    if (!card) return;
    updateVariableFromCard(card);
    if (event.target.matches('[data-field="distribution"], [data-field="name"], [data-discrete]')) renderVariables();
    setWorkflowStep(2);
  });
  $('#variableEditor').addEventListener('click', (event) => {
    const card = event.target.closest('.variable-card');
    if (!card) return;
    const index = Number(card.dataset.index);
    if (event.target.closest('.remove-variable')) {
      state.variables.splice(index, 1);
      renderVariables();
      markDirty();
      setWorkflowStep(2);
    }
    if (event.target.closest('.add-discrete-row')) {
      state.variables[index].discrete = state.variables[index].discrete || [];
      state.variables[index].discrete.push({ value: 0, probability: 0 });
      renderVariables();
      markDirty();
      setWorkflowStep(2);
    }
    if (event.target.closest('.remove-discrete-row')) {
      const row = Number(event.target.closest('.discrete-row').dataset.row);
      state.variables[index].discrete.splice(row, 1);
      renderVariables();
      markDirty();
      setWorkflowStep(2);
    }
  });
  $('#resetToolButton').addEventListener('click', () => {
    if (state.dirty) openResetModal();
    else applyTemplate(state.templateKey);
  });
  $('#confirmResetButton').addEventListener('click', () => {
    const templateKey = state.templateKey;
    closeResetModal();
    applyTemplate(templateKey);
  });
  $('#cancelResetButton').addEventListener('click', closeResetModal);
  $('#confirmModal').addEventListener('click', (event) => {
    if (event.target === $('#confirmModal')) closeResetModal();
  });
  document.addEventListener('keydown', handleModalKeydown);
}

function runDeveloperValidationCases() {
  return [
    'Fixed model case: A=10 and B=5 with A+B should return 15 for every valid sample.',
    'Uniform case: X~Uniform(0,1) should remain between 0 and 1 with mean close to 0.5 over a large seeded run.',
    'Discrete case: 0/10 with 0.5/0.5 probabilities should have mean close to 5 over a large seeded run.'
  ];
}

window.monteCarloDeveloperTests = runDeveloperValidationCases;

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  applyTemplate('profit');
});

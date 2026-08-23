(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const state = {
    columns: ['Labour Hours', 'Overtime Hours', 'Floor Area', 'Orders Shipped', 'Lines Picked'],
    roles: ['input', 'input', 'input', 'output', 'output'],
    rows: [],
    analysis: null,
    estimate: null
  };

  const sampleData = {
    columns: ['Labour Hours', 'Overtime Hours', 'Floor Area', 'Orders Shipped', 'Lines Picked'],
    roles: ['input', 'input', 'input', 'output', 'output'],
    rows: [
      ['Apr', 1610, 170, 42000, 31800, 74500],
      ['May', 1570, 125, 42000, 32400, 76800],
      ['Jun', 1720, 220, 43000, 34900, 80200],
      ['Jul', 1650, 155, 43000, 34300, 81400],
      ['Aug', 1790, 245, 44000, 36700, 84600],
      ['Sep', 1700, 180, 44000, 35800, 85300],
      ['Oct', 1880, 290, 45000, 38200, 88100],
      ['Nov', 2080, 450, 46000, 42600, 97500],
      ['Dec', 2260, 610, 47000, 45800, 104200],
      ['Jan', 1850, 275, 45000, 37600, 87300],
      ['Feb', 1690, 160, 43500, 35200, 82900],
      ['Mar', 1760, 205, 44000, 37100, 86800]
    ]
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '-';
    return value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: Math.abs(value) < 10 ? Math.min(2, digits) : 0 });
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '-';
  }

  function showError(message) {
    $('#errorMessage').textContent = message;
    $('#errorMessage').hidden = false;
  }

  function clearError() {
    $('#errorMessage').hidden = true;
    $('#errorMessage').textContent = '';
  }

  function updateWorkflow(step) {
    document.querySelectorAll('[data-workflow-step]').forEach((item) => {
      const current = Number(item.dataset.workflowStep);
      item.classList.toggle('active', current === step);
      item.classList.toggle('complete', current < step);
      if (current === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function polynomialTermCount(inputCount) {
    return 1 + inputCount + inputCount + (inputCount * (inputCount - 1) / 2);
  }

  function modelAdequacyText(config) {
    const linearTerms = 1 + config.inputNames.length;
    const polynomialTerms = polynomialTermCount(config.inputNames.length);
    const n = config.rows.length;
    if (config.inputNames.length < 1 || config.outputNames.length < 1 || n < 5) {
      return 'Add at least one input, one output, and five complete observations before selecting a model.';
    }
    if (n <= polynomialTerms) {
      return `${n} observations can support linear, ridge, lasso, robust, or kNN checks, but polynomial regression needs more than ${polynomialTerms} complete observations. Use a simpler model or collect more data.`;
    }
    if (n < polynomialTerms * 5) {
      return `${n} observations with ${config.inputNames.length} inputs gives ${polynomialTerms} polynomial terms. Auto Select can compare models, but treat polynomial results cautiously.`;
    }
    return `${n} observations is a healthier sample for ${linearTerms} linear terms and ${polynomialTerms} polynomial terms. Auto Select is a sensible starting point.`;
  }

  function modelSupportLabel(output) {
    if (!Number.isFinite(output.crossValidatedRmse) || Math.abs(output.actual.reduce((sum, value) => sum + value, 0) / output.actual.length) < 1e-9) return 'directional';
    const avg = output.actual.reduce((sum, value) => sum + value, 0) / output.actual.length;
    const cvRatio = Math.abs(output.crossValidatedRmse / avg);
    if (output.rSquared >= 0.85 && cvRatio <= 0.12) return 'stronger';
    if (output.rSquared >= 0.65 && cvRatio <= 0.2) return 'moderate';
    return 'weaker';
  }

  function renderColumns() {
    $('#columnTable').innerHTML = `
      <thead><tr><th>Column</th><th>Role</th></tr></thead>
      <tbody>${state.columns.map((name, index) => `
        <tr>
          <td><input type="text" value="${escapeHtml(name)}" data-column-name="${index}" aria-label="Column ${index + 1} name"></td>
          <td>
            <select data-column-role="${index}" aria-label="Role for ${escapeHtml(name)}">
              <option value="ignore"${state.roles[index] === 'ignore' ? ' selected' : ''}>Ignore</option>
              <option value="input"${state.roles[index] === 'input' ? ' selected' : ''}>Input</option>
              <option value="output"${state.roles[index] === 'output' ? ' selected' : ''}>Output</option>
            </select>
          </td>
        </tr>`).join('')}</tbody>`;
  }

  function renderData() {
    $('#dataTable').innerHTML = `
      <thead><tr><th>Observation</th>${state.columns.map((name) => `<th>${escapeHtml(name)}</th>`).join('')}<th>Remove</th></tr></thead>
      <tbody>${state.rows.map((row, rowIndex) => `
        <tr>
          <td><input type="text" value="${escapeHtml(row[0])}" data-row-label="${rowIndex}" aria-label="Observation ${rowIndex + 1} label"></td>
          ${state.columns.map((_, columnIndex) => `<td><input type="number" step="any" value="${escapeHtml(row[columnIndex + 1])}" data-cell-row="${rowIndex}" data-cell-column="${columnIndex}" aria-label="Value row ${rowIndex + 1} column ${columnIndex + 1}"></td>`).join('')}
          <td class="narrow"><button class="reset" type="button" data-remove-row="${rowIndex}" aria-label="Remove row ${rowIndex + 1}">X</button></td>
        </tr>`).join('')}</tbody>`;
    renderColumns();
    updateDataQuality();
  }

  function updateStateFromInputs() {
    document.querySelectorAll('[data-column-name]').forEach((input) => {
      state.columns[Number(input.dataset.columnName)] = input.value.trim() || `Column ${Number(input.dataset.columnName) + 1}`;
    });
    document.querySelectorAll('[data-column-role]').forEach((select) => {
      state.roles[Number(select.dataset.columnRole)] = select.value;
    });
    document.querySelectorAll('[data-row-label]').forEach((input) => {
      state.rows[Number(input.dataset.rowLabel)][0] = input.value.trim() || `Observation ${Number(input.dataset.rowLabel) + 1}`;
    });
    document.querySelectorAll('[data-cell-row]').forEach((input) => {
      state.rows[Number(input.dataset.cellRow)][Number(input.dataset.cellColumn) + 1] = input.value;
    });
  }

  function getDatasetConfig() {
    updateStateFromInputs();
    const inputIndexes = state.roles.map((role, index) => role === 'input' ? index : -1).filter((index) => index >= 0);
    const outputIndexes = state.roles.map((role, index) => role === 'output' ? index : -1).filter((index) => index >= 0);
    return {
      inputNames: inputIndexes.map((index) => state.columns[index]),
      outputNames: outputIndexes.map((index) => state.columns[index]),
      rows: state.rows.map((row) => ({
        label: row[0],
        inputs: inputIndexes.map((index) => row[index + 1]),
        outputs: outputIndexes.map((index) => row[index + 1])
      }))
    };
  }

  function updateDataQuality() {
    let config;
    try {
      config = getDatasetConfig();
    } catch (_) {
      return;
    }
    const warnings = [];
    if (config.inputNames.length < 1) warnings.push('Select at least one input column.');
    if (config.outputNames.length < 1) warnings.push('Select at least one output column.');
    if (config.rows.length < 5) warnings.push('At least five complete observations are required.');
    config.inputNames.forEach((name, index) => {
      const values = config.rows.map((row) => Number(row.inputs[index])).filter(Number.isFinite);
      if (values.length !== config.rows.length) warnings.push(`${name} contains missing or non-numeric values.`);
      if (values.length > 1 && Math.max(...values) - Math.min(...values) <= 1e-9) warnings.push(`${name} is constant.`);
    });
    config.outputNames.forEach((name, index) => {
      const values = config.rows.map((row) => Number(row.outputs[index])).filter(Number.isFinite);
      if (values.length !== config.rows.length) warnings.push(`${name} contains missing or non-numeric values.`);
      if (values.length > 1 && Math.max(...values) - Math.min(...values) <= 1e-9) warnings.push(`${name} is constant.`);
    });
    const polynomialTerms = polynomialTermCount(config.inputNames.length);
    if (config.rows.length <= polynomialTerms) warnings.push(`Polynomial degree 2 would need more than ${polynomialTerms} observations.`);
    $('#dataQualityGrid').innerHTML = [
      ['Observations', config.rows.length],
      ['Inputs', config.inputNames.length],
      ['Outputs', config.outputNames.length],
      ['Polynomial terms', polynomialTerms],
      ['Complete rows', config.rows.filter((row) => [...row.inputs, ...row.outputs].every((value) => Number.isFinite(Number(value)) && String(value).trim() !== '')).length],
      ['Warnings', warnings.length]
    ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
    $('#dataQualityWarnings').innerHTML = warnings.length
      ? warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')
      : '<li>Data is ready for model fitting. Still confirm operational comparability before interpreting results.</li>';
    $('#dataQualityStatus').textContent = warnings.length ? 'Review needed' : 'Ready';
    $('#dataQualityStatus').classList.toggle('good', warnings.length === 0);
    $('#sampleAdequacy').innerHTML = `<strong>Sample adequacy guidance</strong><p>${escapeHtml(modelAdequacyText(config))}</p>`;
    const modelRecommendation = $('#modelAdequacyRecommendation');
    if (modelRecommendation) modelRecommendation.textContent = modelAdequacyText(config);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(field);
        field = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(field);
        if (row.some((cell) => cell.trim() !== '')) rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
    if (inQuotes) throw new Error('CSV contains an unclosed quoted field.');
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
    return rows;
  }

  function importCsv() {
    clearError();
    const file = $('#csvFile').files[0];
    if (!file) {
      showError('Choose a CSV file first.');
      return;
    }
    if (file.size > 1024 * 1024) {
      showError('CSV file is too large for this browser tool. Use a file under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        if (rows.length < 2 || rows[0].length < 3) throw new Error('CSV needs a header row, an observation column, and at least two numeric columns.');
        state.columns = rows[0].slice(1).map((cell, index) => cell.trim() || `Column ${index + 1}`);
        state.roles = state.columns.map((_, index) => index === 0 ? 'input' : index === state.columns.length - 1 ? 'output' : 'ignore');
        state.rows = rows.slice(1).map((row, index) => [row[0] || `Observation ${index + 1}`, ...state.columns.map((_, columnIndex) => row[columnIndex + 1] ?? '')]);
        $('#uploadStatus').textContent = `${state.rows.length} observations imported. Classify input and output columns before fitting.`;
        state.analysis = null;
        state.estimate = null;
        hideResults();
        renderData();
      } catch (error) {
        showError(error.message);
      }
    };
    reader.readAsText(file);
  }

  function loadSampleData() {
    state.columns = [...sampleData.columns];
    state.roles = [...sampleData.roles];
    state.rows = sampleData.rows.map((row) => [...row]);
    state.analysis = null;
    state.estimate = null;
    hideResults();
    $('#uploadStatus').textContent = `${state.rows.length} editable warehouse observations loaded. Review and replace with your own data before making a real decision.`;
    renderData();
  }

  function resetTool() {
    state.columns = ['Input 1', 'Output 1'];
    state.roles = ['input', 'output'];
    state.rows = [];
    state.analysis = null;
    state.estimate = null;
    $('#uploadStatus').textContent = 'Load sample data, add rows manually, or import a CSV.';
    clearError();
    hideResults();
    renderData();
    updateWorkflow(1);
  }

  function hideResults() {
    $('#scenario-planning').classList.add('hidden');
    $('#results').classList.add('hidden');
    $('#scenarioNavLink').hidden = true;
    $('#resultsNavLink').hidden = true;
  }

  function fitModel() {
    clearError();
    try {
      const result = window.ATHMultivariateEstimator.analyse({ ...getDatasetConfig(), modelType: $('#modelType').value });
      state.analysis = result;
      state.estimate = null;
      renderScenarioInputs();
      renderDiagnostics();
      $('#scenario-planning').classList.remove('hidden');
      $('#scenarioNavLink').hidden = false;
      updateWorkflow(3);
      $('#scenario-planning').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showError(error.message);
    }
  }

  function renderScenarioInputs() {
    const model = state.analysis.selected;
    $('#scenarioInputs').innerHTML = model.inputNames.map((name, index) => {
      const avg = model.rows.reduce((sum, row) => sum + row.inputs[index], 0) / model.rows.length;
      return `<label><span>${escapeHtml(name)}</span><input type="number" step="any" value="${avg.toFixed(2)}" data-scenario-input="${index}" aria-label="Scenario value for ${escapeHtml(name)}"></label>`;
    }).join('');
  }

  function estimateOutputs() {
    clearError();
    if (!state.analysis) {
      showError('Fit a model before estimating outputs.');
      return;
    }
    try {
      const inputs = [...document.querySelectorAll('[data-scenario-input]')].map((input) => input.value);
      state.estimate = window.ATHMultivariateEstimator.estimateScenario(state.analysis.selected, inputs);
      renderResults();
      $('#results').classList.remove('hidden');
      $('#resultsNavLink').hidden = false;
      updateWorkflow(4);
      $('#results-heading').focus();
    } catch (error) {
      showError(error.message);
    }
  }

  function renderDiagnostics() {
    const model = state.analysis.selected;
    $('#selectionReason').innerHTML = `<strong>Model selection:</strong> ${escapeHtml(state.analysis.reason)} ${model.warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join('')}`;
    const candidateRows = state.analysis.candidates.map((candidate) => {
      const terms = window.ATHMultivariateEstimator.createFeatureSpec(model.inputNames, candidate.modelType);
      const definition = window.ATHMultivariateEstimator.getModelDefinition(candidate.modelType);
      const selected = candidate.modelType === model.modelType;
      const parameterNote = `${terms.length} ${definition.termSummary}`;
      return `
        <tr${selected ? ' class="selected-row"' : ''}>
          <td><strong>${escapeHtml(window.ATHMultivariateEstimator.modelDisplayName(candidate.modelType))}</strong>${selected ? ' <span class="status-pill interpolation">Selected</span>' : ''}</td>
          <td>${formatNumber(candidate.averageCvRmse)}</td>
          <td>${escapeHtml(parameterNote)}</td>
          <td>${escapeHtml(definition.interpretation)}</td>
        </tr>`;
    });
    const unavailableRows = (state.analysis.unavailableCandidates || []).map((candidate) => `
      <tr>
        <td><strong>${escapeHtml(candidate.label)}</strong></td>
        <td>n/a</td>
        <td>Not fitted</td>
        <td>${escapeHtml(candidate.reason)}</td>
      </tr>`);
    $('#candidateComparisonTable').innerHTML = `<thead><tr><th>Candidate model</th><th>Average CV RMSE</th><th>Model terms</th><th>Interpretation</th></tr></thead><tbody>${[...candidateRows, ...unavailableRows].join('')}</tbody>`;
    $('#diagnosticsTable').innerHTML = `<thead><tr><th>Output</th><th>R2</th><th>Adjusted R2</th><th>RMSE</th><th>MAE</th><th>CV RMSE</th><th>Observations</th></tr></thead><tbody>${model.outputs.map((output) => `
      <tr><td><strong>${escapeHtml(output.name)}</strong></td><td>${formatPercent(output.rSquared)}</td><td>${output.adjustedRSquared === null ? 'n/a' : formatPercent(output.adjustedRSquared)}</td><td>${formatNumber(output.rmse)}</td><td>${formatNumber(output.mae)}</td><td>${formatNumber(output.crossValidatedRmse)}</td><td>${model.rows.length}</td></tr>`).join('')}</tbody>`;
    const termSummary = model.modelType === 'polynomial'
      ? 'Polynomial degree 2 uses the linear input terms, squared input terms, and pairwise interaction terms after standardising each input.'
      : model.modelType === 'knn'
        ? `k-Nearest Neighbour uses the ${model.k} most similar historical observations in the standardised input space and estimates each output from their distance-weighted values.`
        : model.modelType === 'robust'
          ? 'Robust regression uses one intercept and one coefficient for each selected input, then reduces the influence of observations with unusually large residuals.'
          : model.modelType === 'lasso'
            ? `Lasso regression uses one intercept and one coefficient for each selected input, then adds an absolute-value coefficient penalty of ${formatNumber(model.penalty)} to shrink weak effects.`
      : model.modelType === 'ridge'
        ? `Ridge regression uses one intercept and one coefficient for each selected input after standardising each input, then adds a coefficient penalty of ${formatNumber(model.penalty)} to stabilise the fitted coefficients.`
        : 'Linear regression uses one intercept and one coefficient for each selected input after standardising each input.';
    $('#equationList').innerHTML = `
      <article class="formula-block">
        <span>Candidate model formulas</span>
        <p><strong>Linear:</strong> one straight-line equation is fitted for each output.</p>
        <code>Y_k = beta_0 + beta_1 X_1 + ... + beta_p X_p</code>
        <code>Minimise sum((Y_i - Yhat_i)^2)</code>
        <p><strong>Ridge:</strong> keeps the same linear prediction equation but adds a penalty to reduce unstable large coefficients. The intercept is not penalised.</p>
        <code>Minimise sum((Y_i - Yhat_i)^2) + lambda * sum(beta_j^2), for j = 1...p</code>
        <p><strong>Lasso:</strong> keeps the same linear prediction equation but uses an absolute-value penalty that can shrink weak coefficients to zero.</p>
        <code>Minimise sum((Y_i - Yhat_i)^2) + lambda * sum(abs(beta_j)), for j = 1...p</code>
        <p><strong>Robust regression:</strong> fits a linear equation with Huber-style residual weights so unusual observations have less influence.</p>
        <code>Minimise sum(w_i * (Y_i - Yhat_i)^2), where large residuals receive smaller w_i</code>
        <p><strong>Polynomial degree 2:</strong> adds squared input terms and pairwise interactions.</p>
        <code>Y_k = beta_0 + sum(beta_j X_j) + sum(gamma_j X_j^2) + sum(delta_jm X_j X_m)</code>
        <p><strong>kNN:</strong> estimates from the most similar historical input patterns instead of fitting coefficients.</p>
        <code>Yhat = sum(weight_i * Y_i) / sum(weight_i), where weight_i = 1 / distance_i for the k nearest neighbours</code>
      </article>
      <article class="formula-block">
        <span>Selected model form</span>
        <p>${escapeHtml(termSummary)}</p>
        ${model.outputs.map((output) => `<code>${escapeHtml(window.ATHMultivariateEstimator.formatEquation(output, model.terms, model.inputNames))}</code>`).join('')}
      </article>
      <article class="formula-block">
        <span>Cross-validation</span>
        <p>Rows are split into up to five folds. Auto Select compares linear, ridge, lasso, robust, polynomial, and kNN candidates using held-out prediction error.</p>
        <code>CV RMSE = sqrt(mean((Actual - Predicted)^2 across held-out rows))</code>
      </article>
      <article class="formula-block">
        <span>Scenario support</span>
        <p>The scenario input vector is assessed against the multivariate historical input space using convex-hull membership where practical, then nearest-neighbour distance as a support check.</p>
        <code>Support = Interpolation, Limited Historical Support, or Extrapolation</code>
      </article>
    `;
  }

  function renderModelInterpretation() {
    const model = state.analysis.selected;
    const firstOutput = model.outputs[0];
    if (firstOutput.coefficients) {
      const coefficientRows = firstOutput.coefficients
        .map((coefficient, index) => ({ coefficient, term: model.terms[index] }))
        .filter((item) => item.term.type !== 'intercept')
        .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
        .slice(0, 3);
      const strongest = coefficientRows[0];
      $('#driverInsight').innerHTML = `
        <span>Driver Insight</span>
        <h4>${strongest ? escapeHtml(strongest.term.label) : 'Not available'}</h4>
        <p>${strongest ? `For ${escapeHtml(firstOutput.name)}, ${escapeHtml(strongest.term.label)} has the largest standardised association in the selected model. Treat this as association, not proof of causality.` : 'Fit a model with varying inputs to review driver signals.'}</p>
      `;
    } else {
      const neighbours = state.estimate?.outputs?.[0]?.neighbours || [];
      const nearest = neighbours[0];
      $('#driverInsight').innerHTML = `
        <span>Local Evidence</span>
        <h4>${nearest ? escapeHtml(nearest.label) : 'Nearest observations'}</h4>
        <p>${nearest ? `For ${escapeHtml(firstOutput.name)}, kNN estimates the scenario from nearby historical observations such as ${escapeHtml(nearest.label)}. Treat this as local similarity evidence, not a causal driver ranking.` : 'Estimate a scenario to review the nearest historical observations used by kNN.'}</p>
      `;
    }

    const residuals = firstOutput.actual.map((actual, index) => actual - firstOutput.predicted[index]);
    const avgResidual = residuals.reduce((sum, value) => sum + value, 0) / residuals.length;
    const maxAbs = Math.max(...residuals.map(Math.abs));
    const ratio = firstOutput.rmse ? maxAbs / firstOutput.rmse : 0;
    const support = modelSupportLabel(firstOutput);
    let residualMessage = `${escapeHtml(firstOutput.name)} has ${support} model support based on fitted alignment and cross-validated error.`;
    if (ratio > 2.5) {
      residualMessage += ' One historical observation has a large residual, so review possible outliers or missing explanatory inputs.';
    } else if (Math.abs(avgResidual) > Math.max(firstOutput.rmse * 0.25, 1e-9)) {
      residualMessage += ' Residuals show a small directional bias; review whether the model is consistently over- or under-estimating.';
    } else {
      residualMessage += ' Residuals do not show a major warning in this quick check.';
    }
    $('#residualInsight').innerHTML = `
      <span>Residual Warning</span>
      <h4>${support.charAt(0).toUpperCase() + support.slice(1)} support</h4>
      <p>${residualMessage}</p>
    `;
  }

  function supportLabel(support) {
    return support.classification === 'INTERPOLATION' ? 'interpolation' : support.classification === 'EXTRAPOLATION' ? 'extrapolation' : 'limited';
  }

  function renderResults() {
    const model = state.analysis.selected;
    const support = state.estimate.support;
    const outputs = state.estimate.outputs;
    $('#summaryCards').innerHTML = [
      ['Scenario classification', `<span class="status-pill ${supportLabel(support)}">${support.classification}</span>`],
      ['Selected model', window.ATHMultivariateEstimator.modelDisplayName(model.modelType)],
      ['Outputs estimated', outputs.length],
      ['Nearest support', `${support.nearest[0].label} (${support.nearestDistance.toFixed(2)})`],
      ['Historical observations', model.rows.length],
      ['Historical support', support.level === 'interpolation' ? 'Well supported' : support.level === 'limited' ? 'Limited support' : 'Extrapolation']
    ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');

    const warning = support.level === 'extrapolation'
      ? '<p><strong>Warning:</strong> This scenario extends beyond operating conditions represented in the historical dataset. Estimates may be less reliable.</p>'
      : '';
    $('#executiveSummary').innerHTML = `
      <h3>What this estimate means</h3>
      <p>The scenario is classified as <strong>${escapeHtml(support.classification)}</strong>. The model estimates expected outputs from historical input-output relationships, not efficiency or guaranteed future performance.</p>
      <p><strong>Historical support method:</strong> ${escapeHtml(support.hull.method)}. Nearest comparable records: ${support.nearest.map((item) => `${escapeHtml(item.label)} (${item.distance.toFixed(2)})`).join(', ')}.</p>
      ${warning}
    `;

    const cvOrInfinity = (output) => Number.isFinite(output.crossValidatedRmse) ? output.crossValidatedRmse : Infinity;
    const cvOrNegativeInfinity = (output) => Number.isFinite(output.crossValidatedRmse) ? output.crossValidatedRmse : -Infinity;
    const bestOutput = [...model.outputs].sort((a, b) => cvOrInfinity(a) - cvOrInfinity(b))[0];
    const weakestOutput = [...model.outputs].sort((a, b) => cvOrNegativeInfinity(b) - cvOrNegativeInfinity(a))[0];
    $('#executiveSummary').innerHTML += `
      <p><strong>Model interpretation:</strong> ${escapeHtml(bestOutput?.name || 'The strongest output')} has the lower cross-validated error in this run. ${escapeHtml(weakestOutput?.name || 'Any weaker output')} should be reviewed more carefully if its planning range is wide.</p>
    `;
    $('#estimateTable').innerHTML = `<thead><tr><th>Output</th><th>Estimated value</th><th>Approx. planning range</th><th>Model RMSE</th><th>Cross-validated RMSE</th></tr></thead><tbody>${outputs.map((output) => {
      const spread = Number.isFinite(output.crossValidatedRmse) ? 1.96 * output.crossValidatedRmse : 1.96 * output.rmse;
      return `<tr><td><strong>${escapeHtml(output.name)}</strong></td><td>${formatNumber(output.estimate)}</td><td>${formatNumber(output.estimate - spread)} to ${formatNumber(output.estimate + spread)}</td><td>${formatNumber(output.rmse)}</td><td>${formatNumber(output.crossValidatedRmse)}</td></tr>`;
    }).join('')}</tbody>`;
    renderDiagnostics();
    renderModelInterpretation();
    renderChartSelectors();
    drawCharts();
  }

  function drawAxes(ctx, width, height, padding, labels = {}) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#d0d5dd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    ctx.fillStyle = '#344054';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    if (labels.x) ctx.fillText(labels.x, padding.left + (width - padding.left - padding.right) / 2, height - 10);
    if (labels.y) {
      ctx.save();
      ctx.translate(16, padding.top + (height - padding.top - padding.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(labels.y, 0, 0);
      ctx.restore();
    }
  }

  function scale(value, min, max, start, end) {
    if (Math.abs(max - min) < 1e-9) return (start + end) / 2;
    return start + ((value - min) / (max - min)) * (end - start);
  }

  function paddedExtent(values) {
    const finite = values.filter(Number.isFinite);
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const span = Math.max(max - min, Math.abs(max) * 0.08, 1);
    return [min - span * 0.08, max + span * 0.08];
  }

  function drawScatter(canvas, points, summaryId, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { left: 58, top: 24, right: 24, bottom: 54 };
    drawAxes(ctx, width, height, padding, { x: options.xLabel, y: options.yLabel });
    const xs = [...points, ...(options.linePoints || [])].map((point) => point.x);
    const ys = [...points, ...(options.linePoints || [])].map((point) => point.y);
    const [minX, maxX] = paddedExtent(xs);
    const [minY, maxY] = paddedExtent(ys);
    if (options.diagonal) {
      ctx.strokeStyle = '#98a2b3';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, padding.top);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (options.zeroLine && minY < 0 && maxY > 0) {
      const zeroY = scale(0, minY, maxY, height - padding.bottom, padding.top);
      ctx.strokeStyle = '#98a2b3';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#475467';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('0', padding.left + 6, zeroY - 6);
    }
    if (options.linePoints?.length) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      options.linePoints.forEach((point, index) => {
        const x = scale(point.x, minX, maxX, padding.left, width - padding.right);
        const y = scale(point.y, minY, maxY, height - padding.bottom, padding.top);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    points.forEach((point) => {
      const x = scale(point.x, minX, maxX, padding.left, width - padding.right);
      const y = scale(point.y, minY, maxY, height - padding.bottom, padding.top);
      ctx.fillStyle = point.scenario ? '#f59e0b' : '#1f6feb';
      ctx.beginPath();
      ctx.arc(x, y, point.scenario ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    $(summaryId).textContent = options.summary;
  }

  function drawHorizontalBar(canvas, values, summaryId, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { left: 150, top: 28, right: 24, bottom: 46 };
    drawAxes(ctx, width, height, padding, { x: options.xLabel, y: options.yLabel });
    const max = Math.max(...values.map((item) => Math.max(0, item.value)), 1);
    const rowHeight = (height - padding.top - padding.bottom) / Math.max(values.length, 1);
    values.forEach((item, index) => {
      const y = padding.top + index * rowHeight + rowHeight * .22;
      const barWidth = scale(item.value, 0, max, 0, width - padding.left - padding.right);
      ctx.fillStyle = '#1f6feb';
      ctx.fillRect(padding.left, y, barWidth, Math.max(10, rowHeight * .45));
      ctx.fillStyle = '#475467';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.label.slice(0, 18), padding.left - 8, y + rowHeight * .33);
    });
    const valueRows = values.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(options.valueFormatter ? options.valueFormatter(item.value, item) : formatNumber(item.value, 0))}</span></li>`).join('');
    $(summaryId).innerHTML = `${escapeHtml(options.summary)}${valueRows ? `<ul class="chart-value-list">${valueRows}</ul>` : ''}`;
  }

  function drawRangeChart(canvas, summaryId) {
    const model = state.analysis.selected;
    const scenario = state.estimate.support.scenarioInputs;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const padding = { left: 150, top: 24, right: 32, bottom: 36 };
    const rowHeight = (height - padding.top - padding.bottom) / model.inputNames.length;
    model.inputNames.forEach((name, index) => {
      const values = model.rows.map((row) => row.inputs[index]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const [axisMin, axisMax] = paddedExtent([...values, scenario[index]]);
      const y = padding.top + index * rowHeight + rowHeight / 2;
      const start = scale(min, axisMin, axisMax, padding.left, width - padding.right);
      const end = scale(max, axisMin, axisMax, padding.left, width - padding.right);
      const marker = scale(scenario[index], axisMin, axisMax, padding.left, width - padding.right);
      ctx.strokeStyle = '#d0d5dd';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(start, y);
      ctx.lineTo(end, y);
      ctx.stroke();
      ctx.fillStyle = scenario[index] < min || scenario[index] > max ? '#f59e0b' : '#1f6feb';
      ctx.beginPath();
      ctx.arc(marker, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475467';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(name.slice(0, 18), padding.left - 10, y + 4);
    });
    $('#rangeSupportSummary').textContent = `Scenario markers show whether each input sits within its historical minimum-to-maximum range. The overall classification still uses the full multivariate input vector.`;
  }

  function drawPlanningRangeChart(canvas, summaryId) {
    const values = state.estimate.outputs.map((output) => {
      const spread = Number.isFinite(output.crossValidatedRmse) ? 1.96 * output.crossValidatedRmse : 1.96 * output.rmse;
      return { label: output.name, low: output.estimate - spread, estimate: output.estimate, high: output.estimate + spread };
    });
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { left: 64, top: 28, right: 28, bottom: 62 };
    const [min, max] = paddedExtent(values.flatMap((item) => [item.low, item.high]));
    drawAxes(ctx, width, height, padding, { x: 'Output measure', y: 'Estimated value' });
    const gap = 18;
    const slot = (width - padding.left - padding.right) / values.length;
    values.forEach((item, index) => {
      const x = padding.left + index * slot + slot / 2;
      const yLow = scale(item.low, min, max, height - padding.bottom, padding.top);
      const yHigh = scale(item.high, min, max, height - padding.bottom, padding.top);
      const yEstimate = scale(item.estimate, min, max, height - padding.bottom, padding.top);
      ctx.strokeStyle = '#667085';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, yLow);
      ctx.lineTo(x, yHigh);
      ctx.stroke();
      ctx.strokeStyle = '#667085';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, yLow);
      ctx.lineTo(x + 8, yLow);
      ctx.moveTo(x - 8, yHigh);
      ctx.lineTo(x + 8, yHigh);
      ctx.stroke();
      ctx.fillStyle = '#1f6feb';
      ctx.beginPath();
      ctx.arc(x, yEstimate, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475467';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label.slice(0, 12), x, height - 28);
    });
    const valueRows = values.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>Estimate ${formatNumber(item.estimate, 0)}; planning band ${formatNumber(item.low, 0)} to ${formatNumber(item.high, 0)}</span></li>`).join('');
    $(summaryId).innerHTML = `Dots show estimated outputs. Vertical ranges show an approximate planning band using cross-validated error where available.<ul class="chart-value-list">${valueRows}</ul>`;
  }

  function renderChartSelectors() {
    const model = state.analysis.selected;
    const inputSelect = $('#chartInputSelect');
    const outputSelect = $('#chartOutputSelect');
    inputSelect.innerHTML = model.inputNames.map((name, index) => `<option value="${index}">${escapeHtml(name)}</option>`).join('');
    outputSelect.innerHTML = model.outputs.map((output, index) => `<option value="${index}">${escapeHtml(output.name)}</option>`).join('');
  }

  function drawCharts() {
    const model = state.analysis.selected;
    const selectedInputIndex = Number($('#chartInputSelect').value || 0);
    const selectedOutputIndex = Number($('#chartOutputSelect').value || 0);
    const selectedOutput = model.outputs[selectedOutputIndex] || model.outputs[0];
    const scenario = state.estimate.support.scenarioInputs;
    const inputValues = model.rows.map((row) => row.inputs[selectedInputIndex]);
    const [minInput, maxInput] = paddedExtent([...inputValues, scenario[selectedInputIndex]]);
    const linePoints = Array.from({ length: 36 }, (_, index) => {
      const xValue = minInput + (index / 35) * (maxInput - minInput);
      const inputs = [...scenario];
      inputs[selectedInputIndex] = xValue;
      return { x: xValue, y: window.ATHMultivariateEstimator.estimateScenario(model, inputs).outputs[selectedOutputIndex].estimate };
    });
    const inputOutputPoints = model.rows.map((row) => ({ x: row.inputs[selectedInputIndex], y: row.outputs[selectedOutput.outputIndex] }));
    inputOutputPoints.push({ x: scenario[selectedInputIndex], y: state.estimate.outputs[selectedOutputIndex].estimate, scenario: true });
    drawScatter($('#inputOutputChart'), inputOutputPoints, '#inputOutputSummary', {
      xLabel: model.inputNames[selectedInputIndex],
      yLabel: selectedOutput.name,
      linePoints,
      summary: `Historical observations are blue and the scenario estimate is amber. Because this is a multivariate model, the green fitted line varies ${model.inputNames[selectedInputIndex]} while other inputs are held at the scenario values; it may differ from the simple scatter trend.`
    });

    const actualPredicted = selectedOutput.actual.map((actual, index) => ({ x: actual, y: selectedOutput.predicted[index] }));
    drawScatter($('#actualPredictedChart'), actualPredicted, '#actualPredictedSummary', {
      diagonal: true,
      xLabel: `Actual ${selectedOutput.name}`,
      yLabel: `Predicted ${selectedOutput.name}`,
      summary: `Actual versus predicted values for ${selectedOutput.name}. Points close to the diagonal indicate stronger fitted alignment.`
    });
    const residuals = selectedOutput.predicted.map((predicted, index) => ({ x: predicted, y: selectedOutput.actual[index] - predicted }));
    drawScatter($('#residualChart'), residuals, '#residualSummary', {
      xLabel: `Predicted ${selectedOutput.name}`,
      yLabel: 'Residual',
      zeroLine: true,
      summary: `Residual plot for ${selectedOutput.name}. Random spread around zero is preferred; patterns can suggest curvature, omitted inputs, or unstable historical relationships.`
    });
    drawRangeChart($('#rangeSupportChart'), '#rangeSupportSummary');
    drawPlanningRangeChart($('#planningRangeChart'), '#planningRangeSummary');
    if (selectedOutput.coefficients) {
      const driverValues = selectedOutput.coefficients
        .map((coefficient, index) => ({ coefficient, term: model.terms[index] }))
        .filter((item) => item.term.type !== 'intercept')
        .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
        .slice(0, 5)
        .map((item) => ({ label: item.term.label, value: Math.abs(item.coefficient) }));
      drawHorizontalBar($('#driverStrengthChart'), driverValues, '#driverStrengthSummary', {
        xLabel: 'Relative association strength',
        yLabel: 'Model term',
        summary: `Largest bars show the strongest relative associations for ${selectedOutput.name} within the fitted model. Use this as a diagnostic signal, not as causal proof or an absolute operational effect.`,
        valueFormatter: (value) => `Relative strength ${formatNumber(value, 2)}`
      });
    } else {
      const neighbourValues = (state.estimate.outputs[selectedOutputIndex].neighbours || [])
        .map((neighbour) => ({ label: neighbour.label, value: 1 / Math.max(neighbour.distance, 0.001) }));
      drawHorizontalBar($('#driverStrengthChart'), neighbourValues, '#driverStrengthSummary', {
        xLabel: 'Similarity weight',
        yLabel: 'Nearest observation',
        summary: `For kNN, this chart shows the closest historical observations used to estimate ${selectedOutput.name}. Higher bars indicate stronger local similarity, not a causal input effect.`,
        valueFormatter: (value, item) => `${escapeHtml(item.label)} similarity weight ${formatNumber(value, 2)}`
      });
    }
  }

  function exportCsv() {
    if (!state.analysis || !state.estimate) return;
    const model = state.analysis.selected;
    const lines = [
      ['Multivariate Input-Output Estimator'],
      ['Model', model.modelType],
      ['Scenario Classification', state.estimate.support.classification],
      [],
      ['Output', 'Estimate', 'RMSE', 'CV RMSE'],
      ...state.estimate.outputs.map((output) => [output.name, output.estimate, output.rmse, output.crossValidatedRmse]),
      [],
      ['Diagnostic Output', 'R2', 'Adjusted R2', 'MAE'],
      ...model.outputs.map((output) => [output.name, output.rSquared, output.adjustedRSquared ?? '', output.mae])
    ];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ath-multivariate-input-output-estimate.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function addColumn() {
    updateStateFromInputs();
    state.columns.push(`Column ${state.columns.length + 1}`);
    state.roles.push('ignore');
    state.rows.forEach((row) => row.push(''));
    renderData();
  }

  function addRow() {
    updateStateFromInputs();
    state.rows.push([`Observation ${state.rows.length + 1}`, ...state.columns.map(() => '')]);
    renderData();
  }

  function bindEvents() {
    $('#loadSampleButton').addEventListener('click', loadSampleData);
    $('#resetButton').addEventListener('click', resetTool);
    $('#importCsvButton').addEventListener('click', importCsv);
    $('#addColumnButton').addEventListener('click', addColumn);
    $('#addRowButton').addEventListener('click', addRow);
    $('#continueToModelButton').addEventListener('click', () => {
      updateDataQuality();
      updateWorkflow(2);
      $('#model-selection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#fitModelButton').addEventListener('click', fitModel);
    $('#estimateButton').addEventListener('click', estimateOutputs);
    $('#exportCsvButton').addEventListener('click', exportCsv);
    $('#printReportButton').addEventListener('click', () => window.print());
    $('#chartInputSelect').addEventListener('change', () => { if (state.estimate) drawCharts(); });
    $('#chartOutputSelect').addEventListener('change', () => { if (state.estimate) drawCharts(); });
    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-column-name], [data-row-label], [data-cell-row]')) {
        state.analysis = null;
        state.estimate = null;
        hideResults();
        updateDataQuality();
      }
    });
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-column-role]')) {
        updateStateFromInputs();
        state.analysis = null;
        state.estimate = null;
        hideResults();
        renderData();
        updateWorkflow(1);
      }
    });
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-row]');
      if (!button) return;
      updateStateFromInputs();
      state.rows.splice(Number(button.dataset.removeRow), 1);
      renderData();
    });
  }

  resetTool();
  bindEvents();
}());

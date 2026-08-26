'use strict';

const state = {
  inputNames: ['Input 1'],
  outputNames: ['Output 1'],
  dmus: [],
  analysis: null,
  scenarioAnalyses: null,
  resourceScenario: null,
  templateKey: ''
};

const sampleTemplates = {
  'distribution-centres': {
    title: 'Distribution Centre Efficiency',
    purpose: 'Compare distribution centres that use similar labour and operating resources to process and dispatch customer orders.',
    period: 'Use the same completed 12-month period for every centre.',
    model: 'bcc',
    orientation: 'input',
    dmuLabel: 'Distribution Centre',
    inputs: [
      { name: 'Staff FTE', unit: 'Average full-time equivalents', description: 'Average warehouse and operations staffing available during the period.' },
      { name: 'Operating Cost', unit: 'GBP per year', description: 'Comparable controllable operating expenditure for the distribution centre.' }
    ],
    outputs: [
      { name: 'Completed Orders', unit: 'Orders per year', description: 'Customer orders fully processed during the period.' },
      { name: 'On-Time Orders', unit: 'Orders per year', description: 'Completed orders dispatched within the agreed service window.' }
    ]
  },
  'warehouse-operations': {
    title: 'Warehouse Operations Efficiency',
    purpose: 'Compare warehouses performing a similar storage and fulfilment role by relating labour and occupied space to throughput and order accuracy.',
    period: 'Use the same completed operating period and consistent definitions for every warehouse.',
    model: 'bcc', orientation: 'input', dmuLabel: 'Warehouse',
    inputs: [
      { name: 'Labour Hours', unit: 'Hours per year', description: 'Total comparable warehouse labour used during the period.' },
      { name: 'Occupied Space', unit: 'Square metres', description: 'Average storage and operating floor area used during the period.' }
    ],
    outputs: [
      { name: 'Orders Dispatched', unit: 'Orders per year', description: 'Customer orders completed and dispatched during the period.' },
      { name: 'Accurate Orders', unit: 'Orders per year', description: 'Orders dispatched without picking, packing, or quantity errors.' }
    ]
  },
  'supplier-delivery': {
    title: 'Supplier Delivery Efficiency',
    purpose: 'Compare suppliers providing similar materials or services by relating commercial exposure and lead time to accepted and on-time deliveries.',
    period: 'Use one consistent 12-month supplier-performance period.',
    model: 'bcc',
    orientation: 'output',
    dmuLabel: 'Supplier',
    inputs: [
      { name: 'Annual Spend', unit: 'GBP per year', description: 'Total purchasing expenditure with the supplier during the assessment period.' },
      { name: 'Average Lead Time', unit: 'Calendar days', description: 'Average elapsed time from confirmed order to receipt; lower values are preferable.' }
    ],
    outputs: [
      { name: 'Accepted Deliveries', unit: 'Deliveries per year', description: 'Deliveries accepted without rejection or material non-conformance.' },
      { name: 'On-Time Deliveries', unit: 'Deliveries per year', description: 'Deliveries received within the agreed delivery window.' }
    ]
  },
  'transport-depots': {
    title: 'Transport Depot Efficiency',
    purpose: 'Compare depots operating a similar transport network by relating fleet and operating cost to delivered loads and on-time performance.',
    period: 'Use the same completed 12-month period and a consistent definition of a completed load.',
    model: 'bcc', orientation: 'input', dmuLabel: 'Transport Depot',
    inputs: [
      { name: 'Available Vehicles', unit: 'Average vehicles', description: 'Average number of operational vehicles assigned to the depot.' },
      { name: 'Operating Cost', unit: 'GBP per year', description: 'Comparable depot, labour, fuel, and fleet operating expenditure.' }
    ],
    outputs: [
      { name: 'Loads Delivered', unit: 'Loads per year', description: 'Completed customer or inter-site delivery loads.' },
      { name: 'On-Time Loads', unit: 'Loads per year', description: 'Loads delivered within the agreed time window.' }
    ]
  },
  'last-mile-hubs': {
    title: 'Last-Mile Delivery Hub Efficiency',
    purpose: 'Compare delivery hubs serving comparable territories by relating courier and route resources to successful and first-attempt deliveries.',
    period: 'Use a common reporting period and comparable delivery-service definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Delivery Hub',
    inputs: [
      { name: 'Courier Hours', unit: 'Hours per period', description: 'Total courier labour used for delivery activity.' },
      { name: 'Route Kilometres', unit: 'Kilometres per period', description: 'Total distance travelled on delivery routes.' }
    ],
    outputs: [
      { name: 'Successful Deliveries', unit: 'Deliveries per period', description: 'Consignments successfully delivered to the intended recipient.' },
      { name: 'First-Attempt Deliveries', unit: 'Deliveries per period', description: 'Consignments completed on the first delivery attempt.' }
    ]
  },
  'procurement-teams': {
    title: 'Procurement Team Efficiency',
    purpose: 'Compare procurement teams with similar category responsibilities by relating staffing and controllable cost to managed spend and completed sourcing activity.',
    period: 'Use the same completed 12-month period and consistent sourcing-event definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Procurement Team',
    inputs: [
      { name: 'Procurement FTE', unit: 'Average full-time equivalents', description: 'Average procurement staffing assigned to the assessed scope.' },
      { name: 'Operating Cost', unit: 'GBP per year', description: 'Comparable controllable cost of running the procurement team.' }
    ],
    outputs: [
      { name: 'Managed Spend', unit: 'GBP per year', description: 'Addressable external spend actively managed by the team.' },
      { name: 'Completed Sourcing Events', unit: 'Events per year', description: 'Sourcing exercises completed to the agreed governance standard.' }
    ]
  },
  'manufacturing-plants': {
    title: 'Manufacturing Plant Efficiency',
    purpose: 'Compare plants making a comparable product family by relating labour and energy consumption to good and on-time production output.',
    period: 'Use the same production period and consistent product-equivalent definitions.',
    model: 'bcc',
    orientation: 'input',
    dmuLabel: 'Manufacturing Plant',
    inputs: [
      { name: 'Labour Hours', unit: 'Direct hours per year', description: 'Comparable direct production labour consumed during the period.' },
      { name: 'Energy Consumption', unit: 'MWh per year', description: 'Production-related energy consumed on a consistent reporting basis.' }
    ],
    outputs: [
      { name: 'Good Units Produced', unit: 'Equivalent units per year', description: 'Conforming production output after excluding rejects and rework.' },
      { name: 'On-Time Units', unit: 'Equivalent units per year', description: 'Good units completed within the committed production schedule.' }
    ]
  },
  'production-lines': {
    title: 'Production Line Efficiency',
    purpose: 'Compare lines producing comparable products by relating labour and scheduled time to conforming output and schedule attainment.',
    period: 'Use one production period and convert product mix to a consistent equivalent-unit basis where necessary.',
    model: 'bcc', orientation: 'input', dmuLabel: 'Production Line',
    inputs: [
      { name: 'Labour Hours', unit: 'Direct hours per period', description: 'Direct labour consumed by the production line.' },
      { name: 'Scheduled Machine Hours', unit: 'Hours per period', description: 'Machine time scheduled and made available to the line.' }
    ],
    outputs: [
      { name: 'Good Units', unit: 'Equivalent units per period', description: 'Conforming output after excluding scrap and rework.' },
      { name: 'On-Schedule Units', unit: 'Equivalent units per period', description: 'Good units completed within the production schedule.' }
    ]
  },
  'maintenance-teams': {
    title: 'Maintenance Team Efficiency',
    purpose: 'Compare maintenance teams supporting similar assets by relating labour and maintenance cost to completed work and restored equipment availability.',
    period: 'Use the same completed maintenance period and comparable work-order definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Maintenance Team',
    inputs: [
      { name: 'Technician Hours', unit: 'Hours per year', description: 'Total internal and contracted technician time used.' },
      { name: 'Maintenance Cost', unit: 'GBP per year', description: 'Comparable labour, parts, and contracted maintenance expenditure.' }
    ],
    outputs: [
      { name: 'Work Orders Completed', unit: 'Work orders per year', description: 'Planned and corrective work orders completed and closed.' },
      { name: 'Availability Hours Restored', unit: 'Asset hours per year', description: 'Estimated productive equipment availability restored through completed work.' }
    ]
  },
  'quality-units': {
    title: 'Quality-Control Unit Efficiency',
    purpose: 'Compare quality units performing similar inspection work by relating staffing and test resources to completed and timely inspections.',
    period: 'Use the same completed reporting period and consistent inspection definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Quality Unit',
    inputs: [
      { name: 'Inspector Hours', unit: 'Hours per period', description: 'Quality inspection and testing labour used.' },
      { name: 'Testing Cost', unit: 'GBP per period', description: 'Comparable consumable, equipment, laboratory, and external testing cost.' }
    ],
    outputs: [
      { name: 'Inspections Completed', unit: 'Inspections per period', description: 'Inspection or test activities completed to the required standard.' },
      { name: 'On-Time Inspections', unit: 'Inspections per period', description: 'Inspections completed within the required release or response time.' }
    ]
  },
  'retail-branches': {
    title: 'Retail Branch Efficiency',
    purpose: 'Compare branches with a similar proposition by relating staffing and floor space to sales activity and gross contribution.',
    period: 'Use the same completed trading period and consistent accounting definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Retail Branch',
    inputs: [
      { name: 'Staff FTE', unit: 'Average full-time equivalents', description: 'Average branch staffing during the period.' },
      { name: 'Selling Space', unit: 'Square metres', description: 'Customer-facing retail floor area.' }
    ],
    outputs: [
      { name: 'Transactions', unit: 'Transactions per year', description: 'Completed customer purchase transactions.' },
      { name: 'Gross Contribution', unit: 'GBP per year', description: 'Sales less directly attributable product cost on a consistent basis.' }
    ]
  },
  'regional-sales': {
    title: 'Regional Sales Office Efficiency',
    purpose: 'Compare sales offices serving comparable markets by relating sales resources and operating cost to revenue and retained business.',
    period: 'Use the same completed sales period and consistent customer and revenue definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Sales Office',
    inputs: [
      { name: 'Sales FTE', unit: 'Average full-time equivalents', description: 'Average customer-facing sales staffing.' },
      { name: 'Sales Operating Cost', unit: 'GBP per year', description: 'Comparable sales payroll, travel, and controllable office expenditure.' }
    ],
    outputs: [
      { name: 'Net Revenue', unit: 'GBP per year', description: 'Recognised revenue net of returns and cancellations.' },
      { name: 'Retained Customers', unit: 'Customers per year', description: 'Active customers retained through the end of the assessment period.' }
    ]
  },
  'customer-support': {
    title: 'Customer Support Centre Efficiency',
    purpose: 'Compare support centres handling similar demand by relating agent capacity and operating cost to resolved contacts and service-level performance.',
    period: 'Use a common service period and consistent contact-resolution rules.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Support Centre',
    inputs: [
      { name: 'Agent Hours', unit: 'Hours per period', description: 'Total productive support-agent time available.' },
      { name: 'Operating Cost', unit: 'GBP per period', description: 'Comparable staffing, technology, and facility cost.' }
    ],
    outputs: [
      { name: 'Contacts Resolved', unit: 'Contacts per period', description: 'Customer contacts closed with a documented resolution.' },
      { name: 'Within-SLA Resolutions', unit: 'Contacts per period', description: 'Resolved contacts completed within the agreed service level.' }
    ]
  },
  'service-centres': {
    title: 'Service Centre Efficiency',
    purpose: 'Compare service centres performing similar repair or field-support work by relating labour and operating cost to completed jobs and first-time fixes.',
    period: 'Use the same completed service period and consistent job-completion definitions.',
    model: 'bcc', orientation: 'output', dmuLabel: 'Service Centre',
    inputs: [
      { name: 'Technician Hours', unit: 'Hours per period', description: 'Technical labour available for repair and service work.' },
      { name: 'Operating Cost', unit: 'GBP per period', description: 'Comparable labour, parts-handling, facility, and support cost.' }
    ],
    outputs: [
      { name: 'Jobs Completed', unit: 'Jobs per period', description: 'Customer or internal service jobs completed and closed.' },
      { name: 'First-Time Fixes', unit: 'Jobs per period', description: 'Jobs resolved without a repeat visit or reopened repair.' }
    ]
  }
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value).toLocaleString('en-GB', { maximumFractionDigits });
}

function formatPercent(value, digits = 1) {
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

function numericValues(values) {
  return values.map(Number).filter((value) => Number.isFinite(value));
}

function getRange(values) {
  const clean = numericValues(values);
  if (!clean.length) return { min: 0, max: 0, spread: 0, hasValues: false };
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  return { min, max, spread: min > 0 ? max / min : Infinity, hasValues: true };
}

function getCompleteness() {
  const expected = state.dmus.length * (1 + state.inputNames.length + state.outputNames.length);
  if (!expected) return 0;
  const filled = state.dmus.reduce((total, dmu) => (
    total
    + (String(dmu.name || '').trim() ? 1 : 0)
    + dmu.inputs.filter((value) => String(value).trim()).length
    + dmu.outputs.filter((value) => String(value).trim()).length
  ), 0);
  return filled / expected;
}

function getDataQualityDiagnostics() {
  const warnings = [];
  const dmuNames = state.dmus.map((dmu) => String(dmu.name || '').trim()).filter(Boolean);
  const duplicateNames = dmuNames.filter((name, index) => dmuNames.findIndex((item) => item.toLowerCase() === name.toLowerCase()) !== index);
  const measureCount = state.inputNames.length + state.outputNames.length;
  const adequacy = window.ATHDea.assessSampleAdequacy(state.dmus.length, state.inputNames.length, state.outputNames.length);

  if (!state.dmus.length) warnings.push({ level: 'info', text: 'Add or import comparable DMUs to begin the data-quality review.' });
  if (duplicateNames.length) warnings.push({ level: 'critical', text: `Duplicate DMU names detected: ${[...new Set(duplicateNames)].join(', ')}.` });
  if (state.dmus.length && !adequacy.meetsHeuristic) warnings.push({ level: 'warning', text: `${state.dmus.length} DMUs are below the common ${adequacy.recommendedMinimum}-unit heuristic for ${measureCount} measures.` });

  [...state.inputNames.map((name, index) => ({ kind: 'input', name, index })), ...state.outputNames.map((name, index) => ({ kind: 'output', name, index }))].forEach((measure) => {
    const values = state.dmus.map((dmu) => measure.kind === 'input' ? dmu.inputs[measure.index] : dmu.outputs[measure.index]);
    const blanks = values.filter((value) => !String(value).trim()).length;
    const numbers = numericValues(values);
    const zeros = numbers.filter((value) => value === 0).length;
    const negatives = numbers.filter((value) => value < 0).length;
    const range = getRange(values);
    if (blanks) warnings.push({ level: 'critical', text: `${measure.name} has ${blanks} blank value${blanks === 1 ? '' : 's'}.` });
    if (negatives) warnings.push({ level: 'critical', text: `${measure.name} contains negative values, which are not valid for this DEA model.` });
    if (numbers.length && zeros / numbers.length > .35) warnings.push({ level: 'warning', text: `${measure.name} has many zero values. Confirm that zero means true absence, not missing data.` });
    if (range.hasValues && range.spread > 20) warnings.push({ level: 'warning', text: `${measure.name} has a wide range from ${formatNumber(range.min)} to ${formatNumber(range.max)}. Check for outliers or unit inconsistencies.` });
  });

  const status = warnings.some((warning) => warning.level === 'critical')
    ? 'Needs review'
    : warnings.some((warning) => warning.level === 'warning')
      ? 'Use caution'
      : state.dmus.length >= 2
        ? 'Ready for modelling'
        : 'Not ready';
  return {
    status,
    warnings,
    completeness: getCompleteness(),
    dmuCount: state.dmus.length,
    measureCount,
    recommendedMinimum: adequacy.recommendedMinimum
  };
}

function renderDataQualityPanel() {
  const diagnostics = getDataQualityDiagnostics();
  const status = $('#dataQualityStatus');
  status.textContent = diagnostics.status;
  status.className = `quality-status ${diagnostics.status === 'Ready for modelling' ? 'ready' : diagnostics.status === 'Needs review' ? 'critical' : diagnostics.status === 'Use caution' ? 'warning' : ''}`;
  $('#dataQualityGrid').innerHTML = [
    ['Completeness', formatPercent(diagnostics.completeness)],
    ['DMUs', diagnostics.dmuCount],
    ['Measures', diagnostics.measureCount],
    ['Suggested minimum', diagnostics.recommendedMinimum]
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
  $('#dataQualityWarnings').innerHTML = diagnostics.warnings.length
    ? diagnostics.warnings.map((warning) => `<li class="${warning.level}">${escapeHtml(warning.text)}</li>`).join('')
    : '<li class="ready">No obvious data-quality warnings from the current checks. Still verify comparability, definitions, and operating context before acting on DEA targets.</li>';
}

function updateModelRecommendation() {
  const diagnostics = getDataQualityDiagnostics();
  const selectedTemplate = sampleTemplates[state.templateKey || $('#templateSelect').value];
  const model = selectedTemplate?.model || 'bcc';
  const orientation = selectedTemplate?.orientation || 'input';
  const modelLabel = model === 'bcc' ? 'BCC / VRS' : 'CCR / CRS';
  const orientationLabel = orientation === 'input' ? 'input orientation' : 'output orientation';
  const caution = diagnostics.dmuCount && diagnostics.dmuCount < diagnostics.recommendedMinimum
    ? ` The sample is small for ${diagnostics.measureCount} measures, so treat the result as diagnostic.`
    : '';
  $('#modelRecommendation').innerHTML = `<strong>Suggested starting point:</strong> ${modelLabel} with ${orientationLabel}.${caution} You can override this when your operating assumption differs.`;
}

function renderTemplateContext(templateKey, loaded = false) {
  const template = sampleTemplates[templateKey];
  if (!template) {
    $('#templateContext').innerHTML = '<strong>Blank custom model</strong><p>Define measures and add comparable decision-making units manually, or configure the measures before importing a CSV.</p>';
    return;
  }
  const modelLabel = template.model === 'bcc' ? 'BCC / variable returns to scale' : 'CCR / constant returns to scale';
  const orientationLabel = template.orientation === 'input' ? 'Input-oriented' : 'Output-oriented';
  const measureList = (measures) => measures.map((measure) => `<li><strong>${escapeHtml(measure.name)}</strong> (${escapeHtml(measure.unit)}): ${escapeHtml(measure.description)}</li>`).join('');
  $('#templateContext').innerHTML = `
    <strong>${escapeHtml(template.title)}${loaded ? ' template loaded' : ''}</strong>
    <p>${escapeHtml(template.purpose)}</p>
    <div class="template-context-grid">
      <div><span>Suggested model</span><strong>${modelLabel}</strong></div>
      <div><span>Suggested orientation</span><strong>${orientationLabel}</strong></div>
      <div><span>Comparison period</span><strong>${escapeHtml(template.period)}</strong></div>
    </div>
    <div class="template-measures">
      <section><h4>Suggested inputs</h4><ul>${measureList(template.inputs)}</ul></section>
      <section><h4>Suggested outputs</h4><ul>${measureList(template.outputs)}</ul></section>
    </div>
    <p class="template-safeguard"><strong>Illustrative starting structure:</strong> review and adapt the measures, definitions, units, model assumptions, and reporting period to your context. The three editable DMU rows are placeholders for your data, not an industry benchmark or an adequate comparison sample.</p>
  `;
}

function updateTemplateSelection() {
  const templateKey = $('#templateSelect').value;
  $('#loadSampleButton').disabled = !templateKey;
  renderTemplateContext(templateKey);
  updateModelRecommendation();
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

function setError(message = '') {
  const box = $('#errorMessage');
  box.hidden = !message;
  box.textContent = message;
  if (message) box.scrollIntoView({ block: 'center' });
}

function markResultsStale(nextStep = 1) {
  if (state.analysis) {
    $('#results').classList.add('hidden');
    state.analysis = null;
  }
  state.scenarioAnalyses = null;
  state.resourceScenario = null;
  $('#scenario-analysis').classList.add('hidden');
  $('#resourceScenarioResults').classList.add('hidden');
  resetAssumptionScenario();
  setWorkflowStep(nextStep);
}

function updateModelExplanation() {
  const model = $('#modelType').value;
  const orientation = $('#orientation').value;
  const scaleText = model === 'bcc'
    ? 'BCC separates scale effects by allowing variable returns to scale'
    : 'CCR assumes constant returns to scale across the observed operating range';
  const orientationText = orientation === 'input'
    ? 'focuses on proportional input reduction while maintaining current outputs.'
    : 'focuses on proportional output expansion without increasing current inputs.';
  $('#modelExplanation').innerHTML = `<strong>Selected approach:</strong> ${scaleText} and ${orientationText}`;
  updateModelRecommendation();
  markResultsStale(state.dmus.length >= 2 ? 3 : 1);
}

function renderMeasures(kind) {
  const names = kind === 'input' ? state.inputNames : state.outputNames;
  const target = kind === 'input' ? $('#inputMeasures') : $('#outputMeasures');
  target.innerHTML = names.map((name, index) => `
    <div class="measure-row">
      <input type="text" value="${escapeHtml(name)}" data-measure-kind="${kind}" data-measure-index="${index}" aria-label="${kind} measure ${index + 1} name">
      <button class="reset remove-measure" type="button" data-measure-kind="${kind}" data-measure-index="${index}" aria-label="Remove ${escapeHtml(name)}">X</button>
    </div>
  `).join('');
}

function renderDataTable() {
  const headers = [
    '<th scope="col">DMU Name</th>',
    ...state.inputNames.map((name) => `<th scope="col">${escapeHtml(name)}<span class="metric-kind">Input</span></th>`),
    ...state.outputNames.map((name) => `<th scope="col">${escapeHtml(name)}<span class="metric-kind">Output</span></th>`),
    '<th scope="col">Remove</th>'
  ].join('');
  const rows = state.dmus.map((dmu, rowIndex) => `
    <tr>
      <td><input class="dmu-name" type="text" value="${escapeHtml(dmu.name)}" data-dmu-row="${rowIndex}" data-dmu-field="name" aria-label="DMU ${rowIndex + 1} name"></td>
      ${dmu.inputs.map((value, index) => `<td><input type="number" min="0" step="any" value="${escapeHtml(value)}" data-dmu-row="${rowIndex}" data-dmu-field="input" data-value-index="${index}" aria-label="${escapeHtml(dmu.name || `DMU ${rowIndex + 1}`)} ${escapeHtml(state.inputNames[index])}"></td>`).join('')}
      ${dmu.outputs.map((value, index) => `<td><input type="number" min="0" step="any" value="${escapeHtml(value)}" data-dmu-row="${rowIndex}" data-dmu-field="output" data-value-index="${index}" aria-label="${escapeHtml(dmu.name || `DMU ${rowIndex + 1}`)} ${escapeHtml(state.outputNames[index])}"></td>`).join('')}
      <td><button class="reset remove-dmu" type="button" data-dmu-row="${rowIndex}" aria-label="Remove ${escapeHtml(dmu.name || `DMU ${rowIndex + 1}`)}">X</button></td>
    </tr>
  `).join('');
  $('#dmuTable').innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${state.inputNames.length + state.outputNames.length + 2}">No DMUs added. Load a sample template, import a CSV, or add a row.</td></tr>`}</tbody>`;
  renderSampleAdequacy();
  renderDataQualityPanel();
  updateModelRecommendation();
}

function renderSampleAdequacy() {
  const box = $('#sampleAdequacy');
  const text = $('#sampleAdequacyText');
  const assessment = window.ATHDea.assessSampleAdequacy(
    state.dmus.length,
    state.inputNames.length,
    state.outputNames.length
  );
  box.classList.toggle('warning', state.dmus.length > 0 && !assessment.meetsHeuristic);
  box.classList.toggle('ready', assessment.meetsHeuristic);
  if (!state.dmus.length) {
    text.textContent = `Add comparable units to review the sample size. With ${assessment.measureCount} measures, a common discrimination heuristic suggests at least ${assessment.recommendedMinimum} DMUs.`;
  } else if (assessment.meetsHeuristic) {
    text.textContent = `${assessment.dmuCount} DMUs meet the common heuristic of at least ${assessment.recommendedMinimum} units for ${assessment.measureCount} measures. This is guidance, not proof that the sample is representative.`;
  } else {
    text.textContent = `${assessment.dmuCount} DMUs are below the common heuristic of ${assessment.recommendedMinimum} units for ${assessment.measureCount} measures. Results can still be calculated, but the frontier may classify too many units as efficient. Add comparable DMUs or reduce the measures where appropriate.`;
  }
}

function renderEditor() {
  renderMeasures('input');
  renderMeasures('output');
  renderDataTable();
}

function addMeasure(kind) {
  const names = kind === 'input' ? state.inputNames : state.outputNames;
  if (names.length >= 8) return setError(`A maximum of eight ${kind} measures is supported.`);
  names.push(`${kind === 'input' ? 'Input' : 'Output'} ${names.length + 1}`);
  state.dmus.forEach((dmu) => (kind === 'input' ? dmu.inputs : dmu.outputs).push(''));
  renderEditor();
  markResultsStale();
}

function removeMeasure(kind, index) {
  const names = kind === 'input' ? state.inputNames : state.outputNames;
  if (names.length <= 1) return setError(`Keep at least one ${kind} measure.`);
  names.splice(index, 1);
  state.dmus.forEach((dmu) => (kind === 'input' ? dmu.inputs : dmu.outputs).splice(index, 1));
  renderEditor();
  markResultsStale();
}

function addDmu() {
  if (state.dmus.length >= 100) return setError('A maximum of 100 decision-making units is supported.');
  state.dmus.push({
    name: `DMU ${state.dmus.length + 1}`,
    inputs: Array(state.inputNames.length).fill(''),
    outputs: Array(state.outputNames.length).fill('')
  });
  renderDataTable();
  markResultsStale();
}

function loadSelectedTemplate() {
  setError();
  try {
    const templateKey = $('#templateSelect').value;
    const template = sampleTemplates[templateKey];
    if (!template) throw new Error('Select a sample template before loading it.');
    if (!template.inputs?.length || !template.outputs?.length || !template.dmuLabel) {
      throw new Error('The selected template is incomplete and cannot be loaded.');
    }

    state.templateKey = templateKey;
    state.inputNames = template.inputs.map((measure) => measure.name);
    state.outputNames = template.outputs.map((measure) => measure.name);
    state.dmus = Array.from({ length: 3 }, (_, index) => ({
      name: `${template.dmuLabel} ${index + 1}`,
      inputs: Array(template.inputs.length).fill(''),
      outputs: Array(template.outputs.length).fill('')
    }));
    state.analysis = null;

    $('#modelType').value = template.model;
    $('#orientation').value = template.orientation;
    renderEditor();
    updateModelExplanation();
    renderTemplateContext(templateKey, true);
    $('#results').classList.add('hidden');
    $('#uploadStatus').textContent = `${template.title} structure loaded with three editable placeholder DMUs. Replace the names, enter your data, and add enough comparable units for a meaningful frontier.`;
    setWorkflowStep(2);
  } catch (error) {
    setError(`The sample template could not be loaded. ${error.message}`);
  }
}

function resetTool() {
  state.inputNames = ['Input 1'];
  state.outputNames = ['Output 1'];
  state.dmus = [];
  state.analysis = null;
  state.templateKey = '';
  $('#templateSelect').value = '';
  $('#loadSampleButton').disabled = true;
  $('#modelType').value = 'bcc';
  $('#orientation').value = 'input';
  $('#csvFile').value = '';
  $('#results').classList.add('hidden');
  $('#uploadStatus').textContent = 'Define the measures above, add rows manually, load a sample template, or import a CSV.';
  updateModelExplanation();
  renderEditor();
  renderTemplateContext('');
  setError();
  setWorkflowStep(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field.trim()); field = ''; }
    else if (character === '\n') { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else if (character !== '\r') field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.');
  return rows;
}

async function importCsv() {
  const file = $('#csvFile').files[0];
  if (!file) return setError('Choose a CSV file before importing.');
  if (!file.name.toLowerCase().endsWith('.csv')) return setError('Upload a CSV file with a .csv extension.');
  if (file.size > 2 * 1024 * 1024) return setError('The CSV file must be 2 MB or smaller.');
  try {
    const rows = parseCsv(await file.text());
    if (rows.length < 3) throw new Error('The CSV needs a header and at least two DMU rows.');
    const expectedColumns = 1 + state.inputNames.length + state.outputNames.length;
    if (rows[0].length !== expectedColumns) {
      throw new Error(`The current setup expects ${expectedColumns} columns: one DMU name, ${state.inputNames.length} input(s), and ${state.outputNames.length} output(s).`);
    }
    if (rows[0].some((header) => !String(header).trim())) throw new Error('Every CSV column needs a non-blank header.');
    if (rows.length - 1 > 100) throw new Error('The CSV contains more than 100 DMUs.');
    state.inputNames = rows[0].slice(1, 1 + state.inputNames.length);
    state.outputNames = rows[0].slice(1 + state.inputNames.length);
    state.dmus = rows.slice(1).map((values, rowIndex) => {
      if (values.length !== expectedColumns) throw new Error(`CSV row ${rowIndex + 2} has an unexpected number of columns.`);
      if (!String(values[0] || '').trim()) throw new Error(`CSV row ${rowIndex + 2} needs a DMU name.`);
      values.slice(1).forEach((value, columnIndex) => {
        const label = rows[0][columnIndex + 1];
        if (!String(value ?? '').trim()) throw new Error(`CSV row ${rowIndex + 2}, ${label} is blank.`);
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) throw new Error(`CSV row ${rowIndex + 2}, ${label} must be a finite, non-negative number.`);
      });
      return {
        name: values[0].trim(),
        inputs: values.slice(1, 1 + state.inputNames.length),
        outputs: values.slice(1 + state.inputNames.length)
      };
    });
    renderEditor();
    markResultsStale();
    setError();
    setWorkflowStep(2);
    $('#uploadStatus').textContent = `${state.dmus.length} DMUs imported locally from ${file.name}. Review the measures and values before analysis.`;
  } catch (error) {
    setError(error.message);
  }
}

function collectDataset() {
  return state.dmus.map((dmu) => ({
    name: dmu.name,
    inputs: dmu.inputs.slice(),
    outputs: dmu.outputs.slice()
  }));
}

function continueToModel() {
  setError();
  if (state.dmus.length < 2) {
    setError('Add at least two comparable decision-making units before choosing the DEA model.');
    return;
  }
  setWorkflowStep(2);
  $('#model-setup').scrollIntoView({ block: 'center' });
  $('#modelType').focus({ preventScroll: true });
}

function runAnalysis() {
  setError();
  setWorkflowStep(3);
  syncDmusFromTable();
  renderDataQualityPanel();
  try {
    state.analysis = window.ATHDea.analyseDea({
      model: $('#modelType').value,
      orientation: $('#orientation').value,
      inputNames: state.inputNames,
      outputNames: state.outputNames,
      dmus: collectDataset()
    });
    state.scenarioAnalyses = null;
    state.resourceScenario = null;
    resetAssumptionScenario();
    renderResults();
    renderResourceScenarioEditor();
    setWorkflowStep(4);
    $('#results').classList.remove('hidden');
    $('#results-heading').focus();
  } catch (error) {
    state.analysis = null;
    $('#results').classList.add('hidden');
    setError(error.message);
    setWorkflowStep(3);
  }
}

function renderResourceScenarioEditor() {
  if (!state.analysis) return;
  renderScenarioValueFields();
  $('#scenarioModel').value = state.analysis.model;
  $('#scenarioDmuName').value = 'Future Scenario Plan';
  $('#scenarioError').hidden = true;
  $('#scenarioError').textContent = '';
  $('#resourceScenarioResults').classList.add('hidden');
}

function getScenarioMode() {
  return $('input[name="scenarioMode"]:checked')?.value || 'inputRequirement';
}

function renderScenarioValueFields() {
  if (!state.analysis) return;
  const mode = getScenarioMode();
  const isInputRequirement = mode === 'inputRequirement';
  const fields = isInputRequirement
    ? state.analysis.outputNames.map((name, index) => ({ kind: 'output', name, index }))
    : state.analysis.inputNames.map((name, index) => ({ kind: 'input', name, index }));
  $('#scenarioValueHelp').textContent = isInputRequirement
    ? 'Enter target or forecast outputs using the same definitions as the historical data.'
    : 'Enter available inputs using the same definitions as the historical data.';
  $('#scenarioValueFields').innerHTML = fields.map((field) => `
    <label>
      <span>${escapeHtml(field.name)} <small>${isInputRequirement ? 'Target / forecast output' : 'Available input'}</small></span>
      <input type="number" min="0" step="any" inputmode="decimal" data-scenario-kind="${field.kind}" data-scenario-index="${field.index}" placeholder="Enter value">
    </label>
  `).join('');
  $('#evaluateScenarioButton').textContent = isInputRequirement ? 'Generate Benchmark Inputs' : 'Generate Benchmark Outputs';
  $('#resourceScenarioResults').classList.add('hidden');
  $('#scenarioError').hidden = true;
  $('#scenarioError').textContent = '';
}

function collectResourceScenario() {
  const mode = getScenarioMode();
  const names = mode === 'inputRequirement' ? state.analysis.outputNames : state.analysis.inputNames;
  const kind = mode === 'inputRequirement' ? 'output' : 'input';
  const values = names.map((_, index) => {
    const field = $(`[data-scenario-kind="${kind}"][data-scenario-index="${index}"]`);
    return field ? field.value : '';
  });
  return {
    mode,
    model: $('#scenarioModel').value,
    inputNames: state.analysis.inputNames,
    outputNames: state.analysis.outputNames,
    referenceDmus: state.analysis.dmus,
    scenarioName: $('#scenarioDmuName').value,
    values
  };
}

function scenarioScore(solve) {
  return solve.feasible ? formatPercent(solve.result.efficiency) : 'Not feasible';
}

function renderResourceScenarioResults() {
  const analysis = state.resourceScenario;
  const selected = analysis.selected;
  const isInputRequirement = analysis.mode === 'inputRequirement';
  $('#resourceScenarioSummary').innerHTML = [
    ['Scenario mode', isInputRequirement ? 'Input benchmark' : 'Output benchmark'],
    ['DEA model', analysis.model === 'bcc' ? 'BCC / VRS' : 'CCR / CRS'],
    ['Feasibility', selected.feasible ? 'Feasible benchmark' : 'Not feasible'],
    ['Historical references', String(analysis.referenceCount)],
    ['Benchmark scale', selected.feasible ? formatNumber(selected.result.radialFactor, 3) : 'Not available']
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');

  if (analysis.warnings.length) {
    const messages = analysis.warnings.map((warning) => {
      if (warning.type === 'outputRange') return `${escapeHtml(warning.name)} target is ${formatNumber(warning.value)}, above the historical maximum of ${formatNumber(warning.maximum)}.`;
      if (warning.type === 'inputRange') return `${escapeHtml(warning.name)} input is ${formatNumber(warning.value)}, outside the historical range of ${formatNumber(warning.minimum)} to ${formatNumber(warning.maximum)}.`;
      if (warning.type === 'bccFeasibility') return 'The selected BCC/VRS benchmark is outside the feasible convex historical production set, so generated values are withheld.';
      return 'Review the scenario against the selected historical reference set.';
    }).join(' ');
    $('#scenarioRangeWarning').innerHTML = `<div class="scenario-warning" role="status"><strong>Frontier support warning</strong><p>${messages} DEA Efficient Benchmark values are planning diagnostics, not guaranteed forecasts or requirements.</p></div>`;
  } else {
    $('#scenarioRangeWarning').innerHTML = '';
  }

  if (!selected.feasible) {
    $('#resourceScenarioInterpretation').innerHTML = `
      <h3>DEA Efficient Benchmark conclusion</h3>
      <p><strong>The selected ${analysis.model.toUpperCase()} scenario is not feasible within the selected historical frontier.</strong></p>
      <p>The tool has not generated benchmark values because doing so would imply frontier support that the selected reference observations do not provide. Review the entered values, reference DMUs, or returns-to-scale assumption.</p>
    `;
    $('#scenarioBenchmarkTable').innerHTML = '<tbody><tr><td>No DEA Efficient Benchmark is shown for an infeasible scenario.</td></tr></tbody>';
    $('#scenarioPeerTable').innerHTML = '<tbody><tr><td>No historical peer combination supports this scenario under the selected model.</td></tr></tbody>';
    $('#scenarioPeerSummary').textContent = `${analysis.referenceCount} historical records were considered. The scenario was not included in the frontier.`;
    $('#resourceScenarioResults').classList.remove('hidden');
    return;
  }

  const result = selected.result;
  const answer = isInputRequirement
    ? 'DEA has generated the efficient benchmark input mix associated with the entered target outputs and the selected fixed historical frontier.'
    : 'DEA has generated the efficient benchmark output mix associated with the entered available inputs and the selected fixed historical frontier.';
  $('#resourceScenarioInterpretation').innerHTML = `
    <h3>DEA Efficient Benchmark conclusion</h3>
    <p><strong>${escapeHtml(answer)}</strong></p>
    <p>The benchmark uses ${analysis.referenceCount} selected historical DMUs. The scenario values did not construct or alter the frontier, and no lambda is created for the scenario. Treat the generated values as a relative planning diagnostic, not a guaranteed forecast or requirement.</p>
  `;

  const rows = isInputRequirement
    ? [
      ...analysis.inputNames.map((name, index) => ({ type: 'Generated input', name, entered: 'Generated by DEA', benchmark: result.generatedInputs[index] })),
      ...analysis.outputNames.map((name, index) => ({ type: 'Target output', name, entered: analysis.values[index], benchmark: analysis.values[index] }))
    ]
    : [
      ...analysis.inputNames.map((name, index) => ({ type: 'Available input', name, entered: analysis.values[index], benchmark: analysis.values[index] })),
      ...analysis.outputNames.map((name, index) => ({ type: 'Generated output', name, entered: 'Generated by DEA', benchmark: result.generatedOutputs[index] }))
    ];
  $('#scenarioBenchmarkTable').innerHTML = `<thead><tr><th>Measure</th><th>Scenario role</th><th>Entered value</th><th>DEA Efficient Benchmark</th></tr></thead><tbody>${rows.map((row) => `<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${escapeHtml(row.type)}</td><td>${typeof row.entered === 'number' ? formatNumber(row.entered) : escapeHtml(row.entered)}</td><td>${formatNumber(row.benchmark)}</td></tr>`).join('')}</tbody>`;
  $('#scenarioPeerSummary').textContent = `${result.peers.length} historical peer reference${result.peers.length === 1 ? '' : 's'} support the DEA Efficient Benchmark. No lambda is created for ${$('#scenarioDmuName').value || 'the scenario'}.`;
  $('#scenarioPeerTable').innerHTML = `<thead><tr><th>Historical reference DMU</th><th>Lambda weight</th><th>Role</th></tr></thead><tbody>${result.peers.map((peer) => `<tr><td><strong>${escapeHtml(peer.name)}</strong></td><td>${peer.lambda.toFixed(4)}</td><td><span class="record-badge reference">REFERENCE</span></td></tr>`).join('')}</tbody>`;
  $('#resourceScenarioResults').classList.remove('hidden');
}

function evaluateResourceScenario() {
  if (!state.analysis) return;
  const errorBox = $('#scenarioError');
  errorBox.hidden = true;
  errorBox.textContent = '';
  try {
    state.resourceScenario = window.ATHDea.evaluateScenarioBenchmark(collectResourceScenario());
    renderResourceScenarioResults();
  } catch (error) {
    state.resourceScenario = null;
    $('#resourceScenarioResults').classList.add('hidden');
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: 'center' });
  }
}

function getDmuAction(result, analysis = state.analysis) {
  const peerNames = result.peers.map((peer) => peer.name).filter((name) => name !== result.name);
  if (result.efficient) {
    return {
      priority: 'Maintain and validate',
      action: `Maintain current performance, verify data quality, and document transferable practices${peerNames.length ? ` for ${peerNames.join(', ')}` : ''}. Efficiency is relative to this observed sample.`
    };
  }

  const gap = (1 - result.efficiency) * 100;
  const inputSlackIndex = result.inputSlacks.indexOf(Math.max(...result.inputSlacks));
  const outputSlackIndex = result.outputSlacks.indexOf(Math.max(...result.outputSlacks));
  const largestInputSlack = result.inputSlacks[inputSlackIndex] || 0;
  const largestOutputSlack = result.outputSlacks[outputSlackIndex] || 0;
  const slackAction = largestInputSlack > 1e-6
    ? ` Investigate excess ${analysis.inputNames[inputSlackIndex]} beyond the proportional adjustment.`
    : largestOutputSlack > 1e-6
      ? ` Investigate the additional ${analysis.outputNames[outputSlackIndex]} shortfall beyond the proportional adjustment.`
      : '';
  const radialAction = analysis.orientation === 'input'
    ? `Review whether inputs could be reduced by about ${gap.toFixed(1)}% while maintaining current outputs.`
    : `Review whether outputs could be expanded by about ${(1 / result.efficiency * 100 - 100).toFixed(1)}% with current inputs.`;
  return {
    priority: result.efficiency < 0.8 ? 'Priority review' : result.efficiency < 0.95 ? 'Improvement review' : 'Monitor near frontier',
    action: `${radialAction}${slackAction} Compare operating practices with ${peerNames.join(', ') || 'the calculated peer reference set'} before setting a management target.`
  };
}

function getPeerFrequency(results) {
  const counts = new Map();
  results.forEach((result) => {
    result.peers.forEach((peer) => {
      if (peer.name === result.name) return;
      counts.set(peer.name, (counts.get(peer.name) || 0) + 1);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function getLargestSlackSignal(results, analysis = state.analysis) {
  const signals = [];
  results.forEach((result) => {
    result.inputSlacks.forEach((value, index) => {
      if (value > 1e-6) signals.push({ dmu: result.name, measure: analysis.inputNames[index], type: 'input excess', value });
    });
    result.outputSlacks.forEach((value, index) => {
      if (value > 1e-6) signals.push({ dmu: result.name, measure: analysis.outputNames[index], type: 'output shortfall', value });
    });
  });
  return signals.sort((a, b) => b.value - a.value)[0] || null;
}

function renderExecutiveBenchmarkPanel() {
  const { summary, results, adequacy } = state.analysis;
  const reviewUnits = results.filter((result) => !result.efficient).sort((a, b) => a.efficiency - b.efficiency);
  const topPeer = getPeerFrequency(results)[0];
  const slackSignal = getLargestSlackSignal(results);
  const efficientShare = summary.dmuCount ? summary.efficientCount / summary.dmuCount : 0;
  const discriminationSignal = efficientShare > .6
    ? 'Many units are on the frontier. Review whether the model has too many measures or too few comparable DMUs.'
    : 'The model is providing useful discrimination across the sample.';
  $('#executiveBenchmarkPanel').innerHTML = `
    <div>
      <span>Executive benchmark summary</span>
      <h3>${reviewUnits.length ? `${reviewUnits.length} unit${reviewUnits.length === 1 ? '' : 's'} need benchmark review` : 'All units are on the observed frontier'}</h3>
      <p>${reviewUnits[0] ? `${escapeHtml(reviewUnits[0].name)} has the lowest score at ${formatPercent(reviewUnits[0].efficiency)}.` : 'Use scenario and measure checks to confirm the frontier is still discriminating.'} ${discriminationSignal}</p>
      ${adequacy.meetsHeuristic ? '' : `<p><strong>Sample caution:</strong> ${adequacy.dmuCount} DMUs are below the ${adequacy.recommendedMinimum}-unit heuristic for this measure set.</p>`}
    </div>
    <div class="executive-facts">
      <article><span>Best-practice set</span><strong>${summary.efficientCount}</strong><small>frontier units</small></article>
      <article><span>Most used peer</span><strong>${escapeHtml(topPeer ? topPeer[0] : 'None')}</strong><small>${topPeer ? `${topPeer[1]} reference${topPeer[1] === 1 ? '' : 's'}` : 'self-benchmarks only'}</small></article>
      <article><span>Main slack signal</span><strong>${escapeHtml(slackSignal ? slackSignal.measure : 'None')}</strong><small>${slackSignal ? `${escapeHtml(slackSignal.type)} in ${escapeHtml(slackSignal.dmu)}` : 'no non-radial gap detected'}</small></article>
    </div>
  `;
}

function renderResults() {
  const { summary, results, model, orientation, adequacy } = state.analysis;
  const diagnostics = window.ATHDea?.diagnoseAnalysis
    ? window.ATHDea.diagnoseAnalysis(state.analysis)
    : [];
  $('#summaryCards').innerHTML = [
    ['DMUs compared', summary.dmuCount],
    ['Efficient units', summary.efficientCount],
    ['Average efficiency', formatPercent(summary.averageEfficiency)],
    ['Lowest efficiency', formatPercent(summary.lowestEfficiency)]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');

  const reviewUnits = results.filter((result) => !result.efficient).sort((a, b) => a.efficiency - b.efficiency);
  const modelName = model === 'bcc' ? 'BCC / variable returns to scale' : 'CCR / constant returns to scale';
  const orientationText = orientation === 'input' ? 'input reduction' : 'output expansion';
  const priority = reviewUnits[0];
  $('#interpretationPanel').innerHTML = `
    <h3>What This Analysis Means</h3>
    <p><strong>${summary.efficientCount} of ${summary.dmuCount} units</strong> form or lie on the observed frontier under the ${modelName} assumption.</p>
    <p>The average relative efficiency is <strong>${formatPercent(summary.averageEfficiency)}</strong>. Scores reflect ${orientationText}; they are relative to this sample and these measures.</p>
    ${priority ? `<p><strong>Priority review:</strong> ${escapeHtml(priority.name)} has the lowest score at ${formatPercent(priority.efficiency)}. Review its peer benchmark and projected targets before diagnosing operational causes.</p>` : '<p>Every unit is efficient under the selected model. Review whether the sample is large enough and whether too many measures are making the model weakly discriminating.</p>'}
    ${adequacy.meetsHeuristic ? '' : `<p><strong>Sample caution:</strong> ${adequacy.dmuCount} DMUs are below the common ${adequacy.recommendedMinimum}-unit discrimination heuristic for this measure set. Interpret the number of efficient units cautiously.</p>`}
    <p><strong>Management use:</strong> Treat frontier scores as a screening signal. Validate comparability, data definitions, operating constraints, and peer practices before assigning targets or accountability.</p>
  `;
  renderExecutiveBenchmarkPanel();
  window.ATHDiagnostics?.render('#resultDiagnostics', diagnostics, {
    heading: 'DEA Diagnostics',
  });

  $('#rankingTable').innerHTML = `<thead><tr><th>Rank</th><th>DMU</th><th>Efficiency</th><th>Status</th><th>Benchmark peers</th></tr></thead><tbody>${results.slice().sort((a,b) => a.rank-b.rank).map((result) => `
    <tr><td>${result.rank}</td><td><strong>${escapeHtml(result.name)}</strong></td><td>${formatPercent(result.efficiency)}</td><td><span class="status-pill${result.efficient ? '' : ' review'}">${result.efficient ? 'Efficient frontier' : 'Improvement opportunity'}</span></td><td>${escapeHtml(result.peers.map((peer) => peer.name).join(', ') || 'None')}</td></tr>
  `).join('')}</tbody>`;

  $('#efficiencyChart').innerHTML = results.slice().sort((a,b) => b.efficiency-a.efficiency).map((result) => `
    <div class="efficiency-row${result.efficient ? ' efficient' : ''}"><strong title="${escapeHtml(result.name)}">${escapeHtml(result.name)}</strong><span class="efficiency-track"><i style="--score:${Math.max(1, result.efficiency * 100)}%"></i></span><span class="efficiency-value">${formatPercent(result.efficiency)}</span></div>
  `).join('');
  $('#chartSummary').textContent = `${summary.efficientCount} units score 100% under the selected model. The chart presents relative radial efficiency and does not rank service quality beyond the outputs supplied.`;

  $('#actionSummaryTable').innerHTML = `<thead><tr><th>DMU</th><th>Efficiency</th><th>Management priority</th><th>Peer reference</th><th>Suggested action</th></tr></thead><tbody>${results.slice().sort((a,b) => a.rank-b.rank).map((result) => {
    const guidance = getDmuAction(result);
    const peers = result.peers.map((peer) => peer.name).filter((name) => name !== result.name).join(', ') || (result.efficient ? 'Self / frontier unit' : 'Calculated reference set');
    return `<tr><td><strong>${escapeHtml(result.name)}</strong></td><td>${formatPercent(result.efficiency)}</td><td>${escapeHtml(guidance.priority)}</td><td>${escapeHtml(peers)}</td><td>${escapeHtml(guidance.action)}</td></tr>`;
  }).join('')}</tbody>`;

  $('#selectedDmu').innerHTML = results.slice().sort((a,b) => a.rank-b.rank).map((result) => `<option value="${escapeHtml(result.name)}">${escapeHtml(result.name)} - ${formatPercent(result.efficiency)}</option>`).join('');
  renderSelectedDmu();
}

function analyseAssumptionScenarios() {
  const config = {
    inputNames: state.analysis.inputNames,
    outputNames: state.analysis.outputNames,
    dmus: state.analysis.dmus
  };
  state.scenarioAnalyses = {
    ccrInput: window.ATHDea.analyseDea({ ...config, model: 'ccr', orientation: 'input' }),
    ccrOutput: window.ATHDea.analyseDea({ ...config, model: 'ccr', orientation: 'output' }),
    bccInput: window.ATHDea.analyseDea({ ...config, model: 'bcc', orientation: 'input' }),
    bccOutput: window.ATHDea.analyseDea({ ...config, model: 'bcc', orientation: 'output' })
  };
}

function resultByName(analysis, name) {
  return analysis.results.find((result) => result.name === name);
}

function renderAssumptionScenarios() {
  if (!state.analysis) return;
  if (!state.scenarioAnalyses) analyseAssumptionScenarios();
  const orientation = state.analysis.orientation;
  const model = state.analysis.model;
  const ccr = state.scenarioAnalyses[orientation === 'input' ? 'ccrInput' : 'ccrOutput'];
  const bcc = state.scenarioAnalyses[orientation === 'input' ? 'bccInput' : 'bccOutput'];
  const input = state.scenarioAnalyses[model === 'ccr' ? 'ccrInput' : 'bccInput'];
  const output = state.scenarioAnalyses[model === 'ccr' ? 'ccrOutput' : 'bccOutput'];
  const names = state.analysis.dmus.map((dmu) => dmu.name);
  const modelRows = names.map((name) => {
    const ccrResult = resultByName(ccr, name);
    const bccResult = resultByName(bcc, name);
    const gap = Math.max(0, bccResult.efficiency - ccrResult.efficiency);
    const scaleEfficiency = window.ATHDea.calculateScaleEfficiency(ccrResult.efficiency, bccResult.efficiency);
    return { name, ccr: ccrResult.efficiency, bcc: bccResult.efficiency, gap, scaleEfficiency };
  });
  const orientationRows = names.map((name) => {
    const inputResult = resultByName(input, name);
    const outputResult = resultByName(output, name);
    return { name, input: inputResult.efficiency, output: outputResult.efficiency, gap: Math.abs(inputResult.efficiency - outputResult.efficiency) };
  });
  const scaleSensitive = modelRows.filter((row) => row.scaleEfficiency < .98);
  const orientationSensitive = orientationRows.filter((row) => row.gap > .02);

  $('#modelComparisonSummary').textContent = `Uses the baseline ${orientation}-orientation and changes only the returns-to-scale assumption.`;
  $('#modelComparisonTable').innerHTML = `<thead><tr><th>DMU</th><th>CCR efficiency</th><th>BCC efficiency</th><th>Scale efficiency</th><th>Interpretation signal</th></tr></thead><tbody>${modelRows.map((row) => `<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${formatPercent(row.ccr)}</td><td>${formatPercent(row.bcc)}</td><td><strong>${formatPercent(row.scaleEfficiency)}</strong></td><td>${row.scaleEfficiency < .98 ? 'Review operating scale' : 'Limited scale inefficiency'}</td></tr>`).join('')}</tbody>`;

  $('#orientationComparisonSummary').textContent = `Uses the baseline ${model.toUpperCase()} model and changes only the improvement direction.`;
  $('#orientationComparisonTable').innerHTML = `<thead><tr><th>DMU</th><th>Input-oriented</th><th>Output-oriented</th><th>Absolute difference</th><th>Interpretation signal</th></tr></thead><tbody>${orientationRows.map((row) => `<tr><td><strong>${escapeHtml(row.name)}</strong></td><td>${formatPercent(row.input)}</td><td>${formatPercent(row.output)}</td><td>${formatPercent(row.gap)}</td><td>${row.gap > .02 ? 'Result depends on management focus' : 'Limited orientation sensitivity'}</td></tr>`).join('')}</tbody>`;

  $('#scenarioInterpretation').innerHTML = `
    <h3>Assumption Sensitivity</h3>
    <p><strong>${scaleSensitive.length} of ${names.length} DMUs</strong> have scale efficiency below 98%. ${scaleSensitive.length ? `Review whether operating size contributes to the gap for ${escapeHtml(scaleSensitive.map((row) => row.name).join(', '))}.` : 'Scale inefficiency appears limited under this diagnostic threshold.'}</p>
    <p><strong>${orientationSensitive.length} of ${names.length} DMUs</strong> change by more than 2 percentage points between input and output orientation. ${orientationSensitive.length ? `Clarify whether management can primarily control resources or outcomes for ${escapeHtml(orientationSensitive.map((row) => row.name).join(', '))}.` : 'The improvement direction has limited effect on the observed scores.'}</p>
    <p>Scenario comparisons test modelling assumptions only. They do not prove which specification is correct, and they do not overwrite the baseline ranking, peers, targets, or export above.</p>
  `;
}

function resetAssumptionScenario() {
  const toggle = $('#assumptionScenarioToggle');
  const panel = $('#assumptionScenarioPanel');
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-pressed', 'false');
  panel.classList.add('hidden');
  $('#scenario-analysis').classList.add('hidden');
  $('#scenarioNavLink').hidden = true;
}

function toggleAssumptionScenario() {
  if (!state.analysis) return;
  const toggle = $('#assumptionScenarioToggle');
  const panel = $('#assumptionScenarioPanel');
  const nextState = toggle.getAttribute('aria-pressed') !== 'true';
  toggle.setAttribute('aria-pressed', String(nextState));
  panel.classList.toggle('hidden', !nextState);
  $('#scenario-analysis').classList.toggle('hidden', !nextState);
  $('#scenarioNavLink').hidden = !nextState;
  if (nextState) renderAssumptionScenarios();
}

function renderSelectedDmu() {
  if (!state.analysis) return;
  const selected = state.analysis.results.find((result) => result.name === $('#selectedDmu').value) || state.analysis.results[0];
  const source = state.analysis.dmus.find((dmu) => dmu.name === selected.name);
  const peers = selected.peers.map((peer) => `${peer.name} (${peer.lambda.toFixed(3)})`).join(', ');
  const radialMessage = state.analysis.orientation === 'input'
    ? `The radial score suggests up to ${((1 - selected.efficiency) * 100).toFixed(1)}% proportional input reduction before considering slacks.`
    : `The radial model suggests up to ${((1 / selected.efficiency - 1) * 100).toFixed(1)}% proportional output expansion before considering slacks.`;
  $('#peerSummary').innerHTML = `<strong>${escapeHtml(selected.name)}:</strong> ${selected.efficient ? 'This unit lies on the observed frontier.' : radialMessage} <strong>Peer reference:</strong> ${escapeHtml(peers || 'The unit benchmarks against itself under this model.')}`;

  const rows = [
    ...state.analysis.inputNames.map((name, index) => ({ kind: 'Input', name, actual: source.inputs[index], target: selected.inputTargets[index], slack: selected.inputSlacks[index] })),
    ...state.analysis.outputNames.map((name, index) => ({ kind: 'Output', name, actual: source.outputs[index], target: selected.outputTargets[index], slack: selected.outputSlacks[index] }))
  ];
  const largestGap = rows
    .map((row) => ({ ...row, gap: row.kind === 'Input' ? row.actual - row.target : row.target - row.actual }))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
  const peerMix = selected.peers.length
    ? selected.peers.map((peer) => `<li><strong>${escapeHtml(peer.name)}</strong><span>&lambda; ${formatNumber(peer.lambda, 4)}</span></li>`).join('')
    : '<li><strong>No peer mix returned</strong><span>Review data/model</span></li>';
  $('#peerProfilePanel').innerHTML = `
    <article>
      <span>Peer mix</span>
      <ul>${peerMix}</ul>
    </article>
    <article>
      <span>Benchmark signal</span>
      <strong>${escapeHtml(largestGap ? largestGap.name : 'No gap')}</strong>
      <p>${largestGap && Math.abs(largestGap.gap) > 1e-6 ? `${largestGap.kind === 'Input' ? 'Largest potential input reduction' : 'Largest output target gap'}: ${formatNumber(Math.abs(largestGap.gap))}.` : 'No material target gap is identified for the selected unit.'}</p>
    </article>
    <article>
      <span>Management reading</span>
      <p>${escapeHtml(getDmuAction(selected).action)}</p>
    </article>
  `;
  $('#targetTable').innerHTML = `<thead><tr><th>Type</th><th>Measure</th><th>Actual</th><th>Peer-based target</th><th>Change</th><th>Slack</th></tr></thead><tbody>${rows.map((row) => {
    const change = row.actual > 0 ? (row.target - row.actual) / row.actual : 0;
    const className = Math.abs(change) < 1e-8 ? '' : change > 0 ? 'positive-change' : 'negative-change';
    return `<tr><td>${row.kind}</td><td><strong>${escapeHtml(row.name)}</strong></td><td>${formatNumber(row.actual)}</td><td>${formatNumber(row.target)}</td><td class="${className}">${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%</td><td>${formatNumber(row.slack)}</td></tr>`;
  }).join('')}</tbody>`;
  renderLinearProgrammingFormulation(selected, source);
}

function renderLinearProgrammingFormulation(selected, evaluated) {
  const { dmus, inputNames, outputNames, model, orientation } = state.analysis;
  const lambdaExpression = (values) => values
    .map((value, index) => `${formatNumber(value, 4)}&lambda;<sub>${index + 1}</sub>`)
    .join(' + ');
  const inputConstraints = inputNames.map((name, index) => {
    const rightSide = orientation === 'input'
      ? `${formatNumber(evaluated.inputs[index], 4)}&theta;`
      : formatNumber(evaluated.inputs[index], 4);
    return `<li><span>Input: ${escapeHtml(name)}</span><div class="math-equation">${lambdaExpression(dmus.map((dmu) => dmu.inputs[index]))} &le; ${rightSide}</div></li>`;
  });
  const outputConstraints = outputNames.map((name, index) => {
    const rightSide = orientation === 'output'
      ? `${formatNumber(evaluated.outputs[index], 4)}&phi;`
      : formatNumber(evaluated.outputs[index], 4);
    return `<li><span>Output: ${escapeHtml(name)}</span><div class="math-equation">${lambdaExpression(dmus.map((dmu) => dmu.outputs[index]))} &ge; ${rightSide}</div></li>`;
  });
  const convexityConstraint = model === 'bcc'
    ? `<li><span>BCC convexity</span><div class="math-equation">${dmus.map((_, index) => `&lambda;<sub>${index + 1}</sub>`).join(' + ')} = 1</div></li>`
    : '<li><span>CCR scale assumption</span><div class="math-equation">No convexity constraint; constant returns to scale are assumed.</div></li>';
  const objective = orientation === 'input' ? 'Minimise &theta;' : 'Maximise &phi;';
  const factorLabel = orientation === 'input' ? '&theta;' : '&phi;';
  const efficiencyEquation = orientation === 'input'
    ? `Efficiency = &theta;* = ${formatNumber(selected.radialFactor, 4)} = ${formatPercent(selected.efficiency)}`
    : `Efficiency = 1 / &phi;* = 1 / ${formatNumber(selected.radialFactor, 4)} = ${formatPercent(selected.efficiency)}`;
  const peerWeights = selected.peers.length
    ? selected.peers.map((peer) => `${escapeHtml(peer.name)}: &lambda; = ${formatNumber(peer.lambda, 4)}`).join('; ')
    : 'No non-zero peer weights were returned.';

  $('#lpFormulation').innerHTML = `
    <div class="lp-objective"><span>Objective for ${escapeHtml(evaluated.name)}</span><div class="math-equation">${objective}</div></div>
    <div class="lp-constraints"><h5>Constraints</h5><ul>${[...inputConstraints, ...outputConstraints].join('')}${convexityConstraint}<li><span>Variable bounds</span><div class="math-equation">&lambda;<sub>j</sub> &ge; 0${orientation === 'input' ? ', 0 &le; &theta; &le; 1' : ', &phi; &ge; 1'}</div></li></ul></div>
    <div class="lp-solution"><h5>Optimal solution</h5><p><strong>${factorLabel}* = ${formatNumber(selected.radialFactor, 4)}</strong></p><p class="math-equation">${efficiencyEquation}</p><p><strong>Non-zero peer weights:</strong> ${peerWeights}</p></div>
  `;
}

function csvField(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportResultsCsv() {
  if (!state.analysis) return;
  const generatedAt = new Date().toISOString();
  const diagnostics = window.ATHDea?.diagnoseAnalysis
    ? window.ATHDea.diagnoseAnalysis(state.analysis)
    : [];
  const diagnosticSummary = (window.ATHDiagnostics?.summarize(diagnostics) || []).join(' | ');
  const headers = [
    'Rank', 'DMU', 'Model', 'Orientation', 'Efficiency', 'Radial Factor', 'Efficient', 'Peers',
    'Management Priority', 'Suggested Action', 'DMUs Compared', 'Recommended Minimum DMUs', 'Sample Heuristic Met', 'Diagnostics', 'Generated At',
    ...state.inputNames.flatMap((name) => [`Actual Input: ${name}`, `Target Input: ${name}`, `Input Slack: ${name}`]),
    ...state.outputNames.flatMap((name) => [`Actual Output: ${name}`, `Target Output: ${name}`, `Output Slack: ${name}`])
  ];
  const sourceByName = new Map(state.analysis.dmus.map((dmu) => [dmu.name, dmu]));
  const rows = state.analysis.results.map((result) => {
    const source = sourceByName.get(result.name);
    const guidance = getDmuAction(result);
    return [
      result.rank, result.name, state.analysis.model.toUpperCase(), state.analysis.orientation,
      result.efficiency, result.radialFactor, result.efficient ? 'Yes' : 'No',
      result.peers.map((peer) => `${peer.name} (${peer.lambda.toFixed(4)})`).join('; '),
      guidance.priority, guidance.action,
      state.analysis.adequacy.dmuCount, state.analysis.adequacy.recommendedMinimum,
      state.analysis.adequacy.meetsHeuristic ? 'Yes' : 'No', diagnosticSummary, generatedAt,
      ...state.inputNames.flatMap((_, index) => [source.inputs[index], result.inputTargets[index], result.inputSlacks[index]]),
      ...state.outputNames.flatMap((_, index) => [source.outputs[index], result.outputTargets[index], result.outputSlacks[index]])
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ath-data-envelopment-analysis-results.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function handleMeasureInput(event) {
  const input = event.target.closest('[data-measure-kind]');
  if (!input) return;
  const names = input.dataset.measureKind === 'input' ? state.inputNames : state.outputNames;
  names[Number(input.dataset.measureIndex)] = input.value;
  renderDataTable();
  markResultsStale();
}

function handleDmuInput(event) {
  const input = event.target.closest('[data-dmu-row]');
  if (!input || input.classList.contains('remove-dmu')) return;
  const dmu = state.dmus[Number(input.dataset.dmuRow)];
  if (!dmu) return;
  if (input.dataset.dmuField === 'name') dmu.name = input.value;
  if (input.dataset.dmuField === 'input') dmu.inputs[Number(input.dataset.valueIndex)] = input.value;
  if (input.dataset.dmuField === 'output') dmu.outputs[Number(input.dataset.valueIndex)] = input.value;
  renderSampleAdequacy();
  renderDataQualityPanel();
  updateModelRecommendation();
  markResultsStale();
}

function syncDmusFromTable() {
  document.querySelectorAll('#dmuTable tbody tr').forEach((row) => {
    const nameInput = row.querySelector('[data-dmu-field="name"]');
    if (!nameInput) return;
    const rowIndex = Number(nameInput.dataset.dmuRow);
    const dmu = state.dmus[rowIndex];
    if (!dmu) return;
    dmu.name = nameInput.value;
    row.querySelectorAll('[data-dmu-field="input"]').forEach((input) => {
      dmu.inputs[Number(input.dataset.valueIndex)] = input.value;
    });
    row.querySelectorAll('[data-dmu-field="output"]').forEach((input) => {
      dmu.outputs[Number(input.dataset.valueIndex)] = input.value;
    });
  });
}

function printDecisionReport() {
  if (!state.analysis) return;
  window.print();
}

function initEvents() {
  $('#modelType').addEventListener('change', updateModelExplanation);
  $('#orientation').addEventListener('change', updateModelExplanation);
  $('#templateSelect').addEventListener('change', updateTemplateSelection);
  $('#loadSampleButton').addEventListener('click', loadSelectedTemplate);
  $('#resetButton').addEventListener('click', resetTool);
  $('#addInputButton').addEventListener('click', () => addMeasure('input'));
  $('#addOutputButton').addEventListener('click', () => addMeasure('output'));
  $('#addDmuButton').addEventListener('click', addDmu);
  $('#importCsvButton').addEventListener('click', importCsv);
  $('#continueToModelButton').addEventListener('click', continueToModel);
  $('#analyzeButton').addEventListener('click', runAnalysis);
  $('#exportCsvButton').addEventListener('click', exportResultsCsv);
  $('#printReportButton').addEventListener('click', printDecisionReport);
  $('#assumptionScenarioToggle').addEventListener('click', toggleAssumptionScenario);
  $('#evaluateScenarioButton').addEventListener('click', evaluateResourceScenario);
  document.querySelectorAll('input[name="scenarioMode"]').forEach((input) => input.addEventListener('change', renderScenarioValueFields));
  $('#selectedDmu').addEventListener('change', renderSelectedDmu);
  $('#inputMeasures').addEventListener('input', handleMeasureInput);
  $('#outputMeasures').addEventListener('input', handleMeasureInput);
  document.querySelector('.measure-builder').addEventListener('click', (event) => {
    const button = event.target.closest('.remove-measure');
    if (button) removeMeasure(button.dataset.measureKind, Number(button.dataset.measureIndex));
  });
  $('#dmuTable').addEventListener('input', handleDmuInput);
  $('#dmuTable').addEventListener('click', (event) => {
    const button = event.target.closest('.remove-dmu');
    if (!button) return;
    state.dmus.splice(Number(button.dataset.dmuRow), 1);
    renderDataTable();
    markResultsStale();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  renderEditor();
  updateModelExplanation();
});

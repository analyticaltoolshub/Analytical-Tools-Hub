'use strict';

const state = {
  inputNames: ['Input 1'],
  outputNames: ['Output 1'],
  dmus: [],
  analysis: null,
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
  try {
    state.analysis = window.ATHDea.analyseDea({
      model: $('#modelType').value,
      orientation: $('#orientation').value,
      inputNames: state.inputNames,
      outputNames: state.outputNames,
      dmus: collectDataset()
    });
    renderResults();
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

function renderResults() {
  const { summary, results, model, orientation, adequacy } = state.analysis;
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
  `;

  $('#rankingTable').innerHTML = `<thead><tr><th>Rank</th><th>DMU</th><th>Efficiency</th><th>Status</th><th>Benchmark peers</th></tr></thead><tbody>${results.slice().sort((a,b) => a.rank-b.rank).map((result) => `
    <tr><td>${result.rank}</td><td><strong>${escapeHtml(result.name)}</strong></td><td>${formatPercent(result.efficiency)}</td><td><span class="status-pill${result.efficient ? '' : ' review'}">${result.efficient ? 'Efficient frontier' : 'Improvement opportunity'}</span></td><td>${escapeHtml(result.peers.map((peer) => peer.name).join(', ') || 'None')}</td></tr>
  `).join('')}</tbody>`;

  $('#efficiencyChart').innerHTML = results.slice().sort((a,b) => b.efficiency-a.efficiency).map((result) => `
    <div class="efficiency-row${result.efficient ? ' efficient' : ''}"><strong title="${escapeHtml(result.name)}">${escapeHtml(result.name)}</strong><span class="efficiency-track"><i style="--score:${Math.max(1, result.efficiency * 100)}%"></i></span><span class="efficiency-value">${formatPercent(result.efficiency)}</span></div>
  `).join('');
  $('#chartSummary').textContent = `${summary.efficientCount} units score 100% under the selected model. The chart presents relative radial efficiency and does not rank service quality beyond the outputs supplied.`;

  $('#selectedDmu').innerHTML = results.slice().sort((a,b) => a.rank-b.rank).map((result) => `<option value="${escapeHtml(result.name)}">${escapeHtml(result.name)} - ${formatPercent(result.efficiency)}</option>`).join('');
  renderSelectedDmu();
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
  const headers = [
    'Rank', 'DMU', 'Model', 'Orientation', 'Efficiency', 'Radial Factor', 'Efficient', 'Peers',
    'DMUs Compared', 'Recommended Minimum DMUs', 'Sample Heuristic Met', 'Generated At',
    ...state.inputNames.flatMap((name) => [`Actual Input: ${name}`, `Target Input: ${name}`, `Input Slack: ${name}`]),
    ...state.outputNames.flatMap((name) => [`Actual Output: ${name}`, `Target Output: ${name}`, `Output Slack: ${name}`])
  ];
  const sourceByName = new Map(state.analysis.dmus.map((dmu) => [dmu.name, dmu]));
  const rows = state.analysis.results.map((result) => {
    const source = sourceByName.get(result.name);
    return [
      result.rank, result.name, state.analysis.model.toUpperCase(), state.analysis.orientation,
      result.efficiency, result.radialFactor, result.efficient ? 'Yes' : 'No',
      result.peers.map((peer) => `${peer.name} (${peer.lambda.toFixed(4)})`).join('; '),
      state.analysis.adequacy.dmuCount, state.analysis.adequacy.recommendedMinimum,
      state.analysis.adequacy.meetsHeuristic ? 'Yes' : 'No', generatedAt,
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
  markResultsStale();
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

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id), core = ATHWarehouse;
  const KEY = 'ath.warehouse-layout.v2';
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const uid = () => `layout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const blank = (id = uid(), name = 'New layout') => ({ id, name, width: 32, height: 40, aisle: 2, start: { x: 16, y: 14 }, end: { x: 16, y: 14 }, samePoint: true, locations: [] });
  let project = { type: 'ath-warehouse-layout', version: 2, settings: core.sample().settings, skus: [], layouts: [blank()] };
  let active = project.layouts[0].id, selected = -1, result = null, worker = null, running = false, runToken = 0;
  let animation = 0, animationPoint = null, drag = null, transform = null, selectedPoint = 'location';
  const charts = [];
  let floorKey = '', floorGrid = null;
  const canvas = $('warehouseCanvas'), ctx = canvas.getContext('2d');
  const layoutMap = { layoutName: 'name', warehouseWidth: 'width', warehouseHeight: 'height', aisleWidth: 'aisle' };
  const locationMap = { locationId: 'id', locationX: 'x', locationY: 'y', locationWidth: 'w', locationHeight: 'h', locationSide: 'side' };
  const settingsMap = { orderCount: 'orders', picksPerOrder: 'picks', pickerSpeed: 'speed', pickTime: 'pickTime', randomSeed: 'seed', pickSequenceMode: 'sequenceMode' };
  const current = () => project.layouts.find((l) => l.id === active);
  const number = (v, digits = 1) => Number(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const fieldErrors = new Map();
  function fieldLabel(field) {
    const label = field.getAttribute('aria-label') || field.closest('label')?.textContent.trim() || 'Value';
    const pair = field.closest('.wl-coordinate-pair');
    return pair ? `${pair.querySelector('legend').textContent} ${label}` : label;
  }
  function say(message) { $('status').textContent = message; }
  function error(message = '', field = null, area = 'editor') {
    fieldErrors.forEach(({ node, described }, input) => {
      node.remove(); input.removeAttribute('aria-invalid');
      if (described === null) input.removeAttribute('aria-describedby'); else input.setAttribute('aria-describedby', described);
    });
    fieldErrors.clear();
    const label = field?.isConnected ? fieldLabel(field) : '';
    $('error').textContent = message; $('error').hidden = !message || area === 'simulation' || !!field;
    const summary = $('simulationError'); summary.replaceChildren(); summary.hidden = !message || area !== 'simulation';
    if (message && field?.isConnected) {
      const node = document.createElement('span'); node.className = 'wl-field-error'; node.id = `${field.id}-error`; node.textContent = message;
      const described = field.getAttribute('aria-describedby');
      field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', [described, node.id].filter(Boolean).join(' '));
      field.parentElement.append(node); fieldErrors.set(field, { node, described });
      if (area !== 'simulation') node.setAttribute('role', 'alert');
    }
    if (message && area === 'simulation') {
      summary.append(document.createTextNode(message));
      if (field?.isConnected) {
        const link = document.createElement('a'); link.href = `#${field.id}`; link.textContent = `Go to ${label}`;
        link.addEventListener('click', (event) => { event.preventDefault(); field.scrollIntoView({ block: 'center', behavior: 'instant' }); field.focus({ preventScroll: true }); });
        summary.append(link);
      }
      requestAnimationFrame(() => {
        if (!summary.hidden) window.scrollTo({ top: summary.getBoundingClientRect().top + scrollY - document.querySelector('.tool-topnav').getBoundingClientRect().height - 16, behavior: 'instant' });
      });
    }
  }
  function safe(action, field = null, area = 'editor') { try { error(); action(); } catch (e) { error(e.message, e.field || field, area); } }
  function option(select, value, text) { const node = document.createElement('option'); node.value = value; node.textContent = text; select.append(node); }
  function workflow(step) {
    ['stepEditor', 'stepSimulate', 'stepReview'].forEach((id, i) => { $(id).removeAttribute('aria-current'); $(id).classList.toggle('is-complete', i + 1 < step); if (i + 1 === step) $(id).setAttribute('aria-current', 'step'); });
  }
  function stop() { cancelAnimationFrame(animation); animation = 0; animationPoint = null; $('playButton').textContent = 'Play Route'; draw(); }
  function invalidate() {
    stop();
    result = null;
    charts.splice(0).forEach((chart) => chart.destroy());
    $('resultContent').hidden = true; $('resultEmpty').hidden = false;
    $('resultEmpty').textContent = 'Inputs changed. Run the simulation to calculate current results.';
    $('exportResultsButton').disabled = true;
    $('runStatus').textContent = 'Ready to simulate.';
    $('routeSelect').replaceChildren(); $('routeSelect').disabled = true; $('playButton').disabled = true; $('stopButton').disabled = true;
    $('routeSummary').textContent = 'Run a simulation to inspect the first 20 sampled routes.';
    workflow(1); draw();
  }
  function render() {
    const l = current();
    const checked = new Set([...$('compareChoices').querySelectorAll('input:checked')].map((input) => input.value));
    $('layoutSelect').replaceChildren();
    project.layouts.forEach((item) => option($('layoutSelect'), item.id, item.name));
    $('layoutSelect').value = active;
    Object.entries(layoutMap).forEach(([id, key]) => { $(id).value = l[key]; });
    ['start', 'end'].forEach((point) => ['x', 'y'].forEach((axis) => { $(`${point}${axis.toUpperCase()}`).value = l[point][axis]; }));
    $('samePoint').checked = l.samePoint; $('endXLabel').hidden = l.samePoint; $('endYLabel').hidden = l.samePoint;
    $('endPointFields').hidden = l.samePoint; $('pointGrid').classList.toggle('is-shared', l.samePoint);
    if (l.samePoint && selectedPoint === 'end') selectedPoint = 'start';
    $('pointSelect').value = selectedPoint; $('pointSelect').querySelector('[value="end"]').disabled = l.samePoint;
    Object.entries(settingsMap).forEach(([id, key]) => { $(id).value = project.settings[key]; });
    $('sequenceExplanation').textContent = project.settings.sequenceMode === 'fixed'
      ? 'Fixed pick sequence: required locations are visited alphabetically, A to Z, with bay numbers in numeric order (A2 before A10). The baseline allocates the requested units once, combines picks at each location, and every layout follows the same sorted stops and quantities. Matching location IDs and stock assignments are required.'
      : 'Nearest eligible location: every layout fulfils the same SKU order, choosing its closest location with remaining stock. Location sequences can differ.';
    $('compareChoices').replaceChildren();
    project.layouts.forEach((item) => {
      const label = document.createElement('label'); label.className = 'wl-check';
      const input = document.createElement('input'); input.type = 'checkbox'; input.value = item.id; input.checked = !checked.size || checked.has(item.id);
      label.append(input, document.createTextNode(item.name)); $('compareChoices').append(label);
    });
    $('removeLayoutButton').disabled = project.layouts.length < 2;
    renderLocation(); renderDemand(); renderRoute(); draw();
  }
  function renderLocation() {
    const racks = current().locations;
    selected = Math.min(Math.max(selected, 0), racks.length - 1);
    $('locationSelect').replaceChildren();
    racks.forEach((r, i) => option($('locationSelect'), String(i), r.id));
    if (!racks.length) option($('locationSelect'), '', 'No location selected');
    else $('locationSelect').value = String(selected);
    $('locationFields').disabled = selected < 0; $('removeLocationButton').disabled = selected < 0;
    Object.entries(locationMap).forEach(([id, key]) => { $(id).value = racks[selected]?.[key] ?? ''; });
    $('assignments').replaceChildren(); $('addAssignmentButton').disabled = selected < 0 || !project.skus.length;
    (racks[selected]?.assignments || []).forEach((assignment, i) => {
      const row = document.createElement('div'); row.className = 'wl-assignment';
      const label = document.createElement('label'); label.textContent = 'SKU'; const select = document.createElement('select'); select.id = `assignmentSku-${i}`;
      project.skus.forEach((r) => option(select, r.sku, r.sku)); select.value = assignment.sku; label.append(select);
      const quantityLabel = document.createElement('label'); quantityLabel.textContent = 'Available units'; const quantity = document.createElement('input'); quantity.id = `assignmentQuantity-${i}`; quantity.dataset.integer = 'true'; quantity.type = 'number'; quantity.min = '0'; quantity.max = '1000000000'; quantity.value = assignment.quantity; quantityLabel.append(quantity);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'reset'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${assignment.sku} from location ${racks[selected].id}`);
      const commit = (event) => safe(() => commitLayout((l) => { l.locations[selected].assignments[i] = { sku: select.value, quantity: quantity.value }; }, false), event.currentTarget);
      select.addEventListener('change', commit); quantity.addEventListener('change', commit); quantity.addEventListener('input', invalidate);
      remove.addEventListener('click', () => safe(() => commitLayout((l) => l.locations[selected].assignments.splice(i, 1))));
      row.append(label, quantityLabel, remove); $('assignments').append(row);
    });
  }
  function renderDemand() {
    const scrollTop = $('demandScroll').scrollTop;
    const body = $('demandTable').querySelector('tbody'); body.replaceChildren();
    const total = project.skus.reduce((sum, r) => sum + Number(r.weight), 0);
    project.skus.forEach((sku, i) => {
      const tr = document.createElement('tr');
      const skuInput = document.createElement('input'); skuInput.id = `demandSku-${i}`; skuInput.value = sku.sku; skuInput.maxLength = 80; skuInput.setAttribute('aria-label', `SKU name ${i + 1}`);
      const weight = document.createElement('input'); weight.id = `demandWeight-${i}`; weight.type = 'number'; weight.min = '0'; weight.max = '1000000'; weight.step = 'any'; weight.value = sku.weight; weight.setAttribute('aria-label', `Frequency weight for ${sku.sku}`);
      const commit = (event) => safe(() => {
        const candidate = clone(project), old = candidate.skus[i].sku;
        candidate.skus[i] = { sku: skuInput.value, weight: weight.value };
        candidate.layouts.forEach((l) => l.locations.forEach((loc) => loc.assignments.forEach((a) => { if (a.sku === old) a.sku = skuInput.value; })));
        project = core.project(candidate); invalidate();
        skuInput.value = project.skus[i].sku;
        updateDemandProbabilities();
        if (old !== project.skus[i].sku) renderLocation();
      }, event.currentTarget);
      skuInput.addEventListener('change', commit); weight.addEventListener('change', commit);
      skuInput.addEventListener('input', invalidate); weight.addEventListener('input', invalidate);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'reset'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove SKU ${sku.sku}`);
      remove.addEventListener('click', () => safe(() => {
        const currentSku = project.skus[i].sku;
        if (project.layouts.some((l) => l.locations.some((loc) => loc.assignments.some((a) => a.sku === currentSku)))) throw new Error(`Remove ${currentSku} from its location assignments before removing its demand record.`);
        project.skus.splice(i, 1); invalidate(); render();
      }));
      [skuInput, weight, `${number(total ? 100 * sku.weight / total : 0, 2)}%`, remove].forEach((value) => { const td = document.createElement('td'); if (typeof value === 'string') td.textContent = value; else td.append(value); tr.append(td); });
      body.append(tr);
    });
    $('demandScroll').scrollTop = scrollTop;
  }
  function updateDemandProbabilities() {
    const total = project.skus.reduce((sum, r) => sum + r.weight, 0);
    [...$('demandTable').querySelectorAll('tbody tr')].forEach((row, i) => {
      const sku = project.skus[i]; row.cells[2].textContent = `${number(total ? 100 * sku.weight / total : 0, 2)}%`;
      row.querySelector('input[type="number"]').setAttribute('aria-label', `Frequency weight for ${sku.sku}`);
      row.querySelector('button').setAttribute('aria-label', `Remove SKU ${sku.sku}`);
    });
  }
  function commitLayout(change, refresh = true) {
    const candidate = clone(current()); change(candidate);
    const valid = core.layout(candidate);
    project.layouts[project.layouts.findIndex((l) => l.id === active)] = valid;
    invalidate(); if (refresh) render();
  }
  Object.entries(layoutMap).forEach(([id, key]) => $(id).addEventListener('change', () => safe(() => commitLayout((l) => { l[key] = $(id).value; }), $(id))));
  ['start', 'end'].forEach((point) => {
    ['x', 'y'].forEach((axis) => {
      $(`${point}${axis.toUpperCase()}`).addEventListener('change', () => safe(() => commitLayout((l) => { l[point][axis] = $(`${point}${axis.toUpperCase()}`).value; }), $(`${point}${axis.toUpperCase()}`)));
    });
  });
  $('samePoint').addEventListener('change', () => safe(() => commitLayout((l) => { l.samePoint = $('samePoint').checked; })));
  $('pointSelect').addEventListener('change', () => { selectedPoint = $('pointSelect').value; draw(); });
  Object.entries(locationMap).forEach(([id, key]) => $(id).addEventListener('change', () => safe(() => commitLayout((l) => { if (l.locations[selected]) l.locations[selected][key] = $(id).value; }), $(id))));
  Object.keys(settingsMap).forEach((id) => $(id).addEventListener('input', () => {
    project.settings[settingsMap[id]] = $(id).value; invalidate();
    if (id === 'pickSequenceMode') render();
  }));
  // Uncommitted invalid geometry must never leave a previous result looking current.
  [...Object.keys(layoutMap), ...Object.keys(locationMap), 'startX', 'startY', 'endX', 'endY'].forEach((id) => $(id).addEventListener('input', invalidate));
  function validateVisibleInputs() {
    const integers = new Set(['warehouseWidth','warehouseHeight','aisleWidth','startX','startY','endX','endY','locationX','locationY','locationWidth','locationHeight','orderCount','picksPerOrder','randomSeed']);
    document.querySelectorAll('#editor input, #simulation input').forEach((input) => {
      if (input.matches(':disabled') || input.closest('[hidden]') || !['text','number'].includes(input.type)) return;
      try {
        const label = fieldLabel(input);
        if (input.type === 'number') {
          const value = ATHData.number(input.value, label, input.min === '' ? -Infinity : Number(input.min));
          if (input.max !== '' && value > Number(input.max)) throw new Error(`${label} must be at most ${input.max}.`);
          if ((integers.has(input.id) || input.dataset.integer) && !Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
        } else if (!input.value.trim()) throw new Error(`${label} is required.`);
      } catch (e) { e.field = input; throw e; }
    });
  }
  function collectFields() {
    validateVisibleInputs();
    const candidate = clone(current());
    Object.entries(layoutMap).forEach(([id, key]) => { candidate[key] = $(id).value; });
    candidate.start = { x: $('startX').value, y: $('startY').value }; candidate.samePoint = $('samePoint').checked;
    candidate.end = candidate.samePoint ? { ...candidate.start } : { x: $('endX').value, y: $('endY').value };
    if (candidate.locations[selected]) {
      Object.entries(locationMap).forEach(([id, key]) => { candidate.locations[selected][key] = $(id).value; });
      candidate.locations[selected].assignments = [...$('assignments').querySelectorAll('.wl-assignment')].map((row) => ({ sku: row.querySelector('select').value, quantity: row.querySelector('input').value }));
    }
    const valid = core.layout(candidate);
    const next = clone(project);
    next.layouts[next.layouts.findIndex((l) => l.id === active)] = valid;
    next.skus = [...$('demandTable').querySelectorAll('tbody tr')].map((row) => { const inputs = row.querySelectorAll('input'); return { sku: inputs[0].value, weight: inputs[1].value }; });
    next.skus.forEach((sku, i) => { const old = project.skus[i].sku; if (old !== sku.sku) next.layouts.forEach((l) => l.locations.forEach((loc) => loc.assignments.forEach((a) => { if (a.sku === old) a.sku = sku.sku; }))); });
    Object.entries(settingsMap).forEach(([id, key]) => { next.settings[key] = $(id).value; });
    project = core.project(next);
  }
  $('layoutSelect').addEventListener('change', () => { stop(); active = $('layoutSelect').value; selected = -1; render(); });
  $('locationSelect').addEventListener('change', () => { selected = Number($('locationSelect').value); selectedPoint = 'location'; $('pointSelect').value = 'location'; renderLocation(); draw(); });
  $('addAssignmentButton').addEventListener('click', () => safe(() => commitLayout((l) => {
    const loc = l.locations[selected]; const sku = project.skus.find((r) => !loc.assignments.some((a) => a.sku === r.sku));
    if (!sku) throw new Error('All catalogue SKUs are already assigned to this location.');
    loc.assignments.push({ sku: sku.sku, quantity: 30 });
  })));
  $('addSkuButton').addEventListener('click', () => safe(() => { collectFields(); if (project.skus.length >= 30) throw new Error('Maximum thirty demand SKUs.'); let i = 1; while (project.skus.some((r) => r.sku === `SKU-${i}`)) i++; project.skus.push({ sku: `SKU-${i}`, weight: 1 }); invalidate(); render(); $('demandScroll').scrollTop = $('demandScroll').scrollHeight; }));
  $('importDemandButton').addEventListener('click', async () => {
    const file = $('demandFile').files[0];
    try {
      error();
      if (!file || !/\.csv$/i.test(file.name) || file.size > 1024 * 1024) throw new Error('Choose a demand CSV file up to 1 MB.');
      const incoming = core.demandCsv(await file.text());
      if (running) throw new Error('Finish or cancel the simulation before importing demand.');
      collectFields();
      const candidate = clone(project);
      const indices = new Map(candidate.skus.map((r, i) => [r.sku, i]));
      incoming.forEach((sku) => { if (indices.has(sku.sku)) candidate.skus[indices.get(sku.sku)] = sku; else candidate.skus.push(sku); });
      const validated = core.project(candidate);
      project = validated; invalidate(); render();
      $('demandImportStatus').textContent = `${incoming.length} demand records imported. Existing location assignments are retained.`;
      $('demandFile').value = '';
    } catch (e) {
      error(`${e.message} No demand records from this file were applied.`);
      $('demandImportStatus').textContent = 'Import failed. Correct the file and retry.';
    }
  });
  $('demandTemplateButton').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([ATHData.csv([['SKU', 'FrequencyWeight'], ['SKU-A1', 40], ['SKU-A2', 10]])], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ath-sku-demand-template.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('newLayoutButton').addEventListener('click', () => safe(() => {
    collectFields(); if (project.layouts.length >= 6) throw new Error('Maximum six layouts per project.');
    const l = blank(uid(), `Layout ${project.layouts.length + 1}`); project.layouts.push(l); active = l.id; selected = -1; invalidate(); render();
  }));
  $('duplicateLayoutButton').addEventListener('click', () => safe(() => {
    collectFields(); if (project.layouts.length >= 6) throw new Error('Maximum six layouts per project.');
    const l = clone(current()); l.id = uid(); l.name = `${l.name.slice(0, 65)} copy`; project.layouts.push(l); active = l.id;
    invalidate(); $('compareChoices').replaceChildren(); render(); say('Layout duplicated. Keep SKU names and weights unchanged to compare geometry fairly.');
  }));
  $('removeLayoutButton').addEventListener('click', () => { if (project.layouts.length > 1 && confirm('Delete this layout from the current project?')) { project.layouts = project.layouts.filter((l) => l.id !== active); active = project.layouts[0].id; invalidate(); render(); } });
  $('addLocationButton').addEventListener('click', () => safe(() => {
    collectFields(); const l = current(); if (l.locations.length >= 30) throw new Error('Maximum thirty locations per layout.');
    let n = 1; while (l.locations.some((r) => r.id === `LOC-${n}`)) n++;
    const rack = { id: `LOC-${n}`, x: 0, y: 0, w: 2, h: 3, assignments: [], side: 'N' };
    let found = null;
    for (let y = l.aisle + 2; y + rack.h <= l.height - l.aisle && !found; y++) {
      for (let x = l.aisle + 2; x + rack.w <= l.width - l.aisle; x++) {
        const candidate = clone(l); candidate.locations.push({ ...rack, x, y });
        try { core.prepare(candidate); found = candidate; break; } catch (_) { /* Try the next free pick face. */ }
      }
    }
    if (!found) throw new Error('No accessible space for a new 2 x 3 m rack. Adjust existing racks or warehouse dimensions.');
    project.layouts[project.layouts.findIndex((item) => item.id === active)] = found;
    selected = found.locations.length - 1; invalidate(); render();
  }));
  $('removeLocationButton').addEventListener('click', () => safe(() => commitLayout((l) => l.locations.splice(selected, 1))));
  function replace(raw) { const validated = core.project(raw); project = validated; active = project.layouts[0].id; selected = -1; invalidate(); $('compareChoices').replaceChildren(); $('demandFile').value = ''; $('demandImportStatus').textContent = ''; render(); error(); }
  $('loadSampleButton').addEventListener('click', () => { if (!project.layouts.some((l) => l.locations.length) || confirm('Replace the current project with the sample?')) { replace(core.sample()); say('Two aisle layouts loaded: 30 locations A1-F5, matching SKU assignments, shared induction, and fixed sequences. Dimensions and demand are synthetic.'); } });
  $('resetButton').addEventListener('click', () => { if (confirm('Clear the current project? Your explicitly saved browser copy will be retained.')) { replace({ ...core.sample(), skus: [], layouts: [blank()] }); say('Project reset.'); } });
  $('saveButton').addEventListener('click', () => safe(() => { collectFields(); localStorage.setItem(KEY, JSON.stringify(project)); say('Saved in this browser. Export JSON for a portable backup.'); }));
  $('restoreButton').addEventListener('click', () => safe(() => {
    const text = localStorage.getItem(KEY) || localStorage.getItem('ath.warehouse-layout.v1'); if (!text) throw new Error('No saved warehouse project exists in this browser.');
    const validated = core.project(JSON.parse(text));
    if (!project.layouts.some((l) => l.locations.length) || confirm('Replace the current project with the saved copy?')) { replace(validated); say('Saved project loaded.'); }
  }));
  function download(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('exportProjectButton').addEventListener('click', () => safe(() => { collectFields(); download(project, 'ath-warehouse-project.json'); }));
  $('exportResultsButton').addEventListener('click', () => { if (result) download(result, 'ath-warehouse-results.json'); });
  $('importFile').addEventListener('change', async () => {
    const file = $('importFile').files[0]; if (!file) return;
    try {
      if (!/\.json$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw new Error('Choose a JSON project file smaller than 2 MB.');
      const validated = core.project(JSON.parse(await file.text()));
      if (!project.layouts.some((l) => l.locations.length) || confirm('Replace the current project with this imported project?')) { replace(validated); say('Project imported. No data was uploaded.'); }
    } catch (e) { error(`${e.message} Existing layouts are unchanged.`); }
    $('importFile').value = '';
  });
  function setRunning(value) {
    running = value;
    $('editor').querySelectorAll('button, input, select, fieldset').forEach((el) => { el.disabled = value; });
    $('simulationFields').disabled = value; $('compareLayouts').disabled = value;
    $('pickSequenceMode').disabled = value;
    $('runButton').disabled = value; $('cancelButton').disabled = !value;
    if (!value) render();
  }
  function finish(value) {
    worker?.terminate(); worker = null; result = ATHData.snapshot(value);
    setRunning(false); $('runProgress').value = 1;
    $('runStatus').textContent = `${number(value.project.settings.orders, 0)} orders simulated in each of ${value.results.length} layout(s). ${value.project.settings.sequenceMode === 'fixed' ? 'Fixed pick sequence' : 'Nearest eligible location'}. Seed ${value.project.settings.seed}.`;
    workflow(3); renderResults(); renderRoute(); draw();
  }
  function failed(message) { worker?.terminate(); worker = null; setRunning(false); $('runStatus').textContent = 'Simulation failed. Correct the issue and rerun.'; error(message, null, 'simulation'); }
  function fallback(input, token) {
    const iterator = core.simulateSteps(input);
    const nextBatch = () => {
      if (!running || token !== runToken) return;
      try { const next = iterator.next(); if (next.done) finish(next.value); else { $('runProgress').value = next.value; setTimeout(nextBatch, 0); } } catch (e) { failed(e.message); }
    };
    $('runStatus').textContent = 'Simulating in local batches. Cancel remains available.'; setTimeout(nextBatch, 0);
  }
  $('runButton').addEventListener('click', () => safe(() => {
    collectFields();
    const ids = new Set([...$('compareChoices').querySelectorAll('input:checked')].map((input) => input.value));
    const input = core.project({ ...project, layouts: project.layouts.filter((l) => ids.has(l.id)) });
    invalidate(); error(); setRunning(true); workflow(2); $('runProgress').value = 0;
    $('runStatus').textContent = 'Preparing aisle routes and simulating orders...'; const token = ++runToken;
    if (location.protocol === 'file:' || typeof Worker === 'undefined') { fallback(input, token); return; }
    try {
      worker = new Worker('warehouse-worker.js');
      worker.onmessage = ({ data }) => { if (token !== runToken) return; if (data.type === 'progress') $('runProgress').value = data.value; else if (data.type === 'result') finish(data.result); else failed(data.message); };
      worker.onerror = (event) => { event.preventDefault(); worker?.terminate(); worker = null; fallback(input, token); };
      worker.postMessage(input);
    } catch (_) { worker?.terminate(); worker = null; fallback(input, token); }
  }, null, 'simulation'));
  $('cancelButton').addEventListener('click', () => { ++runToken; worker?.terminate(); worker = null; setRunning(false); $('runStatus').textContent = 'Cancelled. No partial results are presented.'; workflow(1); });
  function row(table, values) { const tr = document.createElement('tr'); values.forEach((value) => { const td = document.createElement('td'); td.textContent = value; tr.append(td); }); table.append(tr); }
  function chart(id, type, labels, datasets, yTitle, stacked = false) {
    charts.push(new Chart($(id), { type, data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: datasets.length > 1 } }, scales: { x: { stacked, ticks: { maxRotation: 45 } }, y: { stacked, beginAtZero: true, title: { display: true, text: yTitle } } } } }));
  }
  function renderResults() {
    if (!result) return;
    const rs = result.results, baseline = rs[0], best = rs.reduce((a, b) => a.total.mean <= b.total.mean ? a : b);
    $('resultContent').hidden = false; $('resultEmpty').hidden = true; $('exportResultsButton').disabled = false;
    $('interpretation').textContent = rs.length === 1
      ? `${baseline.name}: ${number(baseline.distance.mean)} m and ${number(baseline.total.mean)} seconds per order on average. Duplicate this layout and change rack positions to compare alternatives.`
      : `${best.name} has the lowest simulated mean total time (${number(best.total.mean)} s/order): ${number(best.timeImprovement ?? 0, 2)}% lower than ${baseline.name}. Both travel and time comparisons use the same orders. Repeat with other seeds and measured walking/picking times before choosing a layout.`;
    $('kpis').replaceChildren();
    [['Best mean distance', `${number(best.distance.mean)} m`], ['Mean travel time', `${number(best.travel.mean)} s`], ['Mean total time', `${number(best.total.mean)} s`], ['Orders per layout', number(result.project.settings.orders, 0)]].forEach(([label, value]) => {
      const article = document.createElement('article'), span = document.createElement('span'), strong = document.createElement('strong'); span.textContent = label; strong.textContent = value; article.append(span, strong); $('kpis').append(article);
    });
    const body = $('comparisonTable').querySelector('tbody'); body.replaceChildren();
    rs.forEach((r) => row(body, [r.name, number(r.distance.mean), `${number(r.distance.min)} / ${number(r.distance.max)}`, number(r.travel.mean), `${number(r.travel.min)} / ${number(r.travel.max)}`, number(r.total.mean), `${number(r.total.min)} / ${number(r.total.max)}`, r.distanceImprovement === null ? 'N/A (zero baseline)' : `${number(r.distanceImprovement, 2)}%`, r.timeImprovement === null ? 'N/A (zero baseline)' : `${number(r.timeImprovement, 2)}%`]));
    const diagnostics = rs.flatMap((r) => r.diagnostics.map((d) => ({ ...d, title: `${r.name}: ${d.title}` })));
    ATHDiagnostics.render($('resultDiagnostics'), diagnostics, { heading: 'Simulation Diagnostics' });
    const fbody = $('frequencyTable').querySelector('tbody'); fbody.replaceChildren(); rs.forEach((r) => r.locationFrequency.forEach((f) => row(fbody, [r.name, f.location, f.picks, f.visits])));
    $('frequencyExplanation').textContent = result.project.settings.sequenceMode === 'fixed'
      ? 'This chart highlights frequently requested locations. Fixed sequences give matching locations identical order-visit counts across layouts; distance and time show the layout effect. Expand the table for exact counts.'
      : 'This chart highlights frequently used locations and differences in allocation between layouts. High visit counts identify locations worth reviewing for access and congestion, although congestion is not simulated. Expand the table for exact counts.';
    charts.splice(0).forEach((c) => c.destroy());
    if (typeof Chart === 'undefined') { error('Charts could not load. Numerical results and exports remain available.'); return; }
    chart('distanceChart', 'bar', rs.map((r) => r.name), [{ label: 'Distance', data: rs.map((r) => r.distance.mean), backgroundColor: '#1f6feb' }], 'Metres / order');
    chart('timeChart', 'bar', rs.map((r) => r.name), [{ label: 'Travel', data: rs.map((r) => r.travel.mean), backgroundColor: '#1f6feb' }, { label: 'Picking', data: rs.map((r) => r.total.mean - r.travel.mean), backgroundColor: '#0f766e' }], 'Seconds / order', true);
    const ids = [...new Set(rs.flatMap((r) => r.locationFrequency.map((f) => f.location)))].sort();
    const colours = ['#1f6feb', '#0f766e', '#d97706', '#db2777', '#475467', '#7c3aed'];
    chart('frequencyChart', 'bar', ids, rs.map((r, i) => ({ label: r.name, data: ids.map((id) => r.locationFrequency.find((f) => f.location === id)?.visits || 0), backgroundColor: colours[i] })), 'Orders visiting location');
  }
  function currentResult() { return result?.results.find((r) => r.id === active); }
  function example() { return currentResult()?.examples[Number($('routeSelect').value) || 0]; }
  function renderRoute() {
    const r = currentResult(), old = $('routeSelect').value;
    $('routeSelect').replaceChildren();
    if (r) r.examples.forEach((e, i) => option($('routeSelect'), String(i), `Order ${i + 1} - ${number(e.distance, 0)} m`));
    if (r && Number(old) < r.examples.length) $('routeSelect').value = old || '0';
    $('routeSelect').disabled = !r; $('playButton').disabled = !r; $('stopButton').disabled = !r;
    const e = example();
    $('routeSummary').textContent = e ? `${result.project.settings.sequenceMode === 'fixed' ? 'Fixed sequence' : 'Calculated sequence'}: Start > ${e.sequence.join(' > ')} > End. ${number(e.distance)} m; ${number(e.distance / result.project.settings.speed)} s travel; ${number(e.distance / result.project.settings.speed + e.order.length * result.project.settings.pickTime)} s total. Picks: ${e.stops.map((s) => `${s.location}: ${s.picked.map((a) => `${a.sku} x ${a.quantity}`).join(', ')}`).join('; ')}.` : 'Run a simulation for this layout to inspect sampled routes.';
  }
  $('routeSelect').addEventListener('change', () => { stop(); renderRoute(); draw(); });
  $('heatmapToggle').addEventListener('change', draw); $('labelsToggle').addEventListener('change', draw);
  $('stopButton').addEventListener('click', stop);
  $('playButton').addEventListener('click', () => {
    const e = example(); if (!e) return; stop(); const started = performance.now();
    $('playButton').textContent = 'Restart Route';
    function frame(now) {
      const position = Math.max(0, now - started) / 1000 * Number($('animationSpeed').value) * result.project.settings.speed;
      const i = Math.min(Math.floor(position), e.points.length - 1), a = e.points[i], b = e.points[Math.min(i + 1, e.points.length - 1)];
      animationPoint = { x: a.x + (b.x - a.x) * (position % 1), y: a.y + (b.y - a.y) * (position % 1) }; draw();
      if (position < e.points.length - 1) animation = requestAnimationFrame(frame); else { animation = 0; $('playButton').textContent = 'Replay Route'; }
    }
    animation = requestAnimationFrame(frame);
  });
  function draw() {
    const l = current(); if (!l) return;
    const box = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!box.width || !box.height) return;
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 26, scale = Math.min((box.width - 2 * pad) / l.width, (box.height - 2 * pad) / l.height);
    const ox = (box.width - l.width * scale) / 2, oy = (box.height - l.height * scale) / 2;
    transform = { ox, oy, scale };
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, box.width, box.height); ctx.fillStyle = '#fff'; ctx.fillRect(ox, oy, l.width * scale, l.height * scale);
    const key = JSON.stringify([l.width, l.height, l.aisle, l.locations.map((r) => [r.x, r.y, r.w, r.h])]);
    if (key !== floorKey) { floorKey = key; floorGrid = core.walkGrid(l); }
    ctx.fillStyle = '#e4f4ec';
    floorGrid.forEach((column, x) => column.forEach((free, y) => { if (free) ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale); }));
    ctx.strokeStyle = '#e4e7ec'; ctx.lineWidth = .5;
    for (let x = 0; x <= l.width; x++) { ctx.beginPath(); ctx.moveTo(ox + x * scale, oy); ctx.lineTo(ox + x * scale, oy + l.height * scale); ctx.stroke(); }
    for (let y = 0; y <= l.height; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * scale); ctx.lineTo(ox + l.width * scale, oy + y * scale); ctx.stroke(); }
    ctx.fillStyle = '#475467'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(`${l.width} m`, box.width / 2, oy - 8); ctx.textAlign = 'left'; ctx.fillText(`${l.height} m`, 2, box.height / 2);
    const frequency = currentResult()?.locationFrequency || [], max = Math.max(1, ...frequency.map((f) => f.visits));
    l.locations.forEach((rack, i) => {
      const r = drag?.kind === 'location' && drag.index === i ? { ...rack, ...drag.preview } : rack;
      const visits = frequency.find((f) => f.location === r.id)?.visits || 0;
      ctx.fillStyle = $('heatmapToggle').checked && frequency.length ? `hsl(${48 - 45 * visits / max} 85% ${85 - 40 * visits / max}%)` : '#dcebff';
      ctx.fillRect(ox + r.x * scale, oy + r.y * scale, r.w * scale, r.h * scale);
      ctx.strokeStyle = i === selected ? '#06172b' : '#1f6feb'; ctx.lineWidth = i === selected ? 2.5 : 1; ctx.strokeRect(ox + r.x * scale, oy + r.y * scale, r.w * scale, r.h * scale);
      if ($('labelsToggle').checked) { ctx.save(); ctx.beginPath(); ctx.rect(ox + r.x * scale, oy + r.y * scale, r.w * scale, r.h * scale); ctx.clip(); ctx.fillStyle = '#06172b'; ctx.textAlign = 'center'; ctx.font = `${Math.max(10, Math.min(14, scale))}px Arial`; ctx.fillText(r.id, ox + (r.x + r.w / 2) * scale, oy + (r.y + r.h / 2) * scale + 4, Math.max(1, r.w * scale - 4)); ctx.restore(); }
      const face = core.pickPoint(r, l.aisle); ctx.fillStyle = '#0f766e'; ctx.beginPath(); ctx.arc(ox + (face.x + .5) * scale, oy + (face.y + .5) * scale, 3, 0, 2 * Math.PI); ctx.fill();
    });
    const e = example();
    if (e) { ctx.strokeStyle = '#db2777'; ctx.lineWidth = 2.5; ctx.beginPath(); e.points.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](ox + (p.x + .5) * scale, oy + (p.y + .5) * scale)); ctx.stroke(); }
    function marker(kind, label) {
      let point = l[kind];
      if (drag?.kind === kind || (l.samePoint && drag?.kind === 'start')) point = drag.preview;
      const x = ox + (point.x + .5) * scale, y = oy + (point.y + .5) * scale;
      ctx.fillStyle = kind === 'start' ? '#0f766e' : '#9f1239'; ctx.strokeStyle = selectedPoint === kind ? '#06172b' : '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); if (kind === 'start') ctx.arc(x, y, 9, 0, Math.PI * 2); else ctx.rect(x - 8, y - 8, 16, 16); ctx.fill(); ctx.stroke();
      ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#06172b'; ctx.fillText(label, x, y - 14);
    }
    marker('start', l.samePoint ? 'Start / End' : 'Start'); if (!l.samePoint) marker('end', 'End');
    if (animationPoint) { ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#06172b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + (animationPoint.x + .5) * scale, oy + (animationPoint.y + .5) * scale, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    $('canvasSummary').textContent = `${l.name}: ${l.width} x ${l.height} m, ${l.locations.length} locations, ${l.aisle} m aisle clearance. Start (${l.start.x}, ${l.start.y}); end (${l.end.x}, ${l.end.y}). ${selectedPoint === 'location' && selected >= 0 ? `Selected location: ${l.locations[selected]?.id}.` : `Selected: ${selectedPoint}.`}`;
  }
  function position(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left - transform.ox) / transform.scale, y: (event.clientY - rect.top - transform.oy) / transform.scale }; }
  canvas.addEventListener('pointerdown', (event) => {
    if (running || !transform) return; const p = position(event), racks = current().locations;
    const endpointOrder = current().samePoint ? ['start'] : selectedPoint === 'start' ? ['start', 'end'] : ['end', 'start'];
    for (const kind of endpointOrder) {
      const point = current()[kind];
      if (Math.hypot(p.x - point.x - .5, p.y - point.y - .5) * transform.scale <= 18) {
        selectedPoint = kind; $('pointSelect').value = kind; stop();
        drag = { kind, dx: p.x - point.x, dy: p.y - point.y, preview: { ...point } }; canvas.setPointerCapture(event.pointerId); draw(); return;
      }
    }
    const i = racks.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (i < 0) return; selected = i; selectedPoint = 'location'; $('pointSelect').value = 'location'; renderLocation(); stop();
    drag = { kind: 'location', index: i, dx: p.x - racks[i].x, dy: p.y - racks[i].y, preview: { x: racks[i].x, y: racks[i].y } }; canvas.setPointerCapture(event.pointerId); draw();
  });
  canvas.addEventListener('pointermove', (event) => { if (!drag) return; const p = position(event), r = drag.kind === 'location' ? current().locations[drag.index] : { w: 1, h: 1 }; drag.preview = { x: Math.max(0, Math.min(current().width - r.w, Math.round(p.x - drag.dx))), y: Math.max(0, Math.min(current().height - r.h, Math.round(p.y - drag.dy))) }; draw(); });
  canvas.addEventListener('pointerup', () => { if (!drag) return; const move = drag; drag = null; safe(() => commitLayout((l) => { if (move.kind === 'location') Object.assign(l.locations[move.index], move.preview); else l[move.kind] = move.preview; })); draw(); });
  canvas.addEventListener('pointercancel', () => { drag = null; draw(); });
  canvas.addEventListener('keydown', (event) => {
    if (running || (selectedPoint === 'location' && selected < 0) || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); safe(() => commitLayout((l) => { const r = selectedPoint === 'location' ? l.locations[selected] : l[selectedPoint]; if (event.key === 'ArrowLeft') r.x--; if (event.key === 'ArrowRight') r.x++; if (event.key === 'ArrowUp') r.y--; if (event.key === 'ArrowDown') r.y++; }));
  });
  new ResizeObserver(draw).observe(canvas.parentElement);
  render();
}());

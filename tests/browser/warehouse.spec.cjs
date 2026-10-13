const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const core = require('../../calculation-core/warehouse-layout.js');
const URL = '/Warehouse_Layout_Simulation/Warehouse_Layout_Simulation.html';

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  // Real bundled Chart.js and A* are used; no external service is necessary.
  await page.route('**/*', (route) => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
});
async function exportJson(page, id) {
  const promise = page.waitForEvent('download');
  await page.locator(id).click();
  return JSON.parse(fs.readFileSync(await (await promise).path(), 'utf8'));
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
test('warehouse demand edits preserve Tab and Shift-Tab focus and show local/run errors', async ({ page }) => {
  await page.goto(URL); await page.locator('#loadSampleButton').click();
  const first = page.locator('#demandTable tbody tr').first(), weight = first.locator('input').nth(1), sku = first.locator('input').first();
  await weight.fill('21'); await weight.press('Tab'); await expect(first.locator('button')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(weight).toBeFocused();
  await sku.fill('RENAMED'); await sku.press('Tab'); await expect(weight).toBeFocused();
  await expect(page.locator('#assignments select').first()).toHaveValue('RENAMED');
  await weight.fill(''); await weight.press('Tab'); await expect(weight).toHaveAttribute('aria-invalid', 'true');
  await expect(first.locator('.wl-field-error')).toContainText('required');
  await page.locator('#runButton').click(); await expect(page.locator('#simulationError')).toBeVisible();
  await expect.poll(() => page.locator('#simulationError').evaluate(e => { const r=e.getBoundingClientRect(); return r.top >= document.querySelector('.tool-topnav').getBoundingClientRect().height && r.bottom <= innerHeight; })).toBe(true);
  await page.locator('#simulationError a').click(); await expect(weight).toBeFocused();
  await weight.fill('21'); await weight.press('Tab'); await expect(weight).not.toHaveAttribute('aria-invalid', 'true');
  await page.locator('#runButton').click(); await expect(page.locator('#resultContent')).toBeVisible(); await expect(page.locator('#simulationError')).toBeHidden();
});
test('warehouse fields group names, dimensions and coordinate pairs at every width', async ({ page }, info) => {
  for (const width of [1280,768,390]) {
    await page.setViewportSize({width,height:900}); await page.goto(URL); await page.locator('#loadSampleButton').click(); await page.locator('#samePoint').uncheck();
    const rects = await page.evaluate(() => {
      const r=id=>{const b=document.getElementById(id).getBoundingClientRect();return {x:b.x,y:b.y,w:b.width};};
      return {name:r('layoutName'),fields:r('layoutFields'),startX:r('startX'),startY:r('startY'),endX:r('endX'),endY:r('endY'),id:r('locationId'),locFields:r('locationFields'),x:r('locationX'),y:r('locationY'),w:r('locationWidth'),h:r('locationHeight')};
    });
    expect(rects.name.w).toBeGreaterThan(rects.fields.w*.9);
    expect(rects.startX.y).toBe(rects.startY.y); expect(rects.endX.y).toBe(rects.endY.y);
    expect(rects.id.w).toBeGreaterThan(rects.locFields.w*.9);
    expect(rects.x.y).toBe(rects.y.y); expect(rects.w.y).toBe(rects.h.y);
    await noOverflow(page); await page.locator('#pointFields').screenshot({path:info.outputPath(`coordinate-pairs-${width}.png`)});
  }
});
test('warehouse editing, real charts, animation, comparison and portable snapshots', async ({ page }, info) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await expect(page.locator('#resultContent')).toBeHidden();
  await page.locator('#loadSampleButton').click();
  await expect(page.locator('#locationSelect option')).toHaveCount(30);
  await page.locator('#duplicateLayoutButton').click();
  await page.locator('#layoutName').fill('Closer fast mover'); await page.locator('#layoutName').press('Tab');
  await page.locator('#locationX').fill('3'); await page.locator('#locationX').press('Tab');
  await page.locator('#runButton').click();
  await expect(page.locator('#runStatus')).toContainText('3,000 orders', { timeout: 15000 });
  await expect(page.locator('#comparisonTable tbody tr')).toHaveCount(3);
  const result = await exportJson(page, '#exportResultsButton');
  expect(result.project.settings.sequenceMode).toBe('fixed');
  expect(result.results[0].examples.map((e) => e.sequence)).toEqual(result.results[1].examples.map((e) => e.sequence));
  result.results.forEach((r) => r.examples.forEach((e) => {
    expect(e.sequence).toEqual([...e.sequence].sort(new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare));
    expect(new Set(e.sequence).size).toBe(e.sequence.length);
  }));
  expect(result.results[1].distanceImprovement).toEqual(expect.any(Number));
  const expected = core.simulate(result.project);
  expect(result.results).toEqual(expected.results);
  expect(result.assumptions.length).toBeGreaterThan(0);
  const chart = await page.locator('#distanceChart').evaluate((node) => ({ version: Chart.version, bars: Chart.getChart(node).data.datasets[0].data }));
  expect(chart.version).toBe('4.4.8'); expect(chart.bars).toEqual(result.results.map((r) => r.distance.mean));
  await page.locator('#heatmapToggle').check();
  await page.locator('#playButton').click();
  const before = await page.locator('#warehouseCanvas').evaluate((c) => c.toDataURL());
  await expect.poll(() => page.locator('#warehouseCanvas').evaluate((c) => c.toDataURL())).not.toBe(before);
  await page.locator('#stopButton').click();
  const colours = await page.locator('#warehouseCanvas').evaluate((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const s = new Set(); for (let i = 0; i < d.length; i += 16) s.add(`${d[i]},${d[i+1]},${d[i+2]}`); return s.size; });
  expect(colours).toBeGreaterThan(15);
  await noOverflow(page);
  await page.locator('#editor').screenshot({ path: info.outputPath('warehouse-editor.png') });
  await page.locator('#results').screenshot({ path: info.outputPath('warehouse-results.png') });
  await page.locator('#saveButton').click();
  const exported = await exportJson(page, '#exportProjectButton'); expect(exported.layouts).toHaveLength(3);
  await page.reload(); await page.locator('#restoreButton').click();
  await expect(page.locator('#layoutSelect option')).toHaveCount(3);
  expect((await exportJson(page, '#exportProjectButton')).layouts).toEqual(exported.layouts);
  await page.locator('#importFile').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, layouts: [...exported.layouts, { id: 'broken' }] })) });
  await expect(page.locator('#error')).toContainText('Existing layouts are unchanged');
  await expect(page.locator('#layoutSelect option')).toHaveCount(3);
  await page.locator('#importFile').setInputFiles({ name: 'project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(page.locator('#status')).toContainText('Project imported');
  await page.locator('#runButton').click(); await expect(page.locator('#resultContent')).toBeVisible();
  await page.locator('#pickerSpeed').fill('1.5');
  await expect(page.locator('#resultContent')).toBeHidden(); await expect(page.locator('#exportResultsButton')).toBeDisabled();
  await page.locator('#pickSequenceMode').selectOption('nearest');
  await expect(page.locator('#sequenceExplanation')).toContainText('Location sequences can differ');
  await page.locator('#runButton').click(); await expect(page.locator('#runStatus')).toContainText('Nearest eligible location');
  expect(errors).toEqual([]);
});
test('warehouse numeric and drag editing, blocked access, corrupt storage and cancellation', async ({ page }) => {
  await page.goto(URL); await page.locator('#loadSampleButton').click();
  await page.locator('#warehouseCanvas').scrollIntoViewIfNeeded();
  const box = await page.locator('#warehouseCanvas').boundingBox();
  const scale = Math.min((box.width - 52) / 28, (box.height - 52) / 24);
  const ox = box.x + (box.width - 28 * scale) / 2, oy = box.y + (box.height - 24 * scale) / 2;
  await page.mouse.move(ox + 3 * scale, oy + 5 * scale); await page.mouse.down();
  await page.mouse.move(ox + 4 * scale, oy + 5 * scale, { steps: 5 }); await page.mouse.up();
  await expect(page.locator('#locationX')).toHaveValue('3');
  await page.locator('#warehouseCanvas').focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#locationX')).toHaveValue('2');
  await page.locator('#startX').fill('0'); await page.locator('#startX').press('Tab');
  await page.locator('#runButton').click(); await expect(page.locator('#error')).toContainText('start point is blocked');
  await page.locator('#startX').fill('2'); await page.locator('#startX').press('Tab');
  await page.evaluate(() => localStorage.setItem('ath.warehouse-layout.v2', '{bad'));
  await page.locator('#restoreButton').click(); await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#locationSelect option')).toHaveCount(30);
  await page.locator('#orderCount').fill('20000'); await page.locator('#picksPerOrder').fill('30');
  // Force the supported batch fallback so cancellation is exercised deterministically.
  await page.evaluate(() => { window.Worker = undefined; });
  await page.locator('#runButton').click(); await page.locator('#cancelButton').click();
  await expect(page.locator('#runStatus')).toContainText('Cancelled'); await expect(page.locator('#resultContent')).toBeHidden();
  await page.locator('#orderCount').fill('100'); await page.locator('#picksPerOrder').fill('5');
  await page.locator('#runButton').click(); await expect(page.locator('#resultContent')).toBeVisible();
  await expect(page.locator('#resultDiagnostics')).toContainText('Small simulation');
  await noOverflow(page);
});
test('warehouse tablet expanded layout remains contained', async ({ page }, info) => {
  await page.setViewportSize({ width: 768, height: 1024 }); await page.goto(URL);
  await page.locator('#loadSampleButton').click(); await page.locator('#runButton').click();
  await expect(page.locator('#resultContent')).toBeVisible(); await noOverflow(page);
  await page.locator('#editor').screenshot({ path: info.outputPath('warehouse-tablet.png') });
  await page.locator('#warehouseCanvas').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('warehouse-viewport.png') });
});
test('warehouse repeated SKU assignments and draggable separate/shared endpoints', async ({ page }, info) => {
  await page.goto(URL); await page.locator('#loadSampleButton').click();
  await expect(page.locator('#layoutSelect option')).toHaveCount(2);
  await page.locator('#locationSelect').selectOption('2'); // Location C.
  await page.locator('#addAssignmentButton').click();
  await expect(page.locator('#assignments select')).toHaveCount(2);
  await expect(page.locator('#assignments select').nth(1)).toHaveValue('SKU-A1');
  await expect(page.locator('#demandTable tbody tr')).toHaveCount(30);
  const weight = page.locator('#demandTable tbody tr').first().locator('input').nth(1);
  await weight.fill(''); await page.locator('#runButton').click();
  await expect(page.locator('#error')).toContainText('required');
  await weight.fill('20'); await weight.press('Tab');
  await page.locator('#samePoint').uncheck();
  await expect(page.locator('#endX')).toBeVisible();
  await page.locator('#warehouseCanvas').scrollIntoViewIfNeeded();
  async function drag(x, y, nx, ny) {
    await page.locator('#warehouseCanvas').scrollIntoViewIfNeeded();
    const box = await page.locator('#warehouseCanvas').boundingBox();
    const scale = Math.min((box.width - 52) / 28, (box.height - 52) / 24);
    const ox = box.x + (box.width - 28 * scale) / 2, oy = box.y + (box.height - 24 * scale) / 2;
    await page.mouse.move(ox + (x + .5) * scale, oy + (y + .5) * scale); await page.mouse.down();
    await page.mouse.move(ox + (nx + .5) * scale, oy + (ny + .5) * scale, { steps: 5 }); await page.mouse.up();
  }
  await page.locator('#pointSelect').selectOption('start');
  await drag(2, 2, 3, 2);
  await expect(page.locator('#startX')).toHaveValue('3'); await expect(page.locator('#endX')).toHaveValue('2');
  await page.locator('#pointSelect').selectOption('end');
  await drag(2, 2, 20, 22);
  await expect(page.locator('#endX')).toHaveValue('20'); await expect(page.locator('#endY')).toHaveValue('22');
  await expect(page.locator('#startX')).toHaveValue('3'); await expect(page.locator('#endX')).toHaveValue('20');
  await page.locator('#orderCount').fill('100'); await page.locator('#runButton').click();
  await expect(page.locator('#error')).toContainText('fixed sequence requires');
  await page.locator('#pickSequenceMode').selectOption('nearest'); await page.locator('#runButton').click();
  await expect(page.locator('#resultContent')).toBeVisible();
  const r = await exportJson(page, '#exportResultsButton');
  expect(r.results[0].examples[0].points.at(-1)).toEqual({ x: 20, y: 22 });
  expect(r.results[0].frequency).toEqual(r.results[1].frequency);
  await page.locator('#samePoint').check(); await expect(page.locator('#endX')).toBeHidden();
  const p = await exportJson(page, '#exportProjectButton'); expect(p.layouts[0].end).toEqual(p.layouts[0].start);
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.locator('#faq')).toHaveClass(/faq-section/);
  await page.locator('#faq summary').first().click(); await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await page.locator('#faq').screenshot({ path: info.outputPath('warehouse-faq.png') });
  await noOverflow(page);
});
test('warehouse runs directly from local HTML without external requests', async ({ page }) => {
  await page.unroute('**/*');
  const remote = []; page.on('request', (request) => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../Warehouse_Layout_Simulation/Warehouse_Layout_Simulation.html')).href);
  await page.locator('#loadSampleButton').click(); await page.locator('#runButton').click();
  await expect(page.locator('#runStatus')).toContainText('3,000 orders');
  expect(remote).toEqual([]);
  await expect(page.locator('#comparisonTable tbody tr')).toHaveCount(2);
});
test('warehouse demand scroll, atomic CSV imports and collapsible location detail', async ({ page }, info) => {
  await page.goto(URL); await page.locator('#loadSampleButton').click();
  const dimensions = await page.locator('#demandScroll').evaluate((el) => ({ height: el.clientHeight, scroll: el.scrollHeight }));
  expect(dimensions.height).toBeLessThanOrEqual(242); expect(dimensions.scroll).toBeGreaterThan(dimensions.height);
  await page.locator('#demandScroll').focus(); await page.keyboard.press('PageDown');
  await expect.poll(() => page.locator('#demandScroll').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  const before = await exportJson(page, '#exportProjectButton');
  await page.locator('#demandFile').setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU,FrequencyWeight\nSKU-A1,50\nSKU-A2,invalid') });
  await page.locator('#importDemandButton').click(); await expect(page.locator('#error')).toContainText('No demand records from this file were applied');
  expect((await exportJson(page, '#exportProjectButton')).skus).toEqual(before.skus);
  await page.locator('#demandFile').setInputFiles({ name: 'weights.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU,FrequencyWeight\nSKU-A1,40\nSKU-A2,10') });
  await page.locator('#importDemandButton').click(); await expect(page.locator('#demandImportStatus')).toContainText('2 demand records imported');
  const after = await exportJson(page, '#exportProjectButton');
  expect(after.skus.find((r) => r.sku === 'SKU-A1').weight).toBe(40);
  expect(after.layouts).toEqual(before.layouts); expect(after.skus).toHaveLength(30);
  await page.locator('#runButton').click(); await expect(page.locator('#resultContent')).toBeVisible();
  await expect(page.locator('#frequencyTable')).toBeHidden();
  await page.locator('#frequencyDetails summary').click(); await expect(page.locator('#frequencyTable')).toBeVisible();
  await expect(page.locator('#frequencyTable tbody tr')).toHaveCount(60);
  await noOverflow(page);
  await page.locator('#frequencyDetails summary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#frequencyTable')).toBeHidden();
  await page.locator('#demandScroll').screenshot({ path: info.outputPath('warehouse-demand-scroll.png') });
  await page.locator('#editor').scrollIntoViewIfNeeded();
  await page.locator('#resetButton').click(); await page.locator('#addSkuButton').click();
  await expect(page.locator('#demandTable tbody tr')).toHaveCount(1);
  await page.locator('#demandFile').setInputFiles({ name: 'new.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU,FrequencyWeight\nSKU-1,5\nNEW,2') });
  await page.locator('#importDemandButton').click(); await expect(page.locator('#demandTable tbody tr')).toHaveCount(2);
  await noOverflow(page);
});

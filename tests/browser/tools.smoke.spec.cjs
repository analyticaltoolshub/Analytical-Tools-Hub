const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const pages = [
  { name: 'Homepage', url: '/index.html' },
  { name: 'ABC Analysis', url: '/ABC%20Analysis/ABC_Analysis.html', sample: '#btn-load-sample', calculate: '#btn-calculate' },
  { name: 'Analytic Hierarchy Process', url: '/Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html', sample: '#loadSampleResponseButton', calculate: '#calculateAnalysisButton' },
  { name: 'Break-Even Analysis', url: '/Break%20Even%20Analysis/Break_Even_Analysis.html', sample: '#loadSampleButton', calculate: '#calculateButton' },
  { name: 'Economic Order Quantity', url: '/Economic%20Order%20Quantity/Economic_Order_Quantity.html', sample: '#loadSampleButton', calculate: '#calculateButton' },
  { name: 'Exponential Smoothing', url: '/Exponential%20Smoothing/Exponential_Smoothing.html', sample: '#exampleButton', calculate: '#calculateButton' },
  { name: 'Gantt Chart', url: '/Gantt%20Chart/Gantt_Chart.html' },
  { name: 'Interpretive Structural Modeling', url: '/Interpretive%20Structural%20Modeling/Interpretive_Structural_Modeling.html', sample: '#loadSampleResponseButton' },
  { name: 'Kraljic Matrix', url: '/Kraljic%20Matrix/Kraljic_Matrix.html', sample: '#sampleBtn' },
  { name: 'Monte Carlo Risk Simulation', url: '/Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html', calculate: '#runSimulationButton' },
  { name: 'Newsvendor Model Optimizer', url: '/Newsvendor%20Model%20Optimizer/Newsvendor_Model_Optimizer.html', sample: '#loadSampleButton', calculate: '#calculateButton' },
  { name: 'Data Envelopment Analysis', url: '/Data%20Envelopment%20Analysis/Data_Envelopment_Analysis.html', template: { selector: '#templateSelect', value: 'distribution-centres' }, sample: '#loadSampleButton' },
  { name: 'Multivariate Input-Output Estimator', url: '/Multivariate%20Input-Output%20Estimator/Multivariate_Input_Output_Estimator.html', sample: '#loadSampleButton' },
  { name: 'Safety Stock and Reorder Point', url: '/Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html', sample: '#loadSampleButton', calculate: '#calculateButton' },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('http://127.0.0.1:4173/')) await route.continue();
    else await route.abort();
  });
  await page.addInitScript(() => {
    class ChartStub {
      constructor() { this.data = {}; }
      destroy() {}
      resize() {}
      update() {}
    }
    window.Chart = window.Chart || ChartStub;
    window.AOS = window.AOS || { init() {} };
  });
});

for (const entry of pages) {
  test(`${entry.name} loads and its primary sample flow remains operable`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(entry.url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();

    if (entry.template) {
      await page.locator(entry.template.selector).selectOption(entry.template.value);
    }
    if (entry.sample) {
      await expect(page.locator(entry.sample)).toBeVisible();
      await page.locator(entry.sample).click({ force: true });
    }
    if (entry.name === 'Data Envelopment Analysis') {
      await expect(page.locator('#templateSelect option')).toHaveCount(15);
      await expect(page.locator('#inputMeasures input').first()).toHaveValue('Staff FTE');
      await expect(page.locator('#outputMeasures input').first()).toHaveValue('Completed Orders');
      await expect(page.locator('#dmuTable tbody tr')).toHaveCount(3);
      await expect(page.locator('#uploadStatus')).toContainText('three editable placeholder DMUs');
      await expect(page.locator('#sampleAdequacyText')).toContainText('below the common heuristic of 12 units');
      const sectionOrder = await page.locator('.dea-content > section').evaluateAll((sections) => sections.map((section) => section.id));
      expect(sectionOrder.slice(0, 3)).toEqual(['data-preparation', 'model-setup', 'run-analysis']);
      await page.locator('#continueToModelButton').click({ force: true });
      await expect(page.locator('[data-workflow-step="2"]')).toHaveAttribute('aria-current', 'step');
      await page.locator('#modelType').selectOption('ccr');
      await expect(page.locator('[data-workflow-step="3"]')).toHaveAttribute('aria-current', 'step');
      const deaValues = [[10, 100, 100, 90], [12, 110, 130, 100], [8, 90, 90, 85]];
      for (let row = 0; row < deaValues.length; row += 1) {
        const valueInputs = page.locator('#dmuTable tbody tr').nth(row).locator('input[type="number"]');
        for (let column = 0; column < deaValues[row].length; column += 1) {
          await valueInputs.nth(column).fill(String(deaValues[row][column]));
        }
      }
      await expect(page.locator('#dataQualityPanel')).toContainText('Data Quality Check');
      await expect(page.locator('#modelRecommendation')).toContainText('Suggested starting point');
      await page.locator('#continueToModelButton').click({ force: true });
      await page.locator('#modelType').selectOption('bcc');
      await page.locator('#run-analysis').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Run DEA' }).click();
      await expect(page.locator('#lpFormulation')).toContainText('Minimise θ');
      await expect(page.locator('#lpFormulation')).toContainText('BCC convexity');
      await expect(page.locator('#lpFormulation')).toContainText('Non-zero peer weights');
      await expect(page.locator('#executiveBenchmarkPanel')).toContainText('Executive benchmark summary');
      await expect(page.locator('#resultDiagnostics')).toContainText('DEA Diagnostics');
      await expect(page.locator('#peerProfilePanel')).toContainText('Peer mix');
      await expect(page.locator('#roleInterpretationPanel')).toHaveCount(0);
      await expect(page.locator('#printReportButton')).toBeVisible();
      await expect(page.locator('#actionSummaryTable tbody tr')).toHaveCount(3);
      await expect(page.locator('#actionSummaryTable')).toContainText('Suggested action');
      await expect(page.locator('#interpretationPanel')).toContainText('Management use');
      await expect(page.locator('#assumptionScenarioPanel')).toBeHidden();
      await expect(page.locator('#scenario-analysis')).toBeHidden();
      await expect(page.locator('#scenarioNavLink')).toBeHidden();
      await page.locator('#assumptionScenarioToggle').click();
      await expect(page.locator('#assumptionScenarioToggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#assumptionScenarioPanel')).toBeVisible();
      await expect(page.locator('#modelComparisonTable tbody tr')).toHaveCount(3);
      await expect(page.locator('#modelComparisonTable')).toContainText('Scale efficiency');
      await expect(page.locator('#orientationComparisonTable tbody tr')).toHaveCount(3);
      await expect(page.locator('#assumptionScenarioPanel')).toContainText('CCR versus BCC');
      await expect(page.locator('#assumptionScenarioPanel')).toContainText('Input versus output orientation');
      await expect(page.locator('#scenarioInterpretation')).toContainText('do not overwrite the baseline');
      const assumptionLayout = await page.locator('#assumptionScenarioPanel').evaluate((panel) => {
        const model = panel.querySelector('.scenario-grid > section').getBoundingClientRect();
        const orientation = panel.querySelector('.orientation-diagnostic').getBoundingClientRect();
        const interpretation = panel.querySelector('#scenarioInterpretation').getBoundingClientRect();
        const chevron = panel.querySelector('.diagnostic-chevron');
        return { stacked: orientation.top >= model.bottom, interpretationAfter: interpretation.top >= orientation.bottom, chevronVisible: chevron.getBoundingClientRect().width > 0 };
      });
      expect(assumptionLayout).toEqual({ stacked: true, interpretationAfter: true, chevronVisible: true });
      await page.locator('.orientation-diagnostic summary').click();
      await expect(page.locator('.orientation-diagnostic')).toHaveAttribute('open', '');
      await expect(page.locator('#scenario-analysis')).toBeVisible();
      await expect(page.locator('#scenarioNavLink')).not.toHaveAttribute('hidden', '');
      await expect(page.locator('#scenarioReferenceSelector')).toHaveCount(0);
      await expect(page.locator('input[name="scenarioMode"]:checked')).toHaveValue('inputRequirement');
      await expect(page.locator('#scenarioValueHelp')).toContainText('target or forecast outputs');
      const scenarioFields = page.locator('#scenarioValueFields input');
      await expect(scenarioFields).toHaveCount(2);
      await scenarioFields.nth(0).fill('120');
      await scenarioFields.nth(1).fill('95');
      await page.locator('#evaluateScenarioButton').click();
      await expect(page.locator('#resourceScenarioResults')).toBeVisible();
      await expect(page.locator('#resourceScenarioInterpretation')).toContainText('DEA Efficient Benchmark');
      await expect(page.locator('#scenarioBenchmarkTable')).toContainText('Generated input');
      await expect(page.locator('#scenarioBenchmarkTable')).toContainText('120');
      await expect(page.locator('#scenarioBenchmarkTable')).toContainText('95');
      await expect(page.locator('#scenarioPeerSummary')).toContainText('No lambda is created for Future Scenario Plan');
      await expect(page.locator('#scenarioPeerTable')).not.toContainText('Future Scenario Plan');
      await page.locator('input[name="scenarioMode"][value="outputRequirement"]').check();
      await expect(page.locator('#scenarioValueHelp')).toContainText('available inputs');
      await expect(page.locator('#scenarioValueFields input')).toHaveCount(2);
      await page.locator('#scenarioValueFields input').nth(0).fill('10');
      await page.locator('#scenarioValueFields input').nth(1).fill('100');
      await page.locator('#evaluateScenarioButton').click();
      await expect(page.locator('#scenarioBenchmarkTable')).toContainText('Generated output');
      await expect(page.locator('#scenarioBenchmarkTable')).toContainText('Available input');
      await expect(page.locator('#resourceScenarioSummary')).toContainText('Benchmark scale');
      const downloadPromise = page.waitForEvent('download');
      await page.locator('#exportCsvButton').click();
      const download = await downloadPromise;
      const exportText = fs.readFileSync(await download.path(), 'utf8');
      expect(exportText).toContain('Actual Input: Staff FTE');
      expect(exportText).toContain('Input Slack: Staff FTE');
      expect(exportText).toContain('Recommended Minimum DMUs');
      expect(exportText).toContain('Management Priority');
      expect(exportText).toContain('Suggested Action');

      await page.locator('#resetButton').click();
      await page.locator('#csvFile').setInputFiles({
        name: 'malformed.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('DMU,Input 1,Output 1\nUnit A,"10,20\nUnit B,5,10'),
      });
      await page.locator('#importCsvButton').click();
      await expect(page.locator('#errorMessage')).toContainText('unclosed quoted field');

      await page.locator('#csvFile').setInputFiles({
        name: 'missing-value.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('DMU,Input 1,Output 1\nUnit A,,20\nUnit B,5,10'),
      });
      await page.locator('#importCsvButton').click();
      await expect(page.locator('#errorMessage')).toContainText('CSV row 2, Input 1 is blank');
    }
    if (entry.name === 'Monte Carlo Risk Simulation') {
      const modelSelect = page.locator('#modelTemplateSelect');
      await expect(modelSelect).toBeVisible();
      await modelSelect.selectOption('supplierDelay');
      await expect(page.locator('#modelTemplateHelp')).toContainText('supplier arriving later');
      await page.locator('#loadTemplateButton').click();
      await expect(page.locator('#outputName')).toHaveValue('Delivery Delay');
      await page.locator('#advanced-settings summary').click();
      await expect(page.locator('#advanced-settings')).toHaveAttribute('open', '');
    }
    if (entry.name === 'Multivariate Input-Output Estimator') {
      await expect(page.locator('#columnTable')).toContainText('Input');
      await expect(page.locator('#dataTable tbody tr')).toHaveCount(12);
      await expect(page.locator('#dataQualityStatus')).toContainText('Ready');
      await page.locator('#continueToModelButton').click({ force: true });
      await expect(page.locator('[data-workflow-step="2"]')).toHaveAttribute('aria-current', 'step');
      await page.locator('#fitModelButton').click();
      await expect(page.locator('#scenario-planning')).toBeVisible();
      await expect(page.locator('#scenarioInputs input')).toHaveCount(3);
      await page.locator('#scenarioInputs input').nth(0).fill('1900');
      await page.locator('#scenarioInputs input').nth(1).fill('300');
      await page.locator('#scenarioInputs input').nth(2).fill('45500');
      await page.locator('#estimateButton').click();
      await expect(page.locator('#results')).toBeVisible();
      await expect(page.locator('#executiveSummary')).toContainText('historical input-output relationships');
      await expect(page.locator('#resultDiagnostics')).toContainText('Estimator Diagnostics');
      await expect(page.locator('#diagnosticsTable')).toContainText('CV RMSE');
      await expect(page.locator('#estimateTable tbody tr')).toHaveCount(2);
      await expect(page.locator('#equationList')).toContainText('Cross-validation');
      await expect(page.locator('#equationList')).toContainText('Scenario support');
      await expect(page.locator('#driverInsight')).toContainText('Driver Insight');
      await page.locator('#modelType').selectOption('knn');
      await page.locator('#fitModelButton').click();
      await page.locator('#estimateButton').click();
      await expect(page.locator('#driverInsight')).toContainText('Local Evidence');
      await expect(page.locator('#equationList')).toContainText('nearest historical observations');
      await expect(page.locator('#driverStrengthSummary')).toContainText('similarity weight');
    }
    if (entry.calculate) {
      const calculate = page.locator(entry.calculate);
      await expect(calculate).toBeEnabled();
      await calculate.click({ force: true });
      if (entry.name === 'Monte Carlo Risk Simulation') {
        await expect(page.locator('#simulationStatus')).not.toContainText('running', { timeout: 20000 });
        await expect(page.locator('#resultDiagnostics')).toContainText('Simulation Diagnostics');
      }
      if (entry.name === 'Exponential Smoothing') {
        await expect(page.locator('#forecastDiagnostics')).toContainText('Forecast Diagnostics');
      }
      if (entry.name === 'Newsvendor Model Optimizer') {
        await expect(page.locator('#resultDiagnostics')).toContainText('Decision Diagnostics');
      }
    }

    const layout = await page.evaluate(async () => {
      const rawOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const originalX = window.scrollX;
      window.scrollTo(document.documentElement.scrollWidth, window.scrollY);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pageScroll = Math.abs(window.scrollX - originalX);
      window.scrollTo(originalX, window.scrollY);

      return {
        rawOverflow,
        pageScroll,
        offenders: [...document.querySelectorAll('body *')]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].join('.')}` : ''}`),
      };
    });
    expect(
      layout.pageScroll,
      `Page-level horizontal scrolling on ${entry.name} (reported overflow ${layout.rawOverflow}px): ${layout.offenders.join(', ')}`
    ).toBeLessThanOrEqual(2);
    expect(errors, `Uncaught errors on ${entry.name}`).toEqual([]);
  });
}

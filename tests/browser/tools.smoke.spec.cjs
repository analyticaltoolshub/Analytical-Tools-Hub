const { test, expect } = require('@playwright/test');

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

    if (entry.sample) {
      await expect(page.locator(entry.sample)).toBeVisible();
      await page.locator(entry.sample).click({ force: true });
    }
    if (entry.calculate) {
      const calculate = page.locator(entry.calculate);
      await expect(calculate).toBeEnabled();
      await calculate.click({ force: true });
      if (entry.name === 'Monte Carlo Risk Simulation') {
        await expect(page.locator('#simulationStatus')).not.toContainText('running', { timeout: 20000 });
      }
    }

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll('body *')]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].join('.')}` : ''}`),
    }));
    expect(layout.overflow, `Page-level horizontal overflow on ${entry.name}: ${layout.offenders.join(', ')}`).toBeLessThanOrEqual(2);
    expect(errors, `Uncaught errors on ${entry.name}`).toEqual([]);
  });
}

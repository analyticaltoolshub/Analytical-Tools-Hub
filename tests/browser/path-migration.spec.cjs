const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
test('legacy page fallback reaches renamed tool and retains URL context', async ({ page }) => {
  await page.route('**/ABC%20Analysis/ABC_Analysis.html?old=1', route => route.fulfill({ status: 404, contentType: 'text/html', body: fs.readFileSync(path.resolve(__dirname, '../../404.html'), 'utf8') }));
  await page.goto('/ABC%20Analysis/ABC_Analysis.html?old=1#manual-entry');
  await expect(page).toHaveURL(/ABC_Analysis\/ABC_Analysis\.html\?old=1#manual-entry/);
  await expect(page.locator('h1')).toBeVisible();
});
test('saved tools survive the folder URL migration', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ath:saved-tools:v1', JSON.stringify(['ABC%20Analysis/ABC_Analysis.html'])));
  await page.goto('/index.html');
  await expect(page.locator('[data-saved-tools-count]')).toHaveText('1');
  const card = page.locator('.tool-card').filter({ has: page.locator('a[href="ABC_Analysis/ABC_Analysis.html"]') });
  await expect(card.locator('.bookmark-button')).toHaveAttribute('aria-pressed', 'true');
});

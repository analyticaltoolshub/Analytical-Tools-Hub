# Analytical Tools Hub

Static landing page and working browser-based tool pages for Analytical Tools Hub (ATH).

Website: https://analyticaltoolshub.com/

## Current Tools

- ABC Analysis
- Exponential Smoothing
- Kraljic Matrix
- Gantt Chart Planner
- Break-Even Analysis
- Economic Order Quantity
- Newsvendor Model Optimizer
- Safety Stock & Reorder Point
- Analytic Hierarchy Process
- Monte Carlo Risk Simulation
- Interpretive Structural Modeling
- Data Envelopment Analysis
- Multivariate Input-Output Estimator
- Supply Chain Network Optimizer
- Warehouse Layout Simulation

Warehouse Layout Simulation uses locally bundled A* routing and Chart.js, a separate
calculation core, and a worker (with a local-file batch fallback). It compares
single-picker induction-to-drop-off routes on a 1 m grid using identical seeded weighted
orders. Unique locations hold editable SKU quantities; a shared SKU catalogue controls
demand independently of storage assignments. Stock resets for each order. The sample
loads longitudinal and transverse aisle arrangements with bays A1-F5; start/end
points can be shared, separate, and dragged. Fixed pick sequence sorts required
locations alphabetically with numeric bay ordering, combines picks per location,
and replays the same stops across layouts; nearest mode selects stops by distance.
Save/load is explicit browser-local storage; project and result JSON exports
retain settings. It does not automatically optimize rack placement or model congestion.

## Run Locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Test Changes

Install Node.js 20 or newer, install the test dependencies once, then run the checks:

```bash
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

`npm test` verifies calculation cores and repository integrity. The Playwright suite
smoke-tests the homepage and every tool at desktop and mobile widths. GitHub Actions
runs both suites on pushes and pull requests.

## Contact

Contact, feedback, and update-interest emails currently use:

```text
analyticaltoolshub@gmail.com
```

## Notes Before Launch

- Update canonical URLs and `sitemap.xml` if the production domain or routes change.
- Replace `mailto:` update interest with a proper email service when ready.
- Keep legal content in the current overlay or move it to dedicated pages later.
- Some featured tools are intentionally marked as coming soon.

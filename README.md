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

## Run Locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Test Changes

Install Node.js 20 or newer once, then run before pushing calculation changes:

```bash
npm test
```

The test suite has no third-party packages. GitHub Actions runs the same checks on pushes and pull requests.

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

# AGENTS.md

Guidance for future agents working on Analytical Tools Hub (ATH).

## Project Overview

Analytical Tools Hub is a static, browser-based analytical tools website published at:

`https://analyticaltoolshub.com/`

The product positioning is:

- A trusted online workspace for practical analysis and better decision-making.
- Free, practical, browser-based tools for professionals, students, and decision-makers.
- Privacy-first where practical: current calculations should run in the browser unless a tool explicitly says otherwise.

The brand promise is:

`Calculate - Analyze - Decide`

Current contact email:

`analyticaltoolshub@gmail.com`

## Repository Architecture

This is a static site. There is no package manager, build step, bundler, backend, or framework currently required.

Root files:

- `index.html` - homepage and landing page.
- `styles.css` - homepage styles and design tokens.
- `script.js` - homepage interactions, global search, legal overlay, content arrays.
- `tool-theme.css` - shared theme for individual tool pages.
- `README.md` - brief project overview and local run instructions.
- `sitemap.xml` - production sitemap.
- `robots.txt` - crawler rules.
- `CNAME` - GitHub Pages custom domain.
- `assets/` - ATH logos, favicon, and brand assets.

Tool folders follow this pattern:

- `ABC Analysis/ABC_Analysis.html`
- `ABC Analysis/ABC_Analysis.css`
- `ABC Analysis/ABC_Analysis.js`

The same folder/file pattern is used for:

- `Exponential Smoothing`
- `Kraljic Matrix`
- `Gantt Chart`
- `Break Even Analysis`
- `Economic Order Quantity`
- `Safety Stock & Reorder Point`

## Page Architecture Pattern

Tool pages should generally include:

1. Full SEO metadata: title, description, canonical URL, Open Graph, Twitter card.
2. Favicon and ATH logo usage from `assets/`.
3. `SoftwareApplication` schema.
4. `BreadcrumbList` schema.
5. Sticky ATH tool navigation with:
   - ATH logo
   - Tool name
   - Workspace subtitle
   - `ATH Home`
   - `Explore Tools`
6. Tool hero:
   - discipline badge
   - one `h1`
   - short practical value statement
   - reassurance pills such as browser-based calculation and export support
7. `Why use this tool?` section with:
   - Decision Supported
   - What It Tells You
   - Example Input
   - Sample Output Interpretation
8. Input section with clear labels, sample data, reset/clear action, and privacy note.
9. Results section with:
   - KPI cards
   - interpretation or guidance text
   - chart/table where useful
   - export controls where implemented
10. Guidance, methodology, assumptions, limitations, and FAQ sections.
11. Side navigation where the specific tool uses it.

The homepage is content-driven from arrays in `script.js`. When adding tools, update:

- `tools`
- `categories`
- `problems`
- `searchItems` indirectly via the arrays
- featured category counts
- sitemap
- homepage links/cards

When adding a new tool, add all practical plain-language questions the tool can answer to the homepage `problems` array so `Start With a Problem` and global search can route users to that tool. Keep these questions accurate to the tool's actual scope and avoid mapping problems to unavailable features.

## Design Patterns

ATH should feel like a credible analytical platform, not a generic calculator directory.

Use these visual patterns:

- White/light surfaces with deep navy text and bright analytical blue accents.
- Restrained shadows and 8px border radii.
- Professional dashboard-style panels, not decorative marketing clutter.
- Consistent sticky navigation on tool pages.
- Cards for repeated items, results, guidance, and tool-specific modules.
- Clear primary/secondary buttons.
- Browser-local privacy notes near upload/input areas.
- Management-ready interpretation panels where results need explanation.

Shared brand colors are defined in `styles.css` and `tool-theme.css`:

- `--navy-950: #06172b`
- `--navy-900: #08192f`
- `--navy-800: #102a47`
- `--blue-600: #1f6feb`
- `--blue-500: #2d7ff9`
- `--blue-100: #dcebff`
- `--background: #ffffff`
- `--surface: #f7f9fc`
- `--surface-alt: #eef3f9`
- `--text-primary: #101828`
- `--text-secondary: #475467`
- `--border: #e4e7ec`
- `--success: #22c55e`

Do not introduce a conflicting palette. Avoid heavy gradients, excessive glassmorphism, decorative blobs, and fake “AI” styling.

## Brand Asset Rules

Use the provided ATH assets. Do not redraw, stretch, recolor, or distort the logo.

Current assets include:

- `assets/ath-logo-horizontal.png`
- `assets/ath-logo-dark.png`
- `assets/ath-logo-stacked.png`
- `assets/ath-symbol.png`
- `assets/ath-badge.png`
- `assets/ath-favicon.png`
- `assets/Logo.png`

Logo alt text should normally be `Analytical Tools Hub logo`.

## Coding Standards

General:

- Keep the site static unless the user explicitly asks for a framework or backend.
- Use plain HTML, CSS, and JavaScript.
- Prefer existing patterns over new abstractions.
- Use readable, explicit DOM code.
- Keep calculations in tool-specific `.js` files.
- Keep repeated homepage content in arrays in `script.js`.
- Use `textContent` when inserting user-controlled values.
- If `innerHTML` is necessary for generated markup, escape any user-entered or uploaded strings first.
- Do not add unnecessary dependencies.
- Do not add a build step unless explicitly requested.

Formatting/conventions:

- Use two-space indentation in root homepage files where already present.
- Preserve the existing style of each tool file, even when it differs slightly.
- Use `const`/`let`, not `var`.
- Use descriptive function names such as `calculate`, `renderResults`, `drawChart`, `loadSample`, `exportCsv`.
- Prefer small helper functions for formatting, validation, chart drawing, and exports.
- Keep comments useful and sparse.

File editing:

- Do not overwrite user changes.
- Check `git status --short` before substantial edits.
- Keep changes scoped to the requested tool/area.

## Tool Interaction Patterns

Most tools use:

- `Load Sample` to populate a realistic template scenario.
- `Reset` or `Clear` to remove data.
- `Calculate` to produce results.
- Optional `Scenario Planning` toggle for interactive charts.
- CSV/Excel/JSON/image export where relevant.
- Error messages via visible error areas or alerts.

Current examples:

- Break-Even, EOQ, and Safety Stock use scenario planning toggles with interactive canvas charts.
- Gantt Chart supports JSON save/load, fullscreen timeline, current-date-based sample plans.
- ABC Analysis supports ABC-only and ABC + XYZ modes, spreadsheet import, manual entry, Pareto chart, management interpretation, ABC-XYZ matrix, and CSV/XLSX export.
- Kraljic Matrix uses local storage for category state.

When adding interactivity:

- Do not show blank/default results as if they are calculated.
- Do not show all search results before the user types unless the user asks for that behavior.
- Preserve keyboard accessibility and visible focus states.
- Use `aria-pressed` for toggle buttons.
- Use `aria-live` for dynamic summaries where helpful.

## Business Rules

Do not fabricate:

- testimonials
- user counts
- ratings
- awards
- partner logos
- client names
- launch dates
- company status

ATH is not yet a company. Avoid language implying it is incorporated unless the user later confirms it.

Claims must be conservative:

- Say “browser-based” only when the tool actually runs in the browser.
- Say “data is processed locally” only where the current tool does not upload data.
- Do not call features AI-powered unless they actually are.
- Do not imply professional advice. Tools are decision-support and educational aids.

Problem-to-tool mapping must match available tool scope. Homepage search and Tool Discovery should only recommend tools that exist or are clearly marked as coming soon.

Every live tool should have multiple problem-first search questions in `script.js`, especially questions that represent common business, supply-chain, finance, forecasting, project, or analytical decisions the tool can support.

Available tools should be represented consistently:

- ABC Analysis
- Exponential Smoothing
- Kraljic Matrix
- Gantt Chart Planner
- Break-Even Analysis
- Economic Order Quantity
- Safety Stock & Reorder Point

## Current Tool-Specific Rules

### ABC Analysis

- Supports `ABC only` and `ABC + XYZ`.
- ABC-only mode is value prioritisation. It must not claim to identify demand variability risk.
- ABC + XYZ mode can discuss `AX`, `AY`, `AZ`, etc.
- In ABC + XYZ mode, blank months are ignored; explicit zero values count as zero.
- ABC + XYZ requires at least 3 entered monthly values per item.
- Explain that 4-5 months can be directional, 6-12 is better, and 12 months is best for seasonal items.
- Do not show a separate `XYZ Class` column when `ABC-XYZ` is already shown.
- Management interpretation should switch language by mode:
  - ABC only: priority focus and value concentration.
  - ABC + XYZ: risk identification using high-value volatile items.

### Break-Even Analysis

- Default currency symbol is `GBP`/pound sterling in the UI.
- Scenario planning should be opt-in via toggle.
- Fixed cost and variable cost explanations should remain visible.
- Chart readout should not hide axis labels.
- Formula logic should be presented in mathematical style where possible.

### Economic Order Quantity

- Should explain EOQ assumptions: stable demand, known ordering cost, known holding cost.
- Scenario planning should remain optional and should not replace the core calculation.

### Safety Stock & Reorder Point

- Uses average demand and variability inputs, not individual monthly demand.
- Scenario planning can inspect inventory position against reorder point.
- Do not re-add the removed Inventory Cycle View unless the user explicitly asks and the chart adds practical value.

### Gantt Chart

- Sample plans should be relative to current date, not hard-coded historical dates.
- Do not preload a task plan automatically; user should add tasks, load a sample scenario, or import JSON.
- Make it clear that project data is browser-based and users should save/export JSON before refresh if persistence is not implemented.
- Timeline range should be based on actual task dates, with reasonable padding only.

## SEO Requirements

Every production page should have:

- One clear `h1`.
- Unique title and meta description.
- Canonical URL using `https://analyticaltoolshub.com/`.
- Open Graph title, description, URL, image.
- Twitter card metadata.
- Relevant structured data:
  - Homepage: Organization, WebSite, SearchAction, BreadcrumbList.
  - Tool pages: SoftwareApplication and BreadcrumbList.
- Semantic heading hierarchy.
- Internal links back to ATH home and featured tools.
- Sitemap entry for every live tool page.

Avoid keyword stuffing. Use natural, decision-oriented language.

## Accessibility Requirements

Maintain WCAG-minded implementation:

- Semantic HTML.
- One `h1` per page.
- Form labels connected to inputs.
- Visible focus indicators.
- Keyboard-accessible navigation and modals.
- Meaningful alt text for brand images.
- `aria-label`, `aria-live`, and `aria-pressed` only where they add clarity.
- Sufficient color contrast.
- Do not rely on color alone for chart/status meaning.
- Canvas charts should have adjacent text summaries or chart summaries.
- Tables/previews must not overflow mobile viewports without a deliberate scroll container.

## Security and Privacy Constraints

This is a static browser-based site. There is no server-side validation.

Do:

- Validate file extensions and sizes before parsing uploads.
- Keep calculations local unless explicitly adding a service.
- Explain local processing near upload/input areas.
- Escape user-entered strings before inserting them into `innerHTML`.
- Prefer `textContent` for user-controlled data.
- Quote CSV fields and escape quotes.
- Revoke object URLs after downloads where practical.
- Keep legal/privacy overlays accurate if data handling changes.

Do not:

- Add remote analytics, tracking, newsletter scripts, or cookies without updating the cookie/privacy language.
- Send uploaded files or input data to a server unless the user explicitly requests it and privacy copy is updated.
- Store sensitive data silently.
- Introduce `eval`, unsafe script injection, or unescaped user HTML.
- Claim data is never uploaded if a new feature uploads it.

## Testing and Verification

There is currently no automated test suite.

Before finishing changes:

1. Run `git diff --check` on changed files.
2. Run a local static server when visual/interactive behavior matters:
   - `python -m http.server 8000`
   - Open `http://localhost:8000`
3. Manually test affected flows:
   - sample data
   - manual input
   - validation/error states
   - calculate button
   - export button
   - scenario planning toggle if applicable
   - mobile layout
   - keyboard navigation for dialogs/menus
4. If Node is available, run a syntax check for changed JS:
   - `node --check path/to/file.js`

If Node is not available, state that clearly in the final response.

## Deployment Considerations

The project appears intended for GitHub Pages or equivalent static hosting:

- `CNAME` points to `analyticaltoolshub.com`.
- `sitemap.xml` uses production URLs.
- `robots.txt` references the production sitemap.

Before deployment:

- Ensure all live pages are linked from the homepage or sitemap.
- Update `sitemap.xml` when adding/removing tool pages.
- Update canonical URLs when route names change.
- Keep asset paths relative and static-host friendly.
- Avoid server-only features unless the deployment target changes.

## Things Future Agents Must Not Change Without Explicit Approval

- Do not replace the static architecture with Next.js, React, a bundler, or backend unless requested.
- Do not remove or distort ATH logos/assets.
- Do not change the brand positioning away from practical, credible decision support.
- Do not add fake testimonials, fake usage numbers, fake ratings, fake awards, or fake clients.
- Do not add analytics/tracking/newsletter services silently.
- Do not make claims about company status, AI, certifications, or partnerships without confirmation.
- Do not remove browser-local privacy notes from tools that process data locally.
- Do not make global color/theme changes casually; visual consistency across tools matters.
- Do not break existing production URLs or folder names without updating links, sitemap, and canonicals.
- Do not make homepage problem search recommend unavailable tools.
- Do not show results before the user calculates unless the tool explicitly uses a sample/preview state.
- Do not preload user-facing datasets into tools unless the specific tool intentionally has a preview mode.
- Do not remove legal overlay content unless replacing it with an equivalent page/flow.
- Do not alter `CNAME`, `robots.txt`, or canonical domain unless the user asks.
- Do not erase existing user changes in a dirty working tree.

## Things Future Agents Should Do

- Keep user-facing copy plain, specific, and decision-oriented.
- Prefer direct recommendations generated from actual results over long generic explanations.
- Add `Why use this tool?`, `What it tells you`, example input, and sample output interpretation to new tools.
- Add all practical questions a new tool can answer to `Start With a Problem` via the `problems` array in `script.js`.
- Keep sample data realistic and usable as a template.
- Preserve the global search behavior: no results until the user types; results should link to actual pages.
- Use current-date-relative sample data when dates matter.
- Keep charts readable, labelled, and paired with textual summaries.
- Keep exports useful and human-readable.
- Update README briefly when major project capabilities change.
- Keep `AGENTS.md` updated when durable architecture, deployment, privacy, or business rules change.

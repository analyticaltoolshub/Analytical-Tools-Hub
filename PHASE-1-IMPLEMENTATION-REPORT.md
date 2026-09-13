# ATH Phase 1 Implementation Report

## Scope

Implemented targeted corrections for approved P0 recommendations 1-7 only.
No P1/P2/P3 work, new tools, dependencies, framework, or site redesign was added.
The only new result UI is the AHP individual/group consistency disclosure needed
to communicate an analytical condition previously hidden by aggregation.

Recommendations 5 and 6 are incremental infrastructure plus corrections to the
identified input/export paths. This report does **not** certify that every legacy
ATH import or export has been migrated to a common contract or schema.

## 1. DEA Slack Optimization

- **Previous behavior:** the radial LP's first solution supplied peers and targets.
  A self-referencing solution could conceal non-radial improvements and classify
  a weakly efficient unit as strongly efficient.
- **Reproduction:** BCC input-oriented A=(inputs 1,2; output 1), B=(1,1; 1).
  A had radial efficiency 1 and was incorrectly classified as efficient.
- **New behavior:** normalize LP constraints, solve the radial problem, hold its
  optimum fixed, then maximize dimensionless input/output slacks. Use the second
  solution for lambdas, peers, targets, and strong-efficiency classification.
- **Justification:** with the radial optimum fixed, slack constants can be omitted
  from the objective. Maximizing `sum(Y lambda / outputScale) -
  sum(X lambda / inputScale)` is equivalent to maximizing the positive weighted
  sum of slacks. Positive scaling avoids dependence on measurement units.
  Strong efficiency requires radial efficiency 1 and negligible normalized slacks.
- **Tests:** the new dominated-unit test failed before the correction, then passed
  with the second input scaled by 1e-6, 1, and 1e6. Existing CCR/BCC, input/output,
  target, peer, zero-value, degeneracy, and fixed-scenario-frontier tests pass.
- **UI:** the chart summary explicitly distinguishes radial from strong efficiency.

## 2. Degenerate Historical Space

- **Previous behavior:** singular full-dimensional simplices could lead to an
  extrapolation classification for observations actually inside the history.
- **Reproduction:** historical inputs `(x, 2x)` for x=1..12; `(6,12)` and `(6.5,13)`
  belong to the historical line segment but failed the original classification.
- **New behavior:** construct an orthonormal basis of the observed affine span,
  test the scenario's perpendicular residual, and perform convex-hull membership
  in the independent coordinates. Two-pass orthogonalization limits drift.
- **Justification:** affine projection preserves convex combinations for on-span
  points. Off-span points cannot be historical convex combinations. Failure of a
  singular full-dimensional system is not evidence of extrapolation.
- **Tests:** observed and interior points now pass; `(6,13)` (off-span) and
  `(13,26)` (beyond the segment) remain extrapolation. Existing support tests pass.
- **UI:** the existing historical-support explanation reports the projection method.

## 3. Unit-Independent Model Selection

- **Previous behavior:** averaging raw CV RMSE across outputs let a change in one
  output's units change the selected model. Auto Lasso's fixed output-unit penalty
  was also scale dependent.
- **Reproduction:** a two-output linear/curved dataset selected Linear versus
  Polynomial solely when the curved output was multiplied by 0.001.
- **New behavior:** selection uses the equal-weight mean of `CV RMSE_k / SD(y_k)`.
  Coefficient models in Auto Select fit scaled targets, using training-fold scales
  during CV, then convert coefficients and predictions back to original units.
  Auto Lasso therefore has dimensionless penalty semantics. Manual model results
  and penalty semantics remain unchanged.
- **Justification:** both RMSE and SD scale by the same positive unit conversion.
  Equal dimensionless weighting prevents one output's units from dominating.
  Training-fold fitting avoids using held-out target scales to fit coefficients.
  The overall historical SD is a common reporting denominator across candidates.
- **Additional correction:** small-but-varying output columns are no longer
  classified as constant solely by an absolute 1e-9 threshold.
- **Tests:** model choice and all candidate scores agree after output scaling by
  1e-12, 0.001, and 1000. Existing explicit/manual model reference tests pass.
- **UI/export:** candidate table and cross-output interpretation use normalized
  error; raw per-output RMSE remains available. Exports include candidate scores.

## 4. Bounded Monte Carlo Sampling

- **Previous behavior:** after 120 rejected Normal draws, the sampler returned
  the clipped mean. Rare truncation intervals became artificial point masses.
- **Reproduction:** Normal(0,1) truncated to [8,9] produced only 8s.
- **New behavior:** retain the ordinary rejection path, then use valid rejection
  proposals: exponential in a positive tail, reflection for a negative tail,
  uniform proposals for narrow intervals, and Normal proposals centrally.
  Invalid parameters or failure to converge produce an error, not a made-up draw.
- **Justification:** exponential proposal acceptance is proportional to
  `exp(-(z-rate)^2/2)`; narrow-interval uniform acceptance uses the Normal density
  relative to its interval mode. Neither subtracts nearly identical tail CDFs.
- **Tests:** 2,000 seeded draws each for [8,9], [-9,-8], and [0.1,0.10001]; bounds,
  non-degeneracy, and positive-tail mean checked. The reference mean is
  `(phi(8)-phi(9))/(Phi(9)-Phi(8)) = 8.12118899` (sampling tolerance 0.015).
  Invalid zero SD is rejected. Existing seeded simulation tests still pass.
- **Preserved behavior:** lognormal maximum is a cap, not a conditional truncation.
  Its field now explicitly says so; the existing capped model was not silently changed.

## 5. Explicit Validation and Atomic Imports

- **Previous behavior:** coercion could turn blanks into zero; filtering could
  erase invalid items or missing time periods; imports could overwrite valid data
  before all rows were checked; duplicate lanes silently overwrote distances.
- **New shared module:** `calculation-core/data-utils.js`, browser `ATHData` and
  Node compatible. Required finite numeric validation rejects blank/null/boolean,
  nonnumeric suffixes, and infinity while preserving explicit zero.
- **Forecast:** trailing unused manual rows may be omitted, but internal gaps
  produce a period-specific error. Imported observations are checked before
  replacing demand rows. Blank spreadsheet rows are retained for validation.
- **ABC:** invalid named rows fail instead of disappearing. Negative quantities
  and costs cannot multiply into a plausible positive value. ABC+XYZ requires
  common observed-month coverage across items. Mapped imports validate before commit.
- **Gantt:** imported tasks must have real ISO calendar dates, ordered dates,
  numeric progress in [0,100], a name, and a boolean milestone flag. Invalid JSON
  plans preserve existing tasks. Imports have file-size and task-count bounds.
- **Network:** duplicate lanes and unknown facility/customer names fail explicitly.
  A rejected distance import retains the previous matrix. Network data is checked
  before replacing facility/customer state.
- **Tests:** required-value/gap cases, invalid ABC row, duplicate/unknown lanes,
  invalid calendar date, browser missing-period errors, rejected Gantt imports,
  and rejected network matrices preserving the previous valid data.
- **Justification:** dropping records or inventing zeros changes the analytical
  problem. Import validation must be complete before changing application state.

## 6. Result Snapshots and Reproducible Exports

- **Previous behavior:** forecast exports combined old displayed results with
  live edited settings, used download-time timestamps, and manually joined CSV.
- **New shared functions:** `snapshot` recursively copies/freezes plain data;
  `csv` quotes every field, doubles embedded quotes, and uses CRLF records.
- **Forecast:** snapshot includes actual observations, method/settings, full-precision
  predictions, MAE, diagnostics, and calculation timestamp. Editing data/settings
  invalidates results and disables export. Repeated exports are byte-identical.
- **Estimator/network:** immutable result snapshots, calculation timestamps, and
  original historical/scenario/network inputs are exported. Relevant scenario or
  cost/data edits invalidate visible results. Model-selection metadata is included.
- **AHP:** immutable analysis snapshot includes responses, objective values, method,
  timestamp, individual/group checks, and diagnostics in the CSV export.
- **Tests:** deep source/result isolation; CSV commas, quotes, newlines, and empty
  cells; browser alpha-change invalidation; repeated forecast downloads; nonempty
  MAE/next-forecast fields; estimator/network stale-result invalidation; AHP exports.
- **Justification:** one calculation and its settings form one reproducible record.
  Reading unrelated current controls at download time violates that relationship.

## 7. AHP Consistency and Numerical Stability

- **Previous behavior:** group-only consistency could hide inconsistent experts;
  product-based geometric means and unscaled objective sums/reciprocals could overflow.
- **Reproduction:** opposite cyclic 3x3 judgements each have CR about 6.130268199,
  while their geometric aggregate has CR 0. Also `[1e308,1e308]` produced zero
  benefit priorities; very small cost values could overflow their reciprocals.
- **New behavior:** compute individual criteria, sub-criteria, and subjective
  alternative CRs alongside the existing group CRs. A data-driven high-risk
  diagnostic identifies failed checks; the UI and export expose both scopes.
  Objective criteria correctly have no pairwise consistency ratio.
- **Justification:** use `exp(mean(log(a)))` instead of direct products.
  Benefit priorities can use `(x/max(x))/sum(x/max(x))`; cost priorities can use
  `(min(x)/x)/sum(min(x)/x)`. Common positive scale factors cancel exactly.
  Negative CI from floating-point noise is clamped to zero.
- **Tests:** opposing experts, known individual/group CRs, 400 identical expert
  matrices, very large benefit and very small cost values, plus existing AHP
  hierarchy/normalization/reference tests. Browser checks include visible failed
  individual checks and their exported values despite group CR 0.

## Files Changed

- `calculation-core/data-utils.js` (new)
- `calculation-core/dea.js`
- `calculation-core/multivariate-estimator.js`
- `calculation-core/monte-carlo.js`
- `calculation-core/abc.js`
- `calculation-core/gantt.js`
- `calculation-core/supply-chain-network.js`
- `calculation-core/ahp.js`
- `Data Envelopment Analysis/Data_Envelopment_Analysis.js`
- `Multivariate Input-Output Estimator/Multivariate_Input_Output_Estimator.js`
- `Multivariate Input-Output Estimator/Multivariate_Input_Output_Estimator.html`
- `Monte Carlo Risk Simulation/monte-carlo.js`
- `ABC Analysis/ABC_Analysis.js`
- `ABC Analysis/ABC_Analysis.html`
- `Gantt Chart/Gantt_Chart.js`
- `Exponential Smoothing/Exponential_Smoothing.js`
- `Exponential Smoothing/Exponential_Smoothing.html`
- `Supply Chain Network Optimizer/Supply_Chain_Network_Optimizer.js`
- `Supply Chain Network Optimizer/Supply_Chain_Network_Optimizer.html`
- `Analytic Hierarchy Process/Analytic_Hierarchy_Process.js`
- `Analytic Hierarchy Process/Analytic_Hierarchy_Process.html`
- `tests/calculation-core.test.cjs`
- `tests/browser/tools.smoke.spec.cjs`
- `AGENTS.md`
- This implementation report.

## Verification

Failing regressions were observed before the corresponding fixes, including
radial/slack classification, degenerate history, output-unit selection, tail
point masses, silently discarded rows/duplicate lanes, forecast gaps/stale
exports, and AHP extreme-value/individual-consistency cases.

Complete calculation and browser suites were run after each workstream, with
further complete runs after integration corrections. The calculation/repository
count increased from 74 to 84: ten new tests in the existing calculation test file.
The existing 30 desktop/mobile browser cases were extended rather than replaced.

Final verification on 13 September 2026:

| Command | Result |
| --- | --- |
| `npm.cmd test` | Exit 0; 84 passed, 0 failed, 0 skipped; 2.478 seconds |
| `npm.cmd run test:browser` | Exit 0; 30 passed, 0 failed; 31.1 seconds |
| `git diff --check` | Exit 0; no whitespace errors |

Git emitted LF-to-CRLF conversion notices; the whitespace check still exited 0.
Browser output included the existing NO_COLOR/FORCE_COLOR environment warning.

Accepted suite totals through implementation:

| Workstream | Calculation/repository | Desktop/mobile browser |
| --- | --- | --- |
| DEA | 75 passed | 30 passed |
| Historical space | 76 passed | 30 passed |
| Unit-independent selection | 77 passed | 30 passed |
| Sampling | 78 passed | 30 passed |
| Validation/imports | 81 passed | 30 passed |
| Snapshots/exports | 82 passed | 30 passed |
| AHP and final integration | 84 passed | 30 passed |

## Remaining Limitations

- No numbered P0 workstream was omitted. Recommendations 5 and 6 have targeted,
  incremental adoption, not a repository-wide import/export rewrite. Other legacy
  tool exports are not claimed to share one schema or immutable snapshot mechanism.
- DEA remains a floating-point LP implementation. Extreme dynamic range and
  alternative optimal reference sets still require professional review.
- Historical hull checks retain existing dimensionality/sample-size limits and
  local-support fallbacks; affine projection does not create missing evidence.
- Auto Select still chooses one common model family for the outputs and uses the
  existing deterministic folds and simpler-model preference thresholds. Normalized
  error is not a business-loss weighting or calibrated prediction interval.
- Bounded Normal sampling is finite-precision rejection sampling with a finite
  safety limit. It reports failure rather than silently returning a boundary value.
  No additional distribution model was added.
- ABC+XYZ still reports the sum of observed months; common coverage does not turn
  a partial year into a full-year forecast. No silent annualization was introduced.
- AHP CR is coherence guidance, not a measure of truth or expert competence.
  No automatic exclusion/reweighting of experts was introduced.
- Browser smoke tests abort external resources and stub Chart.js. They verify
  local workflows, DOM, exports, and overflow, not live CDN/map availability or
  the appearance of externally rendered chart assets.
- Intermediate browser runs included intermittent AHP workflow failures; assertions
  were not weakened. The final complete-run results above are the acceptance results.

## Verification Follow-Up: Two Corrections

- Estimator R-squared previously treated total squared variation below an absolute
  epsilon as constant and returned 1. A symmetric quadratic fitted with a line
  therefore changed from R-squared 0 to 1 when output units were scaled down.
  R-squared now computes SSE/SST after common magnitude scaling, which cancels
  algebraically and avoids a unit-dependent threshold. Adjusted R-squared uses
  the corrected value. Predictions and raw RMSE/MAE calculations are unchanged.
- ABC previously retained old results after a valid mapped import or manual edits.
  Successful imports, row additions/removals, field edits, formula changes, and
  threshold edits now clear results, charts, and exportable rows through the
  existing reset helper. Rejected imports retain the previous valid state.
  Search filtering does not invalidate results.
- Added an independently known-answer R-squared/adjusted R-squared regression
  for linear and symmetric-quadratic data at scales 1, 1e-12, 1e-120, and 1e100.
  Extended desktop/mobile ABC assertions for rejected and successful mapped
  imports, stale-export prevention, recalculation, edits, thresholds, and deletion.
  Both defects were reproduced with failing tests before their corrections.
- Verification: `npm.cmd test` passed 85/85; `npm.cmd run test:browser` passed
  30/30. `git diff --check` passed, with only Git line-ending conversion notices.
  Browser import assertions exercise mapped rows directly; external spreadsheet
  parser availability remains outside the browser smoke suite.

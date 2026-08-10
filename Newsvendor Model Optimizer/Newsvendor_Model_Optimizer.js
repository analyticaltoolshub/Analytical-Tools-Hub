const elements = {
  distribution: document.getElementById("distribution"),
  meanDemand: document.getElementById("meanDemand"),
  demandStdDev: document.getElementById("demandStdDev"),
  distributionHelp: document.getElementById("distributionHelp"),
  empiricalPanel: document.getElementById("empiricalPanel"),
  demandFile: document.getElementById("demandFile"),
  empiricalValues: document.getElementById("empiricalValues"),
  empiricalStatus: document.getElementById("empiricalStatus"),
  historyType: document.getElementById("historyType"),
  dataDiagnostics: document.getElementById("dataDiagnostics"),
  expertAdjustmentPanel: document.getElementById("expertAdjustmentPanel"),
  expertMean: document.getElementById("expertMean"),
  expertStdDev: document.getElementById("expertStdDev"),
  historicalWeight: document.getElementById("historicalWeight"),
  sellingPrice: document.getElementById("sellingPrice"),
  unitCost: document.getElementById("unitCost"),
  salvageValue: document.getElementById("salvageValue"),
  shortageCost: document.getElementById("shortageCost"),
  holdingCost: document.getElementById("holdingCost"),
  currentOrderQty: document.getElementById("currentOrderQty"),
  packSize: document.getElementById("packSize"),
  roundingMethod: document.getElementById("roundingMethod"),
  currencySymbol: document.getElementById("currencySymbol"),
  minimumOrderQty: document.getElementById("minimumOrderQty"),
  maximumOrderQty: document.getElementById("maximumOrderQty"),
  storageCapacity: document.getElementById("storageCapacity"),
  purchaseBudget: document.getElementById("purchaseBudget"),
  minimumServiceLevel: document.getElementById("minimumServiceLevel"),
  errorMessage: document.getElementById("errorMessage"),
  results: document.getElementById("results"),
  charts: document.getElementById("charts"),
  comparisonBody: document.getElementById("comparisonBody"),
  modelComparisonBody: document.getElementById("modelComparisonBody"),
  scenarioToggle: document.getElementById("scenarioToggle"),
  scenarioControls: document.getElementById("scenarioControls"),
  scenarioQuantity: document.getElementById("scenarioQuantity"),
  demandChart: document.getElementById("demandChart"),
  profitChart: document.getElementById("profitChart")
};

const distributionHelp = {
  normal: "Normal demand is symmetric around the mean. The calculation uses a zero-truncated Normal model so negative demand is excluded.",
  uniform: "Uniform demand treats every value in a symmetric range around the mean as equally likely. The implied range must remain nonnegative.",
  triangular: "Triangular demand uses a symmetric peaked distribution. The mean is the mode and the implied minimum and maximum are derived from the standard deviation.",
  poisson: "Poisson demand is discrete and nonnegative. Enter the mean event count; its standard deviation is calculated as the square root of the mean.",
  empirical: "Empirical demand uses the observed history directly, giving every imported observation equal weight."
};

let empiricalDemand = [];
let empiricalImportIssues = { invalidRows: 0, blankRows: 0 };
let latestResult = null;
let resizeTimer = null;

function numberValue(input) {
  return Number(input.value);
}

function optionalNumber(input) {
  if (input.value.trim() === "") return null;
  return Number(input.value);
}

function currency() {
  const symbol = elements.currencySymbol.value.trim().replace(/[^A-Za-z£€$¥₹]/g, "").slice(0, 4);
  return symbol || "£";
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value);
}

function formatCurrency(value) {
  return `${currency()}${new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function showError(message) {
  elements.errorMessage.textContent = message;
}

function clearError() {
  elements.errorMessage.textContent = "";
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStdDev(values, average = mean(values)) {
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentile(values, probability) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const position = (sorted.length - 1) * Math.min(1, Math.max(0, probability));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function calculateDataDiagnostics(values) {
  const average = mean(values);
  const stdDev = populationStdDev(values, average);
  const median = percentile(values, 0.5);
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = values.filter(value => value < lowerFence || value > upperFence).length;
  const zeros = values.filter(value => value === 0).length;
  const skewness = stdDev === 0
    ? 0
    : values.reduce((sum, value) => sum + ((value - average) / stdDev) ** 3, 0) / values.length;
  return { count: values.length, average, stdDev, median, cv: average === 0 ? 0 : stdDev / average, skewness, zeros, outliers };
}

function renderDataDiagnostics(values) {
  if (values.length < 3) {
    elements.dataDiagnostics.classList.add("hidden");
    return;
  }
  const diagnostics = ATHNewsvendor.calculateDataDiagnostics(values);
  setText("diagnosticCount", formatNumber(diagnostics.count, 0));
  setText("diagnosticMedian", formatNumber(diagnostics.median));
  setText("diagnosticCv", formatPercent(diagnostics.cv));
  setText("diagnosticSkewness", diagnostics.skewness.toFixed(2));
  setText("diagnosticZeros", `${diagnostics.zeros} (${formatPercent(diagnostics.zeros / diagnostics.count)})`);
  setText("diagnosticOutliers", formatNumber(diagnostics.outliers, 0));

  const messages = [];
  if (diagnostics.count < 12) messages.push("Limited history: fewer than 12 observations can produce an unstable recommendation, especially for seasonal demand.");
  else if (diagnostics.count < 24) messages.push("The history is usable but still limited; compare models and review the bootstrap range before acting.");
  else messages.push("The history length supports a useful empirical comparison, provided the periods are relevant to the upcoming decision.");
  if (Math.abs(diagnostics.skewness) > 1) messages.push("Demand is materially skewed, so a symmetric Normal assumption may not represent the tail well.");
  if (diagnostics.outliers > 0) messages.push(`${diagnostics.outliers} potential outlier${diagnostics.outliers === 1 ? "" : "s"} detected using the 1.5 × IQR rule; verify before removing any observation.`);
  if (empiricalImportIssues.invalidRows > 0) messages.push(`${empiricalImportIssues.invalidRows} CSV row${empiricalImportIssues.invalidRows === 1 ? " was" : "s were"} ignored because no valid nonnegative demand value was found.`);
  if (diagnostics.zeros / diagnostics.count >= 0.2) messages.push("Frequent zero-demand periods may indicate intermittent demand; interpret continuous distribution comparisons cautiously.");
  if (elements.historyType.value === "sales-censored") messages.push("Recorded sales may be censored by stockouts. Sales can understate true demand, so the recommendation may be too low unless lost demand is estimated separately.");
  else if (elements.historyType.value === "sales-complete") messages.push("Sales are being treated as demand because no stockouts are known. Confirm that availability did not limit sales in any period.");

  const list = document.getElementById("diagnosticMessages");
  list.textContent = "";
  messages.forEach(message => {
    const item = document.createElement("li");
    item.textContent = message;
    list.appendChild(item);
  });
  const warning = diagnostics.count < 12 || Math.abs(diagnostics.skewness) > 1 || diagnostics.outliers > 0 || empiricalImportIssues.invalidRows > 0 || elements.historyType.value === "sales-censored";
  const status = document.getElementById("dataQualityStatus");
  status.textContent = warning ? "Review warnings" : "Suitable for comparison";
  status.classList.toggle("is-warning", warning);
  status.classList.toggle("is-good", !warning);
  elements.dataDiagnostics.classList.remove("hidden");
}

function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}

function inverseNormalCdf(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  const high = 1 - low;
  const bounded = Math.min(1 - 1e-12, Math.max(1e-12, p));

  if (bounded < low) {
    const q = Math.sqrt(-2 * Math.log(bounded));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (bounded <= high) {
    const q = bounded - 0.5;
    const r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  const q = Math.sqrt(-2 * Math.log(1 - bounded));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

function quantileFromOutcomes(outcomes, probability) {
  const target = Math.min(1, Math.max(0, probability));
  let cumulative = 0;
  for (const outcome of outcomes) {
    cumulative += outcome.probability;
    if (cumulative + 1e-12 >= target) return outcome.demand;
  }
  return outcomes[outcomes.length - 1].demand;
}

function cdfFromOutcomes(outcomes, quantity) {
  return outcomes.reduce((total, outcome) => total + (outcome.demand <= quantity ? outcome.probability : 0), 0);
}

function continuousOutcomes(quantile, count = 2048) {
  const probability = 1 / count;
  return Array.from({ length: count }, (_, index) => ({
    demand: quantile((index + 0.5) / count),
    probability
  }));
}

function poissonOutcomes(lambda) {
  if (lambda === 0) return [{ demand: 0, probability: 1 }];
  const mode = Math.floor(lambda);
  const max = Math.ceil(lambda + 10 * Math.sqrt(lambda) + 20);
  const weights = new Array(max + 1).fill(0);
  weights[mode] = 1;

  for (let k = mode; k < max; k += 1) weights[k + 1] = weights[k] * lambda / (k + 1);
  for (let k = mode; k > 0; k -= 1) weights[k - 1] = weights[k] * k / lambda;

  const total = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((weight, demand) => ({ demand, probability: weight / total }));
}

function blendDemandMoments(baseMean, baseStdDev, expertMean, expertStdDev, historicalWeight) {
  const weight = historicalWeight / 100;
  const adjustedMean = weight * baseMean + (1 - weight) * expertMean;
  const variance = weight * (baseStdDev ** 2 + (baseMean - adjustedMean) ** 2) +
    (1 - weight) * (expertStdDev ** 2 + (expertMean - adjustedMean) ** 2);
  return { mean: adjustedMean, stdDev: Math.sqrt(Math.max(0, variance)), weight };
}

function getDemandInputs() {
  const distribution = elements.distribution.value;
  let baseMean = numberValue(elements.meanDemand);
  let baseStdDev = numberValue(elements.demandStdDev);
  let values = empiricalDemand.slice();

  if (distribution === "empirical") {
    values = parseDemandValues(elements.empiricalValues.value);
    if (!values.length && empiricalDemand.length) values = empiricalDemand.slice();
    if (values.length) {
      baseMean = mean(values);
      baseStdDev = populationStdDev(values, baseMean);
    }
  }

  let adjusted = false;
  let demandMean = baseMean;
  let demandStdDev = baseStdDev;
  const expertOpen = elements.expertAdjustmentPanel.open;
  const expertMean = optionalNumber(elements.expertMean);
  let expertStdDev = optionalNumber(elements.expertStdDev);
  const historicalWeight = numberValue(elements.historicalWeight);

  if (distribution === "poisson" && expertMean !== null) expertStdDev = Math.sqrt(expertMean);

  if (expertOpen && expertMean !== null && expertStdDev !== null) {
    const blend = ATHNewsvendor.blendDemandMoments(baseMean, baseStdDev, expertMean, expertStdDev, historicalWeight);
    demandMean = blend.mean;
    demandStdDev = blend.stdDev;
    adjusted = true;
  }

  return { distribution, baseMean, baseStdDev, demandMean, demandStdDev, values, adjusted, expertOpen, expertMean, expertStdDev, historicalWeight };
}

function getEconomicInputs() {
  return {
    sellingPrice: numberValue(elements.sellingPrice),
    unitCost: numberValue(elements.unitCost),
    salvageValue: numberValue(elements.salvageValue),
    shortageCost: numberValue(elements.shortageCost),
    holdingCost: numberValue(elements.holdingCost),
    currentOrderQty: optionalNumber(elements.currentOrderQty),
    packSize: numberValue(elements.packSize),
    roundingMethod: elements.roundingMethod.value,
    minimumOrderQty: optionalNumber(elements.minimumOrderQty),
    maximumOrderQty: optionalNumber(elements.maximumOrderQty),
    storageCapacity: optionalNumber(elements.storageCapacity),
    purchaseBudget: optionalNumber(elements.purchaseBudget),
    minimumServiceLevel: optionalNumber(elements.minimumServiceLevel)
  };
}

function validateInputs(demand, economics) {
  if (!Number.isFinite(demand.baseMean) || demand.baseMean < 0) return "Enter a valid nonnegative mean demand.";
  if (!Number.isFinite(demand.baseStdDev) || demand.baseStdDev < 0) return "Enter a valid nonnegative demand standard deviation.";
  if (demand.distribution === "empirical" && demand.values.length < 3) return "Enter or upload at least three empirical demand observations.";
  if (demand.distribution === "uniform" && demand.demandMean - Math.sqrt(3) * demand.demandStdDev < 0) return "The Uniform model implies negative demand. Reduce the standard deviation or increase the mean.";
  if (demand.distribution === "triangular" && demand.demandMean - Math.sqrt(6) * demand.demandStdDev < 0) return "The Triangular model implies negative demand. Reduce the standard deviation or increase the mean.";
  if (demand.distribution === "poisson" && demand.demandMean > 10000) return "Poisson mean demand is limited to 10,000 to keep the browser calculation responsive.";
  if (demand.expertOpen && (demand.expertMean === null || demand.expertStdDev === null)) return "Enter the expert demand estimate or close the expert-adjustment section.";
  if (demand.adjusted && (!Number.isFinite(demand.expertMean) || demand.expertMean < 0 || !Number.isFinite(demand.expertStdDev) || demand.expertStdDev < 0)) return "Enter valid nonnegative expert demand estimates.";
  if (demand.adjusted && (!Number.isFinite(demand.historicalWeight) || demand.historicalWeight < 0 || demand.historicalWeight > 100)) return "Historical weight must be between 0% and 100%.";

  const requiredEconomics = [economics.sellingPrice, economics.unitCost, economics.salvageValue, economics.shortageCost, economics.holdingCost];
  if (requiredEconomics.some(value => !Number.isFinite(value) || value < 0)) return "Enter valid nonnegative economic inputs.";
  if (economics.sellingPrice <= economics.unitCost) return "Selling price must be greater than unit purchase cost for the standard Newsvendor model.";
  if (!Number.isInteger(economics.packSize) || economics.packSize < 1) return "Pack size must be a whole number of at least 1.";
  if (economics.currentOrderQty !== null && (!Number.isFinite(economics.currentOrderQty) || economics.currentOrderQty < 0)) return "Current order quantity must be blank or nonnegative.";
  const optionalConstraints = [economics.minimumOrderQty, economics.maximumOrderQty, economics.storageCapacity, economics.purchaseBudget];
  if (optionalConstraints.some(value => value !== null && (!Number.isFinite(value) || value < 0))) return "Operational constraints must be blank or nonnegative.";
  if (economics.minimumServiceLevel !== null && (!Number.isFinite(economics.minimumServiceLevel) || economics.minimumServiceLevel < 0 || economics.minimumServiceLevel >= 100)) return "Minimum service level must be blank or between 0% and 99.9%.";
  if (economics.minimumOrderQty !== null && economics.maximumOrderQty !== null && economics.minimumOrderQty > economics.maximumOrderQty) return "Minimum order quantity cannot exceed maximum order quantity.";

  const underageCost = economics.sellingPrice - economics.unitCost + economics.shortageCost;
  const overageCost = economics.unitCost - economics.salvageValue + economics.holdingCost;
  if (underageCost <= 0) return "Underage cost must be positive. Review selling price, unit cost, and shortage cost.";
  if (overageCost <= 0) return "Overage cost must be positive. Salvage value cannot offset all purchase and holding/disposal cost.";
  return "";
}

function buildDemandModel(demand) {
  const mu = demand.demandMean;
  const sigma = demand.distribution === "poisson" ? Math.sqrt(mu) : demand.demandStdDev;
  let outcomes;
  let quantile;
  let cdf;
  let description;

  if (demand.distribution === "normal") {
    if (sigma === 0) {
      outcomes = [{ demand: mu, probability: 1 }];
      quantile = () => mu;
      cdf = quantity => quantity >= mu ? 1 : 0;
    } else {
      const lowerProbability = normalCdf(-mu / sigma);
      quantile = probability => Math.max(0, mu + sigma * inverseNormalCdf(lowerProbability + probability * (1 - lowerProbability)));
      cdf = quantity => quantity < 0 ? 0 : Math.max(0, Math.min(1, (normalCdf((quantity - mu) / sigma) - lowerProbability) / (1 - lowerProbability)));
      outcomes = continuousOutcomes(quantile);
    }
    description = `Zero-truncated Normal demand with entered mean ${formatNumber(mu)} and standard deviation ${formatNumber(sigma)}.`;
  } else if (demand.distribution === "uniform") {
    const minimum = mu - Math.sqrt(3) * sigma;
    const maximum = mu + Math.sqrt(3) * sigma;
    quantile = probability => minimum + probability * (maximum - minimum);
    cdf = sigma === 0
      ? quantity => quantity >= mu ? 1 : 0
      : quantity => quantity <= minimum ? 0 : quantity >= maximum ? 1 : (quantity - minimum) / (maximum - minimum);
    outcomes = sigma === 0 ? [{ demand: mu, probability: 1 }] : continuousOutcomes(quantile);
    description = `Uniform demand from ${formatNumber(minimum)} to ${formatNumber(maximum)} units.`;
  } else if (demand.distribution === "triangular") {
    const minimum = mu - Math.sqrt(6) * sigma;
    const maximum = mu + Math.sqrt(6) * sigma;
    const mode = mu;
    quantile = probability => probability < 0.5
      ? minimum + Math.sqrt(probability * (maximum - minimum) * (mode - minimum))
      : maximum - Math.sqrt((1 - probability) * (maximum - minimum) * (maximum - mode));
    cdf = sigma === 0 ? quantity => quantity >= mu ? 1 : 0 : quantity => {
      if (quantity <= minimum) return 0;
      if (quantity >= maximum) return 1;
      if (quantity <= mode) return ((quantity - minimum) ** 2) / ((maximum - minimum) * (mode - minimum));
      return 1 - ((maximum - quantity) ** 2) / ((maximum - minimum) * (maximum - mode));
    };
    outcomes = sigma === 0 ? [{ demand: mu, probability: 1 }] : continuousOutcomes(quantile);
    description = `Symmetric Triangular demand from ${formatNumber(minimum)} to ${formatNumber(maximum)} units, with mode ${formatNumber(mode)}.`;
  } else if (demand.distribution === "poisson") {
    outcomes = poissonOutcomes(mu);
    quantile = probability => quantileFromOutcomes(outcomes, probability);
    cdf = quantity => cdfFromOutcomes(outcomes, Math.floor(quantity));
    description = `Poisson demand with mean ${formatNumber(mu)} and implied standard deviation ${formatNumber(Math.sqrt(mu))}.`;
  } else {
    let values = demand.values.slice();
    if (demand.adjusted) {
      const baseStd = demand.baseStdDev;
      values = values.map(value => Math.max(0, baseStd > 0
        ? demand.demandMean + ((value - demand.baseMean) * demand.demandStdDev / baseStd)
        : demand.demandMean));
    }
    values.sort((a, b) => a - b);
    outcomes = values.map(value => ({ demand: value, probability: 1 / values.length }));
    quantile = probability => quantileFromOutcomes(outcomes, probability);
    cdf = quantity => cdfFromOutcomes(outcomes, quantity);
    description = `Empirical demand based on ${values.length} observations${demand.adjusted ? ", transformed to the expert-adjusted moments" : ""}.`;
  }

  return { distribution: demand.distribution, mean: mu, stdDev: sigma, outcomes, quantile, cdf, description };
}

function evaluateQuantity(model, economics, quantity) {
  return ATHNewsvendor.evaluateQuantity(model, economics, quantity);
}

function adjustToPack(rawQuantity, packSize, method, model, economics) {
  const lower = Math.max(0, Math.floor(rawQuantity / packSize) * packSize);
  const upper = Math.ceil(rawQuantity / packSize) * packSize;
  if (method === "up") return upper;
  if (method === "down") return lower;
  if (method === "nearest") return Math.round(rawQuantity / packSize) * packSize;
  const lowerProfit = evaluateQuantity(model, economics, lower).expectedProfit;
  const upperProfit = evaluateQuantity(model, economics, upper).expectedProfit;
  return upperProfit > lowerProfit ? upper : lower;
}

function getFeasibleBounds(model, economics) {
  let minimum = 0;
  let maximum = Infinity;
  const active = [];

  if (economics.minimumOrderQty !== null) {
    minimum = Math.max(minimum, economics.minimumOrderQty);
    active.push("minimum order quantity");
  }
  if (economics.minimumServiceLevel !== null) {
    const serviceQuantity = model.quantile(economics.minimumServiceLevel / 100);
    minimum = Math.max(minimum, serviceQuantity);
    active.push("minimum service level");
  }
  if (economics.maximumOrderQty !== null) {
    maximum = Math.min(maximum, economics.maximumOrderQty);
    active.push("maximum order quantity");
  }
  if (economics.storageCapacity !== null) {
    maximum = Math.min(maximum, economics.storageCapacity);
    active.push("storage capacity");
  }
  if (economics.purchaseBudget !== null) {
    maximum = Math.min(maximum, Math.floor(economics.purchaseBudget / economics.unitCost));
    active.push("purchase budget");
  }

  const minimumPack = Math.ceil(minimum / economics.packSize) * economics.packSize;
  const maximumPack = Number.isFinite(maximum)
    ? Math.floor(maximum / economics.packSize) * economics.packSize
    : Infinity;
  if (minimumPack > maximumPack) {
    throw new Error("The operational constraints are infeasible after pack-size adjustment. Increase the upper limit, budget, or capacity, or reduce the minimum quantity or service level.");
  }
  return { minimum, maximum, minimumPack, maximumPack, active };
}

function applyOperationalConstraints(unconstrainedQuantity, model, economics) {
  const bounds = getFeasibleBounds(model, economics);
  const quantity = Math.min(bounds.maximumPack, Math.max(bounds.minimumPack, unconstrainedQuantity));
  const binding = [];
  if (quantity > unconstrainedQuantity + 1e-9) {
    if (economics.minimumServiceLevel !== null && bounds.minimumPack >= quantity) binding.push("minimum service level");
    if (economics.minimumOrderQty !== null && Math.ceil(economics.minimumOrderQty / economics.packSize) * economics.packSize >= quantity) binding.push("minimum order quantity");
  }
  if (quantity < unconstrainedQuantity - 1e-9) {
    if (economics.maximumOrderQty !== null && bounds.maximumPack <= quantity) binding.push("maximum order quantity");
    if (economics.storageCapacity !== null && Math.floor(economics.storageCapacity / economics.packSize) * economics.packSize <= quantity) binding.push("storage capacity");
    if (economics.purchaseBudget !== null && Math.floor((economics.purchaseBudget / economics.unitCost) / economics.packSize) * economics.packSize <= quantity) binding.push("purchase budget");
  }
  return { quantity, bounds, binding: [...new Set(binding)] };
}

function calculateNewsvendor(demand, economics) {
  return ATHNewsvendor.calculateNewsvendor(demand, economics);
}

function demandForComparison(distribution, demand) {
  return {
    ...demand,
    distribution,
    demandMean: demand.demandMean,
    demandStdDev: distribution === "poisson" ? Math.sqrt(demand.demandMean) : demand.demandStdDev,
    adjusted: distribution === "empirical" ? demand.adjusted : false
  };
}

function compareDemandModels(result) {
  const labels = {
    normal: "Normal",
    uniform: "Uniform",
    triangular: "Triangular",
    poisson: "Poisson",
    empirical: "Empirical history"
  };
  const assessments = {
    normal: "Symmetric continuous demand with a truncated lower tail.",
    uniform: "All values inside the implied range are equally likely.",
    triangular: "Symmetric demand with more weight near the mean.",
    poisson: "Discrete count demand whose variance equals its mean.",
    empirical: "Uses the observed demand values without fitting a named distribution."
  };
  const candidates = ["normal", "uniform", "triangular", "poisson"];
  if (result.demand.values.length >= 3) candidates.push("empirical");

  return candidates.map(distribution => {
    const demand = demandForComparison(distribution, result.demand);
    if (distribution === "uniform" && demand.demandMean - Math.sqrt(3) * demand.demandStdDev < 0) return null;
    if (distribution === "triangular" && demand.demandMean - Math.sqrt(6) * demand.demandStdDev < 0) return null;
    if (distribution === "poisson" && demand.demandMean > 10000) return null;
    try {
      const comparison = calculateNewsvendor(demand, result.economics);
      return { distribution, label: labels[distribution], assessment: assessments[distribution], result: comparison };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function analyzeOpportunityLoss(result) {
  const { minimumPack, maximumPack } = result.constraintResult.bounds;
  const maximumDemand = result.model.outcomes[result.model.outcomes.length - 1].demand;
  const naturalMaximum = Math.max(result.optimalQuantity * 1.8, maximumDemand * 1.2, result.current?.quantity || 0, result.economics.packSize * 20);
  const upper = Number.isFinite(maximumPack) ? maximumPack : Math.ceil(naturalMaximum / result.economics.packSize) * result.economics.packSize;
  const packCount = Math.max(1, Math.floor((upper - minimumPack) / result.economics.packSize));
  const stride = Math.max(1, Math.ceil(packCount / 4000));
  const step = result.economics.packSize * stride;
  const points = [];
  for (let quantity = minimumPack; quantity <= upper + 1e-9; quantity += step) {
    points.push(evaluateQuantity(result.model, result.economics, quantity));
  }
  if (!points.some(point => point.quantity === result.optimalQuantity)) points.push(result.optimized);
  points.sort((a, b) => a.quantity - b.quantity);
  const bestProfit = Math.max(...points.map(point => point.expectedProfit), result.optimized.expectedProfit);
  const tolerance = Math.max(0.01, Math.abs(bestProfit) * 0.01);
  const nearOptimal = points.filter(point => bestProfit - point.expectedProfit <= tolerance + 1e-9);
  return {
    points,
    bestProfit,
    tolerance,
    minimum: nearOptimal[0]?.quantity ?? result.optimalQuantity,
    maximum: nearOptimal[nearOptimal.length - 1]?.quantity ?? result.optimalQuantity,
    currentLoss: result.current ? Math.max(0, bestProfit - result.current.expectedProfit) : null
  };
}

function seededRandom(seed = 24681357) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function bootstrapRecommendation(result, iterations = 250) {
  const source = result.demand.values;
  if (source.length < 8) return null;
  const random = seededRandom(20260802);
  const sampleSize = Math.min(source.length, 500);
  const quantities = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = Array.from({ length: sampleSize }, () => source[Math.floor(random() * source.length)]);
    const average = mean(sample);
    const stdDev = populationStdDev(sample, average);
    const bootstrapDemand = {
      ...result.demand,
      distribution: "empirical",
      baseMean: average,
      baseStdDev: stdDev,
      demandMean: average,
      demandStdDev: stdDev,
      values: sample,
      adjusted: false
    };
    try {
      quantities.push(calculateNewsvendor(bootstrapDemand, result.economics).optimalQuantity);
    } catch {
      // A resample can be infeasible under a strict service or capacity combination.
    }
  }
  if (!quantities.length) return null;
  quantities.sort((a, b) => a - b);
  const lower = percentile(quantities, 0.1);
  const upper = percentile(quantities, 0.9);
  const counts = new Map();
  quantities.forEach(quantity => counts.set(quantity, (counts.get(quantity) || 0) + 1));
  const mode = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { lower, upper, mode, iterations: quantities.length, sampleSize };
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function buildInterpretation(result) {
  const { underageCost, overageCost, criticalRatio, rawOptimalQuantity, unconstrainedQuantity, optimalQuantity, optimized, current, demand, economics, constraintResult } = result;
  const balance = underageCost > overageCost
    ? "The cost of being short is higher than the cost of one leftover unit, so the model targets demand above the median."
    : underageCost < overageCost
      ? "The cost of a leftover unit is higher than the cost of being short, so the model accepts a lower service level to limit excess stock."
      : "Underage and overage costs are balanced, so the unrounded target is the median demand quantile.";
  const packNote = Math.abs(rawOptimalQuantity - unconstrainedQuantity) > 0.01
    ? `The ${formatNumber(rawOptimalQuantity)}-unit statistical quantile was adjusted to ${formatNumber(unconstrainedQuantity, 0)} units using a pack size of ${economics.packSize}.`
    : "No material pack-size adjustment was required.";
  const constraintNote = constraintResult.binding.length
    ? ` The final recommendation is ${formatNumber(optimalQuantity, 0)} units because ${constraintResult.binding.join(" and ")} ${constraintResult.binding.length === 1 ? "is" : "are"} binding.`
    : constraintResult.bounds.active.length
      ? " The entered operational constraints are feasible and do not change the unconstrained pack quantity."
      : " No additional operational constraints were applied.";
  let comparison = "Enter a current order quantity to quantify the expected improvement against the existing policy.";
  if (current) {
    const difference = optimized.expectedProfit - current.expectedProfit;
    comparison = difference >= 0
      ? `Compared with the current quantity, the optimized policy increases expected profit by approximately ${formatCurrency(difference)} per decision period.`
      : `The selected pack rule produces expected profit ${formatCurrency(Math.abs(difference))} below the current quantity; review pack constraints and assumptions before changing policy.`;
  }
  const expertNote = demand.adjusted
    ? ` Demand was adjusted using ${demand.historicalWeight}% baseline weight and ${100 - demand.historicalWeight}% expert weight.`
    : "";

  return `<h3>Why this quantity is recommended</h3><p>${balance}</p><p>The critical ratio is ${formatPercent(criticalRatio)}, which identifies the demand quantile that balances marginal underage and overage costs. ${packNote}${constraintNote}</p><p>${comparison}${expertNote}</p>`;
}

function renderComparison(result) {
  elements.comparisonBody.textContent = "";
  const rows = [];
  if (result.current) rows.push({ label: "Current", data: result.current, className: "" });
  rows.push({ label: "Optimized", data: result.optimized, className: "optimized-row" });

  rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.className = row.className;
    const values = [
      row.label,
      formatNumber(row.data.quantity, 0),
      formatCurrency(row.data.expectedProfit),
      formatPercent(row.data.serviceLevel),
      formatNumber(row.data.expectedSales),
      formatNumber(row.data.expectedLeftovers),
      formatNumber(row.data.expectedLostSales)
    ];
    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      tr.appendChild(cell);
    });
    elements.comparisonBody.appendChild(tr);
  });
}

function renderModelComparison(comparisons, selectedDistribution) {
  elements.modelComparisonBody.textContent = "";
  comparisons.forEach(comparison => {
    const tr = document.createElement("tr");
    if (comparison.distribution === selectedDistribution) tr.className = "selected-model-row";
    const values = [
      comparison.distribution === selectedDistribution ? `${comparison.label} (selected)` : comparison.label,
      `${formatNumber(comparison.result.optimalQuantity, 0)} units`,
      formatCurrency(comparison.result.optimized.expectedProfit),
      formatPercent(comparison.result.optimized.serviceLevel),
      formatPercent(comparison.result.optimized.stockoutProbability),
      comparison.assessment
    ];
    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      tr.appendChild(cell);
    });
    elements.modelComparisonBody.appendChild(tr);
  });
}

function renderDecisionConfidence(result) {
  result.opportunity = analyzeOpportunityLoss(result);
  result.modelComparisons = compareDemandModels(result);
  result.bootstrap = bootstrapRecommendation(result);

  const modelQuantities = result.modelComparisons.map(comparison => comparison.result.optimalQuantity);
  const modelMinimum = Math.min(...modelQuantities);
  const modelMaximum = Math.max(...modelQuantities);
  setText("nearOptimalRange", result.opportunity.minimum === result.opportunity.maximum
    ? `${formatNumber(result.opportunity.minimum, 0)} units`
    : `${formatNumber(result.opportunity.minimum, 0)}–${formatNumber(result.opportunity.maximum, 0)} units`);
  setText("currentOpportunityLoss", result.opportunity.currentLoss === null ? "Not available" : formatCurrency(result.opportunity.currentLoss));
  setText("modelRange", modelMinimum === modelMaximum
    ? `${formatNumber(modelMinimum, 0)} units`
    : `${formatNumber(modelMinimum, 0)}–${formatNumber(modelMaximum, 0)} units`);

  if (result.bootstrap) {
    setText("bootstrapRange", `${formatNumber(result.bootstrap.lower, 0)}–${formatNumber(result.bootstrap.upper, 0)} units`);
    setText("bootstrapDetail", `${result.bootstrap.iterations} deterministic resamples; most frequent recommendation ${formatNumber(result.bootstrap.mode, 0)} units`);
  } else {
    setText("bootstrapRange", result.demand.values.length ? "More history needed" : "Needs history");
    setText("bootstrapDetail", result.demand.values.length
      ? "At least 8 demand observations are required"
      : "Select empirical demand or provide history for a bootstrap range");
  }

  renderModelComparison(result.modelComparisons, result.demand.distribution);
  const modelSpread = modelMaximum - modelMinimum;
  const modelStable = modelSpread <= Math.max(result.economics.packSize * 2, result.optimalQuantity * 0.1);
  const bootstrapStable = !result.bootstrap || result.bootstrap.upper - result.bootstrap.lower <= Math.max(result.economics.packSize * 4, result.optimalQuantity * 0.15);
  const stable = modelStable && bootstrapStable;
  const status = document.getElementById("robustnessStatus");
  status.textContent = stable ? "Relatively stable" : "Assumption-sensitive";
  status.classList.toggle("is-good", stable);
  status.classList.toggle("is-warning", !stable);

  const messages = [];
  messages.push(stable
    ? "The recommended quantity remains reasonably stable across the tested demand assumptions."
    : "The recommended quantity changes materially across the tested demand assumptions; review distribution choice and data quality before acting.");
  messages.push(`Quantities from ${formatNumber(result.opportunity.minimum, 0)} to ${formatNumber(result.opportunity.maximum, 0)} units remain within 1% of the best feasible expected profit, so this range may be more decision-useful than a single exact quantity.`);
  if (result.bootstrap) messages.push(`Resampling the available history produced an indicative 10th–90th percentile range of ${formatNumber(result.bootstrap.lower, 0)} to ${formatNumber(result.bootstrap.upper, 0)} units. This measures sample sensitivity, not guaranteed forecast accuracy.`);
  if (elements.historyType.value === "sales-censored" && result.demand.values.length) messages.push("Because the history may contain stockout-censored sales, even a stable bootstrap result can be systematically too low.");
  const interpretation = document.getElementById("confidenceInterpretation");
  interpretation.textContent = messages.join(" ");
}

function renderResults(result) {
  setText("optimalQuantity", `${formatNumber(result.optimalQuantity, 0)} units`);
  setText("expectedProfit", formatCurrency(result.optimized.expectedProfit));
  setText("serviceLevel", formatPercent(result.optimized.serviceLevel));
  setText("stockoutProbability", formatPercent(result.optimized.stockoutProbability));
  setText("underageCost", formatCurrency(result.underageCost));
  setText("overageCost", formatCurrency(result.overageCost));
  setText("criticalRatio", formatPercent(result.criticalRatio));
  setText("rawOptimalQuantity", `${formatNumber(result.rawOptimalQuantity)} units`);
  setText("unconstrainedQuantity", `${formatNumber(result.unconstrainedQuantity, 0)} units`);
  if (result.constraintResult.binding.length) {
    setText("constraintStatus", "Binding");
    setText("constraintDetail", result.constraintResult.binding.join(", "));
  } else if (result.constraintResult.bounds.active.length) {
    setText("constraintStatus", "Not binding");
    setText("constraintDetail", `${result.constraintResult.bounds.active.length} active constraint${result.constraintResult.bounds.active.length === 1 ? "" : "s"}; recommendation unchanged`);
  } else {
    setText("constraintStatus", "None");
    setText("constraintDetail", "No operational limit changed the result");
  }
  setText("expectedSales", `${formatNumber(result.optimized.expectedSales)} units`);
  setText("expectedLeftovers", `${formatNumber(result.optimized.expectedLeftovers)} units`);
  setText("expectedLostSales", `${formatNumber(result.optimized.expectedLostSales)} units`);
  setText("expectedRevenue", formatCurrency(result.optimized.expectedRevenue));
  document.getElementById("interpretation").innerHTML = buildInterpretation(result);
  renderComparison(result);
  renderDecisionConfidence(result);

  elements.results.classList.remove("hidden");
  elements.charts.classList.remove("hidden");
  configureScenario(result);
  drawCharts(result);
}

function calculate() {
  clearError();
  const demand = getDemandInputs();
  const economics = getEconomicInputs();
  const validationMessage = ATHNewsvendor.validateInputs(demand, economics);
  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  try {
    latestResult = calculateNewsvendor(demand, economics);
    renderResults(latestResult);
  } catch (error) {
    showError(error instanceof Error ? error.message : "The recommendation could not be calculated with the current constraints.");
  }
}

function updateDistributionUi() {
  const distribution = elements.distribution.value;
  const empirical = distribution === "empirical";
  const poisson = distribution === "poisson";
  elements.empiricalPanel.classList.toggle("hidden", !empirical);
  elements.meanDemand.readOnly = empirical;
  elements.demandStdDev.readOnly = empirical || poisson;
  elements.expertStdDev.readOnly = poisson;
  elements.distributionHelp.textContent = distributionHelp[distribution];
  if (poisson && Number.isFinite(numberValue(elements.meanDemand))) {
    elements.demandStdDev.value = Math.sqrt(Math.max(0, numberValue(elements.meanDemand))).toFixed(2);
    const expertMean = optionalNumber(elements.expertMean);
    elements.expertStdDev.value = expertMean === null ? "" : Math.sqrt(Math.max(0, expertMean)).toFixed(2);
  }
  if (empirical) updateEmpiricalSummary();
}

function parseDemandValues(text) {
  return text
    .split(/[\n,;\t]+/)
    .map(value => value.trim())
    .filter(value => value !== "" && Number.isFinite(Number(value)))
    .map(Number)
    .filter(value => value >= 0)
    .slice(0, 10000);
}

function parseCsvRow(row) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"' && quoted && row[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  cells.push(value.trim());
  return cells;
}

function parseDemandCsv(text) {
  const values = [];
  let invalidRows = 0;
  let blankRows = 0;
  String(text).split(/\r?\n/).forEach((row, index) => {
    if (!row.trim()) {
      blankRows += 1;
      return;
    }
    const numericCell = parseCsvRow(row).find(cell => cell !== "" && Number.isFinite(Number(cell)));
    if (numericCell === undefined) {
      if (index > 0) invalidRows += 1;
      return;
    }
    const value = Number(numericCell);
    if (value < 0) invalidRows += 1;
    else if (values.length < 10000) values.push(value);
  });
  return { values, invalidRows, blankRows };
}

function updateEmpiricalSummary() {
  let values = parseDemandValues(elements.empiricalValues.value);
  if (!values.length && empiricalDemand.length) values = empiricalDemand.slice();
  if (!values.length) {
    elements.meanDemand.value = "";
    elements.demandStdDev.value = "";
    elements.empiricalStatus.textContent = "No empirical observations loaded.";
    elements.dataDiagnostics.classList.add("hidden");
    return;
  }
  empiricalDemand = values;
  const average = mean(values);
  const stdDev = populationStdDev(values, average);
  elements.meanDemand.value = average.toFixed(2);
  elements.demandStdDev.value = stdDev.toFixed(2);
  elements.empiricalStatus.textContent = `${values.length} observations ready. Mean ${formatNumber(average)}; standard deviation ${formatNumber(stdDev)}.`;
  renderDataDiagnostics(values);
}

function handleDemandFile(event) {
  clearError();
  const file = event.target.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showError("Choose a CSV demand-history file.");
    event.target.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showError("The CSV file must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseDemandCsv(String(reader.result || ""));
    const values = parsed.values;
    if (values.length < 3) {
      showError("The CSV must contain at least three nonnegative numeric demand observations.");
      return;
    }
    empiricalImportIssues = { invalidRows: parsed.invalidRows, blankRows: parsed.blankRows };
    empiricalDemand = values;
    elements.empiricalValues.value = values.join(", ");
    updateEmpiricalSummary();
  };
  reader.onerror = () => showError("The CSV file could not be read.");
  reader.readAsText(file);
}

function loadSample() {
  const sampleHistory = [428, 462, 475, 489, 501, 514, 536, 552, 491, 468, 579, 523, 447, 483, 506, 541, 558, 497, 472, 615, 532, 518, 456, 564];
  elements.distribution.value = "empirical";
  empiricalDemand = sampleHistory;
  empiricalImportIssues = { invalidRows: 0, blankRows: 0 };
  elements.empiricalValues.value = sampleHistory.join(", ");
  elements.historyType.value = "demand";
  elements.sellingPrice.value = "38";
  elements.unitCost.value = "22";
  elements.salvageValue.value = "12";
  elements.shortageCost.value = "4";
  elements.holdingCost.value = "2";
  elements.currentOrderQty.value = "450";
  elements.packSize.value = "10";
  elements.roundingMethod.value = "profit";
  elements.minimumOrderQty.value = "100";
  elements.maximumOrderQty.value = "700";
  elements.storageCapacity.value = "650";
  elements.purchaseBudget.value = "14000";
  elements.minimumServiceLevel.value = "";
  elements.currencySymbol.value = "£";
  elements.expertAdjustmentPanel.open = false;
  elements.expertMean.value = "540";
  elements.expertStdDev.value = "100";
  elements.historicalWeight.value = "70";
  updateDistributionUi();
  calculate();
}

function reset() {
  document.querySelectorAll("#demand-inputs input:not([type='file']), #cost-inputs input").forEach(input => {
    input.value = "";
  });
  elements.distribution.value = "normal";
  elements.shortageCost.value = "0";
  elements.holdingCost.value = "0";
  elements.packSize.value = "1";
  elements.roundingMethod.value = "profit";
  elements.currencySymbol.value = "£";
  elements.historicalWeight.value = "70";
  elements.historyType.value = "demand";
  elements.demandFile.value = "";
  elements.empiricalValues.value = "";
  elements.expertAdjustmentPanel.open = false;
  document.getElementById("constraintPanel").open = false;
  empiricalDemand = [];
  empiricalImportIssues = { invalidRows: 0, blankRows: 0 };
  latestResult = null;
  clearError();
  elements.results.classList.add("hidden");
  elements.charts.classList.add("hidden");
  elements.scenarioControls.classList.add("hidden");
  elements.scenarioToggle.setAttribute("aria-pressed", "false");
  updateDistributionUi();
}

function configureScenario(result) {
  const maxDemand = result.model.outcomes[result.model.outcomes.length - 1].demand;
  const maxQuantity = Math.max(result.optimalQuantity * 1.8, maxDemand * 1.15, result.current?.quantity || 0, result.economics.packSize * 10);
  elements.scenarioQuantity.min = "0";
  elements.scenarioQuantity.max = String(Math.ceil(maxQuantity / result.economics.packSize) * result.economics.packSize);
  elements.scenarioQuantity.step = String(result.economics.packSize);
  elements.scenarioQuantity.value = String(result.optimalQuantity);
  updateScenarioReadout();
}

function updateScenarioReadout() {
  if (!latestResult) return;
  const quantity = Number(elements.scenarioQuantity.value);
  const scenario = evaluateQuantity(latestResult.model, latestResult.economics, quantity);
  setText("scenarioQtyValue", formatNumber(quantity, 0));
  setText("scenarioProfit", formatCurrency(scenario.expectedProfit));
  setText("scenarioStockout", formatPercent(scenario.stockoutProbability));
  drawProfitChart(latestResult, quantity);
}

function prepareCanvas(canvas, height = 340) {
  const width = Math.max(300, canvas.parentElement.clientWidth || 760);
  const ratio = window.devicePixelRatio || 1;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
}

function drawAxes(context, width, height, padding, xLabel, yLabel) {
  context.strokeStyle = "#98a2b3";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();
  context.fillStyle = "#475467";
  context.font = "12px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(xLabel, (padding.left + width - padding.right) / 2, height - 10);
  context.save();
  context.translate(15, (padding.top + height - padding.bottom) / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(yLabel, 0, 0);
  context.restore();
}

function histogramData(outcomes, binCount = 28) {
  const minimum = outcomes[0].demand;
  const maximum = outcomes[outcomes.length - 1].demand;
  if (maximum === minimum) return [{ start: minimum - 0.5, end: maximum + 0.5, probability: 1 }];
  const width = (maximum - minimum) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({ start: minimum + index * width, end: minimum + (index + 1) * width, probability: 0 }));
  outcomes.forEach(outcome => {
    const index = Math.min(binCount - 1, Math.floor((outcome.demand - minimum) / width));
    bins[index].probability += outcome.probability;
  });
  return bins;
}

function drawDemandChart(result) {
  const { context, width, height } = prepareCanvas(elements.demandChart);
  const padding = { left: 58, right: 24, top: 24, bottom: 50 };
  const bins = histogramData(result.model.outcomes);
  const minX = bins[0].start;
  const maxX = bins[bins.length - 1].end;
  const maxY = Math.max(...bins.map(bin => bin.probability)) * 1.12;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xScale = value => padding.left + ((value - minX) / (maxX - minX || 1)) * plotWidth;
  const yScale = value => height - padding.bottom - (value / (maxY || 1)) * plotHeight;

  context.clearRect(0, 0, width, height);
  drawAxes(context, width, height, padding, "Demand units", "Probability");
  bins.forEach(bin => {
    const x = xScale(bin.start);
    const barWidth = Math.max(1, xScale(bin.end) - x - 1);
    context.fillStyle = "rgba(31, 111, 235, .28)";
    context.strokeStyle = "#1f6feb";
    context.fillRect(x, yScale(bin.probability), barWidth, height - padding.bottom - yScale(bin.probability));
    context.strokeRect(x, yScale(bin.probability), barWidth, height - padding.bottom - yScale(bin.probability));
  });

  const markers = [{ value: result.optimalQuantity, color: "#16a34a", label: "Optimized" }];
  if (result.current) markers.push({ value: result.current.quantity, color: "#f59e0b", label: "Current" });
  markers.forEach((marker, index) => {
    if (marker.value < minX || marker.value > maxX) return;
    const x = xScale(marker.value);
    context.strokeStyle = marker.color;
    context.lineWidth = 2;
    context.setLineDash(index ? [6, 5] : []);
    context.beginPath();
    context.moveTo(x, padding.top);
    context.lineTo(x, height - padding.bottom);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = marker.color;
    context.font = "700 12px Inter, sans-serif";
    context.textAlign = x > width - 110 ? "right" : "left";
    context.fillText(`${marker.label}: ${formatNumber(marker.value, 0)}`, x + (x > width - 110 ? -5 : 5), padding.top + 14 + index * 17);
  });

  setText("demandChartSummary", `${result.model.description} The optimized quantity is ${formatNumber(result.optimalQuantity, 0)} units with a ${formatPercent(result.optimized.stockoutProbability)} stockout probability.`);
}

function buildProfitCurve(result) {
  if (result.opportunity?.points?.length) return result.opportunity.points;
  const maxDemand = result.model.outcomes[result.model.outcomes.length - 1].demand;
  const maxQuantity = Math.max(result.optimalQuantity * 1.8, maxDemand * 1.15, result.current?.quantity || 0, result.economics.packSize * 10);
  const steps = 90;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const quantity = (index / steps) * maxQuantity;
    return evaluateQuantity(result.model, result.economics, quantity);
  });
}

function drawProfitChart(result, scenarioQuantity = null) {
  const { context, width, height } = prepareCanvas(elements.profitChart);
  const padding = { left: 72, right: 24, top: 40, bottom: 50 };
  const points = buildProfitCurve(result);
  const minX = 0;
  const maxX = points[points.length - 1].quantity;
  const minProfit = Math.min(0, ...points.map(point => point.expectedProfit));
  const maxProfit = Math.max(...points.map(point => point.expectedProfit));
  const profitRange = Math.max(1, maxProfit - minProfit);
  const chartMaxProfit = maxProfit + profitRange * 0.12;
  const chartProfitRange = Math.max(1, chartMaxProfit - minProfit);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xScale = value => padding.left + ((value - minX) / (maxX - minX || 1)) * plotWidth;
  const yScale = value => height - padding.bottom - ((value - minProfit) / chartProfitRange) * plotHeight;

  context.clearRect(0, 0, width, height);
  drawAxes(context, width, height, padding, "Order quantity", `Expected profit (${currency()})`);
  if (result.opportunity) {
    const rangeStart = xScale(result.opportunity.minimum);
    const rangeEnd = xScale(result.opportunity.maximum);
    context.fillStyle = "rgba(34, 197, 94, .11)";
    context.fillRect(rangeStart, padding.top, Math.max(2, rangeEnd - rangeStart), plotHeight);
    context.fillStyle = "#067647";
    context.font = "700 12px Inter, sans-serif";
    context.textAlign = "left";
    context.fillText("Shaded range: within 1% of maximum", padding.left + 8, padding.top + 16);
    context.strokeStyle = "rgba(34, 197, 94, .65)";
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(padding.left, yScale(result.opportunity.bestProfit));
    context.lineTo(width - padding.right, yScale(result.opportunity.bestProfit));
    context.stroke();
    context.setLineDash([]);
  }
  context.strokeStyle = "#1f6feb";
  context.lineWidth = 3;
  context.beginPath();
  points.forEach((point, index) => {
    const x = xScale(point.quantity);
    const y = yScale(point.expectedProfit);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  const markers = [];
  const currentMatchesOptimized = result.current && Math.abs(result.current.quantity - result.optimalQuantity) < 0.001;
  markers.push({
    quantity: result.optimalQuantity,
    profit: result.optimized.expectedProfit,
    color: "#16a34a",
    label: currentMatchesOptimized ? "Current / optimized" : "Optimized",
    labelPosition: "below"
  });
  if (result.current && !currentMatchesOptimized) {
    markers.push({
      quantity: result.current.quantity,
      profit: result.current.expectedProfit,
      color: "#f59e0b",
      label: "Current",
      labelPosition: "above"
    });
  }
  if (scenarioQuantity !== null && Number(scenarioQuantity) !== result.optimalQuantity) {
    const scenario = evaluateQuantity(result.model, result.economics, Number(scenarioQuantity));
    markers.push({ quantity: Number(scenarioQuantity), profit: scenario.expectedProfit, color: "#7c3aed", label: "Scenario", labelPosition: "below-far" });
  }

  markers.forEach(marker => {
    const x = xScale(marker.quantity);
    const y = yScale(marker.profit);
    context.fillStyle = marker.color;
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();
    context.font = "700 12px Inter, sans-serif";
    const label = `${marker.label}: ${formatCurrency(marker.profit)}`;
    const labelWidth = context.measureText(label).width;
    const placeLeft = x + labelWidth + 14 > width - padding.right;
    const labelX = placeLeft ? x - 8 : x + 8;
    const verticalOffset = marker.labelPosition === "above" ? -12 : marker.labelPosition === "below-far" ? 38 : 20;
    const labelY = Math.min(height - padding.bottom - 8, Math.max(padding.top + 12, y + verticalOffset));
    context.textAlign = placeLeft ? "right" : "left";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255, 255, 255, .92)";
    context.fillRect(
      placeLeft ? labelX - labelWidth - 4 : labelX - 4,
      labelY - 9,
      labelWidth + 8,
      18
    );
    context.fillStyle = marker.color;
    context.fillText(label, labelX, labelY);
  });
  context.textBaseline = "alphabetic";

  const currentComparison = result.current
    ? ` The current quantity produces expected profit of ${formatCurrency(result.current.expectedProfit)}.`
    : "";
  const nearRange = result.opportunity
    ? ` Quantities from ${formatNumber(result.opportunity.minimum, 0)} to ${formatNumber(result.opportunity.maximum, 0)} units remain within 1% of the maximum feasible expected profit.`
    : "";
  const opportunityLoss = result.opportunity?.currentLoss !== null && result.opportunity?.currentLoss !== undefined
    ? ` The current policy's expected opportunity loss is ${formatCurrency(result.opportunity.currentLoss)}.`
    : "";
  setText("profitChartSummary", `Expected profit reaches its practical maximum near ${formatNumber(result.optimalQuantity, 0)} units under the selected distribution, pack rule, and constraints.${nearRange}${currentComparison}${opportunityLoss}`);
}

function drawCharts(result) {
  drawDemandChart(result);
  drawProfitChart(result, elements.scenarioToggle.getAttribute("aria-pressed") === "true" ? Number(elements.scenarioQuantity.value) : null);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  if (!latestResult) {
    showError("Calculate the Newsvendor model before exporting results.");
    return;
  }
  const result = latestResult;
  const rows = [
    ["Newsvendor Model Optimizer", "Generated locally in the browser"],
    ["Demand distribution", result.model.distribution],
    ["Demand model", result.model.description],
    ["Underage cost", result.underageCost],
    ["Overage cost", result.overageCost],
    ["Critical ratio", result.criticalRatio],
    ["Unrounded optimal quantity", result.rawOptimalQuantity],
    ["Pack size", result.economics.packSize],
    ["Pack adjustment", result.economics.roundingMethod],
    ["Unconstrained pack quantity", result.unconstrainedQuantity],
    ["Recommended order quantity", result.optimalQuantity],
    ["Binding constraints", result.constraintResult.binding.join("; ") || "None"],
    ["Expected profit", result.optimized.expectedProfit],
    ["Service level", result.optimized.serviceLevel],
    ["Stockout probability", result.optimized.stockoutProbability],
    ["Expected sales", result.optimized.expectedSales],
    ["Expected leftovers", result.optimized.expectedLeftovers],
    ["Expected lost sales", result.optimized.expectedLostSales]
  ];
  if (result.opportunity) {
    rows.push(["Near-optimal quantity range", `${result.opportunity.minimum} to ${result.opportunity.maximum}`]);
    rows.push(["Current policy opportunity loss", result.opportunity.currentLoss ?? "Not available"]);
  }
  if (result.bootstrap) rows.push(["Bootstrap recommendation range (P10-P90)", `${result.bootstrap.lower} to ${result.bootstrap.upper}`]);
  if (result.current) {
    rows.push(["Current order quantity", result.current.quantity]);
    rows.push(["Current expected profit", result.current.expectedProfit]);
  }
  if (result.modelComparisons?.length) {
    rows.push([]);
    rows.push(["Demand model comparison"]);
    rows.push(["Model", "Recommended quantity", "Expected profit", "Service level", "Stockout probability"]);
    result.modelComparisons.forEach(comparison => rows.push([
      comparison.label,
      comparison.result.optimalQuantity,
      comparison.result.optimized.expectedProfit,
      comparison.result.optimized.serviceLevel,
      comparison.result.optimized.stockoutProbability
    ]));
  }
  const csv = rows.map(row => row.map(csvEscape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ath-newsvendor-results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

elements.distribution.addEventListener("change", updateDistributionUi);
elements.meanDemand.addEventListener("input", () => {
  if (elements.distribution.value === "poisson" && Number.isFinite(numberValue(elements.meanDemand))) {
    elements.demandStdDev.value = Math.sqrt(Math.max(0, numberValue(elements.meanDemand))).toFixed(2);
  }
});
elements.expertMean.addEventListener("input", () => {
  if (elements.distribution.value === "poisson") {
    const expertMean = optionalNumber(elements.expertMean);
    elements.expertStdDev.value = expertMean === null ? "" : Math.sqrt(Math.max(0, expertMean)).toFixed(2);
  }
});
elements.empiricalValues.addEventListener("input", () => {
  empiricalImportIssues = { invalidRows: 0, blankRows: 0 };
  updateEmpiricalSummary();
});
elements.historyType.addEventListener("change", updateEmpiricalSummary);
elements.demandFile.addEventListener("change", handleDemandFile);
document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("loadSampleButton").addEventListener("click", loadSample);
document.getElementById("resetButton").addEventListener("click", reset);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
elements.scenarioToggle.addEventListener("click", () => {
  if (!latestResult) {
    showError("Calculate the Newsvendor model before using scenario planning.");
    return;
  }
  const active = elements.scenarioToggle.getAttribute("aria-pressed") !== "true";
  elements.scenarioToggle.setAttribute("aria-pressed", String(active));
  elements.scenarioControls.classList.toggle("hidden", !active);
  drawProfitChart(latestResult, active ? Number(elements.scenarioQuantity.value) : null);
});
elements.scenarioQuantity.addEventListener("input", updateScenarioReadout);
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (latestResult) drawCharts(latestResult);
  }, 120);
});

updateDistributionUi();

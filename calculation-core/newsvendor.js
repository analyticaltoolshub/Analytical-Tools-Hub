(function initialiseNewsvendorCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHNewsvendor = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createNewsvendorCore() {
  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function populationStdDev(values, average = mean(values)) {
    return Math.sqrt(values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length);
  }

  function percentile(values, probability) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const position = (sorted.length - 1) * Math.min(1, Math.max(0, probability));
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }

  function calculateDataDiagnostics(values) {
    const average = mean(values);
    const stdDev = populationStdDev(values, average);
    const q1 = percentile(values, 0.25);
    const q3 = percentile(values, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const skewness = stdDev === 0 ? 0 : values.reduce((sum, value) => sum + (((value - average) / stdDev) ** 3), 0) / values.length;
    return {
      count: values.length,
      average,
      stdDev,
      median: percentile(values, 0.5),
      cv: average === 0 ? 0 : stdDev / average,
      skewness,
      zeros: values.filter((value) => value === 0).length,
      outliers: values.filter((value) => value < lowerFence || value > upperFence).length,
    };
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
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (bounded <= high) {
      const q = bounded - 0.5;
      const r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - bounded));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
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
    return Array.from({ length: count }, (_, index) => ({ demand: quantile((index + 0.5) / count), probability: 1 / count }));
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
    const variance = weight * ((baseStdDev ** 2) + ((baseMean - adjustedMean) ** 2)) +
      (1 - weight) * ((expertStdDev ** 2) + ((expertMean - adjustedMean) ** 2));
    return { mean: adjustedMean, stdDev: Math.sqrt(Math.max(0, variance)), weight };
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
    const required = [economics.sellingPrice, economics.unitCost, economics.salvageValue, economics.shortageCost, economics.holdingCost];
    if (required.some((value) => !Number.isFinite(value) || value < 0)) return "Enter valid nonnegative economic inputs.";
    if (economics.sellingPrice <= economics.unitCost) return "Selling price must be greater than unit purchase cost for the standard Newsvendor model.";
    if (!Number.isInteger(economics.packSize) || economics.packSize < 1) return "Pack size must be a whole number of at least 1.";
    if (economics.currentOrderQty !== null && (!Number.isFinite(economics.currentOrderQty) || economics.currentOrderQty < 0)) return "Current order quantity must be blank or nonnegative.";
    const constraints = [economics.minimumOrderQty, economics.maximumOrderQty, economics.storageCapacity, economics.purchaseBudget];
    if (constraints.some((value) => value !== null && (!Number.isFinite(value) || value < 0))) return "Operational constraints must be blank or nonnegative.";
    if (economics.minimumServiceLevel !== null && (!Number.isFinite(economics.minimumServiceLevel) || economics.minimumServiceLevel < 0 || economics.minimumServiceLevel >= 100)) return "Minimum service level must be blank or between 0% and 99.9%.";
    if (economics.minimumOrderQty !== null && economics.maximumOrderQty !== null && economics.minimumOrderQty > economics.maximumOrderQty) return "Minimum order quantity cannot exceed maximum order quantity.";
    if (economics.sellingPrice - economics.unitCost + economics.shortageCost <= 0) return "Underage cost must be positive. Review selling price, unit cost, and shortage cost.";
    if (economics.unitCost - economics.salvageValue + economics.holdingCost <= 0) return "Overage cost must be positive. Salvage value cannot offset all purchase and holding/disposal cost.";
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
        cdf = (quantity) => quantity >= mu ? 1 : 0;
      } else {
        const lowerProbability = normalCdf(-mu / sigma);
        quantile = (probability) => Math.max(0, mu + sigma * inverseNormalCdf(lowerProbability + probability * (1 - lowerProbability)));
        cdf = (quantity) => quantity < 0 ? 0 : Math.max(0, Math.min(1, (normalCdf((quantity - mu) / sigma) - lowerProbability) / (1 - lowerProbability)));
        outcomes = continuousOutcomes(quantile);
      }
      description = "Zero-truncated Normal demand.";
    } else if (demand.distribution === "uniform") {
      const minimum = mu - Math.sqrt(3) * sigma;
      const maximum = mu + Math.sqrt(3) * sigma;
      quantile = (probability) => minimum + probability * (maximum - minimum);
      cdf = sigma === 0 ? (quantity) => quantity >= mu ? 1 : 0 : (quantity) => quantity <= minimum ? 0 : quantity >= maximum ? 1 : (quantity - minimum) / (maximum - minimum);
      outcomes = sigma === 0 ? [{ demand: mu, probability: 1 }] : continuousOutcomes(quantile);
      description = "Uniform demand.";
    } else if (demand.distribution === "triangular") {
      const minimum = mu - Math.sqrt(6) * sigma;
      const maximum = mu + Math.sqrt(6) * sigma;
      const mode = mu;
      quantile = (probability) => probability < 0.5
        ? minimum + Math.sqrt(probability * (maximum - minimum) * (mode - minimum))
        : maximum - Math.sqrt((1 - probability) * (maximum - minimum) * (maximum - mode));
      cdf = sigma === 0 ? (quantity) => quantity >= mu ? 1 : 0 : (quantity) => {
        if (quantity <= minimum) return 0;
        if (quantity >= maximum) return 1;
        return quantity <= mode
          ? ((quantity - minimum) ** 2) / ((maximum - minimum) * (mode - minimum))
          : 1 - ((maximum - quantity) ** 2) / ((maximum - minimum) * (maximum - mode));
      };
      outcomes = sigma === 0 ? [{ demand: mu, probability: 1 }] : continuousOutcomes(quantile);
      description = "Symmetric Triangular demand.";
    } else if (demand.distribution === "poisson") {
      outcomes = poissonOutcomes(mu);
      quantile = (probability) => quantileFromOutcomes(outcomes, probability);
      cdf = (quantity) => cdfFromOutcomes(outcomes, Math.floor(quantity));
      description = "Poisson demand.";
    } else {
      let values = demand.values.slice();
      if (demand.adjusted) {
        values = values.map((value) => Math.max(0, demand.baseStdDev > 0
          ? demand.demandMean + ((value - demand.baseMean) * demand.demandStdDev / demand.baseStdDev)
          : demand.demandMean));
      }
      values.sort((a, b) => a - b);
      outcomes = values.map((value) => ({ demand: value, probability: 1 / values.length }));
      quantile = (probability) => quantileFromOutcomes(outcomes, probability);
      cdf = (quantity) => cdfFromOutcomes(outcomes, quantity);
      description = "Empirical demand.";
    }
    return { distribution: demand.distribution, mean: mu, stdDev: sigma, outcomes, quantile, cdf, description };
  }

  function evaluateQuantity(model, economics, quantity) {
    const q = Math.max(0, quantity);
    let expectedSales = 0;
    let expectedLeftovers = 0;
    let expectedLostSales = 0;
    model.outcomes.forEach((outcome) => {
      expectedSales += Math.min(outcome.demand, q) * outcome.probability;
      expectedLeftovers += Math.max(q - outcome.demand, 0) * outcome.probability;
      expectedLostSales += Math.max(outcome.demand - q, 0) * outcome.probability;
    });
    const expectedRevenue = economics.sellingPrice * expectedSales;
    const expectedProfit = expectedRevenue + economics.salvageValue * expectedLeftovers - economics.unitCost * q - economics.holdingCost * expectedLeftovers - economics.shortageCost * expectedLostSales;
    return { quantity: q, serviceLevel: model.cdf(q), stockoutProbability: 1 - model.cdf(q), expectedSales, expectedLeftovers, expectedLostSales, expectedRevenue, expectedProfit };
  }

  function adjustToPack(rawQuantity, packSize, method, model, economics) {
    const lower = Math.max(0, Math.floor(rawQuantity / packSize) * packSize);
    const upper = Math.ceil(rawQuantity / packSize) * packSize;
    if (method === "up") return upper;
    if (method === "down") return lower;
    if (method === "nearest") return Math.round(rawQuantity / packSize) * packSize;
    return evaluateQuantity(model, economics, upper).expectedProfit > evaluateQuantity(model, economics, lower).expectedProfit ? upper : lower;
  }

  function getFeasibleBounds(model, economics) {
    let minimum = 0;
    let maximum = Infinity;
    const active = [];
    if (economics.minimumOrderQty !== null) { minimum = Math.max(minimum, economics.minimumOrderQty); active.push("minimum order quantity"); }
    if (economics.minimumServiceLevel !== null) { minimum = Math.max(minimum, model.quantile(economics.minimumServiceLevel / 100)); active.push("minimum service level"); }
    if (economics.maximumOrderQty !== null) { maximum = Math.min(maximum, economics.maximumOrderQty); active.push("maximum order quantity"); }
    if (economics.storageCapacity !== null) { maximum = Math.min(maximum, economics.storageCapacity); active.push("storage capacity"); }
    if (economics.purchaseBudget !== null) { maximum = Math.min(maximum, Math.floor(economics.purchaseBudget / economics.unitCost)); active.push("purchase budget"); }
    const minimumPack = Math.ceil(minimum / economics.packSize) * economics.packSize;
    const maximumPack = Number.isFinite(maximum) ? Math.floor(maximum / economics.packSize) * economics.packSize : Infinity;
    if (minimumPack > maximumPack) throw new Error("The operational constraints are infeasible after pack-size adjustment. Increase the upper limit, budget, or capacity, or reduce the minimum quantity or service level.");
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
    const model = buildDemandModel(demand);
    const underageCost = economics.sellingPrice - economics.unitCost + economics.shortageCost;
    const overageCost = economics.unitCost - economics.salvageValue + economics.holdingCost;
    const criticalRatio = underageCost / (underageCost + overageCost);
    const rawOptimalQuantity = model.quantile(criticalRatio);
    const unconstrainedQuantity = adjustToPack(rawOptimalQuantity, economics.packSize, economics.roundingMethod, model, economics);
    const constraintResult = applyOperationalConstraints(unconstrainedQuantity, model, economics);
    const optimalQuantity = constraintResult.quantity;
    return {
      demand,
      economics,
      model,
      underageCost,
      overageCost,
      criticalRatio,
      rawOptimalQuantity,
      unconstrainedQuantity,
      constraintResult,
      optimalQuantity,
      optimized: evaluateQuantity(model, economics, optimalQuantity),
      current: economics.currentOrderQty === null ? null : evaluateQuantity(model, economics, economics.currentOrderQty),
    };
  }

  return {
    mean,
    populationStdDev,
    percentile,
    calculateDataDiagnostics,
    normalCdf,
    inverseNormalCdf,
    quantileFromOutcomes,
    cdfFromOutcomes,
    continuousOutcomes,
    poissonOutcomes,
    blendDemandMoments,
    validateInputs,
    buildDemandModel,
    evaluateQuantity,
    adjustToPack,
    getFeasibleBounds,
    applyOperationalConstraints,
    calculateNewsvendor,
  };
}));

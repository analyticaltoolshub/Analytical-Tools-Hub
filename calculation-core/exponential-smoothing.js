(function initialiseForecastCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHExponentialSmoothing = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createForecastCore() {
  function calculateSimpleExponentialSmoothing(actual, alpha) {
    const forecast = [actual[0]];
    for (let t = 1; t < actual.length; t += 1) {
      forecast[t] = alpha * actual[t - 1] + (1 - alpha) * forecast[t - 1];
    }
    const nextForecast = alpha * actual[actual.length - 1] +
      (1 - alpha) * forecast[forecast.length - 1];
    return { forecast, nextForecast };
  }

  function calculateDoubleExponentialSmoothing(actual, alpha, beta) {
    const forecast = [actual[0]];
    let level = actual[0];
    let trend = actual[1] - actual[0];

    for (let t = 1; t < actual.length; t += 1) {
      forecast[t] = level + trend;
      const previousLevel = level;
      level = alpha * actual[t] + (1 - alpha) * (level + trend);
      trend = beta * (level - previousLevel) + (1 - beta) * trend;
    }

    return { forecast, nextForecast: level + trend };
  }

  function calculateTripleExponentialSmoothing(actual, alpha, beta, gamma, seasonLength, seasonalType) {
    const firstAverage = actual.slice(0, seasonLength).reduce((sum, value) => sum + value, 0) / seasonLength;
    const secondAverage = actual.slice(seasonLength, seasonLength * 2).reduce((sum, value) => sum + value, 0) / seasonLength;
    let level = firstAverage;
    let trend = (secondAverage - firstAverage) / seasonLength;
    const seasonal = actual.slice(0, seasonLength).map((value) => (
      seasonalType === "multiplicative" ? value / firstAverage : value - firstAverage
    ));
    const forecast = new Array(actual.length);

    for (let t = 0; t < actual.length; t += 1) {
      const season = seasonal[t % seasonLength];
      forecast[t] = seasonalType === "multiplicative"
        ? (level + trend) * season
        : level + trend + season;
      const previousLevel = level;

      if (seasonalType === "multiplicative") {
        level = alpha * (actual[t] / season) + (1 - alpha) * (level + trend);
        seasonal[t % seasonLength] = gamma * (actual[t] / level) + (1 - gamma) * season;
      } else {
        level = alpha * (actual[t] - season) + (1 - alpha) * (level + trend);
        seasonal[t % seasonLength] = gamma * (actual[t] - level) + (1 - gamma) * season;
      }
      trend = beta * (level - previousLevel) + (1 - beta) * trend;
    }

    const nextSeason = seasonal[actual.length % seasonLength];
    return {
      forecast,
      nextForecast: seasonalType === "multiplicative"
        ? (level + trend) * nextSeason
        : level + trend + nextSeason,
    };
  }

  function calculateMae(actual, forecast) {
    let errorSum = 0;
    for (let i = 1; i < actual.length; i += 1) {
      errorSum += Math.abs(actual[i] - forecast[i]);
    }
    return errorSum / (actual.length - 1);
  }

  function percentile(values, probability) {
    const sorted = values.slice().sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const position = (sorted.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }

  function diagnoseForecast(actual, options = {}) {
    const values = (actual || []).map(Number).filter(Number.isFinite);
    const method = options.method || "simple";
    const seasonLength = Number(options.seasonLength || 0);
    const seasonalType = options.seasonalType || "additive";
    const horizon = Math.max(1, Number(options.horizon || 1));
    const diagnostics = [];

    if (values.length < 6) {
      diagnostics.push({
        level: "caution",
        title: "Limited history",
        detected: `${values.length} usable demand periods.`,
        why: "Short histories can produce unstable smoothing levels and make forecast error difficult to judge.",
        consider: "Use the forecast directionally and add more recent, comparable periods before using it for planning.",
      });
    }
    if (method === "triple") {
      const seasons = seasonLength > 0 ? values.length / seasonLength : 0;
      if (seasons < 2) {
        diagnostics.push({
          level: "high-risk",
          title: "Seasonality cannot be estimated",
          detected: `Only ${seasons.toFixed(1)} seasonal cycles are available.`,
          why: "Holt-Winters needs at least two full cycles to initialise seasonal factors.",
          consider: "Add more history or choose simple or trend smoothing until seasonal history is available.",
        });
      } else if (seasons < 3) {
        diagnostics.push({
          level: "caution",
          title: "Weak seasonal evidence",
          detected: `${seasons.toFixed(1)} seasonal cycles are available.`,
          why: "Two cycles allow calculation, but seasonal factors may be fragile.",
          consider: "Validate the forecast against operational knowledge before using it for inventory or capacity decisions.",
        });
      }
      if (seasonalType === "multiplicative" && values.some((value) => value <= 0)) {
        diagnostics.push({
          level: "high-risk",
          title: "Multiplicative seasonality invalid",
          detected: "At least one demand value is zero or negative.",
          why: "Multiplicative seasonal factors divide by the seasonal level and require strictly positive demand.",
          consider: "Use additive seasonality or correct the demand history.",
        });
      }
    }
    if (values.length >= 6) {
      const q1 = percentile(values, 0.25);
      const q3 = percentile(values, 0.75);
      const iqr = q3 - q1;
      const outliers = iqr > 0 ? values.filter((value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length : 0;
      if (outliers) {
        diagnostics.push({
          level: "caution",
          title: "Potential demand outliers",
          detected: `${outliers} period${outliers === 1 ? "" : "s"} outside the 1.5 x IQR screening range.`,
          why: "Unusual demand spikes or drops can pull smoothing levels and distort next-period forecasts.",
          consider: "Confirm whether the period reflects genuine demand, a stockout, a promotion, or a data issue.",
        });
      }
    }
    if (horizon > Math.max(1, Math.floor(values.length / 3))) {
      diagnostics.push({
        level: "caution",
        title: "Forecast horizon is long relative to history",
        detected: `${horizon} forecast period${horizon === 1 ? "" : "s"} requested from ${values.length} historical periods.`,
        why: "Long horizons compound model uncertainty when the history is short.",
        consider: "Treat later periods as planning ranges rather than precise point forecasts.",
      });
    }
    diagnostics.push({
      level: "info",
      title: "Method fit guidance",
      detected: method === "simple" ? "Simple smoothing assumes level demand." : method === "double" ? "Holt smoothing allows a trend." : "Holt-Winters adds seasonal factors.",
      why: "The selected method should match the visible demand pattern.",
      consider: "Use SES for level demand, Holt for trend, and Holt-Winters only when seasonality repeats consistently.",
    });
    return diagnostics;
  }

  return {
    calculateSimpleExponentialSmoothing,
    calculateDoubleExponentialSmoothing,
    calculateTripleExponentialSmoothing,
    calculateMae,
    diagnoseForecast,
  };
}));

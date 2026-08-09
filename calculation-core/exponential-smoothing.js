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

  return {
    calculateSimpleExponentialSmoothing,
    calculateDoubleExponentialSmoothing,
    calculateTripleExponentialSmoothing,
    calculateMae,
  };
}));

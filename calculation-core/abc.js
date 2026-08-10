(function initialiseAbcCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHAbc = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createAbcCore() {
  function sumNumbers(values) {
    return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  }

  function populationStandardDeviation(values) {
    if (!values.length) return 0;
    const average = sumNumbers(values) / values.length;
    const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  function validateThresholds(thresholdA, thresholdB, thresholdX, thresholdY, useXyz) {
    if (!(thresholdA >= 0 && thresholdA < thresholdB && thresholdB <= 1)) {
      throw new Error("ABC thresholds must satisfy 0 <= A < B <= 1.");
    }
    if (useXyz && !(thresholdX >= 0 && thresholdX < thresholdY)) {
      throw new Error("XYZ thresholds must satisfy 0 <= X < Y.");
    }
  }

  function calculateAbcAnalysis(items, options = {}) {
    const thresholdA = options.thresholdA ?? 0.8;
    const thresholdB = options.thresholdB ?? 0.95;
    const thresholdX = options.thresholdX ?? 0.25;
    const thresholdY = options.thresholdY ?? 0.5;
    const useXyz = Boolean(options.useXyz);
    validateThresholds(thresholdA, thresholdB, thresholdX, thresholdY, useXyz);

    const sorted = items.map((item) => ({ ...item, calculatedValue: Number(item.calculatedValue) }))
      .filter((item) => item.name && Number.isFinite(item.calculatedValue) && item.calculatedValue >= 0)
      .sort((left, right) => right.calculatedValue - left.calculatedValue);
    const totalValue = sorted.reduce((sum, item) => sum + item.calculatedValue, 0);
    if (!sorted.length || totalValue <= 0) {
      throw new Error("At least one item with a positive value is required.");
    }

    let runningSum = 0;
    const results = sorted.map((item, index) => {
      const previousCumulative = runningSum / totalValue;
      runningSum += item.calculatedValue;
      const individualPercent = item.calculatedValue / totalValue;
      const cumulativePercent = runningSum / totalValue;
      let abcClass = "C";

      if (cumulativePercent <= thresholdA || previousCumulative < thresholdA) {
        abcClass = "A";
      } else if (cumulativePercent <= thresholdB || previousCumulative < thresholdB) {
        abcClass = "B";
      }

      let xyzClass = null;
      if (useXyz) {
        const coefficient = Number(item.coefficientOfVariation);
        if (!Number.isFinite(coefficient) || coefficient < 0) {
          throw new Error(`A valid coefficient of variation is required for ${item.name}.`);
        }
        xyzClass = coefficient <= thresholdX ? "X" : coefficient <= thresholdY ? "Y" : "Z";
      }

      return {
        ...item,
        rank: index + 1,
        value: item.calculatedValue,
        percent: individualPercent,
        cumulative: cumulativePercent,
        class: abcClass,
        xyzClass,
        combinedClass: useXyz ? `${abcClass}${xyzClass}` : null,
      };
    });

    return { totalValue, results };
  }

  return { sumNumbers, populationStandardDeviation, calculateAbcAnalysis };
}));

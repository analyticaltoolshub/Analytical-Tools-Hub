(function initialiseBreakEvenCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHBreakEven = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createBreakEvenCore() {
  function calculateBreakEven(data) {
    const contributionMargin = data.pricePerUnit - data.variableCost;
    const contributionMarginRatio = contributionMargin / data.pricePerUnit;
    const breakEvenUnits = data.fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * data.pricePerUnit;
    const targetProfitUnits = (data.fixedCosts + data.targetProfit) / contributionMargin;
    const expectedRevenue = data.expectedUnits * data.pricePerUnit;
    const expectedTotalCost = data.fixedCosts + (data.expectedUnits * data.variableCost);
    const expectedProfit = expectedRevenue - expectedTotalCost;
    const marginOfSafetyUnits = data.expectedUnits - breakEvenUnits;
    const marginOfSafetyPercent = data.expectedUnits > 0
      ? (marginOfSafetyUnits / data.expectedUnits) * 100
      : 0;

    return {
      ...data,
      contributionMargin,
      contributionMarginRatio,
      breakEvenUnits,
      breakEvenRevenue,
      targetProfitUnits,
      expectedRevenue,
      expectedTotalCost,
      expectedProfit,
      marginOfSafetyUnits,
      marginOfSafetyPercent,
    };
  }

  return { calculateBreakEven };
}));

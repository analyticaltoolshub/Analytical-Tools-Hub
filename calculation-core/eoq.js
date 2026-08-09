(function initialiseEoqCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHEoq = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createEoqCore() {
  function costAtQuantity(data, quantity) {
    const orderingCost = (data.annualDemand / quantity) * data.orderingCost;
    const holdingCost = (quantity / 2) * data.holdingCost;
    return {
      orderingCost,
      holdingCost,
      totalRelevantCost: orderingCost + holdingCost,
    };
  }

  function calculateEoq(data) {
    const eoq = Math.sqrt((2 * data.annualDemand * data.orderingCost) / data.holdingCost);
    const eoqCosts = costAtQuantity(data, eoq);
    const ordersPerYear = data.annualDemand / eoq;
    const averageInventory = eoq / 2;
    const cycleDays = data.workingDays > 0 ? data.workingDays / ordersPerYear : 0;
    const dailyDemand = data.workingDays > 0 ? data.annualDemand / data.workingDays : 0;
    const reorderPoint = dailyDemand * data.leadTime;
    const purchaseSpend = data.unitCost > 0 ? data.annualDemand * data.unitCost : 0;
    const currentCosts = data.currentOrderQty > 0 ? costAtQuantity(data, data.currentOrderQty) : null;
    const currentDifference = currentCosts ? currentCosts.totalRelevantCost - eoqCosts.totalRelevantCost : 0;

    return {
      ...data,
      eoq,
      annualOrderingCost: eoqCosts.orderingCost,
      annualHoldingCost: eoqCosts.holdingCost,
      totalRelevantCost: eoqCosts.totalRelevantCost,
      ordersPerYear,
      averageInventory,
      cycleDays,
      dailyDemand,
      reorderPoint,
      purchaseSpend,
      currentCosts,
      currentDifference,
    };
  }

  return { calculateEoq, costAtQuantity };
}));

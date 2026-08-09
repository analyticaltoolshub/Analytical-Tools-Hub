(function initialiseSafetyStockCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHSafetyStock = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createSafetyStockCore() {
  function calculateSafetyStock(data) {
    const leadTimeDemand = data.averageDemand * data.leadTime;
    const varianceDuringLeadTime =
      (data.leadTime * Math.pow(data.demandStdDev, 2)) +
      (Math.pow(data.averageDemand, 2) * Math.pow(data.leadTimeStdDev, 2));
    const safetyStock = data.zScore * Math.sqrt(varianceDuringLeadTime);
    const reorderPoint = leadTimeDemand + safetyStock;
    const inventoryPosition = data.onHandStock + data.onOrderStock - data.allocatedStock;
    const gapToRop = inventoryPosition - reorderPoint;
    const shouldReorder = inventoryPosition <= reorderPoint;
    const coverageDays = data.averageDemand > 0 ? inventoryPosition / data.averageDemand : 0;
    const safetyCoverageDays = data.averageDemand > 0 ? safetyStock / data.averageDemand : 0;

    return {
      ...data,
      leadTimeDemand,
      varianceDuringLeadTime,
      safetyStock,
      reorderPoint,
      inventoryPosition,
      gapToRop,
      shouldReorder,
      coverageDays,
      safetyCoverageDays,
    };
  }

  return { calculateSafetyStock };
}));

const test = require("node:test");
const assert = require("node:assert/strict");

const breakEven = require("../calculation-core/break-even.js");
const eoq = require("../calculation-core/eoq.js");
const safetyStock = require("../calculation-core/safety-stock.js");
const forecasting = require("../calculation-core/exponential-smoothing.js");
const ahp = require("../calculation-core/ahp.js");

function approximatelyEqual(actual, expected, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

test("Break-Even reproduces a hand-calculated reference case", () => {
  const result = breakEven.calculateBreakEven({
    fixedCosts: 25000,
    pricePerUnit: 120,
    variableCost: 72,
    expectedUnits: 750,
    targetProfit: 10000,
  });

  approximatelyEqual(result.contributionMargin, 48);
  approximatelyEqual(result.contributionMarginRatio, 0.4);
  approximatelyEqual(result.breakEvenUnits, 25000 / 48);
  approximatelyEqual(result.breakEvenRevenue, 62500);
  approximatelyEqual(result.targetProfitUnits, 35000 / 48);
  approximatelyEqual(result.expectedProfit, 11000);
  approximatelyEqual(result.marginOfSafetyPercent, (750 - (25000 / 48)) / 750 * 100);
});

test("EOQ reproduces the Wilson formula and cost-balance invariant", () => {
  const result = eoq.calculateEoq({
    annualDemand: 10000,
    orderingCost: 50,
    holdingCost: 2,
    unitCost: 10,
    workingDays: 250,
    leadTime: 5,
    currentOrderQty: 1000,
  });

  approximatelyEqual(result.eoq, Math.sqrt(500000));
  approximatelyEqual(result.annualOrderingCost, result.annualHoldingCost);
  approximatelyEqual(result.totalRelevantCost, 2 * Math.sqrt(500000));
  approximatelyEqual(result.dailyDemand, 40);
  approximatelyEqual(result.reorderPoint, 200);
  approximatelyEqual(result.purchaseSpend, 100000);
  approximatelyEqual(result.currentCosts.totalRelevantCost, 1500);
  assert.ok(result.currentDifference > 0, "The reference current policy should cost more than EOQ");
});

test("EOQ cost curve is minimized around the calculated quantity", () => {
  const data = { annualDemand: 12000, orderingCost: 80, holdingCost: 3 };
  const result = eoq.calculateEoq({ ...data, unitCost: 0, workingDays: 0, leadTime: 0, currentOrderQty: 0 });
  const lower = eoq.costAtQuantity(data, result.eoq * 0.8).totalRelevantCost;
  const upper = eoq.costAtQuantity(data, result.eoq * 1.2).totalRelevantCost;

  assert.ok(result.totalRelevantCost < lower);
  assert.ok(result.totalRelevantCost < upper);
});

test("Safety Stock combines demand and lead-time uncertainty correctly", () => {
  const data = {
    averageDemand: 50,
    demandStdDev: 10,
    leadTime: 4,
    leadTimeStdDev: 1,
    zScore: 1.645,
    serviceLevelText: "95%",
    onHandStock: 500,
    onOrderStock: 100,
    allocatedStock: 50,
  };
  const result = safetyStock.calculateSafetyStock(data);
  const expectedVariance = (4 * (10 ** 2)) + ((50 ** 2) * (1 ** 2));
  const expectedSafetyStock = 1.645 * Math.sqrt(expectedVariance);

  approximatelyEqual(result.varianceDuringLeadTime, expectedVariance);
  approximatelyEqual(result.safetyStock, expectedSafetyStock);
  approximatelyEqual(result.leadTimeDemand, 200);
  approximatelyEqual(result.reorderPoint, 200 + expectedSafetyStock);
  approximatelyEqual(result.inventoryPosition, 550);
  assert.equal(result.shouldReorder, false);
});

test("Safety Stock triggers replenishment at the reorder point boundary", () => {
  const result = safetyStock.calculateSafetyStock({
    averageDemand: 20,
    demandStdDev: 0,
    leadTime: 5,
    leadTimeStdDev: 0,
    zScore: 1.645,
    onHandStock: 100,
    onOrderStock: 0,
    allocatedStock: 0,
  });

  approximatelyEqual(result.safetyStock, 0);
  approximatelyEqual(result.reorderPoint, 100);
  assert.equal(result.shouldReorder, true);
});

test("Simple exponential smoothing reproduces a known sequence", () => {
  const result = forecasting.calculateSimpleExponentialSmoothing([100, 110, 120], 0.5);
  assert.deepEqual(result.forecast, [100, 100, 105]);
  approximatelyEqual(result.nextForecast, 112.5);
  approximatelyEqual(forecasting.calculateMae([100, 110, 120], result.forecast), 12.5);
});

test("Holt trend preserves a perfectly linear series", () => {
  const result = forecasting.calculateDoubleExponentialSmoothing([100, 110, 120, 130], 0.4, 0.3);
  result.forecast.forEach((value, index) => approximatelyEqual(value, 100 + (10 * index)));
  approximatelyEqual(result.nextForecast, 140);
});

test("Holt-Winters preserves a constant seasonal series", () => {
  const series = [100, 100, 100, 100, 100, 100, 100, 100];
  ["additive", "multiplicative"].forEach((seasonalType) => {
    const result = forecasting.calculateTripleExponentialSmoothing(series, 0.4, 0.2, 0.3, 4, seasonalType);
    result.forecast.forEach((value) => approximatelyEqual(value, 100));
    approximatelyEqual(result.nextForecast, 100);
  });
});

test("AHP builds reciprocal Saaty matrices", () => {
  const matrix = ahp.matrixFromAnswers(3, {
    "c-0-1": 3,
    "c-0-2": -5,
    "c-1-2": 2,
  }, "c");

  approximatelyEqual(matrix[0][1], 3);
  approximatelyEqual(matrix[1][0], 1 / 3);
  approximatelyEqual(matrix[0][2], 1 / 5);
  approximatelyEqual(matrix[2][0], 5);
  matrix.forEach((row, index) => approximatelyEqual(row[index], 1));
});

test("AHP recovers exact weights from a consistent matrix", () => {
  const expectedWeights = [0.5, 0.3, 0.2];
  const matrix = expectedWeights.map((rowWeight) =>
    expectedWeights.map((columnWeight) => rowWeight / columnWeight)
  );
  const result = ahp.calculateWeights(matrix);

  result.weights.forEach((weight, index) => approximatelyEqual(weight, expectedWeights[index]));
  approximatelyEqual(result.weights.reduce((sum, value) => sum + value, 0), 1);
  approximatelyEqual(result.cr, 0, 1e-12);
});

test("AHP aggregates multiple experts using the element-wise geometric mean", () => {
  const first = [[1, 3], [1 / 3, 1]];
  const second = [[1, 7], [1 / 7, 1]];
  const aggregate = ahp.aggregateMatrices([first, second]);

  approximatelyEqual(aggregate[0][1], Math.sqrt(21));
  approximatelyEqual(aggregate[1][0], 1 / Math.sqrt(21));
});

test("AHP calculates weighted alternative scores that sum to one", () => {
  const questionnaire = {
    criteria: ["Cost", "Quality"],
    alternatives: ["Supplier A", "Supplier B"],
  };
  const response = {
    questionnaire,
    answers: {
      criteria: { "c-0-1": 3 },
      alternatives: {
        "a-0-0-1": 3,
        "a-1-0-1": -3,
      },
    },
  };
  const result = ahp.calculateAhp([response]);

  approximatelyEqual(result.criteriaResult.weights[0], 0.75);
  approximatelyEqual(result.alternativeScores.reduce((sum, row) => sum + row.score, 0), 1);
  assert.equal(result.alternativeScores[0].alternative, "Supplier A");
  approximatelyEqual(result.alternativeScores[0].score, 0.625);
});

test("AHP rejects incompatible expert questionnaire structures", () => {
  const base = {
    questionnaire: { criteria: ["Cost"], alternatives: ["A", "B"] },
    answers: { criteria: {}, alternatives: { "a-0-0-1": 2 } },
  };
  const incompatible = {
    questionnaire: { criteria: ["Quality"], alternatives: ["A", "B"] },
    answers: { criteria: {}, alternatives: { "a-0-0-1": 2 } },
  };

  assert.throws(() => ahp.calculateAhp([base, incompatible]), /same questionnaire structure/);
});

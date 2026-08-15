const test = require("node:test");
const assert = require("node:assert/strict");

const breakEven = require("../calculation-core/break-even.js");
const eoq = require("../calculation-core/eoq.js");
const safetyStock = require("../calculation-core/safety-stock.js");
const forecasting = require("../calculation-core/exponential-smoothing.js");
const ahp = require("../calculation-core/ahp.js");
const abc = require("../calculation-core/abc.js");
const kraljic = require("../calculation-core/kraljic.js");
const ism = require("../calculation-core/ism.js");
const gantt = require("../calculation-core/gantt.js");
const monteCarlo = require("../calculation-core/monte-carlo.js");
const newsvendor = require("../calculation-core/newsvendor.js");
const dea = require("../calculation-core/dea.js");

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

test("ABC keeps the item that crosses a cutoff in the higher-priority class", () => {
  const result = abc.calculateAbcAnalysis([
    { name: "Dominant item", calculatedValue: 90 },
    { name: "Remaining item", calculatedValue: 10 },
  ]);

  assert.equal(result.results[0].class, "A");
  assert.equal(result.results[1].class, "B");
  approximatelyEqual(result.results[0].cumulative, 0.9);
});

test("ABC plus XYZ applies inclusive variability thresholds", () => {
  const result = abc.calculateAbcAnalysis([
    { name: "X boundary", calculatedValue: 80, coefficientOfVariation: 0.25 },
    { name: "Y boundary", calculatedValue: 15, coefficientOfVariation: 0.5 },
    { name: "Z item", calculatedValue: 5, coefficientOfVariation: 0.8 },
  ], { useXyz: true });

  assert.deepEqual(result.results.map((row) => row.xyzClass), ["X", "Y", "Z"]);
  assert.deepEqual(result.results.map((row) => row.combinedClass), ["AX", "BY", "CZ"]);
});

test("Kraljic calculates weighted risk and all four portfolio quadrants", () => {
  const risk = kraljic.calculateRiskDetails({
    scoresConfirmed: true,
    weightMode: "custom",
    factors: [{ id: "continuity" }, { id: "quality" }],
    scores: { continuity: 5, quality: 2 },
    weights: { continuity: 60, quality: 40 },
  });

  approximatelyEqual(risk.overall, 3.8);
  assert.deepEqual(
    [[4, 4], [2, 4], [4, 2], [2, 2]].map(([impact, score]) => kraljic.classifyItem({ impact, risk: score })),
    ["strategic", "bottleneck", "leverage", "non-critical"]
  );
  assert.equal(kraljic.calculateRiskDetails({ ...risk.assessment, weights: { continuity: 50, quality: 40 } }), null);
});

test("Kraljic maps relative annual spend onto the 1-to-5 impact scale", () => {
  const result = kraljic.calculateImpactScores([
    { name: "Low", annualSpend: 100 },
    { name: "Middle", annualSpend: 300 },
    { name: "High", annualSpend: 500 },
  ]);
  assert.deepEqual(result.map((row) => row.impact), [1, 3, 5]);
});

test("ISM converts SSIM judgements and creates a multi-level transitive hierarchy", () => {
  const factors = [{ id: "F1" }, { id: "F2" }, { id: "F3" }];
  const relationships = new Map([
    [ism.relationshipKey("F1", "F2"), "V"],
    [ism.relationshipKey("F1", "F3"), "O"],
    [ism.relationshipKey("F2", "F3"), "V"],
  ]);
  const result = ism.analyzeModel(factors, relationships);

  assert.deepEqual(result.initialMatrix, [[1, 1, 0], [0, 1, 1], [0, 0, 1]]);
  assert.deepEqual(result.finalMatrix, [[1, 1, 1], [0, 1, 1], [0, 0, 1]]);
  assert.equal(result.transitive[0][2], true);
  assert.deepEqual(result.levels, [[2], [1], [0]]);
  assert.deepEqual(result.factorLevels, [3, 2, 1]);
  assert.deepEqual(result.driving, [3, 2, 1]);
  assert.deepEqual(result.dependence, [1, 2, 3]);
});

test("ISM honours reciprocal and bidirectional SSIM symbols", () => {
  const factors = [{ id: "F1" }, { id: "F2" }, { id: "F3" }];
  const matrix = ism.buildInitialMatrix(factors, new Map([
    ["F1::F2", "A"],
    ["F1::F3", "X"],
    ["F2::F3", "O"],
  ]));
  assert.deepEqual(matrix, [[1, 0, 1], [1, 1, 0], [1, 0, 1]]);
});

test("Monte Carlo parser handles unary signs without changing precedence", () => {
  approximatelyEqual(monteCarlo.evaluateFormula("A * -1", { A: 7 }), -7);
  approximatelyEqual(monteCarlo.evaluateFormula("-(A + B) * 2", { A: 3, B: 4 }), -14);
  approximatelyEqual(monteCarlo.evaluateFormula("A + -B * 2", { A: 10, B: 3 }), 4);
  assert.throws(() => monteCarlo.evaluateFormula("A + Unknown", { A: 1 }), /Unknown formula variable/);
});

test("Monte Carlo seeded simulation is deterministic and reports target probability", async () => {
  const config = {
    modelName: "Reference",
    outputName: "Outcome",
    formula: "A + B * -1",
    seed: 123,
    iterations: 1000,
    targetValue: 4,
    targetCondition: "gte",
    confidenceLevel: 90,
    variables: [
      { id: "A", name: "A", distribution: "fixed", params: { value: 10 } },
      { id: "B", name: "B", distribution: "fixed", params: { value: 5 } },
    ],
  };
  const first = await monteCarlo.runSimulation(config);
  const second = await monteCarlo.runSimulation(config);

  assert.deepEqual(first.summary, second.summary);
  approximatelyEqual(first.summary.mean, 5);
  approximatelyEqual(first.summary.standardDeviation, 0);
  approximatelyEqual(first.summary.targetProbability, 1);
  assert.equal(first.valid, 1000);
});

test("Newsvendor reproduces the critical-ratio optimum for symmetric Uniform demand", () => {
  const demand = {
    distribution: "uniform",
    baseMean: 100,
    baseStdDev: 20,
    demandMean: 100,
    demandStdDev: 20,
    values: [],
    adjusted: false,
  };
  const economics = {
    sellingPrice: 20,
    unitCost: 10,
    salvageValue: 0,
    shortageCost: 0,
    holdingCost: 0,
    packSize: 1,
    roundingMethod: "profit",
    currentOrderQty: 80,
    minimumOrderQty: null,
    maximumOrderQty: null,
    storageCapacity: null,
    purchaseBudget: null,
    minimumServiceLevel: null,
  };
  const result = newsvendor.calculateNewsvendor(demand, economics);

  approximatelyEqual(result.underageCost, 10);
  approximatelyEqual(result.overageCost, 10);
  approximatelyEqual(result.criticalRatio, 0.5);
  approximatelyEqual(result.rawOptimalQuantity, 100);
  assert.equal(result.optimalQuantity, 100);
  approximatelyEqual(result.optimized.serviceLevel, 0.5);
  assert.ok(result.optimized.expectedProfit > result.current.expectedProfit);
});

test("Newsvendor applies pack sizes and operational constraints explicitly", () => {
  const model = newsvendor.buildDemandModel({
    distribution: "empirical",
    baseMean: 20,
    baseStdDev: 10,
    demandMean: 20,
    demandStdDev: 10,
    values: [10, 20, 30, 40],
    adjusted: false,
  });
  const economics = {
    sellingPrice: 20,
    unitCost: 10,
    salvageValue: 0,
    shortageCost: 0,
    holdingCost: 0,
    packSize: 12,
    roundingMethod: "profit",
    minimumOrderQty: 24,
    maximumOrderQty: 36,
    storageCapacity: null,
    purchaseBudget: null,
    minimumServiceLevel: null,
  };
  const constrained = newsvendor.applyOperationalConstraints(48, model, economics);
  assert.equal(constrained.quantity, 36);
  assert.ok(constrained.binding.includes("maximum order quantity"));
  approximatelyEqual(newsvendor.poissonOutcomes(8).reduce((sum, row) => sum + row.probability, 0), 1);
});

test("DEA reproduces a hand-calculated one-input, one-output CCR frontier", () => {
  const result = dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Labour hours"],
    outputNames: ["Completed orders"],
    dmus: [
      { name: "Unit A", inputs: [1], outputs: [1] },
      { name: "Unit B", inputs: [2], outputs: [1] },
      { name: "Unit C", inputs: [1], outputs: [0.5] },
    ],
  });

  approximatelyEqual(result.results[0].efficiency, 1);
  approximatelyEqual(result.results[1].efficiency, 0.5);
  approximatelyEqual(result.results[2].efficiency, 0.5);
  approximatelyEqual(result.results[1].inputTargets[0], 1);
  assert.equal(result.summary.efficientCount, 1);
});

test("DEA CCR output orientation reproduces the same ratio frontier", () => {
  const result = dea.analyseDea({
    model: "ccr",
    orientation: "output",
    inputNames: ["Labour hours"],
    outputNames: ["Completed orders"],
    dmus: [
      { name: "Unit A", inputs: [1], outputs: [1] },
      { name: "Unit B", inputs: [2], outputs: [1] },
      { name: "Unit C", inputs: [1], outputs: [0.5] },
    ],
  });

  approximatelyEqual(result.results[0].efficiency, 1);
  approximatelyEqual(result.results[1].radialFactor, 2);
  approximatelyEqual(result.results[1].efficiency, 0.5);
  approximatelyEqual(result.results[1].outputTargets[0], 2);
  approximatelyEqual(result.results[2].efficiency, 0.5);
  assert.equal(result.results[1].rank, result.results[2].rank);
});

const bccReferenceDmus = [
  { name: "Unit A", inputs: [1], outputs: [1] },
  { name: "Unit B", inputs: [2], outputs: [3] },
  { name: "Unit C", inputs: [3], outputs: [4] },
  { name: "Unit D", inputs: [2], outputs: [2] },
];

test("DEA BCC input orientation reproduces a convex peer benchmark", () => {
  const result = dea.analyseDea({
    model: "bcc",
    orientation: "input",
    inputNames: ["Input"],
    outputNames: ["Output"],
    dmus: bccReferenceDmus,
  });
  const unitD = result.results.find((row) => row.name === "Unit D");

  approximatelyEqual(unitD.efficiency, 0.75);
  approximatelyEqual(unitD.radialFactor, 0.75);
  approximatelyEqual(unitD.inputTargets[0], 1.5);
  approximatelyEqual(unitD.outputTargets[0], 2);
  approximatelyEqual(unitD.lambdas.reduce((sum, value) => sum + value, 0), 1);
});

test("DEA calculates exact scale efficiency from matched CCR and BCC scores", () => {
  const config = {
    orientation: "input",
    inputNames: ["Input"],
    outputNames: ["Output"],
    dmus: bccReferenceDmus,
  };
  const ccr = dea.analyseDea({ ...config, model: "ccr" });
  const bcc = dea.analyseDea({ ...config, model: "bcc" });
  const ccrUnitD = ccr.results.find((row) => row.name === "Unit D");
  const bccUnitD = bcc.results.find((row) => row.name === "Unit D");

  approximatelyEqual(ccrUnitD.efficiency, 2 / 3);
  approximatelyEqual(bccUnitD.efficiency, 3 / 4);
  approximatelyEqual(dea.calculateScaleEfficiency(ccrUnitD.efficiency, bccUnitD.efficiency), 8 / 9);
  assert.throws(() => dea.calculateScaleEfficiency(0.9, 0.8), /cannot materially exceed/);
});

test("DEA BCC output orientation reproduces an exact expansion target", () => {
  const result = dea.analyseDea({
    model: "bcc",
    orientation: "output",
    inputNames: ["Input"],
    outputNames: ["Output"],
    dmus: bccReferenceDmus,
  });
  const unitD = result.results.find((row) => row.name === "Unit D");

  approximatelyEqual(unitD.radialFactor, 1.5);
  approximatelyEqual(unitD.efficiency, 2 / 3);
  approximatelyEqual(unitD.inputTargets[0], 2);
  approximatelyEqual(unitD.outputTargets[0], 3);
  approximatelyEqual(unitD.lambdas[1], 1);
  approximatelyEqual(unitD.lambdas.reduce((sum, value) => sum + value, 0), 1);
});

test("DEA returns exact peer targets and non-radial input and output slacks", () => {
  const inputSlack = dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Input 1", "Input 2"],
    outputNames: ["Output"],
    dmus: [
      { name: "Peer", inputs: [1, 1], outputs: [1] },
      { name: "Reviewed unit", inputs: [2, 3], outputs: [1] },
    ],
  }).results[1];
  approximatelyEqual(inputSlack.efficiency, 0.5);
  approximatelyEqual(inputSlack.inputTargets[0], 1);
  approximatelyEqual(inputSlack.inputTargets[1], 1);
  approximatelyEqual(inputSlack.inputSlacks[0], 0);
  approximatelyEqual(inputSlack.inputSlacks[1], 0.5);
  assert.deepEqual(inputSlack.peers.map((peer) => peer.name), ["Peer"]);

  const outputSlack = dea.analyseDea({
    model: "bcc",
    orientation: "output",
    inputNames: ["Input"],
    outputNames: ["Output 1", "Output 2"],
    dmus: [
      { name: "Peer", inputs: [1], outputs: [1, 1] },
      { name: "Reviewed unit", inputs: [1], outputs: [1, 0.5] },
    ],
  }).results[1];
  approximatelyEqual(outputSlack.efficiency, 1);
  approximatelyEqual(outputSlack.outputTargets[0], 1);
  approximatelyEqual(outputSlack.outputTargets[1], 1);
  approximatelyEqual(outputSlack.outputSlacks[0], 0);
  approximatelyEqual(outputSlack.outputSlacks[1], 0.5);
  assert.equal(outputSlack.efficient, false);
});

test("DEA handles degeneracy, tied ranks, duplicate observations, and zero values", () => {
  const result = dea.analyseDea({
    model: "bcc",
    orientation: "input",
    inputNames: ["Input 1", "Input 2"],
    outputNames: ["Output 1", "Output 2"],
    dmus: [
      { name: "Unit A", inputs: [1, 0], outputs: [1, 0] },
      { name: "Unit A duplicate observation", inputs: [1, 0], outputs: [1, 0] },
      { name: "Unit B", inputs: [0, 1], outputs: [0, 1] },
      { name: "Unit C", inputs: [1, 1], outputs: [0.5, 0.5] },
    ],
  });

  assert.equal(result.results[0].rank, 1);
  assert.equal(result.results[1].rank, 1);
  assert.equal(result.results[2].rank, 1);
  assert.equal(result.results[3].rank, 4);
  approximatelyEqual(result.results[3].efficiency, 0.5);
});

test("DEA remains stable when input and output units use very different scales", () => {
  const base = [
    { name: "Unit A", inputs: [1], outputs: [1] },
    { name: "Unit B", inputs: [2], outputs: [1] },
    { name: "Unit C", inputs: [1], outputs: [0.5] },
  ];
  const scaled = base.map((row) => ({
    name: row.name,
    inputs: row.inputs.map((value) => value * 1e6),
    outputs: row.outputs.map((value) => value * 1e-3),
  }));
  const baseResult = dea.analyseDea({ model: "ccr", orientation: "input", inputNames: ["Input"], outputNames: ["Output"], dmus: base });
  const scaledResult = dea.analyseDea({ model: "ccr", orientation: "input", inputNames: ["Input"], outputNames: ["Output"], dmus: scaled });
  baseResult.results.forEach((row, index) => approximatelyEqual(row.efficiency, scaledResult.results[index].efficiency));
});

test("DEA reports sample-size adequacy as guidance rather than a validity gate", () => {
  assert.deepEqual(dea.assessSampleAdequacy(3, 2, 2), {
    dmuCount: 3,
    measureCount: 4,
    recommendedMinimum: 12,
    meetsHeuristic: false,
  });
  assert.equal(dea.assessSampleAdequacy(12, 2, 2).meetsHeuristic, true);
});

test("DEA evaluates a future scenario against historical references without adding a scenario lambda", () => {
  const result = dea.evaluateScenario({
    model: "bcc",
    orientation: "input",
    inputNames: ["Input"],
    outputNames: ["Output"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    scenario: { name: "Future plan", inputs: [2], outputs: [2] },
  });

  assert.equal(result.selected.feasible, true);
  approximatelyEqual(result.selected.result.efficiency, 0.75);
  assert.equal(result.selected.result.lambdas.length, 3);
  assert.equal(result.selected.result.peers.some((peer) => peer.name === "Future plan"), false);
  assert.equal(result.referenceDmus.some((dmu) => dmu.name === "Future plan"), false);
});

test("DEA scenario analysis classifies increasing, constant, and decreasing returns to scale", () => {
  const referenceDmus = [
    { name: "Historical A", inputs: [1], outputs: [1] },
    { name: "Historical B", inputs: [2], outputs: [3] },
    { name: "Historical C", inputs: [4], outputs: [4] },
  ];
  const evaluate = (scenario) => dea.evaluateScenario({
    model: "bcc", orientation: "input", inputNames: ["Input"], outputNames: ["Output"], referenceDmus, scenario,
  });

  assert.equal(evaluate({ name: "Small plan", inputs: [1], outputs: [1] }).returnsToScale, "Increasing returns to scale");
  assert.equal(evaluate({ name: "Middle plan", inputs: [2], outputs: [3] }).returnsToScale, "Constant returns to scale");
  assert.equal(evaluate({ name: "Large plan", inputs: [4], outputs: [4] }).returnsToScale, "Decreasing returns to scale");
});

test("DEA scenario analysis supports an exact output-oriented benchmark", () => {
  const result = dea.evaluateScenario({
    model: "bcc",
    orientation: "output",
    inputNames: ["Input"],
    outputNames: ["Output"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    scenario: { name: "Future plan", inputs: [2], outputs: [2] },
  });

  assert.equal(result.selected.feasible, true);
  approximatelyEqual(result.selected.result.radialFactor, 1.5);
  approximatelyEqual(result.selected.result.efficiency, 2 / 3);
  approximatelyEqual(result.selected.result.outputTargets[0], 3);
  assert.equal(result.returnsToScale, "Available for input-oriented scenarios only");
});

test("DEA scenario analysis warns outside observed output ranges and withholds infeasible BCC results", () => {
  const result = dea.evaluateScenario({
    model: "bcc",
    orientation: "input",
    inputNames: ["Input"],
    outputNames: ["Output"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    scenario: { name: "Outside plan", inputs: [5], outputs: [6] },
  });

  assert.equal(result.bcc.feasible, false);
  assert.equal(result.selected.result, null);
  assert.deepEqual(result.outputRangeWarnings, [{ name: "Output", value: 6, maximum: 4 }]);
  assert.equal(result.ccr.feasible, true);
});

test("DEA scenario analysis validates reference selection and future-plan values", () => {
  const base = {
    model: "bcc", orientation: "input", inputNames: ["Input"], outputNames: ["Output"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
    ],
    scenario: { name: "Future plan", inputs: [2], outputs: [2] },
  };
  assert.throws(() => dea.evaluateScenario({ ...base, referenceDmus: base.referenceDmus.slice(0, 1) }), /at least two/);
  assert.throws(() => dea.evaluateScenario({ ...base, scenario: { ...base.scenario, inputs: [""] } }), /Future plan: Input is required/);
  assert.throws(() => dea.evaluateScenario({ ...base, scenario: { ...base.scenario, name: "Historical A" } }), /must differ/);
});

test("DEA benchmark scenario generates input requirements from target outputs without adding scenario lambdas", () => {
  const result = dea.evaluateScenarioBenchmark({
    mode: "inputRequirement",
    model: "bcc",
    inputNames: ["Labour"],
    outputNames: ["Orders"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    values: [3],
  });

  assert.equal(result.selected.feasible, true);
  approximatelyEqual(result.selected.result.generatedInputs[0], 2);
  approximatelyEqual(result.selected.result.generatedOutputs[0], 3);
  assert.deepEqual(result.selected.result.peers.map((peer) => peer.name), ["Historical B"]);
  assert.equal(result.referenceDmus.some((dmu) => dmu.name === "Future Scenario Plan"), false);
});

test("DEA benchmark scenario generates output requirements from available inputs using a fixed frontier", () => {
  const result = dea.evaluateScenarioBenchmark({
    mode: "outputRequirement",
    model: "ccr",
    inputNames: ["Labour"],
    outputNames: ["Orders"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    values: [2],
  });

  assert.equal(result.selected.feasible, true);
  approximatelyEqual(result.selected.result.generatedInputs[0], 2);
  approximatelyEqual(result.selected.result.generatedOutputs[0], 3);
  assert.equal(result.selected.result.lambdas.length, 3);
  assert.equal(result.selected.result.peers.some((peer) => peer.name === "Future Scenario Plan"), false);
});

test("DEA benchmark scenario warns and withholds unsupported BCC benchmarks", () => {
  const result = dea.evaluateScenarioBenchmark({
    mode: "inputRequirement",
    model: "bcc",
    inputNames: ["Labour"],
    outputNames: ["Orders"],
    referenceDmus: [
      { name: "Historical A", inputs: [1], outputs: [1] },
      { name: "Historical B", inputs: [2], outputs: [3] },
      { name: "Historical C", inputs: [4], outputs: [4] },
    ],
    values: [6],
  });

  assert.equal(result.selected.feasible, false);
  assert.equal(result.selected.result, null);
  assert.deepEqual(result.warnings.map((warning) => warning.type), ["outputRange", "bccFeasibility"]);
  assert.equal(result.ccr.feasible, true);
});

test("DEA rejects incomplete and non-comparable datasets", () => {
  assert.throws(() => dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Cost"],
    outputNames: ["Orders"],
    dmus: [{ name: "Only unit", inputs: [10], outputs: [20] }],
  }), /at least two/);
  assert.throws(() => dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Cost"],
    outputNames: ["Orders"],
    dmus: [
      { name: "Unit A", inputs: [-1], outputs: [20] },
      { name: "Unit B", inputs: [2], outputs: [15] },
    ],
  }), /non-negative/);
  assert.throws(() => dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Cost"],
    outputNames: ["Orders"],
    dmus: [
      { name: "Unit A", inputs: [""], outputs: [20] },
      { name: "Unit B", inputs: [2], outputs: [15] },
    ],
  }), /Unit A: Cost is required/);
  assert.throws(() => dea.analyseDea({
    model: "ccr",
    orientation: "input",
    inputNames: ["Cost"],
    outputNames: ["Orders"],
    dmus: [
      { name: "Unit A", inputs: [1], outputs: [20] },
      { name: "unit a", inputs: [2], outputs: [15] },
    ],
  }), /names must be unique/);
  assert.throws(() => dea.analyseDea({
    model: "invalid",
    orientation: "input",
    inputNames: ["Cost"],
    outputNames: ["Orders"],
    dmus: [
      { name: "Unit A", inputs: [1], outputs: [20] },
      { name: "Unit B", inputs: [2], outputs: [15] },
    ],
  }), /model must be CCR or BCC/);
});

test("Gantt day arithmetic remains stable across daylight-saving transitions", () => {
  const start = new Date(2026, 2, 28, 12);
  const end = new Date(2026, 2, 30, 12);
  assert.equal(gantt.daysBetween(start, end), 2);
  assert.equal(gantt.formatDate(gantt.addDays(start, 2)), "2026-03-30");
  assert.equal(gantt.getWeekStart(new Date(2026, 5, 17)).getDay(), 0);
  assert.equal(gantt.getWeekEnd(new Date(2026, 5, 17)).getDay(), 6);
});

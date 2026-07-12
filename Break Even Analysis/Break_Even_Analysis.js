const inputs = {
  fixedCosts: document.getElementById("fixedCosts"),
  pricePerUnit: document.getElementById("pricePerUnit"),
  variableCost: document.getElementById("variableCost"),
  expectedUnits: document.getElementById("expectedUnits"),
  targetProfit: document.getElementById("targetProfit"),
  currencySymbol: document.getElementById("currencySymbol"),
};

const elements = {
  error: document.getElementById("errorMessage"),
  results: document.getElementById("results"),
  chartSection: document.getElementById("chart-section"),
  breakEvenUnits: document.getElementById("breakEvenUnits"),
  breakEvenRevenue: document.getElementById("breakEvenRevenue"),
  contributionMargin: document.getElementById("contributionMargin"),
  marginOfSafety: document.getElementById("marginOfSafety"),
  interpretation: document.getElementById("interpretation"),
  chart: document.getElementById("breakEvenChart"),
  chartNote: document.getElementById("chartNote"),
  chartSummary: document.getElementById("chartSummary"),
  chartReadout: document.getElementById("chartReadout"),
  scenarioToggle: document.getElementById("scenarioToggle"),
  readoutLabel: document.getElementById("readoutLabel"),
  readoutUnits: document.getElementById("readoutUnits"),
  readoutRevenue: document.getElementById("readoutRevenue"),
  readoutVariableCosts: document.getElementById("readoutVariableCosts"),
  readoutTotalCosts: document.getElementById("readoutTotalCosts"),
  readoutProfit: document.getElementById("readoutProfit"),
};

let latestResult = null;
let latestChartModel = null;
let scenarioPlanningActive = false;

function numberValue(input) {
  return Number(input.value);
}

function currency() {
  return inputs.currencySymbol.value.trim() || "\u00a3";
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function formatCurrency(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${currency()}${formatNumber(Math.abs(value), 2)}`;
}

function showError(message) {
  elements.error.textContent = message;
}

function clearError() {
  elements.error.textContent = "";
}

function getInputData() {
  return {
    fixedCosts: numberValue(inputs.fixedCosts),
    pricePerUnit: numberValue(inputs.pricePerUnit),
    variableCost: numberValue(inputs.variableCost),
    expectedUnits: numberValue(inputs.expectedUnits),
    targetProfit: numberValue(inputs.targetProfit) || 0,
  };
}

function validate(data) {
  if (Object.values(data).some((value) => Number.isNaN(value))) {
    return "Enter valid numeric values before calculating.";
  }
  if (data.fixedCosts < 0 || data.pricePerUnit <= 0 || data.variableCost < 0 || data.expectedUnits < 0 || data.targetProfit < 0) {
    return "Use positive values. Price must be greater than zero.";
  }
  if (data.pricePerUnit <= data.variableCost) {
    return "Selling price must be greater than variable cost per unit to calculate a viable break-even point.";
  }
  return "";
}

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
  const marginOfSafetyPercent = data.expectedUnits > 0 ? (marginOfSafetyUnits / data.expectedUnits) * 100 : 0;

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

function renderResults(result) {
  elements.results.classList.remove("hidden");
  elements.chartSection.classList.remove("hidden");

  elements.breakEvenUnits.textContent = formatNumber(Math.ceil(result.breakEvenUnits));
  elements.breakEvenRevenue.textContent = formatCurrency(result.breakEvenRevenue);
  elements.contributionMargin.textContent = `${formatCurrency(result.contributionMargin)} (${formatNumber(result.contributionMarginRatio * 100, 1)}%)`;
  elements.marginOfSafety.textContent = `${formatNumber(result.marginOfSafetyPercent, 1)}%`;

  const profitText = result.expectedProfit >= 0
    ? `At ${formatNumber(result.expectedUnits)} expected units, the scenario is above break-even with an estimated profit of ${formatCurrency(result.expectedProfit)}.`
    : `At ${formatNumber(result.expectedUnits)} expected units, the scenario is below break-even with an estimated loss of ${formatCurrency(Math.abs(result.expectedProfit))}.`;
  const targetText = result.targetProfit > 0
    ? ` To reach a target profit of ${formatCurrency(result.targetProfit)}, estimated sales need to reach ${formatNumber(Math.ceil(result.targetProfitUnits))} units.`
    : "";

  elements.interpretation.textContent = `${profitText}${targetText}`;
  elements.chartNote.textContent = `Break-even occurs at approximately ${formatNumber(result.breakEvenUnits, 1)} units and ${formatCurrency(result.breakEvenRevenue)} in revenue.`;
  elements.chartSummary.textContent = `Break-even units are ${formatNumber(result.breakEvenUnits, 1)}. At expected sales of ${formatNumber(result.expectedUnits)} units, estimated profit is ${formatCurrency(result.expectedProfit)}.`;
}

function buildChartModel(result) {
  const canvas = elements.chart;
  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 86, right: 42, top: 44, bottom: 66 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxUnits = Math.max(result.expectedUnits, result.targetProfitUnits, result.breakEvenUnits) * 1.45 || 100;
  const maxValue = Math.max(
    maxUnits * result.pricePerUnit,
    result.fixedCosts + (maxUnits * result.variableCost)
  ) * 1.12;

  return {
    width,
    height,
    padding,
    plotWidth,
    plotHeight,
    maxUnits,
    maxValue,
    x: (units) => padding.left + (units / maxUnits) * plotWidth,
    y: (value) => padding.top + plotHeight - (value / maxValue) * plotHeight,
    unitsFromX: (canvasX) => Math.min(maxUnits, Math.max(0, ((canvasX - padding.left) / plotWidth) * maxUnits)),
  };
}

function valuesAtUnits(result, units) {
  const revenue = units * result.pricePerUnit;
  const variableCosts = units * result.variableCost;
  const totalCosts = result.fixedCosts + variableCosts;

  return {
    units,
    revenue,
    variableCosts,
    totalCosts,
    profit: revenue - totalCosts,
  };
}

function updateReadout(values, label) {
  elements.chartReadout.hidden = false;
  elements.readoutLabel.textContent = label;
  elements.readoutUnits.textContent = formatNumber(values.units, 1);
  elements.readoutRevenue.textContent = formatCurrency(values.revenue);
  elements.readoutVariableCosts.textContent = formatCurrency(values.variableCosts);
  elements.readoutTotalCosts.textContent = formatCurrency(values.totalCosts);
  elements.readoutProfit.textContent = formatCurrency(values.profit);
  elements.readoutProfit.classList.toggle("is-positive", values.profit >= 0);
  elements.readoutProfit.classList.toggle("is-negative", values.profit < 0);
}

function drawChart(result, selectedUnits = result.expectedUnits, label = "Current", showScenario = scenarioPlanningActive) {
  const canvas = elements.chart;
  const ctx = canvas.getContext("2d");
  const model = buildChartModel(result);
  latestChartModel = model;
  const { width, height, padding, plotWidth, plotHeight, maxUnits, maxValue, x, y } = model;
  const selected = valuesAtUnits(result, selectedUnits);
  const beX = x(result.breakEvenUnits);
  const beY = y(result.breakEvenRevenue);
  const selectedX = x(selected.units);
  const selectedRevenueY = y(selected.revenue);
  const selectedCostY = y(selected.totalCosts);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (showScenario && selected.revenue !== selected.totalCosts) {
    ctx.beginPath();
    ctx.moveTo(selectedX, selectedRevenueY);
    ctx.lineTo(selectedX, selectedCostY);
    ctx.lineTo(beX, beY);
    ctx.closePath();
    ctx.fillStyle = selected.profit >= 0 ? "rgba(34, 197, 94, .16)" : "rgba(225, 29, 72, .12)";
    ctx.fill();
  }

  ctx.strokeStyle = "#e4e7ec";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#475467";
  ctx.font = "13px Inter, sans-serif";

  for (let i = 0; i <= 5; i += 1) {
    const units = (maxUnits / 5) * i;
    const value = (maxValue / 5) * i;

    ctx.beginPath();
    ctx.moveTo(padding.left, y(value));
    ctx.lineTo(width - padding.right, y(value));
    ctx.stroke();

    ctx.fillText(formatCurrency(value), 10, y(value) + 4);
    ctx.fillText(formatNumber(units), x(units) - 10, height - 24);
  }

  ctx.strokeStyle = "#101828";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  function drawLine(label, color, startValue, endValue) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x(0), y(startValue));
    ctx.lineTo(x(maxUnits), y(endValue));
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "700 13px Inter, sans-serif";
    ctx.fillText(label, x(maxUnits) - 145, y(endValue) - 8);
  }

  drawLine("Total Revenue", "#1f6feb", 0, maxUnits * result.pricePerUnit);
  drawLine("Total Cost", "#fb7185", result.fixedCosts, result.fixedCosts + (maxUnits * result.variableCost));
  drawLine("Fixed Cost", "#475467", result.fixedCosts, result.fixedCosts);

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(beX, beY);
  ctx.lineTo(beX, height - padding.bottom);
  ctx.moveTo(padding.left, beY);
  ctx.lineTo(beX, beY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(beX, beY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "800 13px Inter, sans-serif";
  ctx.fillText("Break-even", beX + 10, beY - 10);

  if (showScenario) {
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(selectedX, padding.top);
    ctx.lineTo(selectedX, height - padding.bottom);
    ctx.moveTo(padding.left, selectedRevenueY);
    ctx.lineTo(selectedX, selectedRevenueY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#1f6feb";
    ctx.beginPath();
    ctx.arc(selectedX, selectedRevenueY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(selectedX, selectedCostY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = selected.profit >= 0 ? "#047857" : "#b42318";
    ctx.font = "800 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, selectedX, padding.top - 14);
    ctx.textAlign = "start";

    updateReadout(selected, label);
  } else {
    elements.chartReadout.hidden = true;
  }
}

function calculate() {
  const data = getInputData();
  const validationError = validate(data);
  if (validationError) {
    showError(validationError);
    return;
  }

  clearError();
  latestResult = calculateBreakEven(data);
  renderResults(latestResult);
  drawChart(latestResult, latestResult.expectedUnits, "Current", scenarioPlanningActive);
}

function loadSample() {
  inputs.fixedCosts.value = "25000";
  inputs.pricePerUnit.value = "120";
  inputs.variableCost.value = "72";
  inputs.expectedUnits.value = "750";
  inputs.targetProfit.value = "15000";
  inputs.currencySymbol.value = "\u00a3";
  calculate();
}

function reset() {
  Object.values(inputs).forEach((input) => {
    if (input.id === "currencySymbol") {
      input.value = "\u00a3";
    } else {
      input.value = "";
    }
  });
  latestResult = null;
  scenarioPlanningActive = false;
  elements.scenarioToggle.setAttribute("aria-pressed", "false");
  document.body.classList.remove("scenario-planning");
  clearError();
  elements.results.classList.add("hidden");
  elements.chartSection.classList.add("hidden");
  elements.chartReadout.hidden = true;
  elements.chartSummary.textContent = "";
  latestChartModel = null;
}

function exportCsv() {
  if (!latestResult) {
    showError("Calculate a break-even scenario before exporting.");
    return;
  }

  const rows = [
    ["Metric", "Value"],
    ["Fixed Costs", latestResult.fixedCosts],
    ["Selling Price per Unit", latestResult.pricePerUnit],
    ["Variable Cost per Unit", latestResult.variableCost],
    ["Contribution Margin per Unit", latestResult.contributionMargin],
    ["Contribution Margin Ratio", latestResult.contributionMarginRatio],
    ["Break-Even Units", latestResult.breakEvenUnits],
    ["Break-Even Revenue", latestResult.breakEvenRevenue],
    ["Expected Units", latestResult.expectedUnits],
    ["Expected Profit", latestResult.expectedProfit],
    ["Target Profit Units", latestResult.targetProfitUnits],
    ["Margin of Safety Units", latestResult.marginOfSafetyUnits],
    ["Margin of Safety Percent", latestResult.marginOfSafetyPercent],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "break-even-analysis.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("loadSampleButton").addEventListener("click", loadSample);
document.getElementById("resetButton").addEventListener("click", reset);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);

elements.scenarioToggle.addEventListener("click", () => {
  if (!latestResult) {
    showError("Calculate a break-even scenario before using scenario planning.");
    return;
  }

  scenarioPlanningActive = !scenarioPlanningActive;
  elements.scenarioToggle.setAttribute("aria-pressed", String(scenarioPlanningActive));
  document.body.classList.toggle("scenario-planning", scenarioPlanningActive);
  clearError();
  drawChart(latestResult, latestResult.expectedUnits, "Current", scenarioPlanningActive);
});

elements.chart.addEventListener("pointermove", (event) => {
  if (!scenarioPlanningActive || !latestResult || !latestChartModel) return;

  const rect = elements.chart.getBoundingClientRect();
  const canvasX = ((event.clientX - rect.left) / rect.width) * elements.chart.width;
  const { padding, width } = latestChartModel;
  if (canvasX < padding.left || canvasX > width - padding.right) return;

  drawChart(latestResult, latestChartModel.unitsFromX(canvasX), "Selected", true);
});

elements.chart.addEventListener("pointerleave", () => {
  if (!scenarioPlanningActive || !latestResult) return;
  drawChart(latestResult, latestResult.expectedUnits, "Current", true);
});

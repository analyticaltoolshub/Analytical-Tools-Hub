const inputs = {
  averageDemand: document.getElementById("averageDemand"),
  demandStdDev: document.getElementById("demandStdDev"),
  leadTime: document.getElementById("leadTime"),
  leadTimeStdDev: document.getElementById("leadTimeStdDev"),
  serviceLevel: document.getElementById("serviceLevel"),
  onHandStock: document.getElementById("onHandStock"),
  onOrderStock: document.getElementById("onOrderStock"),
  allocatedStock: document.getElementById("allocatedStock"),
};

const elements = {
  error: document.getElementById("errorMessage"),
  results: document.getElementById("results"),
  actionSummary: document.getElementById("action-summary"),
  chartSection: document.getElementById("chart-section"),
  safetyStock: document.getElementById("safetyStock"),
  reorderPoint: document.getElementById("reorderPoint"),
  leadTimeDemand: document.getElementById("leadTimeDemand"),
  inventoryPosition: document.getElementById("inventoryPosition"),
  replenishmentStatus: document.getElementById("replenishmentStatus"),
  gapToRop: document.getElementById("gapToRop"),
  zScoreUsed: document.getElementById("zScoreUsed"),
  coverageDays: document.getElementById("coverageDays"),
  interpretation: document.getElementById("interpretation"),
  chart: document.getElementById("stockChart"),
  chartNote: document.getElementById("chartNote"),
  chartSummary: document.getElementById("chartSummary"),
  scenarioToggle: document.getElementById("scenarioToggle"),
  chartReadout: document.getElementById("chartReadout"),
  readoutLabel: document.getElementById("readoutLabel"),
  readoutInventoryPosition: document.getElementById("readoutInventoryPosition"),
  readoutGap: document.getElementById("readoutGap"),
  readoutStatus: document.getElementById("readoutStatus"),
  readoutCoverage: document.getElementById("readoutCoverage"),
};

let latestResult = null;
let latestChartModel = null;
let scenarioPlanningActive = false;

function numberValue(input) {
  return Number(input.value);
}

function optionalNumber(input) {
  return input.value.trim() === "" ? 0 : Number(input.value);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en", { maximumFractionDigits }).format(value);
}

function showError(message) {
  elements.error.textContent = message;
}

function clearError() {
  elements.error.textContent = "";
}

function getInputData() {
  return {
    averageDemand: numberValue(inputs.averageDemand),
    demandStdDev: optionalNumber(inputs.demandStdDev),
    leadTime: numberValue(inputs.leadTime),
    leadTimeStdDev: optionalNumber(inputs.leadTimeStdDev),
    zScore: Number(inputs.serviceLevel.value),
    serviceLevelText: inputs.serviceLevel.options[inputs.serviceLevel.selectedIndex].textContent,
    onHandStock: optionalNumber(inputs.onHandStock),
    onOrderStock: optionalNumber(inputs.onOrderStock),
    allocatedStock: optionalNumber(inputs.allocatedStock),
  };
}

function validate(data) {
  if (Object.values(data).some((value) => typeof value === "number" && Number.isNaN(value))) {
    return "Enter valid numeric values before calculating.";
  }
  if (data.averageDemand <= 0) {
    return "Average daily demand must be greater than zero.";
  }
  if (data.leadTime <= 0) {
    return "Average lead time must be greater than zero.";
  }
  if (data.demandStdDev < 0 || data.leadTimeStdDev < 0 || data.onHandStock < 0 || data.onOrderStock < 0 || data.allocatedStock < 0) {
    return "Variability and stock values cannot be negative.";
  }
  return "";
}

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

function renderResults(result) {
  elements.results.classList.remove("hidden");
  elements.actionSummary.classList.remove("hidden");
  elements.chartSection.classList.remove("hidden");

  elements.safetyStock.textContent = `${formatNumber(Math.ceil(result.safetyStock))} units`;
  elements.reorderPoint.textContent = `${formatNumber(Math.ceil(result.reorderPoint))} units`;
  elements.leadTimeDemand.textContent = `${formatNumber(Math.ceil(result.leadTimeDemand))} units`;
  elements.inventoryPosition.textContent = `${formatNumber(result.inventoryPosition)} units`;
  elements.replenishmentStatus.textContent = result.shouldReorder ? "Reorder now" : "Above reorder point";
  elements.replenishmentStatus.classList.toggle("status-warn", result.shouldReorder);
  elements.replenishmentStatus.classList.toggle("status-ok", !result.shouldReorder);
  elements.gapToRop.textContent = `${formatNumber(Math.abs(result.gapToRop), 1)} units ${result.gapToRop >= 0 ? "above" : "below"} ROP`;
  elements.gapToRop.classList.toggle("status-ok", result.gapToRop >= 0);
  elements.gapToRop.classList.toggle("status-warn", result.gapToRop < 0);
  elements.zScoreUsed.textContent = `${formatNumber(result.zScore, 2)} (${result.serviceLevelText})`;
  elements.coverageDays.textContent = `${formatNumber(result.coverageDays, 1)} days`;

  const statusText = result.shouldReorder
    ? `Inventory position is below or equal to the reorder point by ${formatNumber(Math.abs(result.gapToRop), 1)} units, so replenishment should be triggered.`
    : `Inventory position is ${formatNumber(result.gapToRop, 1)} units above the reorder point.`;
  elements.interpretation.textContent = `Safety stock is ${formatNumber(Math.ceil(result.safetyStock))} units and the reorder point is ${formatNumber(Math.ceil(result.reorderPoint))} units. ${statusText}`;
  elements.chartNote.textContent = `Reorder point combines ${formatNumber(Math.ceil(result.leadTimeDemand))} units of lead time demand with ${formatNumber(Math.ceil(result.safetyStock))} units of safety stock.`;
  elements.chartSummary.textContent = `Safety stock is ${formatNumber(result.safetyStock, 1)} units. Reorder point is ${formatNumber(result.reorderPoint, 1)} units. Inventory position is ${formatNumber(result.inventoryPosition, 1)} units.`;
}

function valuesAtInventoryPosition(result, inventoryPosition) {
  const gapToRop = inventoryPosition - result.reorderPoint;
  const shouldReorder = inventoryPosition <= result.reorderPoint;
  const coverageDays = result.averageDemand > 0 ? inventoryPosition / result.averageDemand : 0;

  return {
    inventoryPosition,
    gapToRop,
    shouldReorder,
    coverageDays,
  };
}

function updateReadout(result, inventoryPosition, label) {
  const values = valuesAtInventoryPosition(result, inventoryPosition);

  elements.chartReadout.hidden = false;
  elements.readoutLabel.textContent = label;
  elements.readoutInventoryPosition.textContent = `${formatNumber(values.inventoryPosition, 1)} units`;
  elements.readoutGap.textContent = `${formatNumber(Math.abs(values.gapToRop), 1)} ${values.gapToRop >= 0 ? "above" : "below"} ROP`;
  elements.readoutStatus.textContent = values.shouldReorder ? "Reorder now" : "Above reorder point";
  elements.readoutCoverage.textContent = `${formatNumber(values.coverageDays, 1)} days`;
  elements.readoutGap.classList.toggle("is-positive", values.gapToRop >= 0);
  elements.readoutGap.classList.toggle("is-negative", values.gapToRop < 0);
  elements.readoutStatus.classList.toggle("is-positive", !values.shouldReorder);
  elements.readoutStatus.classList.toggle("is-negative", values.shouldReorder);
}

function buildChartModel(result) {
  const canvas = elements.chart;
  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 82, right: 42, top: 42, bottom: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(result.reorderPoint, result.inventoryPosition, result.leadTimeDemand) * 1.35;

  return {
    width,
    height,
    padding,
    plotWidth,
    plotHeight,
    maxValue,
    y: (value) => padding.top + plotHeight - (value / maxValue) * plotHeight,
    valueFromY: (canvasY) => {
      const ratio = (padding.top + plotHeight - canvasY) / plotHeight;
      return Math.min(maxValue, Math.max(0, ratio * maxValue));
    },
  };
}

function drawChart(result, selectedInventoryPosition = result.inventoryPosition, label = "Current", showScenario = scenarioPlanningActive) {
  const canvas = elements.chart;
  const ctx = canvas.getContext("2d");
  const model = buildChartModel(result);
  latestChartModel = model;
  const { width, height, padding, plotWidth, plotHeight, maxValue, y } = model;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e4e7ec";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#475467";
  ctx.font = "13px Inter, sans-serif";

  for (let i = 0; i <= 5; i += 1) {
    const value = (maxValue / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y(value));
    ctx.lineTo(width - padding.right, y(value));
    ctx.stroke();
    ctx.fillText(formatNumber(value), 16, y(value) + 4);
  }

  ctx.strokeStyle = "#101828";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  const barWidth = 120;
  const baseY = height - padding.bottom;
  const bars = [
    { label: "Lead time demand", value: result.leadTimeDemand, color: "#93c5fd" },
    { label: "Safety stock", value: result.safetyStock, color: "#22c55e", stackedOn: result.leadTimeDemand },
    { label: "Inventory position", value: result.inventoryPosition, color: result.shouldReorder ? "#fb7185" : "#1f6feb" },
  ];

  const firstX = padding.left + plotWidth * .25;
  const secondX = padding.left + plotWidth * .64;

  ctx.fillStyle = bars[0].color;
  ctx.fillRect(firstX, y(bars[0].value), barWidth, baseY - y(bars[0].value));
  ctx.fillStyle = bars[1].color;
  ctx.fillRect(firstX, y(result.reorderPoint), barWidth, y(result.leadTimeDemand) - y(result.reorderPoint));
  ctx.fillStyle = bars[2].color;
  ctx.fillRect(secondX, y(bars[2].value), barWidth, baseY - y(bars[2].value));

  ctx.fillStyle = "#06172b";
  ctx.font = "800 13px Inter, sans-serif";
  ctx.fillText("Reorder point", firstX - 4, y(result.reorderPoint) - 12);
  ctx.fillText("Inventory position", secondX - 8, y(result.inventoryPosition) - 12);

  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, y(result.reorderPoint));
  ctx.lineTo(width - padding.right, y(result.reorderPoint));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#475467";
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Lead time demand + safety stock", firstX + barWidth / 2, baseY + 26);
  ctx.fillText("Current inventory position", secondX + barWidth / 2, baseY + 26);
  ctx.textAlign = "start";

  ctx.fillStyle = "#fff";
  ctx.font = "800 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(formatNumber(Math.ceil(result.leadTimeDemand)), firstX + barWidth / 2, y(result.leadTimeDemand) + 22);
  ctx.fillText(formatNumber(Math.ceil(result.safetyStock)), firstX + barWidth / 2, y(result.reorderPoint) + 22);
  ctx.fillText(formatNumber(Math.ceil(result.inventoryPosition)), secondX + barWidth / 2, y(result.inventoryPosition) + 22);
  ctx.textAlign = "start";

  if (showScenario) {
    const selected = valuesAtInventoryPosition(result, selectedInventoryPosition);
    const selectedY = y(selected.inventoryPosition);
    const scenarioX = secondX + barWidth + 96;

    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(padding.left, selectedY);
    ctx.lineTo(width - padding.right, selectedY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = selected.shouldReorder ? "#fb7185" : "#06172b";
    ctx.beginPath();
    ctx.arc(scenarioX, selectedY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "800 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, scenarioX, Math.max(padding.top + 14, selectedY - 14));
    ctx.textAlign = "start";

    updateReadout(result, selectedInventoryPosition, label);
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
  latestResult = calculateSafetyStock(data);
  renderResults(latestResult);
  drawChart(latestResult, latestResult.inventoryPosition, "Current", scenarioPlanningActive);
}

function loadSample() {
  inputs.averageDemand.value = "48";
  inputs.demandStdDev.value = "14";
  inputs.leadTime.value = "10";
  inputs.leadTimeStdDev.value = "2";
  inputs.serviceLevel.value = "1.65";
  inputs.onHandStock.value = "620";
  inputs.onOrderStock.value = "300";
  inputs.allocatedStock.value = "80";
  calculate();
}

function reset() {
  Object.values(inputs).forEach((input) => {
    if (input.tagName === "SELECT") {
      input.value = "1.65";
    } else {
      input.value = "";
    }
  });
  latestResult = null;
  latestChartModel = null;
  scenarioPlanningActive = false;
  elements.scenarioToggle.setAttribute("aria-pressed", "false");
  document.body.classList.remove("scenario-planning");
  clearError();
  elements.results.classList.add("hidden");
  elements.actionSummary.classList.add("hidden");
  elements.chartSection.classList.add("hidden");
  elements.chartReadout.hidden = true;
  elements.chartSummary.textContent = "";
}

function exportCsv() {
  if (!latestResult) {
    showError("Calculate safety stock before exporting.");
    return;
  }

  const rows = [
    ["Metric", "Value"],
    ["Average Daily Demand", latestResult.averageDemand],
    ["Daily Demand Standard Deviation", latestResult.demandStdDev],
    ["Average Lead Time", latestResult.leadTime],
    ["Lead Time Standard Deviation", latestResult.leadTimeStdDev],
    ["Service Level", latestResult.serviceLevelText],
    ["Z-Score", latestResult.zScore],
    ["Lead Time Demand", latestResult.leadTimeDemand],
    ["Safety Stock", latestResult.safetyStock],
    ["Reorder Point", latestResult.reorderPoint],
    ["Inventory Position", latestResult.inventoryPosition],
    ["Gap to Reorder Point", latestResult.gapToRop],
    ["Coverage Days", latestResult.coverageDays],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "safety-stock-reorder-point.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("loadSampleButton").addEventListener("click", loadSample);
document.getElementById("resetButton").addEventListener("click", reset);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);

elements.scenarioToggle.addEventListener("click", () => {
  if (!latestResult) {
    showError("Calculate safety stock before using scenario planning.");
    return;
  }

  scenarioPlanningActive = !scenarioPlanningActive;
  elements.scenarioToggle.setAttribute("aria-pressed", String(scenarioPlanningActive));
  document.body.classList.toggle("scenario-planning", scenarioPlanningActive);
  clearError();
  drawChart(latestResult, latestResult.inventoryPosition, "Current", scenarioPlanningActive);
});

function handleScenarioPointerMove(event, canvas, model) {
  if (!scenarioPlanningActive || !latestResult || !model) return;

  const rect = canvas.getBoundingClientRect();
  const canvasY = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const { padding, height, valueFromY } = model;
  if (canvasY < padding.top || canvasY > height - padding.bottom) return;

  drawChart(latestResult, valueFromY(canvasY), "Selected", true);
}

function handleScenarioPointerLeave() {
  if (!scenarioPlanningActive || !latestResult) return;
  drawChart(latestResult, latestResult.inventoryPosition, "Current", true);
}

elements.chart.addEventListener("pointermove", (event) => {
  handleScenarioPointerMove(event, elements.chart, latestChartModel);
});

elements.chart.addEventListener("pointerleave", handleScenarioPointerLeave);

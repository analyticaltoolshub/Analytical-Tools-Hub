const inputs = {
  annualDemand: document.getElementById("annualDemand"),
  orderingCost: document.getElementById("orderingCost"),
  holdingCost: document.getElementById("holdingCost"),
  unitCost: document.getElementById("unitCost"),
  workingDays: document.getElementById("workingDays"),
  leadTime: document.getElementById("leadTime"),
  currentOrderQty: document.getElementById("currentOrderQty"),
  currencySymbol: document.getElementById("currencySymbol"),
};

const elements = {
  error: document.getElementById("errorMessage"),
  results: document.getElementById("results"),
  costBreakdown: document.getElementById("cost-breakdown"),
  chartSection: document.getElementById("chart-section"),
  eoqValue: document.getElementById("eoqValue"),
  totalRelevantCost: document.getElementById("totalRelevantCost"),
  ordersPerYear: document.getElementById("ordersPerYear"),
  reorderPoint: document.getElementById("reorderPoint"),
  annualOrderingCost: document.getElementById("annualOrderingCost"),
  annualHoldingCost: document.getElementById("annualHoldingCost"),
  averageInventory: document.getElementById("averageInventory"),
  cycleDays: document.getElementById("cycleDays"),
  purchaseSpend: document.getElementById("purchaseSpend"),
  currentDifference: document.getElementById("currentDifference"),
  interpretation: document.getElementById("interpretation"),
  chart: document.getElementById("eoqChart"),
  chartNote: document.getElementById("chartNote"),
  chartSummary: document.getElementById("chartSummary"),
  scenarioToggle: document.getElementById("scenarioToggle"),
  chartReadout: document.getElementById("chartReadout"),
  readoutLabel: document.getElementById("readoutLabel"),
  readoutQuantity: document.getElementById("readoutQuantity"),
  readoutOrderingCost: document.getElementById("readoutOrderingCost"),
  readoutHoldingCost: document.getElementById("readoutHoldingCost"),
  readoutTotalCost: document.getElementById("readoutTotalCost"),
  readoutDifference: document.getElementById("readoutDifference"),
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
    annualDemand: numberValue(inputs.annualDemand),
    orderingCost: numberValue(inputs.orderingCost),
    holdingCost: numberValue(inputs.holdingCost),
    unitCost: optionalNumber(inputs.unitCost),
    workingDays: optionalNumber(inputs.workingDays),
    leadTime: optionalNumber(inputs.leadTime),
    currentOrderQty: optionalNumber(inputs.currentOrderQty),
  };
}

function validate(data) {
  if (Object.values(data).some((value) => Number.isNaN(value))) {
    return "Enter valid numeric values before calculating.";
  }
  if (data.annualDemand <= 0) {
    return "Annual demand must be greater than zero.";
  }
  if (data.orderingCost <= 0) {
    return "Ordering cost per order must be greater than zero.";
  }
  if (data.holdingCost <= 0) {
    return "Holding cost per unit per year must be greater than zero.";
  }
  if (data.unitCost < 0 || data.workingDays < 0 || data.leadTime < 0 || data.currentOrderQty < 0) {
    return "Optional values cannot be negative.";
  }
  if (data.leadTime > 0 && data.workingDays <= 0) {
    return "Enter working days per year to calculate a reorder point.";
  }
  return "";
}

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

function renderResults(result) {
  elements.results.classList.remove("hidden");
  elements.costBreakdown.classList.remove("hidden");
  elements.chartSection.classList.remove("hidden");

  elements.eoqValue.textContent = formatNumber(Math.ceil(result.eoq));
  elements.totalRelevantCost.textContent = formatCurrency(result.totalRelevantCost);
  elements.ordersPerYear.textContent = formatNumber(result.ordersPerYear, 1);
  elements.reorderPoint.textContent = result.leadTime > 0 ? `${formatNumber(Math.ceil(result.reorderPoint))} units` : "Not set";
  elements.annualOrderingCost.textContent = formatCurrency(result.annualOrderingCost);
  elements.annualHoldingCost.textContent = formatCurrency(result.annualHoldingCost);
  elements.averageInventory.textContent = `${formatNumber(result.averageInventory, 1)} units`;
  elements.cycleDays.textContent = result.cycleDays > 0 ? `${formatNumber(result.cycleDays, 1)} days` : "Not set";
  elements.purchaseSpend.textContent = result.purchaseSpend > 0 ? formatCurrency(result.purchaseSpend) : "Not set";

  if (result.currentCosts) {
    const direction = result.currentDifference >= 0 ? "above" : "below";
    elements.currentDifference.textContent = `${formatCurrency(Math.abs(result.currentDifference))} ${direction} EOQ cost`;
  } else {
    elements.currentDifference.textContent = "Not set";
  }

  const baseText = `The estimated EOQ is ${formatNumber(Math.ceil(result.eoq))} units, creating about ${formatNumber(result.ordersPerYear, 1)} orders per year.`;
  const reorderText = result.leadTime > 0
    ? ` With the supplied lead time, the simple reorder point is approximately ${formatNumber(Math.ceil(result.reorderPoint))} units.`
    : " Add working days and lead time to estimate a simple reorder point.";
  const currentText = result.currentCosts
    ? ` Your current quantity has an estimated annual relevant cost ${formatCurrency(Math.abs(result.currentDifference))} ${result.currentDifference >= 0 ? "higher than" : "lower than"} the EOQ estimate.`
    : "";

  elements.interpretation.textContent = `${baseText}${reorderText}${currentText}`;
  elements.chartNote.textContent = `The total cost curve is lowest near ${formatNumber(result.eoq, 1)} units, where ordering and holding costs are balanced.`;
  elements.chartSummary.textContent = `EOQ is ${formatNumber(result.eoq, 1)} units. Annual ordering cost is ${formatCurrency(result.annualOrderingCost)} and annual holding cost is ${formatCurrency(result.annualHoldingCost)}.`;
}

function updateReadout(result, quantity, label) {
  const costs = costAtQuantity(result, quantity);
  const difference = costs.totalRelevantCost - result.totalRelevantCost;

  elements.chartReadout.hidden = false;
  elements.readoutLabel.textContent = label;
  elements.readoutQuantity.textContent = `${formatNumber(quantity, 1)} units`;
  elements.readoutOrderingCost.textContent = formatCurrency(costs.orderingCost);
  elements.readoutHoldingCost.textContent = formatCurrency(costs.holdingCost);
  elements.readoutTotalCost.textContent = formatCurrency(costs.totalRelevantCost);
  elements.readoutDifference.textContent = formatCurrency(Math.abs(difference));
  elements.readoutDifference.classList.toggle("is-positive", difference <= 0);
  elements.readoutDifference.classList.toggle("is-negative", difference > 0);
}

function buildChartModel(result) {
  const canvas = elements.chart;
  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 86, right: 42, top: 42, bottom: 64 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxQuantity = Math.max(result.eoq * 2.4, result.currentOrderQty * 1.25, result.eoq + 100);
  const minQuantity = Math.max(1, result.eoq * .15);
  const samples = [];

  for (let i = 0; i <= 50; i += 1) {
    const quantity = minQuantity + ((maxQuantity - minQuantity) * i) / 50;
    const costs = costAtQuantity(result, quantity);
    samples.push({ quantity, ...costs });
  }

  const maxCost = Math.max(...samples.map((sample) => sample.totalRelevantCost)) * 1.12;

  return {
    width,
    height,
    padding,
    plotWidth,
    plotHeight,
    maxQuantity,
    minQuantity,
    maxCost,
    samples,
    x: (quantity) => padding.left + ((quantity - minQuantity) / (maxQuantity - minQuantity)) * plotWidth,
    y: (value) => padding.top + plotHeight - (value / maxCost) * plotHeight,
    quantityFromX: (canvasX) => {
      const ratio = (canvasX - padding.left) / plotWidth;
      return Math.min(maxQuantity, Math.max(minQuantity, minQuantity + ratio * (maxQuantity - minQuantity)));
    },
  };
}

function drawChart(result, selectedQuantity = result.currentOrderQty || result.eoq, label = "Current", showScenario = scenarioPlanningActive) {
  const canvas = elements.chart;
  const ctx = canvas.getContext("2d");
  const model = buildChartModel(result);
  latestChartModel = model;
  const { width, height, padding, maxQuantity, minQuantity, maxCost, samples, x, y } = model;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e4e7ec";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#475467";
  ctx.font = "13px Inter, sans-serif";

  for (let i = 0; i <= 5; i += 1) {
    const cost = (maxCost / 5) * i;
    const quantity = minQuantity + ((maxQuantity - minQuantity) / 5) * i;

    ctx.beginPath();
    ctx.moveTo(padding.left, y(cost));
    ctx.lineTo(width - padding.right, y(cost));
    ctx.stroke();

    ctx.fillText(formatCurrency(cost), 10, y(cost) + 4);
    ctx.fillText(formatNumber(quantity), x(quantity) - 16, height - 24);
  }

  ctx.strokeStyle = "#101828";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  function drawCurve(key, color, label, labelOffset) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    samples.forEach((sample, index) => {
      const pointX = x(sample.quantity);
      const pointY = y(sample[key]);
      if (index === 0) ctx.moveTo(pointX, pointY);
      else ctx.lineTo(pointX, pointY);
    });
    ctx.stroke();

    const labelSample = samples[Math.floor(samples.length * .72)];
    ctx.fillStyle = color;
    ctx.font = "800 13px Inter, sans-serif";
    ctx.fillText(label, x(labelSample.quantity) + 6, y(labelSample[key]) + labelOffset);
  }

  drawCurve("totalRelevantCost", "#1f6feb", "Total Relevant Cost", -10);
  drawCurve("orderingCost", "#14a7a2", "Ordering Cost", -8);
  drawCurve("holdingCost", "#fb7185", "Holding Cost", 16);

  const eoqX = x(result.eoq);
  const eoqY = y(result.totalRelevantCost);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(eoqX, eoqY);
  ctx.lineTo(eoqX, height - padding.bottom);
  ctx.moveTo(padding.left, eoqY);
  ctx.lineTo(eoqX, eoqY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(eoqX, eoqY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "800 13px Inter, sans-serif";
  ctx.fillText("EOQ", eoqX + 10, eoqY - 10);

  if (result.currentOrderQty > 0 && result.currentOrderQty >= minQuantity && result.currentOrderQty <= maxQuantity) {
    const currentCosts = costAtQuantity(result, result.currentOrderQty);
    const currentX = x(result.currentOrderQty);
    const currentY = y(currentCosts.totalRelevantCost);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "800 12px Inter, sans-serif";
    ctx.fillText("Current", currentX + 10, currentY + 16);
  }

  if (showScenario) {
    const selectedCosts = costAtQuantity(result, selectedQuantity);
    const selectedX = x(selectedQuantity);
    const selectedY = y(selectedCosts.totalRelevantCost);

    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(selectedX, padding.top);
    ctx.lineTo(selectedX, height - padding.bottom);
    ctx.moveTo(padding.left, selectedY);
    ctx.lineTo(selectedX, selectedY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#06172b";
    ctx.beginPath();
    ctx.arc(selectedX, selectedY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "800 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, selectedX, padding.top - 14);
    ctx.textAlign = "start";

    updateReadout(result, selectedQuantity, label);
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
  latestResult = calculateEoq(data);
  renderResults(latestResult);
  drawChart(latestResult, latestResult.currentOrderQty || latestResult.eoq, "Current", scenarioPlanningActive);
}

function loadSample() {
  inputs.annualDemand.value = "12000";
  inputs.orderingCost.value = "75";
  inputs.holdingCost.value = "3.2";
  inputs.unitCost.value = "18";
  inputs.workingDays.value = "250";
  inputs.leadTime.value = "10";
  inputs.currentOrderQty.value = "1000";
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
  latestChartModel = null;
  scenarioPlanningActive = false;
  elements.scenarioToggle.setAttribute("aria-pressed", "false");
  document.body.classList.remove("scenario-planning");
  clearError();
  elements.results.classList.add("hidden");
  elements.costBreakdown.classList.add("hidden");
  elements.chartSection.classList.add("hidden");
  elements.chartReadout.hidden = true;
  elements.chartSummary.textContent = "";
}

function exportCsv() {
  if (!latestResult) {
    showError("Calculate EOQ before exporting.");
    return;
  }

  const rows = [
    ["Metric", "Value"],
    ["Annual Demand", latestResult.annualDemand],
    ["Ordering Cost per Order", latestResult.orderingCost],
    ["Holding Cost per Unit per Year", latestResult.holdingCost],
    ["Economic Order Quantity", latestResult.eoq],
    ["Annual Ordering Cost", latestResult.annualOrderingCost],
    ["Annual Holding Cost", latestResult.annualHoldingCost],
    ["Annual Relevant Cost", latestResult.totalRelevantCost],
    ["Orders per Year", latestResult.ordersPerYear],
    ["Average Inventory", latestResult.averageInventory],
    ["Reorder Point", latestResult.reorderPoint],
    ["Purchase Spend", latestResult.purchaseSpend],
    ["Current Order Quantity", latestResult.currentOrderQty],
    ["Current Quantity Cost Difference", latestResult.currentDifference],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "economic-order-quantity.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("loadSampleButton").addEventListener("click", loadSample);
document.getElementById("resetButton").addEventListener("click", reset);
document.getElementById("exportCsvButton").addEventListener("click", exportCsv);

elements.scenarioToggle.addEventListener("click", () => {
  if (!latestResult) {
    showError("Calculate EOQ before using scenario planning.");
    return;
  }

  scenarioPlanningActive = !scenarioPlanningActive;
  elements.scenarioToggle.setAttribute("aria-pressed", String(scenarioPlanningActive));
  document.body.classList.toggle("scenario-planning", scenarioPlanningActive);
  clearError();
  drawChart(latestResult, latestResult.currentOrderQty || latestResult.eoq, "Current", scenarioPlanningActive);
});

elements.chart.addEventListener("pointermove", (event) => {
  if (!scenarioPlanningActive || !latestResult || !latestChartModel) return;

  const rect = elements.chart.getBoundingClientRect();
  const canvasX = ((event.clientX - rect.left) / rect.width) * elements.chart.width;
  const { padding, width } = latestChartModel;
  if (canvasX < padding.left || canvasX > width - padding.right) return;

  drawChart(latestResult, latestChartModel.quantityFromX(canvasX), "Selected", true);
});

elements.chart.addEventListener("pointerleave", () => {
  if (!scenarioPlanningActive || !latestResult) return;
  drawChart(latestResult, latestResult.currentOrderQty || latestResult.eoq, "Current", true);
});

let chart;
let uploadedRawData = [];
let latestDiagnostics = [];
let latestSnapshot = null;

const alphaInput = document.getElementById("alpha");
const betaInput = document.getElementById("beta");
const gammaInput = document.getElementById("gamma");
const seasonLengthInput = document.getElementById("seasonLength");
const seasonalTypeInput = document.getElementById("seasonalType");
const methodInput = document.getElementById("method");
const betaContainer = document.getElementById("betaContainer");
const seasonalContainer = document.getElementById("seasonalContainer");
const errorDiv = document.getElementById("error");
const resultsTable = document.getElementById("resultsTable");
const finalForecast = document.getElementById("finalForecast");
const errorMetric = document.getElementById("errorMetric");
const chartSummary = document.getElementById("chartSummary");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const mappingSection = document.getElementById("mapping-section");
const demandColumn = document.getElementById("demandColumn");
const manualTbody = document.getElementById("manualTbody");
const resultsSection = document.getElementById("forecast-results");
const chartSection = document.getElementById("forecast-chart");

document.getElementById("calculateButton").addEventListener("click", calculate);
document.getElementById("clearButton").addEventListener("click", clearData);
document.getElementById("exampleButton").addEventListener("click", loadSampleData);
document.getElementById("exportButton").addEventListener("click", exportCSV);
document.getElementById("exportImageButton").addEventListener("click", exportChartImage);
document.getElementById("processFileButton").addEventListener("click", processUploadedData);
document.getElementById("addRowButton").addEventListener("click", () => addManualRow());

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
    }
});
dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFile(event.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
    handleFile(fileInput.files[0]);
});

methodInput.addEventListener("change", () => {
    betaContainer.classList.toggle("hidden", methodInput.value === "simple");
    seasonalContainer.classList.toggle("hidden", methodInput.value !== "triple");
});

initializeManualRows();
hideResults();
[alphaInput, betaInput, gammaInput, seasonLengthInput, seasonalTypeInput, methodInput, manualTbody].forEach((element) => {
    element.addEventListener('input', hideResults);
    element.addEventListener('change', hideResults);
});

function getManualData() {
    return ATHData.series(Array.from(manualTbody.querySelectorAll('.manual-demand'), (input) => input.value));
}

function getForecastData() {
    return getManualData();
}

function initializeManualRows() {
    manualTbody.textContent = "";
    for (let index = 0; index < 5; index++) {
        addManualRow();
    }
}

function addManualRow(value = "") {
    const row = document.createElement("tr");
    const periodCell = document.createElement("td");
    const demandCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const demandInput = document.createElement("input");
    const deleteButton = document.createElement("button");

    periodCell.className = "manual-period";
    demandInput.type = "number";
    demandInput.step = "any";
    demandInput.min = "0";
    demandInput.value = value;
    demandInput.placeholder = "0";
    demandInput.className = "manual-demand";

    deleteButton.type = "button";
    deleteButton.className = "manual-delete-btn";
    deleteButton.textContent = "x";
    deleteButton.addEventListener("click", () => {
        hideResults();
        row.remove();
        updateManualPeriods();
    });

    demandCell.appendChild(demandInput);
    actionCell.appendChild(deleteButton);
    row.append(periodCell, demandCell, actionCell);
    manualTbody.appendChild(row);
    updateManualPeriods();
}

function updateManualPeriods() {
    manualTbody.querySelectorAll(".manual-period").forEach((cell, index) => {
        cell.textContent = index + 1;
    });
}

function handleFile(file) {
    if (!file) {
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        errorDiv.innerText = 'Use a file up to 5 MB.';
        return;
    }

    errorDiv.innerText = "";
    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const rows = extension === "csv"
                ? parseCsvRows(event.target.result)
                : parseWorkbook(event.target.result);

            if (rows.length === 0) {
                errorDiv.innerText = "Upload a file with a header row and at least one data row.";
                return;
            }

            uploadedRawData = rows;
            populateDemandColumnSelector(Object.keys(uploadedRawData[0]));
            mappingSection.classList.remove("hidden");
        } catch (error) {
            console.warn("Unable to read uploaded demand file.", error);
            errorDiv.innerText = "Unable to read that file. Please upload a CSV or Excel file with numeric demand values.";
        }
    };

    if (extension === "csv") {
        reader.readAsText(file);
        return;
    }

    if (["xlsx", "xls"].includes(extension)) {
        reader.readAsArrayBuffer(file);
        return;
    }

    errorDiv.innerText = "Please upload a CSV or Excel file.";
}

function parseCsvRows(text) {
    if (typeof XLSX === "undefined") {
        throw new Error("XLSX library is not available.");
    }

    const workbook = XLSX.read(text, { type: "string" });
    return sheetToRows(workbook.Sheets[workbook.SheetNames[0]]);
}

function parseWorkbook(arrayBuffer) {
    if (typeof XLSX === "undefined") {
        throw new Error("XLSX library is not available.");
    }

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    return sheetToRows(workbook.Sheets[workbook.SheetNames[0]]);
}

function sheetToRows(worksheet) {
    if (!worksheet || !worksheet["!ref"]) {
        return [];
    }

    return XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        blankrows: true,
    });
}

function populateDemandColumnSelector(headers) {
    demandColumn.textContent = "";

    headers.forEach((header) => {
        const option = document.createElement("option");
        option.value = header;
        option.textContent = header;
        demandColumn.appendChild(option);
    });

    const likelyDemandColumn = headers.find((header) => /demand|forecast|qty|quantity|volume|sales|units/i.test(header));
    if (likelyDemandColumn) {
        demandColumn.value = likelyDemandColumn;
    }
}

function processUploadedData() {
    let values;
    const selectedColumn = demandColumn.value;

    try {
        values = ATHData.series(uploadedRawData.map((row) => row[selectedColumn]), false);
    } catch (error) {
        errorDiv.innerText = `${error.message} Existing demand data is unchanged.`;
        return;
    }

    if (values.length < 2) {
        errorDiv.innerText = "The selected column needs at least 2 numeric demand values.";
        return;
    }

    manualTbody.textContent = "";
    values.forEach((value) => addManualRow(value));
    hideResults();
    errorDiv.innerText = "";
}

function isValidSmoothingFactor(value) {
    return Number.isFinite(value) && value > 0 && value < 1;
}

function calculate() {
    hideResults();
    let actual;
    try {
        actual = getForecastData();
    } catch (error) {
        hideResults();
        errorDiv.innerText = error.message;
        return;
    }
    const alpha = parseFloat(alphaInput.value);
    const beta = parseFloat(betaInput.value);
    const gamma = parseFloat(gammaInput.value);
    const seasonLength = Number(seasonLengthInput.value);
    const method = methodInput.value;

    errorDiv.innerText = "";

    if (actual.length < 2) {
        errorDiv.innerText = "Enter at least 2 demand values.";
        return;
    }

    if (!isValidSmoothingFactor(alpha)) {
        errorDiv.innerText = "Alpha must be between 0 and 1.";
        return;
    }

    if (method !== "simple" && !isValidSmoothingFactor(beta)) {
        errorDiv.innerText = "Beta must be between 0 and 1.";
        return;
    }

    if (method === "triple" && !isValidSmoothingFactor(gamma)) {
        errorDiv.innerText = "Gamma must be between 0 and 1.";
        return;
    }

    if (method === "triple" && (!Number.isInteger(seasonLength) || seasonLength < 2)) {
        errorDiv.innerText = "Season length must be a whole number of at least 2.";
        return;
    }

    if (method === "triple" && actual.length < seasonLength * 2) {
        errorDiv.innerText = `Holt-Winters needs at least ${seasonLength * 2} values (two complete seasons).`;
        return;
    }

    if (method === "triple" && seasonalTypeInput.value === "multiplicative" && actual.some((value) => value <= 0)) {
        errorDiv.innerText = "Multiplicative seasonality requires demand values greater than zero.";
        return;
    }

    let result;
    if (method === "simple") {
        result = calculateSimpleExponentialSmoothing(actual, alpha);
    } else if (method === "double") {
        result = calculateDoubleExponentialSmoothing(actual, alpha, beta);
    } else {
        result = calculateTripleExponentialSmoothing(actual, alpha, beta, gamma, seasonLength, seasonalTypeInput.value);
    }
    const mae = calculateMae(actual, result.forecast);

    showResults();
    displayResults(actual, result.forecast, result.nextForecast, mae);
    latestDiagnostics = ATHExponentialSmoothing.diagnoseForecast(actual, {
        method,
        seasonLength,
        seasonalType: seasonalTypeInput.value,
        horizon: 1,
    });
    latestSnapshot = ATHData.snapshot({ generatedAt: new Date().toISOString(), actual, result: { ...result, mae },
        settings: { method, alpha, beta, gamma, seasonLength, seasonalType: seasonalTypeInput.value }, diagnostics: latestDiagnostics });
    document.getElementById('exportButton').disabled = false;
    document.getElementById('exportImageButton').disabled = false;
    window.ATHDiagnostics?.render("#forecastDiagnostics", latestDiagnostics, {
        heading: "Forecast Diagnostics",
    });
    drawChart(actual, result.forecast);
}

function calculateSimpleExponentialSmoothing(actual, alpha) {
    return ATHExponentialSmoothing.calculateSimpleExponentialSmoothing(actual, alpha);
}

function calculateDoubleExponentialSmoothing(actual, alpha, beta) {
    return ATHExponentialSmoothing.calculateDoubleExponentialSmoothing(actual, alpha, beta);
}

function calculateTripleExponentialSmoothing(actual, alpha, beta, gamma, seasonLength, seasonalType) {
    return ATHExponentialSmoothing.calculateTripleExponentialSmoothing(
        actual,
        alpha,
        beta,
        gamma,
        seasonLength,
        seasonalType
    );
}
function calculateMae(actual, forecast) {
    return ATHExponentialSmoothing.calculateMae(actual, forecast);
}

function displayResults(actual, forecast, nextForecast, mae) {
    resultsTable.textContent = "";

    const headerRow = document.createElement("tr");
    ["Period", "Actual", "Forecast"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headerRow.appendChild(th);
    });
    resultsTable.appendChild(headerRow);

    for (let i = 0; i < actual.length; i++) {
        const row = document.createElement("tr");
        [i + 1, actual[i].toFixed(2), forecast[i].toFixed(2)].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        resultsTable.appendChild(row);
    }

    finalForecast.textContent = `Next Period Forecast: ${nextForecast.toFixed(2)}`;
    errorMetric.textContent = `MAE: ${mae.toFixed(3)}`;
    chartSummary.textContent =
        `Forecast chart summary: ${actual.length} demand periods analysed. ` +
        `The next period forecast is ${nextForecast.toFixed(2)} and the mean absolute error is ${mae.toFixed(3)}.`;
}

function drawChart(actual, forecast) {
    const ctx = document.getElementById("chart").getContext("2d");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: actual.map((_, index) => index + 1),
            datasets: [
                {
                    label: "Actual",
                    data: actual,
                    borderColor: "#1F6FEB",
                    backgroundColor: "rgba(31, 111, 235, 0.14)",
                    fill: false,
                    tension: 0.3,
                },
                {
                    label: "Forecast",
                    data: forecast,
                    borderColor: "#102A47",
                    backgroundColor: "rgba(16, 42, 71, 0.1)",
                    fill: false,
                    tension: 0.3,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#101828",
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "#475467",
                    },
                    grid: {
                        color: "#E4E7EC",
                    },
                },
                y: {
                    ticks: {
                        color: "#475467",
                    },
                    grid: {
                        color: "#E4E7EC",
                    },
                },
            },
        },
    });
}

function showResults() {
    resultsSection.classList.remove("hidden");
    chartSection.classList.remove("hidden");
}

function hideResults() {
    latestSnapshot = null;
    document.getElementById('exportButton').disabled = true;
    document.getElementById('exportImageButton').disabled = true;
    resultsSection.classList.add("hidden");
    chartSection.classList.add("hidden");
    resultsTable.textContent = "";
    finalForecast.textContent = "";
    errorMetric.textContent = "";
    chartSummary.textContent = "";
    latestDiagnostics = [];
    window.ATHDiagnostics?.render("#forecastDiagnostics", latestDiagnostics);

    if (chart) {
        chart.destroy();
        chart = null;
    }
}

function clearData() {
    fileInput.value = "";
    uploadedRawData = [];
    mappingSection.classList.add("hidden");
    demandColumn.textContent = "";
    initializeManualRows();
    errorDiv.innerText = "";
    hideResults();
}

function loadSampleData() {
    uploadedRawData = [];
    mappingSection.classList.add("hidden");
    demandColumn.textContent = "";
    manualTbody.textContent = "";
    const sampleMonthlyDemand = [
        820, 790, 860, 910, 980, 1060, 1120, 1090, 1010, 970, 1180, 1420,
        880, 850, 920, 990, 1050, 1140, 1210, 1170, 1080, 1040, 1270, 1530,
    ];
    sampleMonthlyDemand.forEach((value) => addManualRow(value));
    seasonLengthInput.value = 12;
    errorDiv.innerText = "";
    hideResults();
}

function exportCSV() {
    if (!latestSnapshot) {
        errorDiv.innerText = "Calculate a forecast before exporting.";
        return;
    }

    const { actual, result, settings, diagnostics, generatedAt } = latestSnapshot;
    const csv = [
        ["Analytical Tools Hub", "Exponential Smoothing"],
        ['Snapshot schema', 'ath.forecast.v1'],
        ["Generated at", generatedAt],
        ["Method", settings.method],
        ["Alpha", settings.alpha],
        ["Beta", settings.method === 'simple' ? '' : settings.beta],
        ["Gamma", settings.method === 'triple' ? settings.gamma : ''],
        ["Season length", settings.method === 'triple' ? settings.seasonLength : ''],
        ["Seasonal type", settings.method === 'triple' ? settings.seasonalType : ''],
        ['Assumptions', 'Equally spaced periods; historical pattern continues; no causal interpretation.'],
        ['Next forecast', result.nextForecast],
        ['MAE', result.mae],
        [],
        ["Diagnostics"],
        ...(window.ATHDiagnostics?.summarize(diagnostics) || []).map((item) => [item]),
        [],
        ['Period', 'Actual', 'Forecast'],
        ...actual.map((value, index) => [index + 1, value, result.forecast[index]]),
    ];
    const blob = new Blob([ATHData.csv(csv)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "forecast.csv";
    anchor.click();
    URL.revokeObjectURL(url);
}

function exportChartImage() {
    if (!chart || !latestSnapshot) {
        errorDiv.innerText = "Calculate a forecast before exporting the chart image.";
        return;
    }

    const link = document.createElement("a");
    link.href = chart.toBase64Image("image/png", 1);
    link.download = "forecast-chart.png";
    link.click();
}

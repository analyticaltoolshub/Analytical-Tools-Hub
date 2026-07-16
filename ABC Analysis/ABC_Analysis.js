// Module level state variables
let uploadedRawData = null;
let finalAnalysisResults = [];
let paretoChartInstance = null;
const ALLOWED_FILE_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MONTHS = [
  { key: "jan", label: "Jan" },
  { key: "feb", label: "Feb" },
  { key: "mar", label: "Mar" },
  { key: "apr", label: "Apr" },
  { key: "may", label: "May" },
  { key: "jun", label: "Jun" },
  { key: "jul", label: "Jul" },
  { key: "aug", label: "Aug" },
  { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" },
  { key: "nov", label: "Nov" },
  { key: "dec", label: "Dec" },
];
const SAMPLE_INVENTORY_ITEMS = [
  { name: "Laptop Docking Station", quantity: 120, unitPrice: 155, monthly: [10, 11, 9, 10, 10, 11, 9, 10, 10, 10, 10, 10] },
  { name: "Industrial Safety Gloves", quantity: 950, unitPrice: 15, monthly: [70, 72, 78, 85, 88, 82, 80, 77, 76, 79, 82, 81] },
  { name: "Barcode Scanner", quantity: 40, unitPrice: 320, monthly: [1, 4, 2, 8, 0, 5, 1, 7, 2, 6, 0, 4] },
  { name: "Printer Toner Cartridge", quantity: 160, unitPrice: 60, monthly: [12, 13, 12, 14, 13, 14, 13, 12, 15, 14, 14, 14] },
  { name: "Packing Tape Rolls", quantity: 740, unitPrice: 10, monthly: [52, 58, 62, 64, 70, 68, 65, 60, 58, 61, 60, 62] },
  { name: "Wireless Keyboard", quantity: 150, unitPrice: 41, monthly: [8, 14, 9, 18, 7, 16, 10, 15, 8, 17, 9, 19] },
  { name: "Shipping Labels", quantity: 1300, unitPrice: 4, monthly: [101, 105, 108, 110, 112, 109, 106, 108, 110, 111, 109, 111] },
  { name: "USB-C Cable", quantity: 410, unitPrice: 10, monthly: [22, 28, 35, 46, 30, 42, 26, 50, 29, 45, 24, 33] },
  { name: "Desk Organizer Tray", quantity: 175, unitPrice: 16, monthly: [14, 15, 13, 14, 14, 15, 15, 14, 15, 14, 16, 16] },
  { name: "Replacement Mouse Pads", quantity: 270, unitPrice: 5, monthly: [3, 42, 4, 38, 6, 35, 5, 41, 4, 43, 5, 44] },
];

// UI Element References
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const mappingSection = document.getElementById("mapping-section");
const analysisModeSelect = document.getElementById("analysis-mode");
const calcMethodSelect = document.getElementById("calc-method");
const manualTbody = document.getElementById("manual-tbody");
const manualSearchInput = document.getElementById("manual-search");
const resultsDashboard = document.getElementById("output-dashboard");

// Initial setup hook
window.addEventListener("DOMContentLoaded", () => {
  buildMonthMappingSelectors([]);
  updateAnalysisModeUI();
  initializeManualInputTable();
  setupDragAndDrop();
});

// Initialize Manual Input with empty template fields
function initializeManualInputTable() {
  manualTbody.textContent = "";
  for (let i = 0; i < 5; i++) {
    addManualRow();
  }
}

function resetOutputState() {
  finalAnalysisResults = [];
  resultsDashboard.classList.add("hidden");
  document.getElementById("xyz-output-panel").classList.add("hidden");
  document.getElementById("abc-xyz-matrix").textContent = "";
  document.getElementById("xyz-summary-note").textContent = "";
  document.getElementById("abc-insight-panel").textContent = "";
  document.getElementById("paretoChartSummary").textContent = "";
  document.getElementById("results-tbody").textContent = "";
  document.getElementById("stat-total-value").innerText = "\u00a30.00";
  document.getElementById("stat-class-a").innerText = "0 (0%)";
  document.getElementById("stat-class-b").innerText = "0 (0%)";
  document.getElementById("stat-class-c").innerText = "0 (0%)";

  if (paretoChartInstance) {
    paretoChartInstance.destroy();
    paretoChartInstance = null;
  }
}

function resetImportedFileState() {
  uploadedRawData = null;
  fileInput.value = "";
  mappingSection.classList.add("hidden");
  ["map-item", "map-val1", "map-val2"].forEach((selectId) => {
    document.getElementById(selectId).textContent = "";
  });
  buildMonthMappingSelectors([]);
}

function clearAllData() {
  resetImportedFileState();
  resetOutputState();
  clearThresholdWarning();
  manualSearchInput.value = "";
  analysisModeSelect.value = "abc";
  calcMethodSelect.value = "single";
  analysisModeSelect.dispatchEvent(new Event("change"));
  calcMethodSelect.dispatchEvent(new Event("change"));
  document.getElementById("threshold-a").value = "80";
  document.getElementById("threshold-b").value = "95";
  document.getElementById("threshold-x").value = "0.25";
  document.getElementById("threshold-y").value = "0.50";
  clearXyzThresholdWarning();
  initializeManualInputTable();
}

function loadSampleData() {
  resetImportedFileState();
  resetOutputState();
  clearThresholdWarning();
  clearXyzThresholdWarning();
  manualSearchInput.value = "";
  if (analysisModeSelect.value === "abcxyz") {
    calcMethodSelect.value = "multiply";
  }
  analysisModeSelect.dispatchEvent(new Event("change"));
  calcMethodSelect.dispatchEvent(new Event("change"));
  manualTbody.textContent = "";
  SAMPLE_INVENTORY_ITEMS.forEach((item) => {
    if (analysisModeSelect.value === "abcxyz") {
      addManualRow(item.name, "", item.unitPrice, item.monthly);
      return;
    }

    if (calcMethodSelect.value === "multiply") {
      addManualRow(item.name, item.quantity, item.unitPrice);
      return;
    }

    addManualRow(item.name, item.quantity * item.unitPrice);
  });
  applyManualSearchFilter();
}

function applyManualSearchFilter() {
  const query = manualSearchInput.value.trim().toLowerCase();

  manualTbody.querySelectorAll("tr").forEach((row) => {
    const itemName = row.querySelector(".manual-item").value.toLowerCase();
    row.classList.toggle("hidden", query !== "" && !itemName.includes(query));
  });
}

function isXyzMode() {
  return analysisModeSelect.value === "abcxyz";
}

function sumNumbers(values) {
  return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function getStandardDeviation(values) {
  if (values.length === 0) return 0;
  const average = sumNumbers(values) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function addManualRow(item = "", val1 = "", val2 = "", monthlyValues = []) {
  const row = document.createElement("tr");
  row.className = "hover:bg-gray-50/50 transition-colors group";

  const isMultiply = calcMethodSelect.value === "multiply";
  const useXyz = isXyzMode();

  const itemCell = document.createElement("td");
  itemCell.className = "p-2";
  const itemInput = document.createElement("input");
  itemInput.type = "text";
  itemInput.value = item;
  itemInput.placeholder = `e.g. SKU-${Math.floor(1000 + Math.random() * 9000)}`;
  itemInput.className =
    "w-full border border-gray-200 rounded px-2 py-1 text-sm manual-item";
  itemCell.appendChild(itemInput);

  const val1Cell = document.createElement("td");
  val1Cell.className = `p-2 ${useXyz ? "hidden" : ""} manual-val1-cell`;
  const val1Input = document.createElement("input");
  val1Input.type = "number";
  val1Input.value = val1;
  val1Input.min = "0";
  val1Input.step = "any";
  val1Input.placeholder = "0.00";
  val1Input.className =
    "w-full border border-gray-200 rounded px-2 py-1 text-sm manual-val1";
  val1Cell.appendChild(val1Input);

  const val2Cell = document.createElement("td");
  val2Cell.className = `p-2 ${isMultiply || useXyz ? "" : "hidden"} manual-val2-cell`;
  const val2Input = document.createElement("input");
  val2Input.type = "number";
  val2Input.value = val2;
  val2Input.min = "0";
  val2Input.step = "any";
  val2Input.placeholder = "0.00";
  val2Input.className =
    "w-full border border-gray-200 rounded px-2 py-1 text-sm manual-val2";
  val2Cell.appendChild(val2Input);

  const monthCells = MONTHS.map((month, monthIndex) => {
    const monthCell = document.createElement("td");
    monthCell.className = `p-2 xyz-month-cell ${useXyz ? "" : "hidden"}`;
    const monthInput = document.createElement("input");
    monthInput.type = "number";
    monthInput.value = monthlyValues[monthIndex] ?? "";
    monthInput.min = "0";
    monthInput.step = "any";
    monthInput.placeholder = "0";
    monthInput.setAttribute("aria-label", `${month.label} quantity for ${item || "item"}`);
    monthInput.className =
      "w-full border border-gray-200 rounded px-2 py-1 text-sm manual-month";
    monthCell.appendChild(monthInput);
    return monthCell;
  });

  const actionCell = document.createElement("td");
  actionCell.className = "p-2 text-center";
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className =
    "manual-delete-btn";
  removeButton.textContent = "x";
  removeButton.addEventListener("click", () => row.remove());
  actionCell.appendChild(removeButton);

  row.append(itemCell, val1Cell, val2Cell, ...monthCells, actionCell);
  manualTbody.appendChild(row);
  applyManualSearchFilter();
}

document
  .getElementById("btn-add-row")
  .addEventListener("click", () => addManualRow());
document
  .getElementById("btn-load-sample")
  .addEventListener("click", loadSampleData);
document.getElementById("btn-clear-all").addEventListener("click", clearAllData);
manualSearchInput.addEventListener("input", applyManualSearchFilter);

function updateAnalysisModeUI() {
  const useXyz = isXyzMode();
  const isMultiply = calcMethodSelect.value === "multiply";

  document.getElementById("xyz-settings").classList.toggle("hidden", !useXyz);
  document.getElementById("xyz-mapping-container").classList.toggle("hidden", !useXyz || !uploadedRawData);
  document.querySelectorAll(".xyz-month-header").forEach((header) => header.classList.toggle("hidden", !useXyz));
  document.querySelectorAll(".xyz-month-cell").forEach((cell) => cell.classList.toggle("hidden", !useXyz));
  document.querySelectorAll(".manual-val1-cell").forEach((cell) => cell.classList.toggle("hidden", useXyz));

  if (useXyz) {
    calcMethodSelect.value = "multiply";
    calcMethodSelect.disabled = true;
    document.getElementById("manual-th-val1").innerText = "Quantity Used";
    document.getElementById("manual-th-val1").classList.add("hidden");
    document.getElementById("manual-th-val2").innerText = "Unit Cost";
    document.getElementById("manual-th-val2").classList.remove("hidden");
    document.getElementById("formula-label-1").innerText = "Unit Cost Column";
    document.getElementById("mapping-val2-container").classList.add("hidden");
    document.getElementById("calc-method-help").textContent = "ABC + XYZ sums the entered monthly quantities, then multiplies that quantity by unit cost.";
    selectMappingOptionByPattern(document.getElementById("map-val1"), /unit.*(cost|price)|cost|price/i);
  } else {
    calcMethodSelect.disabled = false;
    document.getElementById("manual-th-val1").classList.remove("hidden");
    document.getElementById("manual-th-val2").innerText = "Unit Cost";
    document.getElementById("manual-th-val1").innerText = isMultiply ? "Quantity Used" : "Consumption Value";
    document.getElementById("formula-label-1").innerText = isMultiply ? "Quantity Used Column" : "Consumption Value Column";
    document.getElementById("calc-method-help").textContent = isMultiply
      ? "Quantity used is the total quantity used, sold, consumed, or demanded during the analysis period."
      : "Consumption value is the total item value over the analysis period.";
  }

  document
    .getElementById("mapping-val2-container")
    .classList.toggle("hidden", useXyz || !isMultiply);
  document
    .querySelectorAll(".manual-val2-cell")
    .forEach((cell) => cell.classList.toggle("hidden", !(useXyz || isMultiply)));
}

function selectMappingOptionByPattern(select, pattern) {
  if (!select || select.options.length === 0) return;
  const options = Array.from(select.options);
  const matchedIndex = options.findIndex((option) => pattern.test(option.value));
  if (matchedIndex >= 0) {
    select.selectedIndex = matchedIndex;
  }
}

analysisModeSelect.addEventListener("change", () => {
  updateAnalysisModeUI();
  resetOutputState();
});

// Respond to structural formulas changing
calcMethodSelect.addEventListener("change", (e) => {
  const isMultiply = e.target.value === "multiply";
  const useXyz = isXyzMode();

  // Adjust Manual Input Column visibility headers
  document
    .getElementById("manual-th-val2")
    .classList.toggle("hidden", !(isMultiply || useXyz));
  document
    .querySelectorAll(".manual-val2-cell")
    .forEach((cell) => cell.classList.toggle("hidden", !(isMultiply || useXyz)));
  document.getElementById("manual-th-val1").innerText = isMultiply
    ? "Quantity Used"
    : "Consumption Value";

  // Adjust Import Parser UI mappings
  document.getElementById("formula-label-1").innerText = isMultiply
    ? "Quantity Used Column"
    : "Consumption Value Column";
  document
    .getElementById("mapping-val2-container")
    .classList.toggle("hidden", useXyz || !isMultiply);
  updateAnalysisModeUI();
});

// Drag & Drop event bindings
function setupDragAndDrop() {
  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) =>
    handleFileSelection(e.target.files[0]),
  );

  ["dragenter", "dragover"].forEach((name) => {
    dropZone.addEventListener(
      name,
      (e) => {
        e.preventDefault();
        dropZone.classList.add("bg-indigo-100", "border-indigo-500");
      },
      false,
    );
  });
  ["dragleave", "drop"].forEach((name) => {
    dropZone.addEventListener(
      name,
      (e) => {
        e.preventDefault();
        dropZone.classList.remove("bg-indigo-100", "border-indigo-500");
      },
      false,
    );
  });
  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt.files.length) handleFileSelection(dt.files[0]);
  });
}

// File loading extraction using SheetJS
function handleFileSelection(file) {
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const isAllowedFileType = ALLOWED_FILE_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension),
  );

  if (!isAllowedFileType) {
    alert("Please upload a valid CSV, XLS, or XLSX file.");
    fileInput.value = "";
    return;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    alert("File is too large. Please upload a file under 5 MB.");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("Workbook does not contain any sheets.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet || !worksheet["!ref"]) {
        throw new Error("First sheet is empty.");
      }

      const rawRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        header: 1,
      });
      const headerRow = rawRows.find((row) =>
        row.some((cell) => String(cell).trim() !== ""),
      );

      if (!headerRow) {
        throw new Error("File does not contain a header row.");
      }

      const headers = headerRow
        .map((header) => String(header).trim())
        .filter((header) => header !== "");

      if (headers.length < 2) {
        throw new Error("File needs at least two usable columns.");
      }

      // Parse rows using the first non-empty row as headers.
      uploadedRawData = XLSX.utils
        .sheet_to_json(worksheet, {
          defval: "",
          range: rawRows.indexOf(headerRow),
        })
        .filter((row) =>
          Object.values(row).some((value) => String(value).trim() !== ""),
        );

      if (uploadedRawData.length === 0) {
        throw new Error("File does not contain data rows below the header.");
      }

      populateColumnMappingSelectors(Object.keys(uploadedRawData[0]));
    } catch (error) {
      uploadedRawData = null;
      mappingSection.classList.add("hidden");
      fileInput.value = "";
      alert(
        "We could not read this file. Please upload a valid CSV, XLS, or XLSX file with a header row and at least one data row.",
      );
    }
  };
  reader.onerror = function () {
    uploadedRawData = null;
    mappingSection.classList.add("hidden");
    fileInput.value = "";
    alert("We could not read this file. Please try again.");
  };

  try {
    reader.readAsArrayBuffer(file);
  } catch (error) {
    uploadedRawData = null;
    mappingSection.classList.add("hidden");
    fileInput.value = "";
    alert("We could not read this file. Please try again.");
  }
}

// Expose dynamic dropdown settings options maps
function populateColumnMappingSelectors(headers) {
  const selectItem = document.getElementById("map-item");
  const selectVal1 = document.getElementById("map-val1");
  const selectVal2 = document.getElementById("map-val2");

  [selectItem, selectVal1, selectVal2].forEach((sel) => {
    sel.textContent = "";
    headers.forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h;
      opt.innerText = h;
      sel.appendChild(opt);
    });
  });

  // Fuzzy logic heuristics to set default index targets natively
  selectItem.selectedIndex = Math.max(
    headers.findIndex((h) => /name|item|sku|id/i.test(h)),
    0,
  );
  selectVal1.selectedIndex = Math.max(
    headers.findIndex((h) => /val|qty|quantity/i.test(h)),
    0,
  );
  selectVal2.selectedIndex = Math.max(
    headers.findIndex((h) => /unit.*(price|cost)|price|cost/i.test(h)),
    0,
  );
  if (isXyzMode()) {
    selectMappingOptionByPattern(selectVal1, /unit.*(cost|price)|cost|price/i);
  }

  buildMonthMappingSelectors(headers);
  mappingSection.classList.remove("hidden");
  updateAnalysisModeUI();
}

function buildMonthMappingSelectors(headers) {
  const monthGrid = document.getElementById("month-mapping-grid");
  monthGrid.textContent = "";

  MONTHS.forEach((month) => {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.className = "block text-xs font-medium mb-1";
    label.setAttribute("for", `map-month-${month.key}`);
    label.textContent = `${month.label} Qty`;

    const select = document.createElement("select");
    select.id = `map-month-${month.key}`;
    select.className = "w-full themed-input px-2 py-1.5 text-sm";

    const unusedOption = document.createElement("option");
    unusedOption.value = "";
    unusedOption.innerText = "Not used";
    select.appendChild(unusedOption);

    headers.forEach((header) => {
      const opt = document.createElement("option");
      opt.value = header;
      opt.innerText = header;
      select.appendChild(opt);
    });

    const monthPattern = new RegExp(`^${month.label}|${month.key}|${month.label.toLowerCase()}|${month.label}.*qty|${month.label}.*demand|${month.label}.*usage`, "i");
    const matchIndex = headers.findIndex((header) => monthPattern.test(header));
    select.selectedIndex = matchIndex >= 0 ? matchIndex + 1 : 0;

    wrapper.append(label, select);
    monthGrid.appendChild(wrapper);
  });
}

// Processing trigger for explicit raw spreadsheets conversion
document.getElementById("btn-process-file").addEventListener("click", () => {
  if (!uploadedRawData) return;

  const itemKey = document.getElementById("map-item").value;
  const val1Key = document.getElementById("map-val1").value;
  const val2Key = document.getElementById("map-val2").value;
  const isMultiply = calcMethodSelect.value === "multiply";
  const useXyz = isXyzMode();
  const monthKeys = MONTHS.map((month) => document.getElementById(`map-month-${month.key}`)?.value);

  manualTbody.textContent = ""; // Wipe manual array context fields

  uploadedRawData.forEach((row) => {
    if (row[itemKey] !== undefined) {
      if (useXyz) {
        const monthlyValues = monthKeys.map((monthKey) => {
          if (!monthKey) return "";
          const rawValue = row[monthKey];
          if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") return "";
          const parsedValue = Number(rawValue);
          return Number.isFinite(parsedValue) ? parsedValue : "";
        });
        addManualRow(
          row[itemKey],
          "",
          row[val1Key] || 0,
          monthlyValues,
        );
        return;
      }

      addManualRow(
        row[itemKey],
        row[val1Key] || 0,
        isMultiply ? row[val2Key] || 0 : "",
      );
    }
  });

  alert(
    `Successfully integrated ${uploadedRawData.length} records. Review the inputs and select Calculate Analysis.`,
  );
});

function showThresholdWarning(message) {
  const thresholdWarning = document.getElementById("threshold-warning");
  thresholdWarning.textContent = message;
  thresholdWarning.classList.remove("hidden");
}

function clearThresholdWarning() {
  const thresholdWarning = document.getElementById("threshold-warning");
  thresholdWarning.textContent = "";
  thresholdWarning.classList.add("hidden");
}

function showXyzThresholdWarning(message) {
  const thresholdWarning = document.getElementById("xyz-threshold-warning");
  thresholdWarning.textContent = message;
  thresholdWarning.classList.remove("hidden");
}

function clearXyzThresholdWarning() {
  const thresholdWarning = document.getElementById("xyz-threshold-warning");
  thresholdWarning.textContent = "";
  thresholdWarning.classList.add("hidden");
}

function getValidatedThresholds() {
  const thresholdAValue = parseFloat(
    document.getElementById("threshold-a").value,
  );
  const thresholdBValue = parseFloat(
    document.getElementById("threshold-b").value,
  );

  if (!Number.isFinite(thresholdAValue) || !Number.isFinite(thresholdBValue)) {
    return {
      isValid: false,
      message: "Please enter valid numeric threshold percentages for Class A and Class B.",
    };
  }

  if (
    thresholdAValue < 0 ||
    thresholdAValue > 100 ||
    thresholdBValue < 0 ||
    thresholdBValue > 100
  ) {
    return {
      isValid: false,
      message: "Class A and Class B thresholds must both be between 0% and 100%.",
    };
  }

  if (thresholdAValue >= thresholdBValue) {
    return {
      isValid: false,
      message: "Class A threshold must be less than Class B threshold.",
    };
  }

  return {
    isValid: true,
    thresholdA: thresholdAValue / 100,
    thresholdB: thresholdBValue / 100,
  };
}

function getValidatedXyzThresholds() {
  const thresholdXValue = parseFloat(document.getElementById("threshold-x").value);
  const thresholdYValue = parseFloat(document.getElementById("threshold-y").value);

  if (!Number.isFinite(thresholdXValue) || !Number.isFinite(thresholdYValue)) {
    return {
      isValid: false,
      message: "Please enter valid numeric CV thresholds for X and Y.",
    };
  }

  if (thresholdXValue < 0 || thresholdYValue < 0 || thresholdXValue > 10 || thresholdYValue > 10) {
    return {
      isValid: false,
      message: "XYZ thresholds must be between 0 and 10.",
    };
  }

  if (thresholdXValue >= thresholdYValue) {
    return {
      isValid: false,
      message: "X threshold must be less than Y threshold.",
    };
  }

  return {
    isValid: true,
    thresholdX: thresholdXValue,
    thresholdY: thresholdYValue,
  };
}

["threshold-a", "threshold-b"].forEach((inputId) => {
  document.getElementById(inputId).addEventListener("input", () => {
    if (getValidatedThresholds().isValid) {
      clearThresholdWarning();
    }
  });
});

["threshold-x", "threshold-y"].forEach((inputId) => {
  document.getElementById(inputId).addEventListener("input", () => {
    if (getValidatedXyzThresholds().isValid) {
      clearXyzThresholdWarning();
    }
  });
});

// Core Mathematical Processing Engine
document.getElementById("btn-calculate").addEventListener("click", () => {
  const dataToProcess = [];
  const xyzRowsWithTooFewMonths = [];
  const isMultiply = calcMethodSelect.value === "multiply";
  const useXyz = isXyzMode();

  const items = document.querySelectorAll(".manual-item");
  const val1s = document.querySelectorAll(".manual-val1");
  const val2s = document.querySelectorAll(".manual-val2");
  const thresholdConfig = getValidatedThresholds();
  const xyzThresholdConfig = getValidatedXyzThresholds();

  if (!thresholdConfig.isValid) {
    showThresholdWarning(thresholdConfig.message);
    return;
  }

  if (useXyz && !xyzThresholdConfig.isValid) {
    showXyzThresholdWarning(xyzThresholdConfig.message);
    return;
  }

  clearThresholdWarning();
  clearXyzThresholdWarning();

  // 1. Gather raw context inputs
  items.forEach((elem, index) => {
    const name = elem.value.trim();
    const v1 = parseFloat(val1s[index].value) || 0;
    const v2 = isMultiply ? parseFloat(val2s[index].value) || 0 : 0;

    if (name !== "") {
      if (useXyz) {
        const row = elem.closest("tr");
        const monthlyValues = Array.from(row.querySelectorAll(".manual-month"))
          .map((input) => input.value.trim())
          .filter((value) => value !== "")
          .map(Number)
          .filter(Number.isFinite);

        if (monthlyValues.length < 3) {
          xyzRowsWithTooFewMonths.push(name);
          return;
        }

        const annualQuantity = sumNumbers(monthlyValues);
        const unitCost = parseFloat(val2s[index].value) || 0;
        const averageMonthlyQuantity = annualQuantity / monthlyValues.length;
        const monthlyStdDev = getStandardDeviation(monthlyValues);
        const coefficientOfVariation = averageMonthlyQuantity > 0 ? monthlyStdDev / averageMonthlyQuantity : 0;
        const finalCalculatedValue = annualQuantity * unitCost;

        dataToProcess.push({
          name,
          calculatedValue: finalCalculatedValue,
          annualQuantity,
          unitCost,
          monthlyValues,
          monthCount: monthlyValues.length,
          averageMonthlyQuantity,
          monthlyStdDev,
          coefficientOfVariation,
        });
        return;
      }

      const finalCalculatedValue = isMultiply ? v1 * v2 : v1;
      dataToProcess.push({
        name,
        calculatedValue: finalCalculatedValue,
        annualQuantity: isMultiply ? v1 : null,
        unitCost: isMultiply ? v2 : null,
      });
    }
  });

  if (useXyz && xyzRowsWithTooFewMonths.length > 0) {
    alert(
      `ABC + XYZ needs at least 3 entered monthly quantity values per item. Check: ${xyzRowsWithTooFewMonths.slice(0, 5).join(", ")}${xyzRowsWithTooFewMonths.length > 5 ? "..." : ""}. Four or five months can be used for a directional view; 6-12 months is better.`,
    );
    return;
  }

  if (dataToProcess.length === 0) {
    alert(
      "Please add at least one item with valid dataset metadata measurements.",
    );
    return;
  }

  // 2. Sorting array sequence by individual items value weights (Descending structural sort)
  dataToProcess.sort((a, b) => b.calculatedValue - a.calculatedValue);

  // 3. Mathematical aggregation metrics computations
  const totalValue = dataToProcess.reduce(
    (sum, item) => sum + item.calculatedValue,
    0,
  );

  if (totalValue <= 0) {
    alert(
      "Total cumulative sum aggregate value must be strictly greater than 0 to calculate fractional values.",
    );
    return;
  }

  // 4. Threshold parsing configurations variables maps
  const { thresholdA, thresholdB } = thresholdConfig;
  const { thresholdX, thresholdY } = xyzThresholdConfig;

  let runningSum = 0;
  finalAnalysisResults = dataToProcess.map((item, index) => {
    runningSum += item.calculatedValue;
    const individualPercent = item.calculatedValue / totalValue;
    const cumulativePercent = runningSum / totalValue;

    // ABC Conditional Assignment logic blocks
    let abcClass = "C";
    if (cumulativePercent <= thresholdA) {
      abcClass = "A";
    } else if (
      cumulativePercent <= thresholdB ||
      cumulativePercent - individualPercent < thresholdB
    ) {
      // Inclusion edge logic catches cutoff bounds efficiently
      abcClass = "B";
    }

    let xyzClass = null;
    let combinedClass = null;
    if (useXyz) {
      if (item.coefficientOfVariation <= thresholdX) {
        xyzClass = "X";
      } else if (item.coefficientOfVariation <= thresholdY) {
        xyzClass = "Y";
      } else {
        xyzClass = "Z";
      }
      combinedClass = `${abcClass}${xyzClass}`;
    }

    return {
      rank: index + 1,
      name: item.name,
      value: item.calculatedValue,
      annualQuantity: item.annualQuantity,
      unitCost: item.unitCost,
      monthCount: item.monthCount,
      coefficientOfVariation: item.coefficientOfVariation,
      xyzClass,
      combinedClass,
      percent: individualPercent,
      cumulative: cumulativePercent,
      class: abcClass,
    };
  });

  renderDashboardOutputs(totalValue, finalAnalysisResults, useXyz);
});

// Presentation Layout Handler Engine Functions
function renderDashboardOutputs(totalSum, datasets, useXyz = false) {
  resultsDashboard.classList.remove("hidden");
  document.getElementById("xyz-output-panel").classList.toggle("hidden", !useXyz);
  ["result-th-annual-qty", "result-th-cv", "result-th-combined"].forEach((id) => {
    document.getElementById(id).classList.toggle("hidden", !useXyz);
  });

  // Compute structural widget summary sets
  const countA = datasets.filter((d) => d.class === "A").length;
  const countB = datasets.filter((d) => d.class === "B").length;
  const countC = datasets.filter((d) => d.class === "C").length;

  const sumValA = datasets
    .filter((d) => d.class === "A")
    .reduce((s, i) => s + i.value, 0);
  const sumValB = datasets
    .filter((d) => d.class === "B")
    .reduce((s, i) => s + i.value, 0);
  const sumValC = datasets
    .filter((d) => d.class === "C")
    .reduce((s, i) => s + i.value, 0);

  document.getElementById("stat-total-value").innerText = formatCurrency(totalSum);
  document.getElementById("stat-class-a").innerText =
    `${countA} (${((sumValA / totalSum) * 100).toFixed(1)}%)`;
  document.getElementById("stat-class-b").innerText =
    `${countB} (${((sumValB / totalSum) * 100).toFixed(1)}%)`;
  document.getElementById("stat-class-c").innerText =
    `${countC} (${((sumValC / totalSum) * 100).toFixed(1)}%)`;
  document.getElementById("paretoChartSummary").textContent =
    `Pareto chart summary: ${datasets.length} items were analysed with total inventory value ${formatCurrency(totalSum)}. ` +
    `A items represent ${((sumValA / totalSum) * 100).toFixed(1)}% of value, ` +
    `B items represent ${((sumValB / totalSum) * 100).toFixed(1)}%, and ` +
    `C items represent ${((sumValC / totalSum) * 100).toFixed(1)}%.`;

  renderManagementInsightPanel(totalSum, datasets, useXyz, {
    countA,
    countB,
    countC,
    sumValA,
    sumValB,
    sumValC,
  });

  // Display table compilation
  const tbody = document.getElementById("results-tbody");
  tbody.textContent = "";

  datasets.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors";

    let badgeStyle = "bg-rose-100 text-rose-800 font-bold";
    if (row.class === "A")
      badgeStyle = "bg-emerald-100 text-emerald-800 font-bold";
    if (row.class === "B") badgeStyle = "bg-amber-100 text-amber-800 font-bold";

    const rankCell = document.createElement("td");
    rankCell.className = "p-4 font-medium text-gray-500";
    rankCell.textContent = row.rank;

    const nameCell = document.createElement("td");
    nameCell.className = "p-4 font-semibold text-gray-800";
    nameCell.textContent = row.name;

    const valueCell = document.createElement("td");
    valueCell.className = "p-4 text-right font-mono";
    valueCell.textContent = row.value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const annualQuantityCell = document.createElement("td");
    annualQuantityCell.className = `p-4 text-right font-mono text-gray-600 ${useXyz ? "" : "hidden"}`;
    annualQuantityCell.textContent = Number.isFinite(row.annualQuantity)
      ? row.annualQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "-";

    const cvCell = document.createElement("td");
    cvCell.className = `p-4 text-right font-mono text-gray-600 ${useXyz ? "" : "hidden"}`;
    cvCell.textContent = Number.isFinite(row.coefficientOfVariation)
      ? row.coefficientOfVariation.toFixed(2)
      : "-";

    const combinedCell = document.createElement("td");
    combinedCell.className = `p-4 text-center ${useXyz ? "" : "hidden"}`;
    if (useXyz) {
      const combinedBadge = document.createElement("span");
      combinedBadge.className = "px-3 py-1 rounded text-xs tracking-wider uppercase bg-blue-100 text-blue-800 font-bold";
      combinedBadge.textContent = row.combinedClass;
      combinedCell.appendChild(combinedBadge);
    }

    const percentCell = document.createElement("td");
    percentCell.className = "p-4 text-right font-mono text-gray-600";
    percentCell.textContent = `${(row.percent * 100).toFixed(2)}%`;

    const cumulativeCell = document.createElement("td");
    cumulativeCell.className = "p-4 text-right font-mono text-gray-600 font-medium";
    cumulativeCell.textContent = `${(row.cumulative * 100).toFixed(2)}%`;

    const classCell = document.createElement("td");
    classCell.className = "p-4 text-center";
    const classBadge = document.createElement("span");
    classBadge.className = `px-3 py-1 rounded text-xs tracking-wider uppercase ${badgeStyle}`;
    classBadge.textContent = row.class;
    classCell.appendChild(classBadge);

    tr.append(
      rankCell,
      nameCell,
      valueCell,
      annualQuantityCell,
      cvCell,
      combinedCell,
      percentCell,
      cumulativeCell,
      classCell,
    );
    tbody.appendChild(tr);
  });

  // Rebuild interactive Pareto Multi-Axis Canvas Charts
  buildParetoChart(datasets);

  if (useXyz) {
    renderAbcXyzMatrix(datasets, totalSum);
  }

  // Auto scroll down directly into view smoothly
  resultsDashboard.scrollIntoView({ behavior: "smooth" });
}

function formatCurrency(value) {
  return `\u00a3${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderManagementInsightPanel(totalSum, datasets, useXyz, classSummary) {
  const panel = document.getElementById("abc-insight-panel");
  const totalItems = datasets.length;
  const { countA, countB, countC, sumValA, sumValB, sumValC } = classSummary;
  const countShareC = totalItems > 0 ? countC / totalItems : 0;
  const valueShareA = totalSum > 0 ? sumValA / totalSum : 0;
  const valueShareC = totalSum > 0 ? sumValC / totalSum : 0;
  const azItems = useXyz ? datasets.filter((item) => item.combinedClass === "AZ") : [];
  const highValueVolatileItems = useXyz
    ? datasets.filter((item) => item.class === "A" && ["Y", "Z"].includes(item.xyzClass))
    : [];
  const priorityItems = useXyz ? highValueVolatileItems : datasets.filter((item) => item.class === "A");
  const priorityPreview = priorityItems
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const azValue = azItems.reduce((sum, item) => sum + item.value, 0);

  const xyzRiskCopy = useXyz
    ? azItems.length > 0
      ? `${azItems.length} AZ item${azItems.length === 1 ? "" : "s"} account for ${formatCurrency(azValue)} of inventory value and should be prioritised for forecast review and safety stock assessment.`
      : "No A-class items are currently classified as AZ. Continue reviewing AY and high-value A items for forecast and replenishment risk."
    : `${countA.toLocaleString()} A-class item${countA === 1 ? "" : "s"} should be prioritised for management review because they hold the largest share of inventory value.`;

  panel.innerHTML = `
    <div class="abc-insight-header">
      <div>
        <p class="abc-insight-eyebrow">Management Interpretation</p>
        <h2>What This Analysis Means</h2>
      </div>
      <span>${totalItems.toLocaleString()} SKU${totalItems === 1 ? "" : "s"} analysed</span>
    </div>
    <div class="abc-insight-grid">
      <section class="abc-insight-section abc-insight-section-wide">
        <h3>Executive Summary</h3>
        <ul>
          <li>Inventory analysis completed for ${totalItems.toLocaleString()} SKU${totalItems === 1 ? "" : "s"}.</li>
          <li>${countA.toLocaleString()} A-class item${countA === 1 ? "" : "s"} represent ${formatPercent(valueShareA)} of inventory value.</li>
          <li>${xyzRiskCopy}</li>
          <li>${formatPercent(countShareC)} of SKUs are C-class items but represent only ${formatPercent(valueShareC)} of inventory value.</li>
        </ul>
      </section>
      <section class="abc-insight-section">
        <h3>Working Capital View</h3>
        <dl>
          <div><dt>Total inventory value</dt><dd>${formatCurrency(totalSum)}</dd></div>
          <div><dt>Value in A items</dt><dd>${formatCurrency(sumValA)} (${formatPercent(valueShareA)})</dd></div>
          <div><dt>Value in C items</dt><dd>${formatCurrency(sumValC)} (${formatPercent(valueShareC)})</dd></div>
        </dl>
      </section>
      <section class="abc-insight-section">
        <h3>${useXyz ? "Risk Identification" : "Priority Focus"}</h3>
        <ul>
          <li>${useXyz ? `${azItems.length.toLocaleString()} AZ item${azItems.length === 1 ? "" : "s"} detected.` : `Review ${countA.toLocaleString()} A-class item${countA === 1 ? "" : "s"} first because they represent ${formatPercent(valueShareA)} of inventory value.`}</li>
          <li>${useXyz ? `${highValueVolatileItems.length.toLocaleString()} high-value volatile item${highValueVolatileItems.length === 1 ? "" : "s"} require review.` : `${countC.toLocaleString()} C-class item${countC === 1 ? "" : "s"} can usually be managed with simpler controls because they represent ${formatPercent(valueShareC)} of inventory value.`}</li>
          <li>${useXyz ? "Lead-time and single-source risk are not included unless those fields are added to the dataset." : "Demand variability, lead-time risk, and single-source risk are not assessed in ABC-only mode."}</li>
        </ul>
      </section>
      <section class="abc-insight-section">
        <h3>Suggested Policies</h3>
        <ul>
          <li><strong>A items:</strong> weekly review, tight min/max controls, frequent exception checks.</li>
          <li><strong>B items:</strong> monthly review with standard reorder controls.</li>
          <li><strong>C items:</strong> simplified replenishment and exception-based review.</li>
        </ul>
      </section>
      <section class="abc-insight-section">
        <h3>Cycle Count Recommendations</h3>
        <ul>
          <li><strong>A items:</strong> count most frequently, such as monthly or by rolling weekly samples.</li>
          <li><strong>B items:</strong> count quarterly or on a planned cycle.</li>
          <li><strong>C items:</strong> count less often, using annual, sample-based, or exception-driven checks.</li>
        </ul>
      </section>
    </div>
    <div class="abc-priority-list">
      <h3>${useXyz ? "Priority Review List" : "Highest-Value Review List"}</h3>
      ${
        priorityPreview.length > 0
          ? `<ol>${priorityPreview
              .map((item) => `<li><span>${escapeHtml(item.name)}</span><strong>${formatCurrency(item.value)}${useXyz ? ` - ${item.combinedClass}` : ` - ${item.class}`}</strong></li>`)
              .join("")}</ol>`
          : "<p>No priority items were identified from the current dataset.</p>"
      }
    </div>
  `;
}

function getXyzBadgeStyle(xyzClass) {
  if (xyzClass === "X") return "bg-blue-100 text-blue-800 font-bold";
  if (xyzClass === "Y") return "bg-indigo-100 text-indigo-800 font-bold";
  return "bg-purple-100 text-purple-800 font-bold";
}

function getSegmentRecommendation(segment) {
  const recommendations = {
    AX: "High value and predictable. Keep tight replenishment controls and reliable availability.",
    AY: "High value with moderate variability. Review forecasts and safety stock frequently.",
    AZ: "High value and volatile. Prioritize planning attention, supplier reliability, and buffer review.",
    BX: "Moderate value and predictable. Use standard replenishment with periodic review.",
    BY: "Moderate value and variable. Monitor demand changes and adjust reorder settings.",
    BZ: "Moderate value and volatile. Review stocking logic before increasing inventory.",
    CX: "Low value and predictable. Keep controls simple and automate where practical.",
    CY: "Low value with moderate variability. Use simple min/max rules and review exceptions.",
    CZ: "Low value and volatile. Consider lower service targets, make-to-order, or rationalization.",
  };
  return recommendations[segment] || "Review this segment before setting policy.";
}

function renderAbcXyzMatrix(datasets, totalSum) {
  const matrix = document.getElementById("abc-xyz-matrix");
  const summaryNote = document.getElementById("xyz-summary-note");
  const abcClasses = ["A", "B", "C"];
  const xyzClasses = ["X", "Y", "Z"];
  const segmentCounts = {};

  datasets.forEach((item) => {
    segmentCounts[item.combinedClass] = segmentCounts[item.combinedClass] || { count: 0, value: 0 };
    segmentCounts[item.combinedClass].count += 1;
    segmentCounts[item.combinedClass].value += item.value;
  });

  const volatileHighValue = datasets.filter((item) => item.combinedClass === "AZ");
  summaryNote.textContent = volatileHighValue.length > 0
    ? `${volatileHighValue.length} A-class item${volatileHighValue.length === 1 ? "" : "s"} also have Z-level variability. Review these first.`
    : "No A-class items are currently in the high-variability Z segment.";

  matrix.textContent = "";
  const corner = document.createElement("div");
  corner.className = "abc-xyz-cell abc-xyz-axis";
  corner.textContent = "ABC / XYZ";
  matrix.appendChild(corner);

  xyzClasses.forEach((xyzClass) => {
    const header = document.createElement("div");
    header.className = "abc-xyz-cell abc-xyz-axis";
    header.innerHTML = `<strong>${xyzClass}</strong><span>${xyzClass === "X" ? "Predictable" : xyzClass === "Y" ? "Moderate" : "Variable"}</span>`;
    matrix.appendChild(header);
  });

  abcClasses.forEach((abcClass) => {
    const rowHeader = document.createElement("div");
    rowHeader.className = "abc-xyz-cell abc-xyz-axis";
    rowHeader.innerHTML = `<strong>${abcClass}</strong><span>${abcClass === "A" ? "High value" : abcClass === "B" ? "Medium value" : "Lower value"}</span>`;
    matrix.appendChild(rowHeader);

    xyzClasses.forEach((xyzClass) => {
      const segment = `${abcClass}${xyzClass}`;
      const metrics = segmentCounts[segment] || { count: 0, value: 0 };
      const cell = document.createElement("div");
      cell.className = `abc-xyz-cell abc-xyz-segment segment-${segment.toLowerCase()}`;
      const valueShare = totalSum > 0 ? (metrics.value / totalSum) * 100 : 0;
      cell.innerHTML = `
        <strong>${segment}</strong>
        <span>${metrics.count} item${metrics.count === 1 ? "" : "s"} - ${valueShare.toFixed(1)}% value</span>
        <p>${getSegmentRecommendation(segment)}</p>
      `;
      matrix.appendChild(cell);
    });
  });
}

function buildParetoChart(datasets) {
  const ctx = document.getElementById("paretoChart").getContext("2d");

  if (paretoChartInstance) {
    paretoChartInstance.destroy();
  }

  // Sub-sample rendering if records exceed visual viewport boundaries safely
  const maxChartBars = 30;
  const displayData = datasets.slice(0, maxChartBars);

  const labels = displayData.map((d) => d.name);
  const absoluteValues = displayData.map((d) => d.value);
  const cumulativePercentages = displayData.map((d) =>
    (d.cumulative * 100).toFixed(1),
  );

  // Dynamic color determination for the bars based on classification type map context
  const barColors = displayData.map((d) => {
    if (d.class === "A") return "rgba(16, 185, 129, 0.75)"; // Emerald
    if (d.class === "B") return "rgba(245, 158, 11, 0.75)"; // Amber
    return "rgba(239, 68, 68, 0.6)"; // Rose
  });

  paretoChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Consumption Value",
          data: absoluteValues,
          backgroundColor: barColors,
          borderColor: barColors.map((c) =>
            c.replace("0.75", "1").replace("0.6", "1"),
          ),
          borderWidth: 1.5,
          yAxisID: "yAbsolute",
          order: 2,
        },
        {
          label: "Cumulative Percent (%)",
          data: cumulativePercentages,
          type: "line",
          borderColor: "#1F6FEB",
          borderWidth: 3,
          pointBackgroundColor: "#1F6FEB",
          pointHoverRadius: 6,
          fill: false,
          tension: 0.1,
          yAxisID: "yCumulative",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { weight: "bold" }, color: "#101828" },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          titleColor: "#101828",
          bodyColor: "#475467",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#475467" },
          title: { color: "#475467" },
        },
        yAbsolute: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "Individual Value",
            font: { weight: "bold" },
            color: "#475467",
          },
          ticks: { color: "#475467" },
          grid: { color: "#E4E7EC", borderDash: [4, 4] },
        },
        yCumulative: {
          type: "linear",
          position: "right",
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Cumulative Percent (%)",
            font: { weight: "bold" },
            color: "#475467",
          },
          ticks: { color: "#475467" },
          grid: { display: false },
        },
      },
    },
  });
}

// Data Export Utility Modules
window.exportData = function (format) {
  if (finalAnalysisResults.length === 0) return;
  const useXyz = finalAnalysisResults.some((row) => row.xyzClass);

  // Structure data cleanly mapping programmatic attributes into human-readable export maps
  const exportRows = finalAnalysisResults.map((r) => {
    const baseRow = {
      Rank: r.rank,
      "Item/SKU Code": r.name,
      "Consumption Value": r.value,
      "Percentage Share (%)": +(r.percent * 100).toFixed(4),
      "Cumulative Percentage (%)": +(r.cumulative * 100).toFixed(4),
      "ABC Classification": r.class,
    };

    if (useXyz) {
      return {
        ...baseRow,
        "Quantity Used": r.annualQuantity,
        "Months Used for XYZ": r.monthCount,
        "Coefficient of Variation": Number.isFinite(r.coefficientOfVariation) ? +r.coefficientOfVariation.toFixed(4) : "",
        "ABC-XYZ Segment": r.combinedClass,
        "Recommended Policy": getSegmentRecommendation(r.combinedClass),
      };
    }

    return baseRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ABC Analysis Results");

  if (format === "xlsx") {
    XLSX.writeFile(
      workbook,
      `ABC_Analysis_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  } else {
    XLSX.writeFile(
      workbook,
      `ABC_Analysis_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      { bookType: "csv" },
    );
  }
};

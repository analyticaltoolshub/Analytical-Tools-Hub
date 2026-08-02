const scaleLabels = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Very High"
};

const riskFactors = [
  {
    id: "supplierAvailability",
    name: "Number of Suppliers",
    description: "Availability of qualified alternative sources. Very low means several viable suppliers; very high means sole-source or highly concentrated supply."
  },
  {
    id: "leadTime",
    name: "Lead Time and Delivery",
    description: "Length, variability, and reliability of replenishment lead time. Risk rises when delays are frequent or recovery is slow."
  },
  {
    id: "switchingDifficulty",
    name: "Switching and Substitution",
    description: "Time, qualification effort, tooling, approvals, and cost required to change supplier or substitute the specification."
  },
  {
    id: "financialStability",
    name: "Financial Stability",
    description: "Risk that weak liquidity, profitability, credit position, or business continuity could interrupt supply."
  },
  {
    id: "qualityRisk",
    name: "Quality Risk",
    description: "Likelihood and operational impact of defects, non-conformance, rework, warranty claims, or weak quality controls."
  },
  {
    id: "capacityRisk",
    name: "Capacity and Flexibility",
    description: "Ability to meet current demand, absorb volume changes, recover capacity, and respond to urgent requirements."
  },
  {
    id: "geopoliticalRisk",
    name: "Geopolitical and Location Risk",
    description: "Exposure to political instability, trade restrictions, border disruption, regional concentration, or natural hazards."
  },
  {
    id: "technologyComplexity",
    name: "Technology Complexity",
    description: "Dependence on specialist intellectual property, proprietary tooling, scarce capability, or rapidly changing technology."
  },
  {
    id: "complianceRisk",
    name: "Regulatory and ESG Compliance",
    description: "Exposure to regulatory, safety, labour, environmental, ethical-sourcing, or certification failures."
  },
  {
    id: "logisticsContinuity",
    name: "Logistics Continuity",
    description: "Reliance on constrained routes, modes, ports, carriers, storage conditions, or vulnerable logistics infrastructure."
  }
];

function isValidRisk(value) {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

function getRiskLevel(value) {
  if (!isValidRisk(value)) return "Not set";
  return scaleLabels[Math.min(5, Math.max(1, Math.round(value)))];
}

function cloneRiskAssessment(assessment) {
  return {
    weightMode: assessment.weightMode,
    factors: assessment.factors.map(factor => ({ ...factor })),
    scores: { ...assessment.scores },
    weights: { ...assessment.weights },
    scoresConfirmed: Boolean(assessment.scoresConfirmed)
  };
}

function createRiskAssessment(factors, existingAssessment = null) {
  return {
    weightMode: existingAssessment ? existingAssessment.weightMode : "",
    factors: factors.map(factor => ({ ...factor })),
    scores: Object.fromEntries(factors.map(factor => {
      const existingScore = Number(existingAssessment && existingAssessment.scores[factor.id]);
      return [factor.id, isValidRisk(existingScore) ? Math.round(existingScore) : 3];
    })),
    weights: Object.fromEntries(factors.map(factor => {
      const existingWeight = Number(existingAssessment && existingAssessment.weights[factor.id]);
      return [factor.id, Number.isFinite(existingWeight) && existingWeight >= 0 ? existingWeight : 0];
    })),
    scoresConfirmed: Boolean(existingAssessment && existingAssessment.scoresConfirmed)
  };
}

function sanitizeRiskFactor(factor) {
  if (!factor || typeof factor !== "object") return null;
  const id = String(factor.id || "").trim();
  const name = String(factor.name || "").trim();
  if (!id || !name) return null;

  return {
    id,
    name: name.slice(0, 80),
    description: String(factor.description || "").trim().slice(0, 240),
    custom: Boolean(factor.custom)
  };
}

function sanitizeRiskAssessment(assessment) {
  if (!assessment || typeof assessment !== "object") {
    return null;
  }

  let factors = Array.isArray(assessment.factors)
    ? assessment.factors.map(sanitizeRiskFactor).filter(Boolean)
    : [];

  if (!factors.length && Array.isArray(assessment.selectedFactorIds)) {
    factors = assessment.selectedFactorIds
      .map(id => riskFactors.find(factor => factor.id === id))
      .filter(Boolean)
      .map(factor => ({ ...factor, custom: false }));
  }

  factors = factors.filter((factor, index, all) => (
    all.findIndex(candidate => candidate.id === factor.id) === index
  ));

  if (!factors.length) {
    return null;
  }

  const scores = {};
  const weights = {};
  factors.forEach(factor => {
    const score = Number(assessment.scores && assessment.scores[factor.id]);
    const weight = Number(assessment.weights && assessment.weights[factor.id]);
    scores[factor.id] = isValidRisk(score) ? Math.round(score) : 3;
    weights[factor.id] = Number.isFinite(weight) && weight >= 0 ? weight : 0;
  });

  const legacyReferenceMode = assessment.weightMode === "reference";
  return {
    weightMode: legacyReferenceMode
      ? ""
      : (assessment.weightMode === "equal" || assessment.weightMode === "custom" ? assessment.weightMode : ""),
    factors,
    scores,
    weights: legacyReferenceMode ? Object.fromEntries(factors.map(factor => [factor.id, 0])) : weights,
    scoresConfirmed: assessment.scoresConfirmed === undefined
      ? true
      : Boolean(assessment.scoresConfirmed)
  };
}

function calculateRiskDetails(assessment) {
  const sanitized = sanitizeRiskAssessment(assessment);

  if (!sanitized || !sanitized.scoresConfirmed || !sanitized.weightMode) {
    return null;
  }

  const equalWeight = 100 / sanitized.factors.length;
  const weights = sanitized.weightMode === "equal"
    ? Object.fromEntries(sanitized.factors.map(factor => [factor.id, equalWeight]))
    : sanitized.weights;
  const totalWeight = sanitized.factors.reduce((total, factor) => (
    total + Number(weights[factor.id] || 0)
  ), 0);

  if (Math.abs(totalWeight - 100) > 0.01) {
    return null;
  }

  const rows = sanitized.factors.map(factor => {
    const score = sanitized.scores[factor.id];
    const weight = Number(weights[factor.id] || 0);

    return {
      factor,
      score,
      weight,
      contribution: score * (weight / 100)
    };
  });

  return {
    assessment: {
      ...sanitized,
      weights
    },
    rows,
    overall: rows.reduce((total, row) => total + row.contribution, 0)
  };
}

const sampleSpendRows = [
  { "Item / Category Name": "Item-1", "Supplier Name": "Supplier-1", "Annual Spend": "250,000" },
  { "Item / Category Name": "Item-2", "Supplier Name": "Supplier-2", "Annual Spend": "4,500,000" },
  { "Item / Category Name": "Item-2", "Supplier Name": "Supplier-3", "Annual Spend": "1,200,000" },
  { "Item / Category Name": "Item-3", "Supplier Name": "Supplier-1", "Annual Spend": "1,800,000" },
  { "Item / Category Name": "Item-4", "Supplier Name": "Supplier-2", "Annual Spend": "25,000" }
];

let uploadedRawData = null;

function createItemId(name, supplier) {
  return `${String(name || "").trim()}::${String(supplier || "").trim()}`;
}

function getItemSupplier(item) {
  return item.suppliers && item.suppliers.length
    ? item.suppliers[0]
    : "Supplier not specified";
}

function getItemLabel(item) {
  return `${item.name} - ${getItemSupplier(item)}`;
}

function loadItems() {
  try {
    const savedItems = JSON.parse(localStorage.getItem("kraljic"));

    if (!Array.isArray(savedItems)) {
      return [];
    }

    return savedItems
      .filter(item => (
        item &&
        typeof item.name === "string" &&
        (item.risk === null || isValidRisk(Number(item.risk))) &&
        Number.isInteger(item.impact) &&
        item.impact >= 1 &&
        item.impact <= 5
      ))
      .map(item => {
        const legacyRisk = item.risk === null ? null : Number(item.risk);
        const riskAssessment = sanitizeRiskAssessment(item.riskAssessment);
        const calculatedRisk = calculateRiskDetails(riskAssessment);

        const suppliers = Array.isArray(item.suppliers) ? item.suppliers.filter(Boolean) : [];
        return {
          id: String(item.id || createItemId(item.name, suppliers.join("|"))),
          name: item.name.trim(),
          risk: calculatedRisk ? Number(calculatedRisk.overall.toFixed(2)) : legacyRisk,
          riskAssessment,
          impact: item.impact,
          annualSpend: Number(item.annualSpend) || 0,
          suppliers
        };
      })
      .filter(item => item.name);
  } catch (error) {
    console.warn("Unable to load saved Kraljic Matrix data.", error);
    return [];
  }
}

let items = loadItems();
let matrixIsCurrent = items.length > 0 && items.every(item => isValidRisk(item.risk));
let riskDraft = null;
let riskDraftDirty = false;
let activeRiskCategoryName = null;
let factorSelectionDraft = items.find(item => item.riskAssessment)
  ? items.find(item => item.riskAssessment).riskAssessment.factors.map(factor => ({ ...factor }))
  : [];
let factorsConfirmed = factorSelectionDraft.length > 0;

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const sampleBtn = document.getElementById("sampleBtn");
const mappingSection = document.getElementById("mapping-section");
const categoryColumn = document.getElementById("categoryColumn");
const supplierColumn = document.getElementById("supplierColumn");
const spendColumn = document.getElementById("spendColumn");
const processBtn = document.getElementById("processBtn");
const riskEntry = document.getElementById("risk-entry");
const categorySelect = document.getElementById("categorySelect");
const riskWeightMode = document.getElementById("riskWeightMode");
const toggleRiskFactorsBtn = document.getElementById("toggleRiskFactorsBtn");
const riskFactorPanel = document.getElementById("riskFactorPanel");
const riskFactorSelector = document.getElementById("riskFactorSelector");
const customRiskFactorName = document.getElementById("customRiskFactorName");
const customRiskFactorDescription = document.getElementById("customRiskFactorDescription");
const addCustomRiskFactorBtn = document.getElementById("addCustomRiskFactorBtn");
const selectedRiskFactors = document.getElementById("selectedRiskFactors");
const confirmRiskFactorsBtn = document.getElementById("confirmRiskFactorsBtn");
const riskFactorStatus = document.getElementById("riskFactorStatus");
const riskScoringSection = document.getElementById("riskScoringSection");
const riskCategoryProgress = document.getElementById("riskCategoryProgress");
const riskFactorAssessments = document.getElementById("riskFactorAssessments");
const riskWeightingSection = document.getElementById("riskWeightingSection");
const riskWeightInputs = document.getElementById("riskWeightInputs");
const riskWeightTotal = document.getElementById("riskWeightTotal");
const riskWeightError = document.getElementById("riskWeightError");
const applyRiskWeightsBtn = document.getElementById("applyRiskWeightsBtn");
const riskBreakdownSection = document.getElementById("riskBreakdownSection");
const riskBreakdownItems = document.getElementById("riskBreakdownItems");
const riskSaveStatus = document.getElementById("riskSaveStatus");
const addBtn = document.getElementById("addBtn");
const updateMatrixBtn = document.getElementById("updateMatrixBtn");
const resetBtn = document.getElementById("resetBtn");
const csvBtn = document.getElementById("csvBtn");
const imgBtn = document.getElementById("imgBtn");
const tableBody = document.getElementById("table");
const matrix = document.getElementById("matrix");
const summary = document.getElementById("summary");
const matrixSummary = document.getElementById("matrixSummary");
const searchInput = document.getElementById("searchInput");
const exportArea = document.getElementById("exportArea");
const portfolioPriorityBadge = document.getElementById("portfolioPriorityBadge");
const portfolioInterpretationSummary = document.getElementById("portfolioInterpretationSummary");
const portfolioInsights = document.getElementById("portfolioInsights");
const categoryRecommendations = document.getElementById("categoryRecommendations");

function updateKraljicWorkflow() {
  const hasItems = items.length > 0;
  const hasMissingRisk = hasItems && items.some(item => !isValidRisk(item.risk));
  let activeStep = 1;

  if (hasItems && (hasMissingRisk || riskDraftDirty)) {
    activeStep = 2;
  } else if (hasItems && !matrixIsCurrent) {
    activeStep = 3;
  } else if (hasItems) {
    activeStep = 4;
  }

  document.querySelectorAll("[data-kraljic-workflow-step]").forEach(item => {
    const step = Number(item.dataset.kraljicWorkflowStep);
    item.classList.toggle("active", step === activeStep);
    item.classList.toggle("complete", step < activeStep);

    if (step === activeStep) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function buildRiskFactorSelector() {
  riskFactorSelector.textContent = "";

  riskFactors.forEach(factor => {
    const label = document.createElement("label");
    label.className = "risk-factor-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = factor.id;
    checkbox.dataset.riskFactorId = factor.id;
    checkbox.checked = factorSelectionDraft.some(selected => selected.id === factor.id);

    const text = document.createElement("span");
    text.textContent = factor.name;

    label.append(checkbox, text);
    riskFactorSelector.appendChild(label);
  });
}

function renderSelectedRiskFactors() {
  selectedRiskFactors.textContent = "";

  if (!factorSelectionDraft.length) {
    const empty = document.createElement("p");
    empty.className = "risk-factor-empty";
    empty.textContent = "No risk factors selected. Use Add Risk Factors to choose from the list or create a custom factor.";
    selectedRiskFactors.appendChild(empty);
    return;
  }

  factorSelectionDraft.forEach(factor => {
    const item = document.createElement("div");
    item.className = "selected-risk-factor";

    const content = document.createElement("div");
    const name = document.createElement("strong");
    const description = document.createElement("p");
    name.textContent = factor.name;
    description.textContent = factor.description || "No description provided.";
    content.append(name, description);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-factor";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      factorSelectionDraft = factorSelectionDraft.filter(candidate => candidate.id !== factor.id);
      const checkbox = riskFactorSelector.querySelector(`[data-risk-factor-id="${factor.id}"]`);
      if (checkbox) checkbox.checked = false;
      markFactorSelectionUnconfirmed("Confirm the updated factor set before scoring.");
      renderSelectedRiskFactors();
    });

    item.append(content, removeButton);

    selectedRiskFactors.appendChild(item);
  });
}

function markFactorSelectionUnconfirmed(message) {
  factorsConfirmed = false;
  riskScoringSection.classList.add("hidden");
  riskWeightingSection.classList.add("hidden");
  riskBreakdownSection.classList.add("hidden");
  exportArea.classList.add("hidden");
  matrixIsCurrent = false;
  riskFactorStatus.textContent = message;
  updateKraljicWorkflow();
}

function addCustomRiskFactor() {
  const name = customRiskFactorName.value.trim();
  const description = customRiskFactorDescription.value.trim();

  if (!name) {
    riskFactorStatus.textContent = "Enter a name for the custom risk factor.";
    customRiskFactorName.focus();
    return;
  }

  factorSelectionDraft.push({
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    custom: true
  });
  customRiskFactorName.value = "";
  customRiskFactorDescription.value = "";
  markFactorSelectionUnconfirmed("Custom factor added. Confirm the factor set when ready.");
  renderSelectedRiskFactors();
}

function handleRiskFactorSelection() {
  const selectedBuiltInIds = new Set(
    Array.from(riskFactorSelector.querySelectorAll("[data-risk-factor-id]:checked"))
      .map(checkbox => checkbox.dataset.riskFactorId)
  );
  const customFactors = factorSelectionDraft.filter(factor => factor.custom);
  const selectedBuiltIns = riskFactors
    .filter(factor => selectedBuiltInIds.has(factor.id))
    .map(factor => ({ ...factor, custom: false }));

  factorSelectionDraft = [...selectedBuiltIns, ...customFactors];
  markFactorSelectionUnconfirmed("Confirm the selected factors to continue.");
  renderSelectedRiskFactors();
}

function confirmRiskFactors() {
  const validFactors = factorSelectionDraft
    .map(sanitizeRiskFactor)
    .filter(factor => factor && factor.name);

  if (!validFactors.length) {
    riskFactorStatus.textContent = "Select or add at least one risk factor.";
    return;
  }

  factorSelectionDraft = validFactors;
  factorsConfirmed = true;
  items = items.map(item => {
    const previousAssessment = sanitizeRiskAssessment(item.riskAssessment);
    return {
      ...item,
      risk: null,
      riskAssessment: {
        ...createRiskAssessment(factorSelectionDraft, previousAssessment),
        weightMode: "",
        weights: Object.fromEntries(factorSelectionDraft.map(factor => [factor.id, 0])),
        scoresConfirmed: false
      }
    };
  });
  riskDraftDirty = false;
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  riskFactorStatus.textContent = `${factorSelectionDraft.length} risk factor${factorSelectionDraft.length === 1 ? "" : "s"} confirmed. Score each item-supplier relationship next.`;
  riskScoringSection.classList.remove("hidden");
  riskWeightingSection.classList.add("hidden");
  riskBreakdownSection.classList.add("hidden");
  riskWeightMode.value = "";
  save();
  populateCategoryRiskSelector();
  renderTable();
  updateKraljicWorkflow();
}

function renderRiskFactorAssessments() {
  riskFactorAssessments.textContent = "";

  if (!riskDraft || !riskDraft.factors.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "risk-factor-empty";
    emptyState.textContent = "Confirm at least one risk factor to create the assessment.";
    riskFactorAssessments.appendChild(emptyState);
    return;
  }

  riskDraft.factors.forEach(factor => {
    const row = document.createElement("div");
    row.className = "risk-factor-row";

    const heading = document.createElement("div");
    heading.className = "risk-factor-row-heading";

    const label = document.createElement("strong");
    label.id = `risk-label-${factor.id}`;
    label.textContent = factor.name;

    const output = document.createElement("output");
    output.id = `risk-output-${factor.id}`;
    output.textContent = getRiskLevel(riskDraft.scores[factor.id]);

    const description = document.createElement("p");
    description.id = `risk-description-${factor.id}`;
    description.className = "risk-factor-description";
    description.textContent = factor.description;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = String(riskDraft.scores[factor.id]);
    slider.setAttribute("aria-labelledby", label.id);
    slider.setAttribute("aria-describedby", description.id);
    slider.setAttribute("aria-valuetext", getRiskLevel(riskDraft.scores[factor.id]));
    slider.addEventListener("input", () => {
      riskDraft.scores[factor.id] = Number(slider.value);
      const level = getRiskLevel(Number(slider.value));
      output.textContent = level;
      slider.setAttribute("aria-valuetext", level);
      riskSaveStatus.textContent = "Unsaved assessment changes.";
      riskDraftDirty = true;
      matrixIsCurrent = false;
      exportArea.classList.add("hidden");
      riskBreakdownSection.classList.add("hidden");
      updateKraljicWorkflow();
    });

    heading.append(label);
    row.append(heading, description, slider, output);
    riskFactorAssessments.appendChild(row);
  });
}

function renderRiskBreakdowns() {
  const assessedItems = items
    .map(item => ({ item, details: calculateRiskDetails(item.riskAssessment) }))
    .filter(entry => entry.details);
  riskBreakdownItems.textContent = "";

  if (!assessedItems.length) {
    riskBreakdownSection.classList.add("hidden");
    return;
  }

  riskBreakdownSection.classList.remove("hidden");

  assessedItems.forEach(({ item, details }) => {
    const article = document.createElement("article");
    article.className = "risk-breakdown-item";

    const heading = document.createElement("div");
    heading.className = "risk-breakdown-item-heading";
    const headingCopy = document.createElement("div");
    const title = document.createElement("h5");
    const note = document.createElement("p");
    title.textContent = getItemLabel(item);
    note.textContent = details.assessment.weightMode === "custom"
      ? "Custom weights applied."
      : `Equal weights applied across ${details.rows.length} factors.`;
    headingCopy.append(title, note);

    const scoreCard = document.createElement("div");
    scoreCard.className = "overall-risk-card";
    const scoreLabel = document.createElement("span");
    const score = document.createElement("strong");
    const level = document.createElement("small");
    scoreLabel.textContent = "Calculated Supply Risk";
    score.textContent = `${details.overall.toFixed(2)} / 5`;
    level.textContent = `${getRiskLevel(details.overall)} risk`;
    scoreCard.append(scoreLabel, score, level);
    heading.append(headingCopy, scoreCard);

    const tableScroll = document.createElement("div");
    tableScroll.className = "table-scroll";
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Risk factor", "Score", "Weight", "Contribution"].forEach(label => {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    details.rows.forEach(row => {
      const tr = document.createElement("tr");
      [
        row.factor.name,
        `${row.score} / 5`,
        `${row.weight.toFixed(1)}%`,
        `${row.contribution.toFixed(2)} points`
      ].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    const totalRow = document.createElement("tr");
    const totalLabel = document.createElement("td");
    const totalScore = document.createElement("td");
    const totalWeight = document.createElement("td");
    const totalContribution = document.createElement("td");
    const totalLabelText = document.createElement("strong");
    const totalContributionText = document.createElement("strong");
    totalLabelText.textContent = "Calculated Supply Risk";
    totalContributionText.textContent = `${details.overall.toFixed(2)} / 5`;
    totalLabel.appendChild(totalLabelText);
    totalWeight.textContent = "100%";
    totalContribution.appendChild(totalContributionText);
    totalRow.append(totalLabel, totalScore, totalWeight, totalContribution);
    tbody.appendChild(totalRow);

    table.append(thead, tbody);
    tableScroll.appendChild(table);
    article.append(heading, tableScroll);
    riskBreakdownItems.appendChild(article);
  });
}

function hasCompleteCategoryScores(item) {
  const assessment = sanitizeRiskAssessment(item && item.riskAssessment);
  return Boolean(
    assessment &&
    assessment.scoresConfirmed &&
    assessment.factors.length === factorSelectionDraft.length &&
    factorSelectionDraft.every(factor => (
      assessment.factors.some(candidate => candidate.id === factor.id) &&
      isValidRisk(Number(assessment.scores[factor.id]))
    ))
  );
}

function updateRiskCategoryProgress() {
  const completed = items.filter(hasCompleteCategoryScores).length;
  riskCategoryProgress.textContent = `${completed} of ${items.length} assessed`;
  riskWeightingSection.classList.toggle("hidden", !items.length || completed !== items.length);
}

function renderRiskWeightInputs() {
  riskWeightInputs.textContent = "";
  riskWeightError.textContent = "";
  riskWeightTotal.classList.remove("invalid");

  if (!riskWeightMode.value || !factorSelectionDraft.length) {
    riskWeightTotal.textContent = "0%";
    return;
  }

  if (riskWeightMode.value === "equal") {
    const exactWeight = 100 / factorSelectionDraft.length;
    factorSelectionDraft.forEach(factor => {
      const row = document.createElement("div");
      row.className = "risk-weight-row";
      const name = document.createElement("span");
      const value = document.createElement("strong");
      name.textContent = factor.name;
      value.textContent = `${exactWeight.toFixed(2)}%`;
      row.append(name, value);
      riskWeightInputs.appendChild(row);
    });
    riskWeightTotal.textContent = "100%";
    return;
  }

  const sourceAssessment = items.find(item => item.riskAssessment && item.riskAssessment.weightMode === "custom");
  factorSelectionDraft.forEach(factor => {
    const row = document.createElement("div");
    row.className = "risk-weight-row risk-weight-row-editable";
    const label = document.createElement("label");
    const input = document.createElement("input");
    const suffix = document.createElement("span");
    label.htmlFor = `risk-weight-${factor.id}`;
    label.textContent = factor.name;
    input.id = `risk-weight-${factor.id}`;
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.step = "0.1";
    input.dataset.riskWeightId = factor.id;
    input.value = String(
      Number(sourceAssessment && sourceAssessment.riskAssessment.weights[factor.id]) || 0
    );
    input.addEventListener("input", updateCustomWeightTotal);
    suffix.textContent = "%";
    row.append(label, input, suffix);
    riskWeightInputs.appendChild(row);
  });
  updateCustomWeightTotal();
}

function getCustomWeights() {
  return Object.fromEntries(
    Array.from(riskWeightInputs.querySelectorAll("[data-risk-weight-id]"))
      .map(input => [input.dataset.riskWeightId, Number(input.value) || 0])
  );
}

function updateCustomWeightTotal() {
  const total = Object.values(getCustomWeights()).reduce((sum, value) => sum + value, 0);
  riskWeightTotal.textContent = `${total.toFixed(1)}%`;
  riskWeightTotal.classList.toggle("invalid", Math.abs(total - 100) > 0.01);
  riskWeightError.textContent = total > 100
    ? "Custom weights exceed 100%."
    : "";
}

function applyRiskWeights() {
  if (!items.length || items.some(item => !hasCompleteCategoryScores(item))) {
    riskWeightError.textContent = "Save factor scores for every item-supplier relationship before applying weights.";
    return;
  }

  const mode = riskWeightMode.value;
  if (mode !== "equal" && mode !== "custom") {
    riskWeightError.textContent = "Choose Equal Weights or Custom Weights.";
    return;
  }

  const equalWeight = 100 / factorSelectionDraft.length;
  const weights = mode === "equal"
    ? Object.fromEntries(factorSelectionDraft.map(factor => [factor.id, equalWeight]))
    : getCustomWeights();
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (mode === "custom" && Math.abs(total - 100) > 0.01) {
    riskWeightError.textContent = `Custom weights total ${total.toFixed(1)}%. Adjust them to exactly 100%.`;
    return;
  }

  items = items.map(item => {
    const assessment = createRiskAssessment(factorSelectionDraft, item.riskAssessment);
    assessment.weightMode = mode;
    assessment.weights = { ...weights };
    const details = calculateRiskDetails(assessment);
    return {
      ...item,
      riskAssessment: details.assessment,
      risk: Number(details.overall.toFixed(2))
    };
  });

  riskWeightError.textContent = "";
  riskDraftDirty = false;
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  save();
  populateCategoryRiskSelector();
  renderTable();
  renderRiskBreakdowns();
  updateKraljicWorkflow();
}

function save() {
  localStorage.setItem("kraljic", JSON.stringify(items));
}

function classifyItem(item) {
  if (!isValidRisk(item.risk)) return null;
  if (item.impact > 2 && item.risk > 2) return "strategic";
  if (item.impact <= 2 && item.risk > 2) return "bottleneck";
  if (item.impact > 2 && item.risk <= 2) return "leverage";
  return "non-critical";
}

function formatQuadrant(category) {
  if (!category) return "Pending";
  if (category === "non-critical") return "Non-Critical";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getTopRiskDriver(item) {
  const details = calculateRiskDetails(item.riskAssessment);
  if (!details || !details.rows.length) return null;

  return details.rows.reduce((highest, row) => (
    !highest || row.contribution > highest.contribution ? row : highest
  ), null);
}

function getCategoryRecommendation(category) {
  const recommendations = {
    strategic: "Build a close supplier relationship, agree continuity actions, monitor the leading risk driver, and review long-term sourcing options.",
    leverage: "Use competitive tension and volume leverage while maintaining performance controls and avoiding unnecessary supplier dependency.",
    bottleneck: "Protect continuity through buffers, qualification of alternatives, specification review, and focused mitigation of the leading risk driver.",
    "non-critical": "Simplify purchasing through standardisation, catalogues, automation, or consolidated ordering while keeping controls proportionate."
  };

  return recommendations[category] || "Complete the supply-risk assessment before selecting a sourcing response.";
}

function renderPortfolioInterpretation() {
  const assessedItems = items.filter(item => classifyItem(item));
  const totalSpend = assessedItems.reduce((total, item) => total + item.annualSpend, 0);
  const groups = {
    strategic: assessedItems.filter(item => classifyItem(item) === "strategic"),
    leverage: assessedItems.filter(item => classifyItem(item) === "leverage"),
    bottleneck: assessedItems.filter(item => classifyItem(item) === "bottleneck"),
    "non-critical": assessedItems.filter(item => classifyItem(item) === "non-critical")
  };
  const priorityItems = [...groups.strategic, ...groups.bottleneck];
  const prioritySpend = priorityItems.reduce((total, item) => total + item.annualSpend, 0);
  const strategicSpend = groups.strategic.reduce((total, item) => total + item.annualSpend, 0);
  const highestRiskItem = [...assessedItems].sort((a, b) => (
    b.risk - a.risk || b.annualSpend - a.annualSpend
  ))[0];

  portfolioPriorityBadge.textContent = `${priorityItems.length} priority relationship${priorityItems.length === 1 ? "" : "s"}`;
  portfolioInterpretationSummary.textContent =
    `This portfolio assesses ${assessedItems.length} item-supplier relationship${assessedItems.length === 1 ? "" : "s"} ` +
    `representing ${formatCurrency(totalSpend)} in annual purchasing exposure. ` +
    `${priorityItems.length} relationship${priorityItems.length === 1 ? " falls" : "s fall"} in the Strategic or Bottleneck quadrants and should receive earlier procurement review.`;

  portfolioInsights.textContent = "";
  const insights = [
    {
      label: "Strategic Exposure",
      value: formatCurrency(strategicSpend),
      detail: `${groups.strategic.length} high-impact, high-risk relationship${groups.strategic.length === 1 ? "" : "s"}`
    },
    {
      label: "Continuity Priority",
      value: formatCurrency(prioritySpend),
      detail: "Annual spend in Strategic and Bottleneck relationships"
    },
    {
      label: "Highest Supply Risk",
      value: highestRiskItem ? getItemLabel(highestRiskItem) : "None",
      detail: highestRiskItem
        ? `${highestRiskItem.risk.toFixed(2)} / 5 - ${getRiskLevel(highestRiskItem.risk)} risk`
        : "Complete the assessment to identify the leading exposure"
    }
  ];

  insights.forEach(insight => {
    const card = document.createElement("article");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    const detail = document.createElement("p");
    label.textContent = insight.label;
    value.textContent = insight.value;
    detail.textContent = insight.detail;
    card.append(label, value, detail);
    portfolioInsights.appendChild(card);
  });

  categoryRecommendations.textContent = "";
  [...assessedItems]
    .sort((a, b) => {
      const priority = { strategic: 0, bottleneck: 1, leverage: 2, "non-critical": 3 };
      return priority[classifyItem(a)] - priority[classifyItem(b)] || b.annualSpend - a.annualSpend;
    })
    .forEach(item => {
      const category = classifyItem(item);
      const topDriver = getTopRiskDriver(item);
      const article = document.createElement("article");
      const heading = document.createElement("div");
      const title = document.createElement("h5");
      const badge = document.createElement("span");
      const recommendation = document.createElement("p");
      const evidence = document.createElement("small");

      title.textContent = getItemLabel(item);
      badge.className = `quadrant-label quadrant-label-${category}`;
      badge.textContent = formatQuadrant(category);
      heading.append(title, badge);
      recommendation.textContent = getCategoryRecommendation(category);
      evidence.textContent = topDriver
        ? `Top weighted risk driver: ${topDriver.factor.name} (${topDriver.contribution.toFixed(2)} points). Annual spend: ${formatCurrency(item.annualSpend)}.`
        : `Annual spend: ${formatCurrency(item.annualSpend)}. No weighted risk-driver breakdown is available.`;
      article.append(heading, recommendation, evidence);
      categoryRecommendations.appendChild(article);
    });
}

function getPointClass(category) {
  switch (category) {
    case "strategic": return "strategic-point";
    case "bottleneck": return "bottleneck-point";
    case "leverage": return "leverage-point";
    default: return "non-critical-point";
  }
}

function getPointColor(category) {
  switch (category) {
    case "strategic": return "#E11D48";
    case "bottleneck": return "#D97706";
    case "leverage": return "#16A34A";
    default: return "#1F6FEB";
  }
}

function getPointOffset(index) {
  const offsetPattern = [
    [0, 0],
    [12, -12],
    [-12, 12],
    [12, 12],
    [-12, -12],
    [0, -18],
    [18, 0],
    [0, 18],
    [-18, 0]
  ];

  return offsetPattern[index % offsetPattern.length];
}

function parseSpend(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value || "")
    .replace(/[^0-9.-]/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function calculateImpactScores(aggregatedItems) {
  const spends = aggregatedItems.map(item => item.annualSpend);
  const minSpend = Math.min(...spends);
  const maxSpend = Math.max(...spends);

  return aggregatedItems.map(item => {
    if (maxSpend === minSpend) {
      return { ...item, impact: 3 };
    }

    const normalized = (item.annualSpend - minSpend) / (maxSpend - minSpend);
    return {
      ...item,
      impact: Math.min(5, Math.max(1, Math.round(normalized * 4) + 1))
    };
  });
}

function populateColumnSelectors(headers) {
  [categoryColumn, supplierColumn, spendColumn].forEach(select => {
    select.textContent = "";
    headers.forEach(header => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      select.appendChild(option);
    });
  });

  selectLikelyColumn(categoryColumn, headers, ["item", "category", "commodity", "group"]);
  selectLikelyColumn(supplierColumn, headers, ["supplier", "vendor"]);
  selectLikelyColumn(spendColumn, headers, ["annual spend", "spend", "value", "cost"]);
  mappingSection.classList.remove("hidden");
}

function selectLikelyColumn(select, headers, keywords) {
  const match = headers.find(header => {
    const normalized = header.toLowerCase();
    return keywords.some(keyword => normalized.includes(keyword));
  });

  if (match) {
    select.value = match;
  }
}

function setUploadedData(rows, showMapping = true) {
  uploadedRawData = rows;
  const headers = Object.keys(rows[0] || {});

  if (!headers.length) {
    alert("No usable columns were found. Please use a file with a header row.");
    return;
  }

  if (showMapping) {
    populateColumnSelectors(headers);
  }
}

function loadSampleData() {
  mappingSection.classList.add("hidden");
  uploadedRawData = sampleSpendRows;
  aggregateRows("Item / Category Name", "Supplier Name", "Annual Spend");
}

function handleFile(file) {
  if (!file) {
    return;
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const allowedExtensions = [".csv", ".xlsx", ".xls"];

  if (!allowedExtensions.includes(extension)) {
    alert("Please upload a valid CSV, XLS, or XLSX file.");
    fileInput.value = "";
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("The spreadsheet parser is not available. Please check your connection and reload the page.");
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("Workbook does not contain any sheets.");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        header: 1
      });
      const headerRow = rawRows.find(row => row.some(cell => String(cell).trim()));

      if (!headerRow) {
        throw new Error("No header row found.");
      }

      const parsedRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        range: rawRows.indexOf(headerRow)
      });

      if (!parsedRows.length) {
        throw new Error("No data rows found.");
      }

      setUploadedData(parsedRows, true);
    } catch (error) {
      console.error("Unable to read file.", error);
      uploadedRawData = null;
      mappingSection.classList.add("hidden");
      fileInput.value = "";
      alert("We could not read this file. Please upload a CSV, XLS, or XLSX file with a header row and data rows.");
    }
  };

  reader.onerror = () => {
    uploadedRawData = null;
    mappingSection.classList.add("hidden");
    fileInput.value = "";
    alert("We could not read this file. Please try again.");
  };

  reader.readAsArrayBuffer(file);
}

function aggregateMappedData() {
  if (!uploadedRawData || !uploadedRawData.length) {
    alert("Upload a file or load sample data first.");
    return;
  }

  aggregateRows(categoryColumn.value, supplierColumn.value, spendColumn.value);
}

function aggregateRows(categoryKey, supplierKey, spendKey) {
  const previousRiskById = new Map(items.map(item => [
    item.id || createItemId(item.name, getItemSupplier(item)),
    {
      risk: item.risk,
      riskAssessment: item.riskAssessment
        ? cloneRiskAssessment(item.riskAssessment)
        : null
    }
  ]));
  const groups = new Map();

  uploadedRawData.forEach(row => {
    const category = String(row[categoryKey] || "").trim();
    const supplier = String(row[supplierKey] || "").trim();
    const annualSpend = parseSpend(row[spendKey]);

    if (!category || annualSpend <= 0) {
      return;
    }

    const groupId = createItemId(category, supplier);

    if (!groups.has(groupId)) {
      const previousRisk = previousRiskById.get(groupId);
      groups.set(groupId, {
        id: groupId,
        name: category,
        annualSpend: 0,
        suppliers: new Set(),
        risk: previousRisk ? previousRisk.risk : null,
        riskAssessment: previousRisk ? previousRisk.riskAssessment : null,
        impact: 3
      });
    }

    const group = groups.get(groupId);
    group.annualSpend += annualSpend;
    if (supplier) {
      group.suppliers.add(supplier);
    }
  });

  const aggregatedItems = Array.from(groups.values())
    .map(item => ({
      ...item,
      suppliers: Array.from(item.suppliers).sort()
    }))
    .sort((a, b) => (
      a.name.localeCompare(b.name, undefined, { numeric: true }) ||
      getItemSupplier(a).localeCompare(getItemSupplier(b), undefined, { numeric: true })
    ));

  if (!aggregatedItems.length) {
    alert("No valid category and annual spend rows were found.");
    return;
  }

  items = calculateImpactScores(aggregatedItems);
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  save();
  populateCategoryRiskSelector();
  riskEntry.classList.remove("hidden");
  riskScoringSection.classList.toggle("hidden", !factorsConfirmed);
  renderTable();
  clearMatrix();
  updateKraljicWorkflow();
}

function populateCategoryRiskSelector() {
  categorySelect.textContent = "";

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    const riskStatus = isValidRisk(item.risk)
      ? ` - Risk ${item.risk.toFixed(2)}`
      : hasCompleteCategoryScores(item)
        ? " - Scores saved"
        : " - Risk not set";
    option.textContent = `${getItemLabel(item)}${riskStatus}`;
    categorySelect.appendChild(option);
  });

  syncRiskAssessmentToSelectedCategory();
  updateRiskCategoryProgress();
}

function syncRiskAssessmentToSelectedCategory() {
  const selectedItem = items.find(item => item.id === categorySelect.value);

  if (!selectedItem) {
    riskDraft = null;
    riskDraftDirty = false;
    activeRiskCategoryName = null;
    renderRiskFactorAssessments();
    return;
  }

  activeRiskCategoryName = selectedItem.id;
  riskDraft = selectedItem.riskAssessment
    ? cloneRiskAssessment(selectedItem.riskAssessment)
    : createRiskAssessment(factorSelectionDraft);
  riskDraftDirty = false;

  riskSaveStatus.textContent = !selectedItem.riskAssessment && isValidRisk(selectedItem.risk)
    ? "This item-supplier relationship has a previously saved overall score. Review and save the factor assessment to add a transparent breakdown."
    : "";
  renderRiskFactorAssessments();

  if (items.length && items.every(item => isValidRisk(item.risk))) {
    renderRiskBreakdowns();
  } else {
    riskBreakdownSection.classList.add("hidden");
  }
}

function handleRiskCategoryChange() {
  if (
    riskDraftDirty &&
    activeRiskCategoryName &&
    categorySelect.value !== activeRiskCategoryName &&
    !confirm("Discard the unsaved Supply Risk changes for this item-supplier relationship?")
  ) {
    categorySelect.value = activeRiskCategoryName;
    return;
  }

  syncRiskAssessmentToSelectedCategory();
}

function updateSelectedRisk() {
  const selectedItem = items.find(item => item.id === categorySelect.value);

  if (!selectedItem) {
    alert("Select an item-supplier relationship first.");
    return;
  }

  if (!riskDraft || !riskDraft.factors.length) {
    alert("Confirm the relevant risk factors before saving the item-supplier scores.");
    return;
  }

  riskDraft.scoresConfirmed = true;
  riskDraft.weightMode = "";
  riskDraft.weights = Object.fromEntries(riskDraft.factors.map(factor => [factor.id, 0]));
  selectedItem.riskAssessment = cloneRiskAssessment(riskDraft);
  selectedItem.risk = null;
  riskDraftDirty = false;
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  save();
  const selectedId = selectedItem.id;
  populateCategoryRiskSelector();
  const nextItem = items.find(item => !hasCompleteCategoryScores(item));
  categorySelect.value = nextItem ? nextItem.id : selectedId;
  syncRiskAssessmentToSelectedCategory();
  riskSaveStatus.textContent = nextItem
    ? `${getItemLabel(selectedItem)} scores saved. Continue with ${getItemLabel(nextItem)}.`
    : "All item-supplier scores are saved. Choose a weighting method next.";
  renderTable();
  updateRiskCategoryProgress();
  updateKraljicWorkflow();
}

function removeItem(index) {
  items.splice(index, 1);
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  save();
  populateCategoryRiskSelector();
  if (!items.length) {
    riskEntry.classList.add("hidden");
  }
  render();
}

function resetAll() {
  if (confirm("Clear all?")) {
    items = [];
    matrixIsCurrent = false;
    riskDraft = null;
    riskDraftDirty = false;
    activeRiskCategoryName = null;
    factorSelectionDraft = [];
    factorsConfirmed = false;
    uploadedRawData = null;
    fileInput.value = "";
    mappingSection.classList.add("hidden");
    riskEntry.classList.add("hidden");
    riskScoringSection.classList.add("hidden");
    riskWeightingSection.classList.add("hidden");
    riskBreakdownSection.classList.add("hidden");
    exportArea.classList.add("hidden");
    riskFactorPanel.classList.add("hidden");
    toggleRiskFactorsBtn.setAttribute("aria-expanded", "false");
    toggleRiskFactorsBtn.textContent = "Add Risk Factors";
    riskWeightMode.value = "";
    riskFactorStatus.textContent = "";
    riskSaveStatus.textContent = "";
    buildRiskFactorSelector();
    renderSelectedRiskFactors();
    renderRiskWeightInputs();
    save();
    render();
  }
}

function filterTable(text) {
  const rows = tableBody.querySelectorAll("tr");
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(text.toLowerCase()) ? "" : "none";
  });
}

function exportCSV() {
  let csv = "Item / Category,Supplier,Annual Spend,Supply Risk Score,Supply Risk Level,Weighting Method,Risk Factors and Scores,Impact,Kraljic Quadrant,Top Risk Driver,Recommended Action\n";

  items.forEach(item => {
    const category = classifyItem(item);
    const topDriver = getTopRiskDriver(item);
    const suppliers = (item.suppliers || []).join("; ");
    const factorSummary = item.riskAssessment
      ? item.riskAssessment.factors
        .map(factor => {
          const weight = Number(item.riskAssessment.weights[factor.id] || 0);
          return `${factor.name}: ${getRiskLevel(item.riskAssessment.scores[factor.id])}, ${weight.toFixed(1)}%`;
        })
        .filter(Boolean)
        .join("; ")
      : "";
    const weightingMethod = item.riskAssessment
      ? (item.riskAssessment.weightMode === "custom" ? "Custom Weights" : "Equal Weights")
      : "Legacy overall score";
    const row = [
      item.name,
      suppliers,
      item.annualSpend || 0,
      isValidRisk(item.risk) ? item.risk.toFixed(2) : "",
      getRiskLevel(item.risk),
      weightingMethod,
      factorSummary,
      item.impact,
      formatQuadrant(category),
      topDriver ? topDriver.factor.name : "",
      getCategoryRecommendation(category)
    ];

    csv += `${row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = "kraljic_matrix.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportImage() {
  if (!items.length || items.some(item => !isValidRisk(item.risk))) {
    alert("Complete and save the Supply Risk assessment for every item-supplier relationship before exporting the matrix image.");
    return;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1100;
    canvas.height = 780;

    const ctx = canvas.getContext("2d");
    const matrixX = 190;
    const matrixY = 125;
    const matrixW = 760;
    const matrixH = 520;
    const pointPadding = 76;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#06172B";
    ctx.font = "700 34px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Kraljic Matrix", canvas.width / 2, 62);

    drawQuadrant(ctx, matrixX, matrixY, matrixW / 2, matrixH / 2, "#FEF3C7", "Bottleneck");
    drawQuadrant(ctx, matrixX + matrixW / 2, matrixY, matrixW / 2, matrixH / 2, "#FFE4E6", "Strategic");
    drawQuadrant(ctx, matrixX, matrixY + matrixH / 2, matrixW / 2, matrixH / 2, "#DCEBFF", "Non-Critical");
    drawQuadrant(ctx, matrixX + matrixW / 2, matrixY + matrixH / 2, matrixW / 2, matrixH / 2, "#DCFCE7", "Leverage");

    ctx.strokeStyle = "#102A47";
    ctx.lineWidth = 3;
    ctx.strokeRect(matrixX, matrixY, matrixW, matrixH);

    ctx.fillStyle = "#102A47";
    ctx.font = "700 20px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Profit Impact ->", matrixX + matrixW / 2, matrixY + matrixH + 45);

    ctx.save();
    ctx.translate(matrixX - 92, matrixY + matrixH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Supply Risk ->", 0, 0);
    ctx.restore();

    const coordinateCounts = {};

    items.forEach(item => {
      const category = classifyItem(item);
      const coordinateKey = `${item.impact}-${item.risk}`;
      const duplicateIndex = coordinateCounts[coordinateKey] || 0;
      coordinateCounts[coordinateKey] = duplicateIndex + 1;

      const offset = getPointOffset(duplicateIndex);
      const x = matrixX + pointPadding + ((item.impact - 1) / 4) * (matrixW - pointPadding * 2) + offset[0];
      const y = matrixY + matrixH - pointPadding - ((item.risk - 1) / 4) * (matrixH - pointPadding * 2) + offset[1];

      drawPoint(ctx, x, y, item, category);
    });

    ctx.fillStyle = "#102A47";
    ctx.font = "700 18px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(summary.textContent, canvas.width / 2, matrixY + matrixH + 92);

    const a = document.createElement("a");
    a.download = "kraljic_matrix.png";
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error("Unable to export image.", error);
    alert("Unable to export image. Please try again.");
  }
}

function drawQuadrant(ctx, x, y, width, height, color, label) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(16, 42, 71, 0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = "#06172B";
  ctx.font = "700 22px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.textBaseline = "alphabetic";
}

function drawPoint(ctx, x, y, item, category) {
  const width = 124;
  const height = 58;
  const radius = 8;

  ctx.fillStyle = getPointColor(category);
  drawRoundedRect(ctx, x - width / 2, y - height / 2, width, height, radius);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 12px Inter, Arial, sans-serif";
  ctx.fillText(truncateText(ctx, getItemLabel(item), width - 16), x, y - 13);
  ctx.font = "11px Inter, Arial, sans-serif";
      ctx.fillText(`R: ${item.risk.toFixed(1)} / 5`, x, y + 5);
      ctx.fillText(`I: ${scaleLabels[item.impact]}`, x, y + 21);
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}...`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated}...`;
}

function createTableRow(item, index) {
  const tr = document.createElement("tr");

  const nameTd = document.createElement("td");
  nameTd.textContent = item.name;

  const suppliersTd = document.createElement("td");
  suppliersTd.textContent = item.suppliers && item.suppliers.length
    ? item.suppliers.join(", ")
    : "-";

  const spendTd = document.createElement("td");
  spendTd.textContent = formatCurrency(item.annualSpend);

  const riskTd = document.createElement("td");
  riskTd.textContent = isValidRisk(item.risk)
    ? `${item.risk.toFixed(2)} - ${getRiskLevel(item.risk)}`
    : "Not set";

  const impactTd = document.createElement("td");
  impactTd.textContent = `${scaleLabels[item.impact]} (${formatCurrency(item.annualSpend)})`;

  const quadrantTd = document.createElement("td");
  const category = classifyItem(item);
  const quadrantLabel = document.createElement("span");
  quadrantLabel.className = category
    ? `quadrant-label quadrant-label-${category}`
    : "quadrant-label";
  quadrantLabel.textContent = formatQuadrant(category);
  quadrantTd.appendChild(quadrantLabel);

  const driverTd = document.createElement("td");
  const topDriver = getTopRiskDriver(item);
  driverTd.textContent = topDriver
    ? `${topDriver.factor.name} (${topDriver.contribution.toFixed(2)} pts)`
    : "Pending";

  const deleteTd = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.textContent = "X";
  delBtn.setAttribute("aria-label", `Delete ${getItemLabel(item)}`);
  delBtn.setAttribute("title", `Delete ${getItemLabel(item)}`);
  delBtn.addEventListener("click", () => removeItem(index));
  deleteTd.appendChild(delBtn);

  tr.appendChild(nameTd);
  tr.appendChild(suppliersTd);
  tr.appendChild(spendTd);
  tr.appendChild(riskTd);
  tr.appendChild(impactTd);
  tr.appendChild(quadrantTd);
  tr.appendChild(driverTd);
  tr.appendChild(deleteTd);

  return tr;
}

function render() {
  renderTable();
  renderMatrix();
  updateKraljicWorkflow();
}

function clearMatrix() {
  matrix.querySelectorAll(".point").forEach(p => p.remove());
  summary.textContent = "Set supply risk, then click Update Matrix.";
  matrixSummary.textContent = "Kraljic matrix summary: supply risk has not been set yet.";
  exportArea.classList.add("hidden");
}

function renderTable() {
  tableBody.textContent = "";

  items.forEach((item, index) => {
    tableBody.appendChild(createTableRow(item, index));
  });
}

function renderMatrix() {
  matrix.querySelectorAll(".point").forEach(p => p.remove());

  const rect = matrix.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const counts = {
    "non-critical": 0,
    "leverage": 0,
    "bottleneck": 0,
    "strategic": 0
  };
  const coordinateCounts = {};

  items
    .filter(item => isValidRisk(item.risk))
    .forEach(item => {
    const category = classifyItem(item);
    if (!category) {
      return;
    }
    counts[category]++;

    const p = document.createElement("div");
    p.className = `point ${getPointClass(category)}`;

    const coordinateKey = `${item.impact}-${item.risk}`;
    const duplicateIndex = coordinateCounts[coordinateKey] || 0;
    coordinateCounts[coordinateKey] = duplicateIndex + 1;

    const offset = getPointOffset(duplicateIndex);
    const x = ((item.impact - 1) / 4) * (w - 120) + 60 + offset[0];
    const y = h - ((item.risk - 1) / 4) * (h - 120) - 60 + offset[1];

    p.style.left = x + "px";
    p.style.top = y + "px";

    const pointName = document.createElement("strong");
    pointName.textContent = getItemLabel(item);
    p.append(
      pointName,
      document.createElement("br"),
      `R: ${item.risk.toFixed(2)} / 5`,
      document.createElement("br"),
      `I: ${scaleLabels[item.impact]}`
    );
    p.setAttribute("title", `${getItemLabel(item)}: ${item.risk.toFixed(2)} out of 5 (${getRiskLevel(item.risk)}) supply risk, ${scaleLabels[item.impact]} profit impact from ${formatCurrency(item.annualSpend)} annual spend`);
    p.setAttribute("aria-label", `${getItemLabel(item)}: ${item.risk.toFixed(2)} out of 5, ${getRiskLevel(item.risk)} supply risk, ${scaleLabels[item.impact]} profit impact from annual spend`);

    matrix.appendChild(p);
  });

  summary.textContent =
    `Non-critical: ${counts["non-critical"]} | Leverage: ${counts["leverage"]} | Bottleneck: ${counts["bottleneck"]} | Strategic: ${counts["strategic"]}`;
  matrixSummary.textContent =
    `Kraljic matrix summary: ${counts.strategic} strategic relationships, ${counts.leverage} leverage relationships, ` +
    `${counts.bottleneck} bottleneck relationships, and ${counts["non-critical"]} non-critical relationships are currently plotted.`;
  renderPortfolioInterpretation();
}

function updateMatrix() {
  if (!items.length) {
    alert("Load or upload data first.");
    return;
  }

  const missingRiskItems = items.filter(item => !isValidRisk(item.risk));

  if (missingRiskItems.length) {
    alert("Please set supply risk for each item-supplier relationship first, then click Update Matrix.");
    return;
  }

  if (riskDraftDirty) {
    alert("Save the current Supply Risk assessment before updating the matrix.");
    return;
  }

  matrixIsCurrent = true;
  exportArea.classList.remove("hidden");
  requestAnimationFrame(() => {
    renderMatrix();
    exportArea.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });
  updateKraljicWorkflow();
}

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});
dropZone.addEventListener("dragover", event => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", event => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFile(event.dataTransfer.files[0]);
});

fileInput.addEventListener("change", event => handleFile(event.target.files[0]));
sampleBtn.addEventListener("click", loadSampleData);
processBtn.addEventListener("click", aggregateMappedData);
categorySelect.addEventListener("change", handleRiskCategoryChange);
riskWeightMode.addEventListener("change", () => {
  riskBreakdownSection.classList.add("hidden");
  items.forEach(item => {
    item.risk = null;
    if (item.riskAssessment) {
      item.riskAssessment.weightMode = "";
      item.riskAssessment.weights = Object.fromEntries(
        item.riskAssessment.factors.map(factor => [factor.id, 0])
      );
    }
  });
  matrixIsCurrent = false;
  exportArea.classList.add("hidden");
  save();
  renderTable();
  renderRiskWeightInputs();
  updateKraljicWorkflow();
});
riskFactorSelector.addEventListener("change", handleRiskFactorSelection);
toggleRiskFactorsBtn.addEventListener("click", () => {
  const expanded = toggleRiskFactorsBtn.getAttribute("aria-expanded") === "true";
  toggleRiskFactorsBtn.setAttribute("aria-expanded", String(!expanded));
  toggleRiskFactorsBtn.textContent = expanded ? "Add Risk Factors" : "Close Factor List";
  riskFactorPanel.classList.toggle("hidden", expanded);
});
addCustomRiskFactorBtn.addEventListener("click", addCustomRiskFactor);
confirmRiskFactorsBtn.addEventListener("click", confirmRiskFactors);
addBtn.addEventListener("click", updateSelectedRisk);
applyRiskWeightsBtn.addEventListener("click", applyRiskWeights);
updateMatrixBtn.addEventListener("click", updateMatrix);
resetBtn.addEventListener("click", resetAll);
csvBtn.addEventListener("click", exportCSV);
imgBtn.addEventListener("click", exportImage);
searchInput.addEventListener("input", event => filterTable(event.target.value));

buildRiskFactorSelector();
renderSelectedRiskFactors();

if (items.length) {
  populateCategoryRiskSelector();
  riskEntry.classList.remove("hidden");
  riskScoringSection.classList.toggle("hidden", !factorsConfirmed);
  updateRiskCategoryProgress();
  const existingModeItem = items.find(item => item.riskAssessment && item.riskAssessment.weightMode);
  if (existingModeItem) {
    riskWeightMode.value = existingModeItem.riskAssessment.weightMode;
    renderRiskWeightInputs();
  }
}

render();

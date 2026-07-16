const elements = {
  projectTitle: document.getElementById("projectTitle"),
  criteriaCount: document.getElementById("criteriaCount"),
  alternativeCount: document.getElementById("alternativeCount"),
  buildStructureButton: document.getElementById("buildStructureButton"),
  sampleTemplateSelect: document.getElementById("sampleTemplateSelect"),
  loadSampleDesignButton: document.getElementById("loadSampleDesignButton"),
  resetDesignButton: document.getElementById("resetDesignButton"),
  structureFields: document.getElementById("structureFields"),
  previewQuestionnaireButton: document.getElementById("previewQuestionnaireButton"),
  exportQuestionnaireButton: document.getElementById("exportQuestionnaireButton"),
  questionnairePreview: document.getElementById("questionnairePreview"),
  designError: document.getElementById("designError"),
  questionnaireFile: document.getElementById("questionnaireFile"),
  loadQuestionnaireButton: document.getElementById("loadQuestionnaireButton"),
  surveyError: document.getElementById("surveyError"),
  surveyWorkspace: document.getElementById("surveyWorkspace"),
  surveyTitle: document.getElementById("surveyTitle"),
  surveyCompleteness: document.getElementById("surveyCompleteness"),
  expertName: document.getElementById("expertName"),
  surveyQuestions: document.getElementById("surveyQuestions"),
  exportSurveyButton: document.getElementById("exportSurveyButton"),
  responseFiles: document.getElementById("responseFiles"),
  loadResponsesButton: document.getElementById("loadResponsesButton"),
  loadSampleResponseButton: document.getElementById("loadSampleResponseButton"),
  analysisError: document.getElementById("analysisError"),
  responseList: document.getElementById("responseList"),
  calculateAnalysisButton: document.getElementById("calculateAnalysisButton"),
  exportAnalysisButton: document.getElementById("exportAnalysisButton"),
  results: document.getElementById("results"),
  analysisSummary: document.getElementById("analysisSummary"),
  analysisChartSummary: document.getElementById("analysisChartSummary"),
  criteriaWeights: document.getElementById("criteriaWeights"),
  alternativeRanking: document.getElementById("alternativeRanking"),
  consistencyPanel: document.getElementById("consistencyPanel"),
};

const RI = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

const preferenceLabels = {
  1: "equally preferred to",
  2: "equally to moderately preferred over",
  3: "moderately preferred over",
  4: "moderately to strongly preferred over",
  5: "strongly preferred over",
  6: "strongly to very strongly preferred over",
  7: "very strongly preferred over",
  8: "very strong to extremely preferred over",
  9: "extremely preferred over",
};

let currentQuestionnaire = null;
let loadedResponses = [];
let latestAnalysis = null;

const sampleTemplates = {
  "supplier-selection": {
    projectTitle: "Supplier Selection Decision",
    criteria: ["Total Cost", "Quality Performance", "Delivery Reliability", "Supply Risk"],
    alternatives: ["Supplier A", "Supplier B", "Supplier C"],
  },
  "third-party-logistics": {
    projectTitle: "3PL Partner Selection",
    criteria: ["Service Coverage", "Delivery Performance", "Technology Capability", "Total Logistics Cost", "Scalability"],
    alternatives: ["3PL Provider A", "3PL Provider B", "3PL Provider C"],
  },
  "warehouse-location": {
    projectTitle: "Warehouse Location Decision",
    criteria: ["Transport Access", "Operating Cost", "Customer Proximity", "Labour Availability", "Expansion Potential"],
    alternatives: ["Location A", "Location B", "Location C"],
  },
  "transport-mode": {
    projectTitle: "Transport Mode Selection",
    criteria: ["Transit Time", "Freight Cost", "Reliability", "Carbon Impact", "Damage Risk"],
    alternatives: ["Road Freight", "Rail Freight", "Air Freight", "Sea Freight"],
  },
  "inventory-policy": {
    projectTitle: "Inventory Policy Selection",
    criteria: ["Service Level", "Working Capital", "Stockout Risk", "Planning Complexity"],
    alternatives: ["Make to Stock", "Make to Order", "Vendor Managed Inventory"],
  },
};

function setError(target, message) {
  target.textContent = message;
}

function clearErrors() {
  [elements.designError, elements.surveyError, elements.analysisError].forEach((target) => {
    target.textContent = "";
  });
}

function clampCount(input) {
  const value = Number(input.value);
  if (!Number.isInteger(value) || value < 2 || value > 10) {
    return null;
  }
  return value;
}

function uid() {
  return `ahp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pairsFor(items) {
  const pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push({ leftIndex: i, rightIndex: j, left: items[i], right: items[j] });
    }
  }
  return pairs;
}

function safeName(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function buildStructureFields(criteria = [], alternatives = []) {
  const criteriaCount = clampCount(elements.criteriaCount);
  const alternativeCount = clampCount(elements.alternativeCount);

  if (!criteriaCount || !alternativeCount) {
    setError(elements.designError, "Enter between 2 and 10 criteria and between 2 and 10 alternatives.");
    return;
  }

  clearErrors();
  elements.structureFields.textContent = "";

  const criteriaGroup = document.createElement("div");
  criteriaGroup.className = "field-group";
  const criteriaTitle = document.createElement("h3");
  criteriaTitle.textContent = "Criteria";
  const criteriaGrid = document.createElement("div");
  criteriaGrid.className = "name-grid";

  for (let i = 0; i < criteriaCount; i++) {
    criteriaGrid.appendChild(createNameInput("criteria", i, criteria[i] || `Criterion ${i + 1}`));
  }

  criteriaGroup.append(criteriaTitle, criteriaGrid);

  const alternativeGroup = document.createElement("div");
  alternativeGroup.className = "field-group";
  const alternativeTitle = document.createElement("h3");
  alternativeTitle.textContent = "Alternatives";
  const alternativeGrid = document.createElement("div");
  alternativeGrid.className = "name-grid";

  for (let i = 0; i < alternativeCount; i++) {
    alternativeGrid.appendChild(createNameInput("alternative", i, alternatives[i] || `Alternative ${i + 1}`));
  }

  alternativeGroup.append(alternativeTitle, alternativeGrid);
  elements.structureFields.append(criteriaGroup, alternativeGroup);
  elements.exportQuestionnaireButton.disabled = true;
  elements.questionnairePreview.textContent = "";
  elements.questionnairePreview.classList.add("hidden");
}

function createNameInput(type, index, value) {
  const label = document.createElement("label");
  label.textContent = `${type === "criteria" ? "Criterion" : "Alternative"} ${index + 1}`;
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.dataset.type = type;
  input.dataset.index = String(index);
  label.appendChild(input);
  return label;
}

function collectStructure() {
  const criteriaCount = clampCount(elements.criteriaCount);
  const alternativeCount = clampCount(elements.alternativeCount);

  if (!criteriaCount || !alternativeCount) {
    throw new Error("Enter between 2 and 10 criteria and between 2 and 10 alternatives.");
  }

  if (!elements.structureFields.querySelector("input")) {
    buildStructureFields();
  }

  const criteria = [];
  const alternatives = [];

  elements.structureFields.querySelectorAll('input[data-type="criteria"]').forEach((input, index) => {
    criteria.push(safeName(input.value, `Criterion ${index + 1}`));
  });

  elements.structureFields.querySelectorAll('input[data-type="alternative"]').forEach((input, index) => {
    alternatives.push(safeName(input.value, `Alternative ${index + 1}`));
  });

  if (criteria.length !== criteriaCount || alternatives.length !== alternativeCount) {
    throw new Error("Build the criteria and alternative fields before previewing the questionnaire.");
  }

  return {
    projectTitle: safeName(elements.projectTitle.value, "AHP Decision"),
    criteria,
    alternatives,
  };
}

function createQuestionnaire() {
  const structure = collectStructure();
  return makeQuestionnaire(structure.projectTitle, structure.criteria, structure.alternatives);
}

function makeQuestionnaire(projectTitle, criteria, alternatives, id = uid()) {
  const criteriaPairs = pairsFor(criteria).map((pair, index) => ({
    id: `c-${pair.leftIndex}-${pair.rightIndex}`,
    type: "criteria",
    leftIndex: pair.leftIndex,
    rightIndex: pair.rightIndex,
    left: pair.left,
    right: pair.right,
    prompt: `For the decision goal, compare ${pair.left} with ${pair.right}.`,
    order: index + 1,
  }));

  const alternativePairs = [];
  criteria.forEach((criterion, criterionIndex) => {
    pairsFor(alternatives).forEach((pair, index) => {
      alternativePairs.push({
        id: `a-${criterionIndex}-${pair.leftIndex}-${pair.rightIndex}`,
        type: "alternative",
        criterionIndex,
        criterion,
        leftIndex: pair.leftIndex,
        rightIndex: pair.rightIndex,
        left: pair.left,
        right: pair.right,
        prompt: `With respect to ${criterion}, compare ${pair.left} with ${pair.right}.`,
        order: index + 1,
      });
    });
  });

  return {
    athTool: "Analytical Tools Hub - Analytic Hierarchy Process",
    type: "ahp-questionnaire",
    version: 1,
    id,
    createdAt: new Date().toISOString(),
    projectTitle,
    scale: "Saaty 1-9 pairwise comparison scale",
    criteria,
    alternatives,
    questions: {
      criteria: criteriaPairs,
      alternatives: alternativePairs,
    },
  };
}

function previewQuestionnaire() {
  try {
    clearErrors();
    currentQuestionnaire = createQuestionnaire();
    const criteriaCount = currentQuestionnaire.questions.criteria.length;
    const alternativeCount = currentQuestionnaire.questions.alternatives.length;
    elements.questionnairePreview.textContent = "";

    const title = document.createElement("strong");
    title.textContent = currentQuestionnaire.projectTitle;
    const text = document.createElement("p");
    text.textContent =
      `${criteriaCount} criteria-comparison questions and ${alternativeCount} alternative-comparison questions will be included. ` +
      `${currentQuestionnaire.criteria.length} criteria and ${currentQuestionnaire.alternatives.length} alternatives are defined.`;

    elements.questionnairePreview.append(title, text);
    elements.questionnairePreview.classList.remove("hidden");
    elements.exportQuestionnaireButton.disabled = false;
  } catch (error) {
    setError(elements.designError, error.message);
  }
}

function loadSampleDesign() {
  const template = sampleTemplates[elements.sampleTemplateSelect.value] || sampleTemplates["supplier-selection"];
  elements.projectTitle.value = template.projectTitle;
  elements.criteriaCount.value = template.criteria.length;
  elements.alternativeCount.value = template.alternatives.length;
  buildStructureFields(
    template.criteria,
    template.alternatives
  );
}

function resetQuestionnaireDesign() {
  currentQuestionnaire = null;
  elements.projectTitle.value = "";
  elements.criteriaCount.value = "";
  elements.alternativeCount.value = "";
  elements.structureFields.textContent = "";
  elements.questionnairePreview.textContent = "";
  elements.questionnairePreview.classList.add("hidden");
  elements.exportQuestionnaireButton.disabled = true;
  clearErrors();
}

function validateQuestionnaire(data) {
  if (!data || data.type !== "ahp-questionnaire" || !Array.isArray(data.criteria) || !Array.isArray(data.alternatives)) {
    throw new Error("The selected file is not a valid AHP questionnaire JSON.");
  }

  if (data.criteria.length < 2 || data.alternatives.length < 2) {
    throw new Error("AHP requires at least two criteria and two alternatives.");
  }

  return data;
}

function sliderPositionToAhpValue(position) {
  const sliderValue = Number(position);
  if (sliderValue === 0) {
    return 1;
  }
  return sliderValue > 0 ? sliderValue + 1 : sliderValue - 1;
}

function describeJudgement(position, left, right, criterion = "") {
  const ahpValue = sliderPositionToAhpValue(position);
  const intensity = Math.abs(ahpValue);
  const prefix = criterion ? `In terms of ${criterion}, ` : "";

  if (intensity === 1) {
    return `${prefix}${left} is equally preferred to ${right}.`;
  }

  if (ahpValue > 0) {
    return `${prefix}${left} is ${preferenceLabels[intensity]} ${right}.`;
  }

  return `${prefix}${right} is ${preferenceLabels[intensity]} ${left}.`;
}

function createJudgementSlider(question) {
  const wrapper = document.createElement("div");
  wrapper.className = "judgement-slider";

  const output = document.createElement("output");
  output.className = "judgement-tooltip";
  output.setAttribute("for", `slider-${question.id}`);

  const range = document.createElement("input");
  range.type = "range";
  range.id = `slider-${question.id}`;
  range.min = "-8";
  range.max = "8";
  range.step = "1";
  range.value = "0";
  range.dataset.questionId = question.id;
  range.dataset.left = question.left;
  range.dataset.right = question.right;
  range.setAttribute("aria-label", `Compare ${question.left} with ${question.right}`);

  const endpoints = document.createElement("div");
  endpoints.className = "slider-endpoints";
  const leftLabel = document.createElement("span");
  leftLabel.textContent = question.left;
  const equalLabel = document.createElement("span");
  equalLabel.textContent = "Equal";
  const rightLabel = document.createElement("span");
  rightLabel.textContent = question.right;
  endpoints.append(leftLabel, equalLabel, rightLabel);

  function updateSliderText() {
    const text = describeJudgement(range.value, question.left, question.right, question.criterion);
    output.textContent = text;
    range.title = text;
    range.dataset.ahpValue = String(sliderPositionToAhpValue(range.value));
  }

  range.addEventListener("input", () => {
    updateSliderText();
    updateSurveyCompleteness();
  });

  updateSliderText();
  wrapper.append(output, range, endpoints);
  return wrapper;
}

function renderSurvey(questionnaire) {
  currentQuestionnaire = questionnaire;
  elements.surveyWorkspace.classList.remove("hidden");
  elements.surveyTitle.textContent = questionnaire.projectTitle;
  elements.surveyQuestions.textContent = "";

  const criteriaGroup = createQuestionGroup("Criteria comparisons", questionnaire.questions.criteria);
  elements.surveyQuestions.appendChild(criteriaGroup);

  questionnaire.criteria.forEach((criterion, criterionIndex) => {
    const questions = questionnaire.questions.alternatives.filter((question) => question.criterionIndex === criterionIndex);
    elements.surveyQuestions.appendChild(createQuestionGroup(`Alternative comparisons: ${criterion}`, questions));
  });

  updateSurveyCompleteness();
}

function createQuestionGroup(title, questions) {
  const group = document.createElement("div");
  group.className = "question-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  group.appendChild(heading);

  questions.forEach((question) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const questionText = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = question.type === "criteria" ? "Criteria judgement" : "Alternative judgement";
    const prompt = document.createElement("p");
    prompt.textContent = question.prompt;
    questionText.append(label, prompt);

    card.append(questionText, createJudgementSlider(question));
    group.appendChild(card);
  });

  return group;
}

function updateSurveyCompleteness() {
  const sliders = Array.from(elements.surveyQuestions.querySelectorAll(".judgement-slider input"));
  elements.surveyCompleteness.textContent = `${sliders.length} / ${sliders.length} ready`;
}

function collectSurveyResponse() {
  if (!currentQuestionnaire) {
    throw new Error("Load a questionnaire before exporting a survey response.");
  }

  const sliders = Array.from(elements.surveyQuestions.querySelectorAll(".judgement-slider input"));

  const answers = {
    criteria: {},
    alternatives: {},
  };

  sliders.forEach((slider) => {
    const value = Number(slider.dataset.ahpValue);
    if (slider.dataset.questionId.startsWith("c-")) {
      answers.criteria[slider.dataset.questionId] = value;
    } else {
      answers.alternatives[slider.dataset.questionId] = value;
    }
  });

  return {
    athTool: "Analytical Tools Hub - Analytic Hierarchy Process",
    type: "ahp-survey-response",
    version: 1,
    completedAt: new Date().toISOString(),
    expertName: safeName(elements.expertName.value, "Unnamed expert"),
    questionnaire: currentQuestionnaire,
    answers,
  };
}

function validateResponse(data) {
  if (!data || data.type !== "ahp-survey-response" || !data.questionnaire || !data.answers) {
    throw new Error("The selected file is not a valid completed AHP survey response.");
  }

  const questionnaire = validateQuestionnaire(data.questionnaire);
  const criteriaIds = questionnaire.questions.criteria.map((question) => question.id);
  const alternativeIds = questionnaire.questions.alternatives.map((question) => question.id);
  const missingCriteria = criteriaIds.filter((id) => !Number.isFinite(Number(data.answers.criteria?.[id])));
  const missingAlternatives = alternativeIds.filter((id) => !Number.isFinite(Number(data.answers.alternatives?.[id])));

  if (missingCriteria.length || missingAlternatives.length) {
    throw new Error("The completed response is missing one or more pairwise answers.");
  }

  return data;
}

function judgementToRatio(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) {
    throw new Error("AHP comparison values must be valid Saaty scale numbers.");
  }
  return number > 0 ? number : 1 / Math.abs(number);
}

function matrixFromAnswers(size, answers, prefix) {
  const matrix = Array.from({ length: size }, () => Array(size).fill(1));

  Object.entries(answers).forEach(([key, value]) => {
    if (!key.startsWith(prefix)) {
      return;
    }
    const parts = key.split("-").map((part) => Number(part));
    const i = prefix === "c" ? parts[1] : parts[2];
    const j = prefix === "c" ? parts[2] : parts[3];
    const ratio = judgementToRatio(value);
    matrix[i][j] = ratio;
    matrix[j][i] = 1 / ratio;
  });

  return matrix;
}

function aggregateMatrices(matrices) {
  const size = matrices[0].length;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const product = matrices.reduce((total, matrix) => total * matrix[row][col], 1);
      return Math.pow(product, 1 / matrices.length);
    })
  );
}

function calculateWeights(matrix) {
  const size = matrix.length;
  const rowGeometricMeans = matrix.map((row) => {
    const product = row.reduce((total, value) => total * value, 1);
    return Math.pow(product, 1 / size);
  });
  const total = rowGeometricMeans.reduce((sum, value) => sum + value, 0);
  const weights = rowGeometricMeans.map((value) => value / total);

  const weightedSums = matrix.map((row) => row.reduce((sum, value, index) => sum + value * weights[index], 0));
  const lambdaMax = weightedSums.reduce((sum, value, index) => sum + value / weights[index], 0) / size;
  const ci = size <= 2 ? 0 : (lambdaMax - size) / (size - 1);
  const ri = RI[size] || 1.49;
  const cr = ri === 0 ? 0 : ci / ri;

  return { weights, lambdaMax, ci, cr };
}

function calculateAhp(responses) {
  const questionnaire = responses[0].questionnaire;
  const criteriaCount = questionnaire.criteria.length;
  const alternativeCount = questionnaire.alternatives.length;

  responses.forEach((response) => {
    if (
      response.questionnaire.criteria.length !== criteriaCount ||
      response.questionnaire.alternatives.length !== alternativeCount ||
      response.questionnaire.criteria.join("|") !== questionnaire.criteria.join("|") ||
      response.questionnaire.alternatives.join("|") !== questionnaire.alternatives.join("|")
    ) {
      throw new Error("All response files must use the same questionnaire structure.");
    }
  });

  const criteriaMatrices = responses.map((response) => matrixFromAnswers(criteriaCount, response.answers.criteria, "c"));
  const criteriaResult = calculateWeights(aggregateMatrices(criteriaMatrices));

  const alternativeResults = questionnaire.criteria.map((criterion, criterionIndex) => {
    const prefix = `a-${criterionIndex}`;
    const matrices = responses.map((response) => matrixFromAnswers(alternativeCount, response.answers.alternatives, prefix));
    return {
      criterion,
      ...calculateWeights(aggregateMatrices(matrices)),
    };
  });

  const alternativeScores = questionnaire.alternatives.map((alternative, alternativeIndex) => {
    const score = alternativeResults.reduce((sum, result, criterionIndex) => {
      return sum + criteriaResult.weights[criterionIndex] * result.weights[alternativeIndex];
    }, 0);
    return { alternative, score };
  }).sort((a, b) => b.score - a.score);

  return {
    questionnaire,
    expertCount: responses.length,
    criteriaResult,
    alternativeResults,
    alternativeScores,
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function renderBarList(target, labels, weights) {
  target.textContent = "";
  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const labelRow = document.createElement("div");
    labelRow.className = "bar-label";
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = formatPercent(weights[index]);
    labelRow.append(name, value);
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max(2, weights[index] * 100)}%`;
    track.appendChild(fill);
    row.append(labelRow, track);
    target.appendChild(row);
  });
}

function renderAnalysis(analysis) {
  elements.results.classList.remove("hidden");
  renderBarList(elements.criteriaWeights, analysis.questionnaire.criteria, analysis.criteriaResult.weights);
  elements.alternativeRanking.textContent = "";
  elements.consistencyPanel.textContent = "";

  analysis.alternativeScores.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "rank-item";
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${item.alternative}`;
    const score = document.createElement("span");
    score.textContent = `Overall priority: ${formatPercent(item.score)}`;
    row.append(title, score);
    elements.alternativeRanking.appendChild(row);
  });

  const consistencyItems = [
    { label: "Criteria comparisons", cr: analysis.criteriaResult.cr },
    ...analysis.alternativeResults.map((result) => ({
      label: `Alternatives under ${result.criterion}`,
      cr: result.cr,
    })),
  ];

  consistencyItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "consistency-item";
    const label = document.createElement("strong");
    label.textContent = item.label;
    const status = document.createElement("span");
    status.className = item.cr <= 0.1 ? "status-good" : "status-review";
    status.textContent = `CR ${item.cr.toFixed(3)} - ${item.cr <= 0.1 ? "reasonable consistency" : "review recommended"}`;
    row.append(label, status);
    elements.consistencyPanel.appendChild(row);
  });

  const winner = analysis.alternativeScores[0];
  const topCriterionIndex = analysis.criteriaResult.weights.indexOf(Math.max(...analysis.criteriaResult.weights));
  const consistencyWarnings = consistencyItems.filter((item) => item.cr > 0.1).length;
  elements.analysisSummary.textContent =
    `${analysis.questionnaire.projectTitle}: ${analysis.expertCount} expert response${analysis.expertCount === 1 ? "" : "s"} analysed. ` +
    `${winner.alternative} ranks first with an overall priority of ${formatPercent(winner.score)}. ` +
    `The most influential criterion is ${analysis.questionnaire.criteria[topCriterionIndex]} at ${formatPercent(analysis.criteriaResult.weights[topCriterionIndex])}. ` +
    `${consistencyWarnings ? `${consistencyWarnings} consistency check${consistencyWarnings === 1 ? "" : "s"} should be reviewed before using the ranking.` : "All displayed consistency ratios are within the common 0.10 review threshold."}`;
  elements.analysisChartSummary.textContent = `AHP ranking summary: ${winner.alternative} is ranked first. ${analysis.questionnaire.criteria[topCriterionIndex]} is the highest-weighted criterion.`;
  elements.exportAnalysisButton.disabled = false;
  elements.results.scrollIntoView({ behavior: "smooth" });
}

function renderResponses() {
  elements.responseList.textContent = "";

  loadedResponses.forEach((response, index) => {
    const item = document.createElement("div");
    item.className = "response-item";
    const left = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = `Response ${index + 1}`;
    const title = document.createElement("strong");
    title.textContent = response.expertName;
    left.append(label, title);
    const right = document.createElement("strong");
    right.textContent = response.questionnaire.projectTitle;
    item.append(left, right);
    elements.responseList.appendChild(item);
  });

  elements.calculateAnalysisButton.disabled = loadedResponses.length === 0;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error(`${file.name} is not valid JSON.`));
      }
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsText(file);
  });
}

function sampleQuestionnaire() {
  return makeQuestionnaire(
    "Supplier Selection Decision",
    ["Total Cost", "Quality Performance", "Delivery Reliability", "Supply Risk"],
    ["Supplier A", "Supplier B", "Supplier C"],
    "ahp-sample-supplier-selection"
  );
}

function sampleResponse() {
  const questionnaire = sampleQuestionnaire();
  return {
    athTool: "Analytical Tools Hub - Analytic Hierarchy Process",
    type: "ahp-survey-response",
    version: 1,
    completedAt: new Date().toISOString(),
    expertName: "Sample procurement expert",
    questionnaire,
    answers: {
      criteria: {
        "c-0-1": -2,
        "c-0-2": -3,
        "c-0-3": 2,
        "c-1-2": 2,
        "c-1-3": 5,
        "c-2-3": 6,
      },
      alternatives: {
        "a-0-0-1": 3,
        "a-0-0-2": -2,
        "a-0-1-2": -4,
        "a-1-0-1": -3,
        "a-1-0-2": 2,
        "a-1-1-2": 4,
        "a-2-0-1": -2,
        "a-2-0-2": -4,
        "a-2-1-2": -2,
        "a-3-0-1": 2,
        "a-3-0-2": -3,
        "a-3-1-2": -5,
      },
    },
  };
}

elements.buildStructureButton.addEventListener("click", () => buildStructureFields());
elements.loadSampleDesignButton.addEventListener("click", loadSampleDesign);
elements.resetDesignButton.addEventListener("click", resetQuestionnaireDesign);
elements.previewQuestionnaireButton.addEventListener("click", previewQuestionnaire);

elements.exportQuestionnaireButton.addEventListener("click", () => {
  try {
    clearErrors();
    currentQuestionnaire = currentQuestionnaire || createQuestionnaire();
    downloadJson("ahp-questionnaire.json", currentQuestionnaire);
  } catch (error) {
    setError(elements.designError, error.message);
  }
});

elements.loadQuestionnaireButton.addEventListener("click", async () => {
  try {
    clearErrors();
    const file = elements.questionnaireFile.files[0];
    if (!file) {
      throw new Error("Choose a questionnaire JSON file first.");
    }
    renderSurvey(validateQuestionnaire(await readJsonFile(file)));
  } catch (error) {
    setError(elements.surveyError, error.message);
  }
});

elements.exportSurveyButton.addEventListener("click", () => {
  try {
    clearErrors();
    const response = collectSurveyResponse();
    downloadJson("ahp-completed-survey-response.json", response);
  } catch (error) {
    setError(elements.surveyError, error.message);
  }
});

elements.loadResponsesButton.addEventListener("click", async () => {
  try {
    clearErrors();
    const files = Array.from(elements.responseFiles.files);
    if (!files.length) {
      throw new Error("Choose at least one completed response JSON file.");
    }
    loadedResponses = await Promise.all(files.map(async (file) => validateResponse(await readJsonFile(file))));
    latestAnalysis = null;
    elements.exportAnalysisButton.disabled = true;
    renderResponses();
  } catch (error) {
    setError(elements.analysisError, error.message);
  }
});

elements.loadSampleResponseButton.addEventListener("click", () => {
  clearErrors();
  loadedResponses = [sampleResponse()];
  latestAnalysis = null;
  elements.exportAnalysisButton.disabled = true;
  renderResponses();
});

elements.calculateAnalysisButton.addEventListener("click", () => {
  try {
    clearErrors();
    if (!loadedResponses.length) {
      throw new Error("Load at least one completed response before calculating.");
    }
    latestAnalysis = calculateAhp(loadedResponses);
    renderAnalysis(latestAnalysis);
  } catch (error) {
    setError(elements.analysisError, error.message);
  }
});

elements.exportAnalysisButton.addEventListener("click", () => {
  if (!latestAnalysis) {
    return;
  }

  const rows = [
    ["Rank", "Alternative", "Overall Priority"],
    ...latestAnalysis.alternativeScores.map((item, index) => [index + 1, item.alternative, item.score.toFixed(6)]),
    [],
    ["Criterion", "Weight"],
    ...latestAnalysis.questionnaire.criteria.map((criterion, index) => [criterion, latestAnalysis.criteriaResult.weights[index].toFixed(6)]),
  ];
  downloadCsv("ahp-ranking.csv", rows);
});

resetQuestionnaireDesign();

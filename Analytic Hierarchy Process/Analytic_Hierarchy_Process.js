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
  criteriaWeightChart: document.getElementById("criteriaWeightChart"),
  criteriaWeightLegend: document.getElementById("criteriaWeightLegend"),
  alternativeRanking: document.getElementById("alternativeRanking"),
  decisionMatrix: document.getElementById("decisionMatrix"),
  pairwiseCalculations: document.getElementById("pairwiseCalculations"),
  sensitivityToggle: document.getElementById("sensitivityToggle"),
  sensitivityPanel: document.getElementById("sensitivityPanel"),
  sensitivityCriterion: document.getElementById("sensitivityCriterion"),
  sensitivityWeight: document.getElementById("sensitivityWeight"),
  sensitivityWeightValue: document.getElementById("sensitivityWeightValue"),
  resetSensitivityButton: document.getElementById("resetSensitivityButton"),
  sensitivityWeightComparison: document.getElementById("sensitivityWeightComparison"),
  sensitivityChart: document.getElementById("sensitivityChart"),
  sensitivityLegend: document.getElementById("sensitivityLegend"),
  sensitivityChartSummary: document.getElementById("sensitivityChartSummary"),
  sensitivityRanking: document.getElementById("sensitivityRanking"),
  sensitivityInterpretation: document.getElementById("sensitivityInterpretation"),
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
let sensitivityPlanningActive = false;
let sensitivityRangeCache = new Map();

function updateAhpWorkflow(activeIndex) {
  document.querySelectorAll("[data-ahp-workflow-index]").forEach((item) => {
    const index = Number(item.dataset.ahpWorkflowIndex);
    item.classList.toggle("active", index === activeIndex);
    item.classList.toggle("complete", index < activeIndex);

    if (index === activeIndex) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

const sampleTemplates = {
  "supplier-selection": {
    projectTitle: "Supplier Selection Decision",
    criteria: [
      { name: "Total Cost", description: "Total landed and lifecycle cost, including price, freight, duties, inventory, quality failure, implementation, and ongoing support costs." },
      { name: "Quality Performance", description: "The supplier's demonstrated ability to meet specifications consistently, prevent defects, maintain process control, and resolve quality issues effectively." },
      { name: "Delivery Reliability", description: "The supplier's ability to deliver the confirmed quantity on time, maintain predictable lead times, and communicate potential delays early." },
      { name: "Supply Risk", description: "Exposure to interruption arising from supplier financial health, capacity constraints, geographic concentration, compliance, continuity, or limited alternatives." }
    ],
    alternatives: ["Supplier A", "Supplier B", "Supplier C"],
  },
  "third-party-logistics": {
    projectTitle: "3PL Partner Selection",
    criteria: [
      { name: "Service Coverage", description: "The provider's geographic reach, service portfolio, lane coverage, operating hours, and ability to support the required customer and product profile." },
      { name: "Delivery Performance", description: "Demonstrated on-time, in-full, damage-free, and exception-management performance under volumes and service conditions comparable to the requirement." },
      { name: "Technology Capability", description: "The quality of warehouse, transport, tracking, integration, reporting, cybersecurity, and operational visibility capabilities." },
      { name: "Total Logistics Cost", description: "Expected end-to-end cost, including rates, accessorial charges, implementation, systems integration, inventory effects, management effort, and exit costs." },
      { name: "Scalability", description: "The ability to expand capacity, locations, services, labour, and technology support as volumes, channels, and geographic requirements change." }
    ],
    alternatives: ["3PL Provider A", "3PL Provider B", "3PL Provider C"],
  },
  "warehouse-location": {
    projectTitle: "Warehouse Location Decision",
    criteria: [
      { name: "Transport Access", description: "Access to required road, rail, port, airport, parcel, and freight networks, including route resilience, congestion, and carrier availability." },
      { name: "Operating Cost", description: "Expected facility, labour, utility, tax, transport, inventory, security, maintenance, and compliance cost for the planning horizon." },
      { name: "Customer Proximity", description: "The location's ability to meet target delivery times and service priority for current and expected customer demand." },
      { name: "Labour Availability", description: "Availability, skills, wage competitiveness, retention, shift flexibility, and seasonal capacity of the local workforce." },
      { name: "Expansion Potential", description: "Practical ability to add space, throughput, automation, yard capacity, utilities, and supporting services as requirements grow." }
    ],
    alternatives: ["Location A", "Location B", "Location C"],
  },
  "transport-mode": {
    projectTitle: "Transport Mode Selection",
    criteria: [
      { name: "Transit Time", description: "Door-to-door elapsed time, including collection, terminal handling, consolidation, customs, transfers, and final delivery." },
      { name: "Freight Cost", description: "Expected transport and accessorial cost for the required shipment profile, frequency, service level, and lane." },
      { name: "Reliability", description: "Consistency of transit time and the probability of meeting the required delivery window under normal and disrupted conditions." },
      { name: "Carbon Impact", description: "Estimated greenhouse-gas impact for the shipment activity, using a consistent boundary and method across all modes." },
      { name: "Damage Risk", description: "Likelihood and operational consequence of loss, damage, contamination, temperature excursion, or excessive handling in transit." }
    ],
    alternatives: ["Road Freight", "Rail Freight", "Air Freight", "Sea Freight"],
  },
  "inventory-policy": {
    projectTitle: "Inventory Policy Selection",
    criteria: [
      { name: "Service Level", description: "The policy's ability to meet target product availability, order fulfilment, and customer response-time requirements." },
      { name: "Working Capital", description: "The expected cash tied up in cycle stock, safety stock, work in progress, and obsolete or slow-moving inventory." },
      { name: "Stockout Risk", description: "The likelihood and business consequence of inventory being unavailable when customer or production demand occurs." },
      { name: "Planning Complexity", description: "The data, coordination, system discipline, supplier integration, and management effort required to operate the policy reliably." }
    ],
    alternatives: ["Make to Stock", "Make to Order", "Vendor Managed Inventory"],
  },
};

function normaliseStructureItem(item, fallbackName) {
  if (item && typeof item === "object") {
    return {
      name: safeName(item.name, fallbackName),
      description: String(item.description || "").trim(),
    };
  }

  return {
    name: safeName(item, fallbackName),
    description: "",
  };
}

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

function createStructureGroupHeader(title, type, count) {
  const header = document.createElement("div");
  header.className = "field-group-header";

  const copy = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = title;
  const guidance = document.createElement("p");
  guidance.textContent = type === "criteria"
    ? "Review each criterion and its definition. Rename, edit, add, or remove criteria so they reflect your industry, organisation, and decision context."
    : "Replace sample alternatives with the actual options being considered. Rename, add, or remove alternatives before previewing the questionnaire.";
  copy.append(heading, guidance);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-structure-button";
  button.dataset.addStructure = type;
  button.textContent = type === "criteria" ? "+ Add Criterion" : "+ Add Alternative";
  button.disabled = count >= 10;
  button.setAttribute(
    "aria-label",
    type === "criteria" ? "Add another decision criterion" : "Add another decision alternative"
  );

  header.append(copy, button);
  return header;
}

function readStructureEditorItems(type) {
  return Array.from(
    elements.structureFields.querySelectorAll(`[data-structure-item="${type}"]`),
    (item, index) => ({
      name: item.querySelector(`[data-type="${type}"]`)?.value || "",
      description: type === "criteria"
        ? item.querySelector('[data-description-type="criteria"]')?.value || ""
        : "",
      fallbackName: `${type === "criteria" ? "Criterion" : "Alternative"} ${index + 1}`,
    })
  );
}

function buildStructureFields(criteria = [], alternatives = []) {
  const criteriaCount = clampCount(elements.criteriaCount);
  const alternativeCount = clampCount(elements.alternativeCount);

  if (!criteriaCount || !alternativeCount) {
    setError(elements.designError, "Enter between 2 and 10 criteria and between 2 and 10 alternatives.");
    return;
  }

  clearErrors();
  currentQuestionnaire = null;
  elements.structureFields.textContent = "";

  const criteriaGroup = document.createElement("div");
  criteriaGroup.className = "field-group";
  const criteriaHeader = createStructureGroupHeader("Criteria", "criteria", criteriaCount);
  const criteriaGrid = document.createElement("div");
  criteriaGrid.className = "name-grid";

  for (let i = 0; i < criteriaCount; i++) {
    criteriaGrid.appendChild(createNameInput("criteria", i, criteria[i], criteriaCount));
  }

  criteriaGroup.append(criteriaHeader, criteriaGrid);

  const alternativeGroup = document.createElement("div");
  alternativeGroup.className = "field-group";
  const alternativeHeader = createStructureGroupHeader("Alternatives", "alternative", alternativeCount);
  const alternativeGrid = document.createElement("div");
  alternativeGrid.className = "name-grid";

  for (let i = 0; i < alternativeCount; i++) {
    alternativeGrid.appendChild(createNameInput("alternative", i, alternatives[i], alternativeCount));
  }

  alternativeGroup.append(alternativeHeader, alternativeGrid);
  elements.structureFields.append(criteriaGroup, alternativeGroup);
  elements.exportQuestionnaireButton.disabled = true;
  elements.questionnairePreview.textContent = "";
  elements.questionnairePreview.classList.add("hidden");
}

function addStructureItem(type) {
  const criteria = readStructureEditorItems("criteria");
  const alternatives = readStructureEditorItems("alternative");
  const items = type === "criteria" ? criteria : alternatives;

  if (items.length >= 10) {
    setError(
      elements.designError,
      `AHP supports up to 10 ${type === "criteria" ? "criteria" : "alternatives"} in this tool.`
    );
    return;
  }

  items.push({ name: "", description: "" });
  elements.criteriaCount.value = criteria.length;
  elements.alternativeCount.value = alternatives.length;
  buildStructureFields(criteria, alternatives);

  const addedInput = elements.structureFields.querySelector(
    `input[data-type="${type}"][data-index="${items.length - 1}"]`
  );
  addedInput?.focus();
}

function removeStructureItem(type, index) {
  const criteria = readStructureEditorItems("criteria");
  const alternatives = readStructureEditorItems("alternative");
  const items = type === "criteria" ? criteria : alternatives;

  if (items.length <= 2) {
    setError(elements.designError, `AHP requires at least two ${type}.`);
    return;
  }

  items.splice(index, 1);
  elements.criteriaCount.value = criteria.length;
  elements.alternativeCount.value = alternatives.length;
  buildStructureFields(criteria, alternatives);
}

function createNameInput(type, index, value, count) {
  const item = normaliseStructureItem(
    value,
    `${type === "criteria" ? "Criterion" : "Alternative"} ${index + 1}`
  );
  const wrapper = document.createElement("div");
  wrapper.className = "structure-item";
  wrapper.dataset.structureItem = type;

  const itemHeader = document.createElement("div");
  itemHeader.className = "structure-item-header";
  const itemTitle = document.createElement("strong");
  itemTitle.textContent = `${type === "criteria" ? "Criterion" : "Alternative"} ${index + 1}`;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-structure-button";
  removeButton.dataset.removeStructure = type;
  removeButton.dataset.index = String(index);
  removeButton.textContent = "×";
  removeButton.title = `Remove ${type === "criteria" ? "criterion" : "alternative"}`;
  removeButton.setAttribute("aria-label", `Remove ${type === "criteria" ? "criterion" : "alternative"} ${index + 1}`);
  removeButton.disabled = count <= 2;
  itemHeader.append(itemTitle, removeButton);

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Name";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 100;
  input.value = item.name;
  input.dataset.type = type;
  input.dataset.index = String(index);
  nameLabel.appendChild(input);

  wrapper.append(itemHeader, nameLabel);
  if (type === "criteria") {
    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "Description";
    const description = document.createElement("textarea");
    description.rows = 3;
    description.maxLength = 300;
    description.value = item.description;
    description.dataset.descriptionType = type;
    description.dataset.index = String(index);
    description.placeholder = "Explain what this criterion includes and how experts should interpret it.";
    descriptionLabel.appendChild(description);
    wrapper.appendChild(descriptionLabel);
  }
  return wrapper;
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

  const criterionItems = readStructureEditorItems("criteria");
  const alternativeItems = readStructureEditorItems("alternative");
  const criteria = criterionItems.map((item, index) => safeName(item.name, `Criterion ${index + 1}`));
  const alternatives = alternativeItems.map((item, index) => safeName(item.name, `Alternative ${index + 1}`));
  const criteriaDescriptions = criterionItems.map((item) => String(item.description || "").trim());

  if (criteria.length !== criteriaCount || alternatives.length !== alternativeCount) {
    throw new Error("Build the criteria and alternative fields before previewing the questionnaire.");
  }

  return {
    projectTitle: safeName(elements.projectTitle.value, "AHP Decision"),
    criteria,
    alternatives,
    criteriaDescriptions,
  };
}

function createQuestionnaire() {
  const structure = collectStructure();
  return makeQuestionnaire(
    structure.projectTitle,
    structure.criteria,
    structure.alternatives,
    undefined,
    structure.criteriaDescriptions
  );
}

function makeQuestionnaire(
  projectTitle,
  criteria,
  alternatives,
  id = uid(),
  criteriaDescriptions = []
) {
  const criteriaPairs = pairsFor(criteria).map((pair, index) => ({
    id: `c-${pair.leftIndex}-${pair.rightIndex}`,
    type: "criteria",
    leftIndex: pair.leftIndex,
    rightIndex: pair.rightIndex,
    left: pair.left,
    right: pair.right,
    leftDescription: criteriaDescriptions[pair.leftIndex] || "",
    rightDescription: criteriaDescriptions[pair.rightIndex] || "",
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
        criterionDescription: criteriaDescriptions[criterionIndex] || "",
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
    criteriaDescriptions: criteria.map((_, index) => criteriaDescriptions[index] || ""),
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
  updateAhpWorkflow(0);
  clearErrors();
}

function validateQuestionnaire(data) {
  if (!data || data.type !== "ahp-questionnaire" || !Array.isArray(data.criteria) || !Array.isArray(data.alternatives)) {
    throw new Error("The selected file is not a valid AHP questionnaire JSON.");
  }

  if (
    data.criteria.length < 2 ||
    data.alternatives.length < 2 ||
    data.criteria.length > 10 ||
    data.alternatives.length > 10
  ) {
    throw new Error("AHP requires between two and ten criteria and between two and ten alternatives.");
  }

  if (
    data.criteria.some((item) => typeof item !== "string" || !item.trim()) ||
    data.alternatives.some((item) => typeof item !== "string" || !item.trim()) ||
    !data.questions ||
    !Array.isArray(data.questions.criteria) ||
    !Array.isArray(data.questions.alternatives)
  ) {
    throw new Error("The questionnaire contains an invalid decision structure.");
  }

  data.criteriaDescriptions = data.criteria.map((_, index) =>
    String(data.criteriaDescriptions?.[index] || "").slice(0, 300)
  );
  data.questions.criteria.forEach((question) => {
    question.leftDescription = question.leftDescription || data.criteriaDescriptions[question.leftIndex] || "";
    question.rightDescription = question.rightDescription || data.criteriaDescriptions[question.rightIndex] || "";
  });
  data.questions.alternatives.forEach((question) => {
    question.criterionDescription = question.criterionDescription || data.criteriaDescriptions[question.criterionIndex] || "";
    delete question.leftDescription;
    delete question.rightDescription;
  });
  delete data.alternativeDescriptions;

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
    elements.surveyQuestions.appendChild(createQuestionGroup(
      `Alternative comparisons: ${criterion}`,
      questions,
      questionnaire.criteriaDescriptions?.[criterionIndex] || ""
    ));
  });

  updateSurveyCompleteness();
  updateAhpWorkflow(1);
}

function createQuestionGroup(title, questions, description = "") {
  const group = document.createElement("div");
  group.className = "question-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  group.appendChild(heading);
  if (description) {
    const context = document.createElement("p");
    context.className = "question-group-description";
    context.textContent = description;
    group.appendChild(context);
  }

  questions.forEach((question) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const questionText = document.createElement("div");
    const label = document.createElement("span");
    label.textContent = question.type === "criteria" ? "Criteria judgement" : "Alternative judgement";
    const prompt = document.createElement("p");
    prompt.textContent = question.prompt;
    questionText.append(label, prompt);

    if (question.leftDescription || question.rightDescription) {
      const definitions = document.createElement("dl");
      definitions.className = "comparison-definitions";
      [
        [question.left, question.leftDescription],
        [question.right, question.rightDescription],
      ].forEach(([name, definition]) => {
        if (!definition) return;
        const term = document.createElement("dt");
        const detail = document.createElement("dd");
        term.textContent = name;
        detail.textContent = definition;
        definitions.append(term, detail);
      });
      questionText.appendChild(definitions);
    }

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
  const consistencyVector = weightedSums.map((value, index) => value / weights[index]);
  const lambdaMax = consistencyVector.reduce((sum, value) => sum + value, 0) / size;
  const ci = size <= 2 ? 0 : (lambdaMax - size) / (size - 1);
  const ri = RI[size] || 1.49;
  const cr = ri === 0 ? 0 : ci / ri;

  return { weights, rowGeometricMeans, weightedSums, consistencyVector, lambdaMax, ci, cr };
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
  const criteriaMatrix = aggregateMatrices(criteriaMatrices);
  const criteriaResult = {
    matrix: criteriaMatrix,
    ...calculateWeights(criteriaMatrix),
  };

  const alternativeResults = questionnaire.criteria.map((criterion, criterionIndex) => {
    const prefix = `a-${criterionIndex}`;
    const matrices = responses.map((response) => matrixFromAnswers(alternativeCount, response.answers.alternatives, prefix));
    const matrix = aggregateMatrices(matrices);
    return {
      criterion,
      matrix,
      ...calculateWeights(matrix),
    };
  });

  const alternativeScores = questionnaire.alternatives.map((alternative, alternativeIndex) => {
    const score = alternativeResults.reduce((sum, result, criterionIndex) => {
      return sum + criteriaResult.weights[criterionIndex] * result.weights[alternativeIndex];
    }, 0);
    return { alternative, alternativeIndex, score };
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

function renderWeightDistribution(labels, weights) {
  if (!elements.criteriaWeightChart || !elements.criteriaWeightLegend) return;

  const colors = ["#1f6feb", "#22c55e", "#f8b84e", "#f97066", "#7c3aed", "#0ea5e9", "#14b8a6", "#64748b", "#db2777", "#84cc16"];
  let cursor = 0;
  const segments = weights.map((weight, index) => {
    const start = cursor;
    cursor += weight * 100;
    return `${colors[index % colors.length]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });

  elements.criteriaWeightChart.style.background =
    `radial-gradient(circle at center, #fff 0 47%, transparent 48%), conic-gradient(${segments.join(", ")})`;
  elements.criteriaWeightLegend.textContent = "";

  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "weight-legend-item";
    const marker = document.createElement("span");
    marker.className = "weight-legend-marker";
    marker.style.background = colors[index % colors.length];
    const name = document.createElement("span");
    name.textContent = label;
    const value = document.createElement("strong");
    value.textContent = formatPercent(weights[index]);
    row.append(marker, name, value);
    elements.criteriaWeightLegend.appendChild(row);
  });
}

function renderDecisionMatrix(analysis) {
  if (!elements.decisionMatrix) return;

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "AHP decision matrix and weighted calculation");

  const table = document.createElement("table");
  table.className = "decision-matrix-table";
  const caption = document.createElement("caption");
  caption.textContent = "Alternative priorities and weighted contributions by criterion";
  table.appendChild(caption);

  const head = document.createElement("thead");
  const groupRow = document.createElement("tr");
  const alternativeHeader = document.createElement("th");
  alternativeHeader.scope = "col";
  alternativeHeader.rowSpan = 2;
  alternativeHeader.textContent = "Alternative";
  const criteriaGroup = document.createElement("th");
  criteriaGroup.scope = "colgroup";
  criteriaGroup.colSpan = analysis.questionnaire.criteria.length;
  criteriaGroup.className = "matrix-criteria-group";
  criteriaGroup.textContent = "Criteria";
  const overallHeader = document.createElement("th");
  overallHeader.scope = "col";
  overallHeader.rowSpan = 2;
  overallHeader.textContent = "Overall priority";
  const rankHeader = document.createElement("th");
  rankHeader.scope = "col";
  rankHeader.rowSpan = 2;
  rankHeader.textContent = "Rank";
  groupRow.append(alternativeHeader, criteriaGroup, overallHeader, rankHeader);

  const criteriaRow = document.createElement("tr");
  analysis.questionnaire.criteria.forEach((criterion, index) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = criterion;
    const weight = document.createElement("span");
    weight.className = "matrix-header-weight";
    weight.textContent = `Weight ${formatPercent(analysis.criteriaResult.weights[index])}`;
    cell.appendChild(weight);
    criteriaRow.appendChild(cell);
  });
  head.append(groupRow, criteriaRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  analysis.alternativeScores.forEach((item, rankIndex) => {
    const row = document.createElement("tr");
    const alternativeCell = document.createElement("th");
    alternativeCell.scope = "row";
    alternativeCell.textContent = item.alternative;
    row.appendChild(alternativeCell);

    analysis.alternativeResults.forEach((criterionResult, criterionIndex) => {
      const localPriority = criterionResult.weights[item.alternativeIndex];
      const contribution = analysis.criteriaResult.weights[criterionIndex] * localPriority;
      const cell = document.createElement("td");
      const priority = document.createElement("span");
      priority.className = "matrix-priority";
      priority.textContent = `Priority ${formatPercent(localPriority)}`;
      const weighted = document.createElement("span");
      weighted.className = "matrix-contribution";
      weighted.textContent = `Contribution ${formatPercent(contribution)}`;
      cell.append(priority, weighted);
      row.appendChild(cell);
    });

    const scoreCell = document.createElement("td");
    scoreCell.className = "matrix-overall";
    scoreCell.textContent = formatPercent(item.score);
    const rankCell = document.createElement("td");
    rankCell.className = "matrix-rank";
    rankCell.textContent = String(rankIndex + 1);
    row.append(scoreCell, rankCell);
    body.appendChild(row);
  });
  table.appendChild(body);

  const formula = document.createElement("p");
  formula.className = "decision-matrix-formula";
  formula.textContent = "Overall priority = sum of (criterion weight x alternative priority under that criterion).";
  wrapper.appendChild(table);
  elements.decisionMatrix.replaceChildren(wrapper, formula);
}

function rebalanceCriterionWeights(baseWeights, selectedIndex, selectedWeight) {
  const clampedWeight = Math.min(1, Math.max(0, selectedWeight));
  const remainingBaseWeight = 1 - baseWeights[selectedIndex];
  const remainingScenarioWeight = 1 - clampedWeight;

  return baseWeights.map((weight, index) => {
    if (index === selectedIndex) return clampedWeight;
    if (remainingBaseWeight <= Number.EPSILON) {
      return remainingScenarioWeight / (baseWeights.length - 1);
    }
    return weight * (remainingScenarioWeight / remainingBaseWeight);
  });
}

function calculateScenarioScoreValues(analysis, criterionWeights) {
  return analysis.questionnaire.alternatives.map((_, alternativeIndex) =>
    analysis.alternativeResults.reduce(
      (sum, result, criterionIndex) =>
        sum + criterionWeights[criterionIndex] * result.weights[alternativeIndex],
      0
    )
  );
}

function rankScenarioAlternatives(analysis, scoreValues) {
  return analysis.questionnaire.alternatives
    .map((alternative, alternativeIndex) => ({
      alternative,
      alternativeIndex,
      score: scoreValues[alternativeIndex],
    }))
    .sort((a, b) => b.score - a.score || a.alternativeIndex - b.alternativeIndex);
}

function getSensitivityWinner(analysis, criterionIndex, criterionWeight) {
  const weights = rebalanceCriterionWeights(
    analysis.criteriaResult.weights,
    criterionIndex,
    criterionWeight
  );
  return rankScenarioAlternatives(
    analysis,
    calculateScenarioScoreValues(analysis, weights)
  )[0].alternativeIndex;
}

function findBaselineWinnerRange(analysis, criterionIndex) {
  if (sensitivityRangeCache.has(criterionIndex)) {
    return sensitivityRangeCache.get(criterionIndex);
  }
  const baselineWinnerIndex = analysis.alternativeScores[0].alternativeIndex;
  const baselineWeight = analysis.criteriaResult.weights[criterionIndex];
  const step = 0.001;
  let lower = baselineWeight;
  let upper = baselineWeight;

  for (let weight = baselineWeight; weight >= 0; weight -= step) {
    if (getSensitivityWinner(analysis, criterionIndex, Math.max(0, weight)) !== baselineWinnerIndex) break;
    lower = Math.max(0, weight);
  }

  for (let weight = baselineWeight; weight <= 1; weight += step) {
    if (getSensitivityWinner(analysis, criterionIndex, Math.min(1, weight)) !== baselineWinnerIndex) break;
    upper = Math.min(1, weight);
  }

  const range = { lower, upper, baselineWinnerIndex };
  sensitivityRangeCache.set(criterionIndex, range);
  return range;
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function renderSensitivityChart(analysis, criterionIndex, scenarioWeight, scenarioScores, stabilityRange) {
  const svg = elements.sensitivityChart;
  if (!svg) return;
  svg.textContent = "";

  const width = 760;
  const height = 340;
  const margin = { top: 24, right: 28, bottom: 54, left: 62 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const colors = ["#1f6feb", "#16a46f", "#e38b13", "#dc4c64", "#7c3aed", "#0891b2", "#0f766e", "#64748b", "#be185d", "#65a30d"];
  const series = analysis.questionnaire.alternatives.map(() => []);
  let maximumScore = 0;

  for (let percentage = 0; percentage <= 100; percentage += 2) {
    const weights = rebalanceCriterionWeights(
      analysis.criteriaResult.weights,
      criterionIndex,
      percentage / 100
    );
    const scores = calculateScenarioScoreValues(analysis, weights);
    scores.forEach((score, alternativeIndex) => {
      series[alternativeIndex].push({ percentage, score });
      maximumScore = Math.max(maximumScore, score);
    });
  }

  const yMaximum = Math.max(0.4, Math.ceil((maximumScore * 1.08) * 10) / 10);
  const xScale = (percentage) => margin.left + (percentage / 100) * plotWidth;
  const yScale = (score) => margin.top + plotHeight - (score / yMaximum) * plotHeight;
  const title = createSvgElement("title");
  title.textContent = `Alternative priorities as ${analysis.questionnaire.criteria[criterionIndex]} changes from zero to one hundred percent`;
  const description = createSvgElement("desc");
  description.textContent = "Each labelled line represents an alternative. The vertical marker shows the selected scenario weight.";
  svg.append(title, description);

  for (let tick = 0; tick <= 4; tick++) {
    const score = (yMaximum / 4) * tick;
    const y = yScale(score);
    svg.appendChild(createSvgElement("line", {
      x1: margin.left,
      y1: y,
      x2: width - margin.right,
      y2: y,
      class: "sensitivity-grid-line",
    }));
    const label = createSvgElement("text", {
      x: margin.left - 10,
      y: y + 4,
      class: "sensitivity-axis-label",
      "text-anchor": "end",
    });
    label.textContent = formatPercent(score);
    svg.appendChild(label);
  }

  [0, 25, 50, 75, 100].forEach((percentage) => {
    const x = xScale(percentage);
    svg.appendChild(createSvgElement("line", {
      x1: x,
      y1: margin.top,
      x2: x,
      y2: height - margin.bottom,
      class: "sensitivity-grid-line sensitivity-grid-line-vertical",
    }));
    const label = createSvgElement("text", {
      x,
      y: height - margin.bottom + 24,
      class: "sensitivity-axis-label",
      "text-anchor": "middle",
    });
    label.textContent = `${percentage}%`;
    svg.appendChild(label);
  });

  const xAxisTitle = createSvgElement("text", {
    x: margin.left + plotWidth / 2,
    y: height - 10,
    class: "sensitivity-axis-title",
    "text-anchor": "middle",
  });
  xAxisTitle.textContent = `${analysis.questionnaire.criteria[criterionIndex]} weight`;
  const yAxisTitle = createSvgElement("text", {
    x: 16,
    y: margin.top + plotHeight / 2,
    class: "sensitivity-axis-title",
    "text-anchor": "middle",
    transform: `rotate(-90 16 ${margin.top + plotHeight / 2})`,
  });
  yAxisTitle.textContent = "Overall priority";
  svg.append(xAxisTitle, yAxisTitle);

  [stabilityRange.lower, stabilityRange.upper].forEach((threshold, index) => {
    if (threshold <= 0.001 || threshold >= 0.999) return;
    if (index === 1 && Math.abs(threshold - stabilityRange.lower) < 0.002) return;
    const x = xScale(threshold * 100);
    svg.appendChild(createSvgElement("line", {
      x1: x,
      y1: margin.top,
      x2: x,
      y2: height - margin.bottom,
      class: "sensitivity-crossover-line",
    }));
    const label = createSvgElement("text", {
      x,
      y: margin.top - 7,
      class: "sensitivity-crossover-label",
      "text-anchor": "middle",
    });
    label.textContent = `${formatPercent(threshold)} threshold`;
    svg.appendChild(label);
  });

  series.forEach((points, alternativeIndex) => {
    const polyline = createSvgElement("polyline", {
      points: points.map((point) => `${xScale(point.percentage)},${yScale(point.score)}`).join(" "),
      fill: "none",
      stroke: colors[alternativeIndex % colors.length],
      "stroke-width": analysis.alternativeScores[0].alternativeIndex === alternativeIndex ? 3.5 : 2.5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    svg.appendChild(polyline);
  });

  const scenarioX = xScale(scenarioWeight * 100);
  svg.appendChild(createSvgElement("line", {
    x1: scenarioX,
    y1: margin.top,
    x2: scenarioX,
    y2: height - margin.bottom,
    class: "sensitivity-scenario-line",
  }));
  scenarioScores.forEach((score, alternativeIndex) => {
    svg.appendChild(createSvgElement("circle", {
      cx: scenarioX,
      cy: yScale(score),
      r: 5,
      fill: colors[alternativeIndex % colors.length],
      stroke: "#fff",
      "stroke-width": 2,
    }));
  });

  elements.sensitivityLegend.textContent = "";
  analysis.questionnaire.alternatives.forEach((alternative, alternativeIndex) => {
    const item = document.createElement("div");
    item.className = "sensitivity-legend-item";
    const marker = document.createElement("span");
    marker.className = "sensitivity-legend-marker";
    marker.style.background = colors[alternativeIndex % colors.length];
    const label = document.createElement("span");
    label.textContent = alternative;
    const value = document.createElement("strong");
    value.textContent = formatPercent(scenarioScores[alternativeIndex]);
    item.append(marker, label, value);
    elements.sensitivityLegend.appendChild(item);
  });
}

function renderSensitivityWeights(analysis, scenarioWeights) {
  const table = document.createElement("table");
  table.className = "sensitivity-weight-table";
  const caption = document.createElement("caption");
  caption.textContent = "Baseline and scenario criterion weights";
  table.appendChild(caption);
  const head = document.createElement("thead");
  const header = document.createElement("tr");
  ["Criterion", "Baseline", "Scenario", "Change"].forEach((label) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    header.appendChild(cell);
  });
  head.appendChild(header);
  table.appendChild(head);
  const body = document.createElement("tbody");
  analysis.questionnaire.criteria.forEach((criterion, index) => {
    const row = document.createElement("tr");
    const name = document.createElement("th");
    name.scope = "row";
    name.textContent = criterion;
    const baseline = document.createElement("td");
    baseline.textContent = formatPercent(analysis.criteriaResult.weights[index]);
    const scenario = document.createElement("td");
    scenario.textContent = formatPercent(scenarioWeights[index]);
    const change = document.createElement("td");
    const difference = scenarioWeights[index] - analysis.criteriaResult.weights[index];
    change.textContent = `${difference >= 0 ? "+" : ""}${(difference * 100).toFixed(1)} pp`;
    row.append(name, baseline, scenario, change);
    body.appendChild(row);
  });
  table.appendChild(body);
  elements.sensitivityWeightComparison.replaceChildren(table);
}

function renderSensitivityScenario() {
  if (!latestAnalysis || !sensitivityPlanningActive) return;
  const criterionIndex = Number(elements.sensitivityCriterion.value);
  const scenarioWeight = Number(elements.sensitivityWeight.value) / 100;
  const scenarioWeights = rebalanceCriterionWeights(
    latestAnalysis.criteriaResult.weights,
    criterionIndex,
    scenarioWeight
  );
  const scoreValues = calculateScenarioScoreValues(latestAnalysis, scenarioWeights);
  const ranking = rankScenarioAlternatives(latestAnalysis, scoreValues);
  const baselineWinner = latestAnalysis.alternativeScores[0];
  const scenarioWinner = ranking[0];
  const stabilityRange = findBaselineWinnerRange(latestAnalysis, criterionIndex);
  const criterion = latestAnalysis.questionnaire.criteria[criterionIndex];

  elements.sensitivityWeightValue.textContent = formatPercent(scenarioWeight);
  renderSensitivityWeights(latestAnalysis, scenarioWeights);
  renderSensitivityChart(
    latestAnalysis,
    criterionIndex,
    scenarioWeight,
    scoreValues,
    stabilityRange
  );

  elements.sensitivityRanking.textContent = "";
  ranking.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "rank-item";
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${item.alternative}`;
    const score = document.createElement("span");
    score.textContent = `Scenario priority: ${formatPercent(item.score)}`;
    row.append(title, score);
    elements.sensitivityRanking.appendChild(row);
  });

  const rangeText = stabilityRange.lower <= 0.001 && stabilityRange.upper >= 0.999
    ? `${baselineWinner.alternative} remains first across the full tested 0% to 100% range.`
    : `${baselineWinner.alternative} remains first while ${criterion} is approximately ${formatPercent(stabilityRange.lower)} to ${formatPercent(stabilityRange.upper)}.`;
  const scenarioText = scenarioWinner.alternativeIndex === baselineWinner.alternativeIndex
    ? `${scenarioWinner.alternative} remains the preferred alternative at a ${formatPercent(scenarioWeight)} ${criterion} weight.`
    : `${scenarioWinner.alternative} becomes the preferred alternative at a ${formatPercent(scenarioWeight)} ${criterion} weight, replacing the baseline winner ${baselineWinner.alternative}.`;
  elements.sensitivityInterpretation.textContent = `${scenarioText} ${rangeText}`;
  elements.sensitivityChartSummary.textContent =
    `${criterion} sensitivity scenario at ${formatPercent(scenarioWeight)}. ` +
    ranking.map((item, index) => `${index + 1}. ${item.alternative}, ${formatPercent(item.score)}`).join(" ");
}

function initialiseSensitivityScenario(analysis) {
  sensitivityPlanningActive = false;
  sensitivityRangeCache = new Map();
  elements.sensitivityToggle.setAttribute("aria-pressed", "false");
  elements.sensitivityPanel.classList.add("hidden");
  elements.sensitivityCriterion.textContent = "";
  analysis.questionnaire.criteria.forEach((criterion, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = criterion;
    elements.sensitivityCriterion.appendChild(option);
  });
  elements.sensitivityCriterion.value = "0";
  elements.sensitivityWeight.value = (analysis.criteriaResult.weights[0] * 100).toFixed(1);
  elements.sensitivityWeightValue.textContent = formatPercent(analysis.criteriaResult.weights[0]);
}

function resetSensitivityToBaseline() {
  if (!latestAnalysis) return;
  const criterionIndex = Number(elements.sensitivityCriterion.value);
  elements.sensitivityWeight.value = (latestAnalysis.criteriaResult.weights[criterionIndex] * 100).toFixed(1);
  renderSensitivityScenario();
}

function formatCalculationValue(value) {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value - Math.round(value)) < 0.0005) return String(Math.round(value));
  return value.toFixed(3);
}

function createPairwiseCalculation(title, labels, result, open = false) {
  const detail = document.createElement("details");
  detail.className = "calculation-detail";
  detail.open = open;

  const summary = document.createElement("summary");
  const summaryTitle = document.createElement("span");
  summaryTitle.textContent = title;
  const summaryStatus = document.createElement("span");
  summaryStatus.className = result.cr <= 0.1 ? "status-good" : "status-review";
  summaryStatus.textContent = result.cr <= 0.1
    ? `CR ${result.cr.toFixed(3)} - within guidance`
    : `CR ${result.cr.toFixed(3)} - review required`;
  summary.append(summaryTitle, summaryStatus);
  detail.appendChild(summary);

  const region = document.createElement("div");
  region.className = "calculation-detail-body";
  if (result.cr > 0.1) {
    const warning = document.createElement("p");
    warning.className = "calculation-consistency-warning";
    warning.textContent =
      "Review required: the consistency ratio exceeds the common 0.10 guidance threshold. Revisit the pairwise judgements in this matrix before relying on its priorities.";
    region.appendChild(warning);
  }
  const scroll = document.createElement("div");
  scroll.className = "table-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", `${title} calculation table`);

  const table = document.createElement("table");
  table.className = "pairwise-calculation-table";
  const caption = document.createElement("caption");
  caption.textContent = `${title}: pairwise matrix, geometric mean, priority weight, weighted sum, and consistency vector`;
  table.appendChild(caption);

  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Factor", ...labels, "Geometric mean", "Priority weight", "Weighted sum", "Consistency vector"].forEach((label) => {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headerRow.appendChild(cell);
  });
  head.appendChild(headerRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  labels.forEach((label, rowIndex) => {
    const row = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.scope = "row";
    rowHeader.textContent = label;
    row.appendChild(rowHeader);
    result.matrix[rowIndex].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = formatCalculationValue(value);
      row.appendChild(cell);
    });
    [
      formatCalculationValue(result.rowGeometricMeans[rowIndex]),
      formatPercent(result.weights[rowIndex]),
      formatCalculationValue(result.weightedSums[rowIndex]),
      formatCalculationValue(result.consistencyVector[rowIndex]),
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
  table.appendChild(body);
  scroll.appendChild(table);

  const metrics = document.createElement("dl");
  metrics.className = "calculation-metrics";
  [
    ["Lambda max", result.lambdaMax.toFixed(4)],
    ["Consistency index (CI)", result.ci.toFixed(4)],
    ["Random index (RI)", (RI[labels.length] || 1.49).toFixed(2)],
    ["Consistency ratio (CR)", result.cr.toFixed(4)],
  ].forEach(([termText, valueText]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const value = document.createElement("dd");
    term.textContent = termText;
    value.textContent = valueText;
    item.append(term, value);
    metrics.appendChild(item);
  });
  region.append(scroll, metrics);
  detail.appendChild(region);
  return detail;
}

function renderPairwiseCalculations(analysis) {
  if (!elements.pairwiseCalculations) return;
  const fragment = document.createDocumentFragment();
  const note = document.createElement("p");
  note.className = "calculation-note";
  note.textContent = analysis.expertCount > 1
    ? `Pairwise judgements from ${analysis.expertCount} experts are aggregated using the geometric mean before priorities are calculated.`
    : "The tables below use the expert's pairwise judgements to calculate local priorities using the row geometric-mean method.";
  fragment.appendChild(note);
  fragment.appendChild(createPairwiseCalculation(
    "Criteria pairwise comparison matrix",
    analysis.questionnaire.criteria,
    analysis.criteriaResult,
    true
  ));
  analysis.alternativeResults.forEach((result) => {
    fragment.appendChild(createPairwiseCalculation(
      `Alternative pairwise matrix under ${result.criterion}`,
      analysis.questionnaire.alternatives,
      result
    ));
  });
  elements.pairwiseCalculations.replaceChildren(fragment);
}

function renderAnalysis(analysis) {
  elements.results.classList.remove("hidden");
  updateAhpWorkflow(2);
  renderWeightDistribution(analysis.questionnaire.criteria, analysis.criteriaResult.weights);
  renderPairwiseCalculations(analysis);
  renderDecisionMatrix(analysis);
  initialiseSensitivityScenario(analysis);
  elements.alternativeRanking.textContent = "";

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

  const winner = analysis.alternativeScores[0];
  const topCriterionIndex = analysis.criteriaResult.weights.indexOf(Math.max(...analysis.criteriaResult.weights));
  const consistencyWarnings = consistencyItems.filter((item) => item.cr > 0.1).length;
  elements.analysisSummary.textContent =
    `${analysis.questionnaire.projectTitle}: ${analysis.expertCount} expert response${analysis.expertCount === 1 ? "" : "s"} analysed. ` +
    `${winner.alternative} ranks first with an overall priority of ${formatPercent(winner.score)}. ` +
    `The most influential criterion is ${analysis.questionnaire.criteria[topCriterionIndex]} at ${formatPercent(analysis.criteriaResult.weights[topCriterionIndex])}. ` +
    `${consistencyWarnings ? `${consistencyWarnings} consistency check${consistencyWarnings === 1 ? "" : "s"} should be reviewed before using the ranking.` : "All displayed consistency ratios are within the common 0.10 review threshold."}`;
  elements.analysisChartSummary.textContent =
    `Criteria weight distribution: ${analysis.questionnaire.criteria.map((criterion, index) => `${criterion} ${formatPercent(analysis.criteriaResult.weights[index])}`).join(", ")}. ` +
    `AHP ranking summary: ${winner.alternative} is ranked first. ${analysis.questionnaire.criteria[topCriterionIndex]} is the highest-weighted criterion.`;
  elements.exportAnalysisButton.disabled = false;
  elements.results.scrollIntoView({ behavior: "smooth" });
}

function renderResponses() {
  elements.responseList.textContent = "";
  updateAhpWorkflow(2);

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
  const template = sampleTemplates["supplier-selection"];
  const criteria = template.criteria.map((item, index) => normaliseStructureItem(item, `Criterion ${index + 1}`));
  const alternatives = template.alternatives.map((item, index) => normaliseStructureItem(item, `Alternative ${index + 1}`));
  return makeQuestionnaire(
    template.projectTitle,
    criteria.map((item) => item.name),
    alternatives.map((item) => item.name),
    "ahp-sample-supplier-selection",
    criteria.map((item) => item.description)
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
elements.structureFields.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-structure]");
  if (addButton) {
    addStructureItem(addButton.dataset.addStructure);
    return;
  }

  const removeButton = event.target.closest("[data-remove-structure]");
  if (removeButton) {
    removeStructureItem(removeButton.dataset.removeStructure, Number(removeButton.dataset.index));
  }
});
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
    sensitivityPlanningActive = false;
    elements.results.classList.add("hidden");
    elements.sensitivityToggle.setAttribute("aria-pressed", "false");
    elements.sensitivityPanel.classList.add("hidden");
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
  sensitivityPlanningActive = false;
  elements.results.classList.add("hidden");
  elements.sensitivityToggle.setAttribute("aria-pressed", "false");
  elements.sensitivityPanel.classList.add("hidden");
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

elements.sensitivityToggle.addEventListener("click", () => {
  if (!latestAnalysis) return;
  sensitivityPlanningActive = !sensitivityPlanningActive;
  elements.sensitivityToggle.setAttribute("aria-pressed", String(sensitivityPlanningActive));
  elements.sensitivityPanel.classList.toggle("hidden", !sensitivityPlanningActive);
  if (sensitivityPlanningActive) {
    renderSensitivityScenario();
  }
});

elements.sensitivityCriterion.addEventListener("change", () => {
  resetSensitivityToBaseline();
});

elements.sensitivityWeight.addEventListener("input", renderSensitivityScenario);
elements.resetSensitivityButton.addEventListener("click", resetSensitivityToBaseline);

resetQuestionnaireDesign();

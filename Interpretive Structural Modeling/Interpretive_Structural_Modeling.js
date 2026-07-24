const ISM_MODEL_VERSION = 1;
const MAX_FACTORS = 12;
const VALID_SYMBOLS = new Set(["V", "A", "X", "O"]);

const multiLevelDemonstration = {
  title: "Illustrative supply-chain resilience hierarchy",
  description: "A synthetic teaching example showing how directional expert judgements can produce a multi-level ISM structure. Review every relationship before adapting it to a real decision.",
  factors: [
    ["F1", "Weak risk governance", "Risk ownership, escalation, and response responsibilities are unclear."],
    ["F2", "Fragmented risk data", "Operational and supplier risk information is dispersed across disconnected systems."],
    ["F3", "Limited supplier collaboration", "Suppliers are not consistently involved in risk sensing and continuity planning."],
    ["F4", "Slow risk escalation", "Disruption signals do not reach accountable decision-makers quickly enough."],
    ["F5", "Poor end-to-end visibility", "Material, capacity, and shipment status is not visible across supply tiers."],
    ["F6", "Insufficient buffer capacity", "Inventory, production, transport, or labour buffers cannot absorb disruption."],
    ["F7", "Untested continuity plans", "Response plans have not been exercised against realistic disruption scenarios."],
    ["F8", "Delayed disruption response", "Containment and recovery actions begin too late to limit operational impact."],
    ["F9", "Extended recovery time", "The supply chain takes longer than required to restore stable service."]
  ],
  directLinks: [
    ["F1", "F3"],
    ["F1", "F4"],
    ["F1", "F7"],
    ["F2", "F4"],
    ["F2", "F5"],
    ["F3", "F5"],
    ["F3", "F7"],
    ["F4", "F8"],
    ["F5", "F6"],
    ["F5", "F8"],
    ["F7", "F6"],
    ["F7", "F8"],
    ["F6", "F9"],
    ["F8", "F9"]
  ]
};

const problemTemplates = {
  "supplier-selection": {
    title: "Supplier selection barriers",
    description: "Explore barriers that may prevent a robust and transparent supplier selection process.",
    factors: [
      ["F1", "Incomplete supplier data", "Limited or inconsistent evidence about supplier capability and performance."],
      ["F2", "Unclear evaluation criteria", "Decision criteria are ambiguous, overlapping, or not agreed."],
      ["F3", "Stakeholder goal conflict", "Functions place different priorities on cost, quality, delivery, and risk."],
      ["F4", "Weak total-cost visibility", "Landed, lifecycle, and switching costs are not fully understood."],
      ["F5", "Limited risk assessment", "Financial, geopolitical, capacity, and continuity risks are insufficiently assessed."],
      ["F6", "Supplier capacity uncertainty", "Available capacity and scalability are difficult to verify."],
      ["F7", "Poor cross-functional governance", "Roles, approvals, and decision ownership are fragmented."],
      ["F8", "Short-term price focus", "Immediate price receives more weight than resilience and long-term value."]
    ]
  },
  resilience: {
    title: "Supply-chain resilience barriers",
    description: "Structure the organisational and network barriers that can limit preparation, response, and recovery.",
    factors: [
      ["F1", "Limited end-to-end visibility", "Critical material, capacity, and shipment status is not visible across tiers."],
      ["F2", "Single-source dependency", "Critical supply relies on one source or one geographic region."],
      ["F3", "Weak risk governance", "Risk ownership, escalation, and response responsibilities are unclear."],
      ["F4", "Insufficient buffer capacity", "Inventory, production, transport, or labour buffers are inadequate."],
      ["F5", "Poor supplier collaboration", "Suppliers are not involved in risk sensing or continuity planning."],
      ["F6", "Fragmented data", "Risk and operational data is dispersed across incompatible systems."],
      ["F7", "Slow decision escalation", "Signals do not reach decision-makers quickly enough during disruption."],
      ["F8", "Untested continuity plans", "Response plans have not been exercised against realistic scenarios."],
      ["F9", "Limited recovery funding", "Financial resources for mitigation and recovery are constrained."]
    ]
  },
  sustainable: {
    title: "Sustainable supply-chain implementation barriers",
    description: "Explore barriers to embedding environmental and social considerations across supply-chain decisions.",
    factors: [
      ["F1", "Limited leadership commitment", "Sustainability is not consistently reflected in priorities and decisions."],
      ["F2", "Unclear sustainability metrics", "Targets and performance measures are incomplete or inconsistent."],
      ["F3", "Supplier capability gaps", "Suppliers lack knowledge, technology, or resources to meet requirements."],
      ["F4", "High transition cost", "Implementation requires investment with uncertain short-term returns."],
      ["F5", "Weak traceability", "Material origin and environmental or social impacts cannot be verified."],
      ["F6", "Conflicting commercial priorities", "Cost and service pressures override sustainability objectives."],
      ["F7", "Regulatory complexity", "Requirements differ across products, markets, and jurisdictions."],
      ["F8", "Limited cross-functional ownership", "Responsibility is dispersed across procurement, operations, and compliance."],
      ["F9", "Data quality limitations", "Emissions, waste, and supplier performance data is incomplete."]
    ]
  },
  digital: {
    title: "Digital supply-chain adoption barriers",
    description: "Structure the barriers that can slow adoption of connected planning, visibility, and automation.",
    factors: [
      ["F1", "Legacy system constraints", "Existing platforms are difficult to integrate or extend."],
      ["F2", "Poor master data quality", "Product, supplier, inventory, and location data is unreliable."],
      ["F3", "Skills shortage", "Teams lack digital, analytical, or implementation capability."],
      ["F4", "Unclear business case", "Expected benefits, costs, and decision ownership are not defined."],
      ["F5", "Cybersecurity concerns", "Connected systems increase perceived security and privacy exposure."],
      ["F6", "Resistance to process change", "Users and managers prefer established workflows."],
      ["F7", "Supplier integration gaps", "Trading partners have incompatible systems or limited digital maturity."],
      ["F8", "Fragmented governance", "Technology standards and data ownership are unclear."],
      ["F9", "Insufficient implementation funding", "Investment competes with other operational priorities."]
    ]
  },
  circular: {
    title: "Circular supply-chain barriers",
    description: "Explore barriers to product recovery, reuse, remanufacturing, and closed-loop material flows.",
    factors: [
      ["F1", "Product design limitations", "Products are not designed for disassembly, repair, or material recovery."],
      ["F2", "Uncertain return volumes", "Timing, quantity, and condition of returned products are difficult to predict."],
      ["F3", "Weak reverse logistics network", "Collection, consolidation, and recovery channels are insufficient."],
      ["F4", "Limited secondary-market demand", "Demand for recovered materials or remanufactured products is uncertain."],
      ["F5", "Quality variability of returns", "Returned items have inconsistent condition and recoverable value."],
      ["F6", "High recovery cost", "Inspection, transport, sorting, and processing costs reduce viability."],
      ["F7", "Unclear ownership incentives", "Partners lack aligned responsibilities and value-sharing mechanisms."],
      ["F8", "Regulatory and standards gaps", "Definitions, liability, and quality standards are unclear."],
      ["F9", "Limited traceability", "Material composition and product history are not reliably available."]
    ]
  },
  "green-procurement": {
    title: "Green procurement barriers",
    description: "Structure barriers to incorporating environmental requirements into sourcing and supplier management.",
    factors: [
      ["F1", "Unclear environmental criteria", "Specifications and evaluation measures are not sufficiently defined."],
      ["F2", "Limited supplier information", "Reliable environmental performance data is unavailable."],
      ["F3", "Higher perceived purchase cost", "Greener options are assumed to cost more at the point of purchase."],
      ["F4", "Weak lifecycle-cost analysis", "Use, maintenance, disposal, and externality costs are not considered."],
      ["F5", "Limited internal expertise", "Buyers lack environmental assessment knowledge."],
      ["F6", "Supplier market constraints", "Few qualified suppliers can meet technical and environmental needs."],
      ["F7", "Low management priority", "Environmental performance has limited influence on sourcing decisions."],
      ["F8", "Verification difficulty", "Claims and certifications are difficult to validate consistently."]
    ]
  },
  "industry-4": {
    title: "Industry 4.0 adoption challenges",
    description: "Explore challenges affecting connected production, automation, and data-driven operations.",
    factors: [
      ["F1", "Legacy equipment integration", "Existing machines lack compatible interfaces or connectivity."],
      ["F2", "Capital investment constraints", "Technology, infrastructure, and implementation costs are substantial."],
      ["F3", "Workforce capability gaps", "Digital, automation, and data skills are insufficient."],
      ["F4", "Cyber-physical security risk", "Connected assets create new operational security concerns."],
      ["F5", "Data interoperability gaps", "Systems use inconsistent formats, definitions, and protocols."],
      ["F6", "Uncertain return on investment", "Benefits and implementation timeframes are difficult to quantify."],
      ["F7", "Organisational resistance", "Roles, routines, and decision rights are disrupted by automation."],
      ["F8", "Lack of implementation roadmap", "Technology initiatives are not sequenced around operational priorities."],
      ["F9", "Supplier technology mismatch", "Equipment and service partners have uneven technical maturity."]
    ]
  },
  blockchain: {
    title: "Blockchain adoption in supply chains",
    description: "Structure barriers affecting distributed-ledger use for traceability, transactions, and trust.",
    factors: [
      ["F1", "Unclear use-case value", "Blockchain is proposed without a decision problem that needs shared records."],
      ["F2", "Partner participation gaps", "Network value is limited when key trading partners do not participate."],
      ["F3", "Data accuracy at source", "Immutable records cannot correct inaccurate or fraudulent input data."],
      ["F4", "Integration complexity", "Ledger solutions must connect with existing operational systems."],
      ["F5", "Governance uncertainty", "Rules for access, validation, ownership, and dispute handling are unclear."],
      ["F6", "Scalability and performance concerns", "Transaction speed and cost may not fit operational volumes."],
      ["F7", "Regulatory uncertainty", "Legal recognition, privacy, and cross-border requirements are evolving."],
      ["F8", "Skills and vendor dependency", "Specialist capability is scarce and may create technology lock-in."],
      ["F9", "Confidentiality concerns", "Partners may resist sharing commercially sensitive information."]
    ]
  },
  risk: {
    title: "Supply-chain risk factors",
    description: "Explore how external, supplier, operational, and information risks may influence one another.",
    factors: [
      ["F1", "Supplier financial instability", "A critical supplier may be unable to sustain operations or investment."],
      ["F2", "Demand volatility", "Customer demand changes materially in volume, timing, or mix."],
      ["F3", "Lead-time variability", "Replenishment timing is inconsistent or difficult to predict."],
      ["F4", "Capacity constraints", "Internal or external capacity cannot respond to required volumes."],
      ["F5", "Logistics disruption", "Transport, port, route, or carrier interruption affects flow."],
      ["F6", "Geopolitical exposure", "Trade, conflict, sanctions, or policy changes threaten supply."],
      ["F7", "Quality failure", "Defects or non-conformance interrupt usable supply."],
      ["F8", "Information delay", "Risk signals and operational changes are not communicated promptly."],
      ["F9", "Inventory imbalance", "Stock is insufficient, excessive, or positioned in the wrong location."]
    ]
  },
  outsourcing: {
    title: "Logistics outsourcing barriers",
    description: "Structure barriers to selecting, governing, and integrating outsourced logistics services.",
    factors: [
      ["F1", "Unclear service requirements", "Scope, service levels, and exception responsibilities are ambiguous."],
      ["F2", "Loss of operational control", "The organisation has less direct influence over daily execution."],
      ["F3", "Provider capability uncertainty", "Capacity, technology, geographic, or sector capability is difficult to verify."],
      ["F4", "Data integration difficulty", "Systems and operational data do not connect reliably."],
      ["F5", "Hidden transition cost", "Migration, dual running, training, and exit costs are underestimated."],
      ["F6", "Weak performance governance", "KPIs, review routines, and corrective-action processes are inadequate."],
      ["F7", "Commercial dependency", "Switching barriers and provider concentration reduce flexibility."],
      ["F8", "Cultural and process mismatch", "Working practices and decision expectations are not aligned."],
      ["F9", "Data security concerns", "Sensitive customer and operational data is handled by a third party."]
    ]
  },
  "last-mile": {
    title: "Last-mile delivery challenges",
    description: "Explore interconnected challenges affecting cost, service, capacity, and delivery reliability.",
    factors: [
      ["F1", "Delivery density variation", "Stops are dispersed or unevenly concentrated across service areas."],
      ["F2", "Customer availability uncertainty", "Recipients may not be present or able to accept delivery."],
      ["F3", "Traffic and access constraints", "Congestion, parking, and restricted access reduce productivity."],
      ["F4", "Demand peak volatility", "Daily and seasonal peaks exceed normal route capacity."],
      ["F5", "Address and instruction quality", "Incomplete location data causes delay and failed attempts."],
      ["F6", "Limited route visibility", "Dispatchers lack timely status and exception information."],
      ["F7", "Driver capacity constraints", "Recruitment, retention, and scheduling limit available delivery capacity."],
      ["F8", "High failed-delivery rate", "Repeated attempts increase cost and reduce customer satisfaction."],
      ["F9", "Sustainability pressure", "Emissions and congestion targets constrain delivery choices."]
    ]
  },
  inventory: {
    title: "Inventory management barriers",
    description: "Structure barriers affecting inventory availability, working capital, and replenishment control.",
    factors: [
      ["F1", "Poor demand visibility", "Future demand and demand drivers are not sufficiently understood."],
      ["F2", "Inaccurate inventory records", "System stock differs from physical stock or usable availability."],
      ["F3", "Long supplier lead times", "Replenishment requires extended planning and commitment."],
      ["F4", "Lead-time variability", "Actual replenishment timing differs materially from assumptions."],
      ["F5", "Weak item segmentation", "Different SKU behaviours use the same planning policy."],
      ["F6", "Unclear service-level targets", "Availability expectations are not defined by item or customer."],
      ["F7", "Parameter maintenance gaps", "Safety stock, reorder points, and order quantities are not reviewed."],
      ["F8", "Supplier reliability issues", "Quantity, timing, or quality performance is inconsistent."],
      ["F9", "Fragmented planning ownership", "Purchasing, planning, sales, and operations use conflicting priorities."]
    ]
  },
  "reverse-logistics": {
    title: "Reverse logistics barriers",
    description: "Explore barriers affecting returns collection, disposition, recovery, and value retention.",
    factors: [
      ["F1", "Uncertain return flows", "Return timing, volume, product mix, and condition are unpredictable."],
      ["F2", "Weak return authorisation", "Eligibility, routing, and disposition decisions are inconsistent."],
      ["F3", "Limited collection network", "Convenient and economical return channels are unavailable."],
      ["F4", "Slow inspection and grading", "Returned items wait too long for condition and value assessment."],
      ["F5", "Poor disposition rules", "Repair, resale, recycling, and disposal choices are unclear."],
      ["F6", "System visibility gaps", "Return status and recoverable inventory are not visible."],
      ["F7", "High processing cost", "Transport, handling, testing, and recovery costs erode value."],
      ["F8", "Partner coordination gaps", "Retailers, carriers, repairers, and recyclers use fragmented processes."],
      ["F9", "Limited secondary demand", "Recovered products or materials lack reliable markets."]
    ]
  },
  "cold-chain": {
    title: "Cold-chain implementation barriers",
    description: "Structure barriers to maintaining temperature-controlled product integrity across the network.",
    factors: [
      ["F1", "Infrastructure gaps", "Temperature-controlled storage and transport capacity is insufficient."],
      ["F2", "High operating cost", "Energy, equipment, maintenance, and specialist transport increase cost."],
      ["F3", "Temperature visibility gaps", "Conditions are not monitored continuously across custody transfers."],
      ["F4", "Handling discipline variation", "People and partners apply procedures inconsistently."],
      ["F5", "Equipment reliability risk", "Refrigeration and monitoring equipment can fail in operation."],
      ["F6", "Limited partner capability", "Suppliers, carriers, and facilities have uneven cold-chain maturity."],
      ["F7", "Regulatory complexity", "Product and market requirements create compliance burden."],
      ["F8", "Weak exception response", "Temperature excursions are not escalated or contained quickly."],
      ["F9", "Demand and shelf-life uncertainty", "Volatility and perishability increase expiry and shortage risk."]
    ]
  }
};

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function relationshipKey(leftId, rightId) {
  return `${leftId}::${rightId}`;
}

function buildInitialMatrix(factors, relationships) {
  const size = factors.length;
  const matrix = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0))
  );

  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const symbol = relationships.get(relationshipKey(factors[i].id, factors[j].id));
      if (symbol === "V" || symbol === "X") matrix[i][j] = 1;
      if (symbol === "A" || symbol === "X") matrix[j][i] = 1;
    }
  }

  return matrix;
}

function applyTransitivity(initialMatrix) {
  const finalMatrix = cloneMatrix(initialMatrix);
  const size = finalMatrix.length;

  for (let via = 0; via < size; via += 1) {
    for (let from = 0; from < size; from += 1) {
      if (!finalMatrix[from][via]) continue;
      for (let to = 0; to < size; to += 1) {
        if (finalMatrix[via][to]) finalMatrix[from][to] = 1;
      }
    }
  }

  const transitive = finalMatrix.map((row, i) =>
    row.map((value, j) => Boolean(value && !initialMatrix[i][j] && i !== j))
  );
  return { finalMatrix, transitive };
}

function setFromIndexes(indexes, factors) {
  return indexes.map((index) => factors[index].code);
}

function partitionLevels(finalMatrix, factors) {
  const remaining = new Set(factors.map((_, index) => index));
  const partitions = [];
  const levels = [];
  let level = 1;

  while (remaining.size) {
    const currentIndexes = Array.from(remaining);
    const assigned = [];

    currentIndexes.forEach((factorIndex) => {
      const reachability = currentIndexes.filter((index) => finalMatrix[factorIndex][index] === 1);
      const antecedent = currentIndexes.filter((index) => finalMatrix[index][factorIndex] === 1);
      const antecedentSet = new Set(antecedent);
      const intersection = reachability.filter((index) => antecedentSet.has(index));
      const isAssigned = reachability.length === intersection.length &&
        reachability.every((index) => antecedentSet.has(index));

      partitions.push({
        factorIndex,
        level: isAssigned ? level : null,
        iteration: level,
        reachability,
        antecedent,
        intersection,
        assigned: isAssigned
      });
      if (isAssigned) assigned.push(factorIndex);
    });

    if (!assigned.length) {
      currentIndexes.forEach((factorIndex) => assigned.push(factorIndex));
    }

    levels.push(assigned);
    assigned.forEach((index) => remaining.delete(index));
    level += 1;
  }

  const factorLevels = Array(factors.length).fill(0);
  levels.forEach((indexes, levelIndex) => {
    indexes.forEach((factorIndex) => {
      factorLevels[factorIndex] = levelIndex + 1;
    });
  });

  return { levels, factorLevels, partitions };
}

function calculatePowers(finalMatrix) {
  const size = finalMatrix.length;
  const driving = finalMatrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const dependence = Array.from({ length: size }, (_, column) =>
    finalMatrix.reduce((sum, row) => sum + row[column], 0)
  );
  return { driving, dependence };
}

function classifyMicmac(driving, dependence) {
  const averageDriving = driving.reduce((sum, value) => sum + value, 0) / driving.length;
  const averageDependence = dependence.reduce((sum, value) => sum + value, 0) / dependence.length;
  const classifications = driving.map((drive, index) => {
    const highDriving = drive >= averageDriving;
    const highDependence = dependence[index] >= averageDependence;
    if (!highDriving && !highDependence) return "Autonomous";
    if (!highDriving && highDependence) return "Dependent";
    if (highDriving && highDependence) return "Linkage";
    return "Independent/driving";
  });
  return { averageDriving, averageDependence, classifications };
}

function analyzeModel(factors, relationships) {
  const initialMatrix = buildInitialMatrix(factors, relationships);
  const { finalMatrix, transitive } = applyTransitivity(initialMatrix);
  const partition = partitionLevels(finalMatrix, factors);
  const powers = calculatePowers(finalMatrix);
  const micmac = classifyMicmac(powers.driving, powers.dependence);
  return { initialMatrix, finalMatrix, transitive, ...partition, ...powers, ...micmac };
}

globalThis.ISMCore = {
  buildInitialMatrix,
  applyTransitivity,
  partitionLevels,
  calculatePowers,
  classifyMicmac,
  analyzeModel
};

if (typeof document !== "undefined") {
  const elements = {
    problemSelect: document.getElementById("problemSelect"),
    loadTemplateButton: document.getElementById("loadTemplateButton"),
    resetToolButton: document.getElementById("resetToolButton"),
    problemTitle: document.getElementById("problemTitle"),
    problemDescription: document.getElementById("problemDescription"),
    suggestedFactorsNote: document.getElementById("suggestedFactorsNote"),
    setupError: document.getElementById("setupError"),
    addFactorButton: document.getElementById("addFactorButton"),
    factorList: document.getElementById("factorList"),
    factorError: document.getElementById("factorError"),
    factorActionMessage: document.getElementById("factorActionMessage"),
    exportQuestionnaireButton: document.getElementById("exportQuestionnaireButton"),
    prepareRelationshipsButton: document.getElementById("prepareRelationshipsButton"),
    relationshipEntry: document.getElementById("relationship-entry"),
    surveyWorkspace: document.getElementById("surveyWorkspace"),
    questionnaireFileInput: document.getElementById("questionnaireFileInput"),
    loadQuestionnaireButton: document.getElementById("loadQuestionnaireButton"),
    surveyImportError: document.getElementById("surveyImportError"),
    surveyProblemTitle: document.getElementById("surveyProblemTitle"),
    expertName: document.getElementById("expertName"),
    relationshipProgress: document.getElementById("relationshipProgress"),
    relationshipList: document.getElementById("relationshipList"),
    relationshipError: document.getElementById("relationshipError"),
    surveyActionMessage: document.getElementById("surveyActionMessage"),
    exportSurveyButton: document.getElementById("exportSurveyButton"),
    buildMatricesButton: document.getElementById("buildMatricesButton"),
    matrixReview: document.getElementById("matrix-review"),
    responseFileInput: document.getElementById("responseFileInput"),
    loadResponseButton: document.getElementById("loadResponseButton"),
    loadSampleResponseButton: document.getElementById("loadSampleResponseButton"),
    analysisError: document.getElementById("analysisError"),
    analysisWorkspace: document.getElementById("analysisWorkspace"),
    ssimTab: document.getElementById("ssimTab"),
    initialTab: document.getElementById("initialTab"),
    ssimPanel: document.getElementById("ssimPanel"),
    initialPanel: document.getElementById("initialPanel"),
    ssimTable: document.getElementById("ssimTable"),
    initialMatrixTable: document.getElementById("initialMatrixTable"),
    generateResultsButton: document.getElementById("generateResultsButton"),
    results: document.getElementById("results"),
    hierarchyDiagnostic: document.getElementById("hierarchyDiagnostic"),
    resultSummary: document.getElementById("resultSummary"),
    resultMetrics: document.getElementById("resultMetrics"),
    directLinksToggle: document.getElementById("directLinksToggle"),
    transitiveToggle: document.getElementById("transitiveToggle"),
    hierarchyDiagram: document.getElementById("hierarchyDiagram"),
    hierarchyTextSummary: document.getElementById("hierarchyTextSummary"),
    finalMatrixTable: document.getElementById("finalMatrixTable"),
    partitionTable: document.getElementById("partitionTable"),
    powerTable: document.getElementById("powerTable"),
    micmacChart: document.getElementById("micmacChart"),
    micmacSummary: document.getElementById("micmacSummary"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    printReportButton: document.getElementById("printReportButton"),
    exportSvgButton: document.getElementById("exportSvgButton")
  };

  let factors = [];
  let relationships = new Map();
  let results = null;
  let factorSequence = 0;
  let activeTemplateKey = "custom";
  let questionnaireId = "";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function escapeXml(value) {
    return escapeHtml(value);
  }

  function nextFactorId() {
    factorSequence += 1;
    return `factor-${Date.now()}-${factorSequence}`;
  }

  function makeFactor(code = "", name = "", description = "") {
    return { id: nextFactorId(), code, name, description };
  }

  function setError(element, message = "") {
    element.textContent = message;
  }

  function setActionMessage(element, message = "", type = "") {
    element.textContent = message;
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function scrollToElement(element) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function updateWorkflow(activeStep) {
    const activeIndexes = {
      setup: 0,
      factors: 0,
      relationships: 1,
      matrices: 2,
      results: 2
    };
    const activeIndex = activeIndexes[activeStep] ?? 0;
    document.querySelectorAll("[data-workflow-index]").forEach((item) => {
      const index = Number(item.dataset.workflowIndex);
      item.classList.toggle("active", index === activeIndex);
      item.classList.toggle("complete", index < activeIndex);
    });
  }

  function hideDownstream(stage = "relationships") {
    results = null;
    elements.results.hidden = true;
    if (stage === "relationships") {
      elements.analysisWorkspace.hidden = true;
    }
  }

  function resetRelationships(reason = "") {
    relationships = new Map();
    elements.surveyWorkspace.hidden = true;
    elements.analysisWorkspace.hidden = true;
    elements.results.hidden = true;
    results = null;
    setActionMessage(elements.factorActionMessage);
    setActionMessage(elements.surveyActionMessage);
    if (reason) setError(elements.factorError, reason);
    updateWorkflow("factors");
  }

  function loadTemplate(templateKey) {
    setError(elements.setupError);
    setError(elements.factorError);
    setActionMessage(elements.factorActionMessage);
    setActionMessage(elements.surveyActionMessage);
    activeTemplateKey = templateKey;
    questionnaireId = "";
    if (templateKey === "custom") {
      elements.problemTitle.value = "";
      elements.problemDescription.value = "";
      elements.suggestedFactorsNote.hidden = true;
      factors = [makeFactor("F1"), makeFactor("F2")];
    } else {
      const template = problemTemplates[templateKey];
      if (!template) return;
      elements.problemTitle.value = template.title;
      elements.problemDescription.value = template.description;
      elements.suggestedFactorsNote.hidden = false;
      factors = template.factors.map(([code, name, description]) => makeFactor(code, name, description));
    }
    relationships = new Map();
    results = null;
    renderFactors();
    elements.surveyWorkspace.hidden = true;
    elements.analysisWorkspace.hidden = true;
    elements.results.hidden = true;
    updateWorkflow("factors");
  }

  function renderFactors() {
    elements.factorList.innerHTML = factors.map((factor, index) => `
      <div class="factor-row" data-factor-id="${escapeHtml(factor.id)}">
        <label class="factor-field">
          Factor code
          <input type="text" maxlength="12" value="${escapeHtml(factor.code)}" data-factor-field="code" aria-label="Factor ${index + 1} code">
        </label>
        <label class="factor-field">
          Factor name
          <input type="text" maxlength="100" value="${escapeHtml(factor.name)}" data-factor-field="name" aria-label="Factor ${index + 1} name">
        </label>
        <label class="factor-field factor-description">
          Description
          <textarea rows="2" maxlength="260" data-factor-field="description" aria-label="Factor ${index + 1} description">${escapeHtml(factor.description)}</textarea>
        </label>
        <div class="factor-actions" aria-label="Reorder or remove factor ${index + 1}">
          <button type="button" class="secondary-button move-factor" data-direction="-1" aria-label="Move ${escapeHtml(factor.code || `factor ${index + 1}`)} up" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="secondary-button move-factor" data-direction="1" aria-label="Move ${escapeHtml(factor.code || `factor ${index + 1}`)} down" title="Move down" ${index === factors.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="remove-factor" aria-label="Remove ${escapeHtml(factor.code || `factor ${index + 1}`)}" title="Remove factor">×</button>
        </div>
      </div>
    `).join("");
  }

  function validateFactors() {
    const title = elements.problemTitle.value.trim();
    if (!title) return "Enter a clear problem title.";
    if (factors.length < 2) return "Add at least two factors.";
    if (factors.length > MAX_FACTORS) return `Use no more than ${MAX_FACTORS} factors in this browser tool.`;

    const codes = new Set();
    for (let index = 0; index < factors.length; index += 1) {
      const factor = factors[index];
      factor.code = factor.code.trim().toUpperCase();
      factor.name = factor.name.trim();
      factor.description = factor.description.trim();
      if (!factor.code) return `Enter a code for factor ${index + 1}.`;
      if (!factor.name) return `Enter a name for ${factor.code}.`;
      if (codes.has(factor.code)) return `Factor code ${factor.code} is duplicated. Use unique codes.`;
      codes.add(factor.code);
    }
    return "";
  }

  function createQuestionnaireId() {
    return `ism-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function questionnairePayload() {
    if (!questionnaireId) questionnaireId = createQuestionnaireId();
    return {
      schema: "ath-ism-questionnaire",
      version: ISM_MODEL_VERSION,
      questionnaireId,
      generatedAt: new Date().toISOString(),
      problem: {
        template: activeTemplateKey,
        title: elements.problemTitle.value.trim(),
        description: elements.problemDescription.value.trim()
      },
      factors: factors.map(({ id, code, name, description }) => ({ id, code, name, description })),
      relationshipScale: {
        V: "Factor i influences factor j",
        A: "Factor j influences factor i",
        X: "Both factors influence each other",
        O: "No direct relationship"
      },
      note: "The factor list is context-specific. The expert or facilitation group must confirm every relationship."
    };
  }

  function validateFactorPayload(dataFactors) {
    if (!Array.isArray(dataFactors) || dataFactors.length < 2 || dataFactors.length > MAX_FACTORS) {
      throw new Error(`The questionnaire must contain 2–${MAX_FACTORS} factors.`);
    }
    const ids = new Set();
    const codes = new Set();
    dataFactors.forEach((factor) => {
      if (!factor || typeof factor.id !== "string" || typeof factor.code !== "string" || typeof factor.name !== "string") {
        throw new Error("One or more factors are invalid.");
      }
      const code = factor.code.trim().toUpperCase();
      if (!code || !factor.name.trim() || ids.has(factor.id) || codes.has(code)) {
        throw new Error("Factor IDs and codes must be present and unique.");
      }
      ids.add(factor.id);
      codes.add(code);
    });
    return ids;
  }

  function validateQuestionnaire(data) {
    if (!data || data.schema !== "ath-ism-questionnaire" || data.version !== ISM_MODEL_VERSION) {
      throw new Error("This file is not a compatible ATH ISM questionnaire.");
    }
    if (!data.problem || typeof data.problem.title !== "string" || !data.problem.title.trim()) {
      throw new Error("The questionnaire is missing a valid problem definition.");
    }
    validateFactorPayload(data.factors);
  }

  function applyQuestionnaire(data) {
    validateQuestionnaire(data);
    questionnaireId = String(data.questionnaireId || createQuestionnaireId()).slice(0, 120);
    activeTemplateKey = data.problem.template in problemTemplates ? data.problem.template : "custom";
    elements.problemSelect.value = activeTemplateKey;
    elements.problemTitle.value = data.problem.title.slice(0, 120);
    elements.problemDescription.value = String(data.problem.description || "").slice(0, 600);
    elements.suggestedFactorsNote.hidden = activeTemplateKey === "custom";
    factors = data.factors.map((factor) => ({
      id: factor.id.slice(0, 160),
      code: factor.code.slice(0, 12),
      name: factor.name.slice(0, 100),
      description: String(factor.description || "").slice(0, 260)
    }));
    relationships = new Map();
    results = null;
    setActionMessage(elements.factorActionMessage);
    setActionMessage(elements.surveyActionMessage);
    renderFactors();
    renderRelationships();
    elements.surveyProblemTitle.textContent = elements.problemTitle.value;
    elements.surveyWorkspace.hidden = false;
    elements.analysisWorkspace.hidden = true;
    elements.results.hidden = true;
    updateWorkflow("relationships");
  }

  async function readJsonFile(input, missingMessage) {
    const file = input.files?.[0];
    if (!file) throw new Error(missingMessage);
    if (!file.name.toLowerCase().endsWith(".json")) throw new Error("Choose a JSON file with a .json extension.");
    if (file.size > 2 * 1024 * 1024) throw new Error("The JSON file must be smaller than 2 MB.");
    try {
      return JSON.parse(await file.text());
    } catch {
      throw new Error("The selected file does not contain valid JSON.");
    }
  }

  function exportQuestionnaire() {
    setError(elements.factorError);
    setActionMessage(elements.factorActionMessage);
    const error = validateFactors();
    if (error) {
      setError(elements.factorError, error);
      setActionMessage(elements.factorActionMessage, error, "error");
      return;
    }
    renderFactors();
    downloadBlob(
      "ath-ism-questionnaire.json",
      JSON.stringify(questionnairePayload(), null, 2),
      "application/json;charset=utf-8"
    );
    setActionMessage(elements.factorActionMessage, "Questionnaire JSON downloaded. Send this file to the expert or open it in Expert Survey.", "success");
  }

  async function loadQuestionnaire() {
    setError(elements.surveyImportError);
    try {
      const data = await readJsonFile(
        elements.questionnaireFileInput,
        "Choose an ATH ISM questionnaire JSON file first."
      );
      applyQuestionnaire(data);
      scrollToElement(elements.relationshipEntry);
    } catch (error) {
      setError(elements.surveyImportError, error.message || "The questionnaire could not be loaded.");
    }
  }

  function validateCompletedRelationships() {
    const total = factors.length * (factors.length - 1) / 2;
    if (relationships.size !== total || Array.from(relationships.values()).some((value) => !VALID_SYMBOLS.has(value))) {
      return "Confirm a V, A, X, or O judgement for every factor pair before continuing.";
    }
    return "";
  }

  function showIncompleteRelationships(message) {
    const unanswered = Array.from(elements.relationshipList.querySelectorAll("[data-relationship-key]"))
      .filter((select) => !VALID_SYMBOLS.has(select.value));
    elements.relationshipList.querySelectorAll(".relationship-row").forEach((row) => {
      const select = row.querySelector("[data-relationship-key]");
      row.classList.toggle("incomplete-relationship", Boolean(select && !VALID_SYMBOLS.has(select.value)));
    });
    const detail = unanswered.length
      ? `${unanswered.length} relationship judgement${unanswered.length === 1 ? "" : "s"} remaining. ${message}`
      : message;
    setError(elements.relationshipError, detail);
    setActionMessage(elements.surveyActionMessage, detail, "error");
    if (unanswered[0]) {
      unanswered[0].focus();
      scrollToElement(unanswered[0].closest(".relationship-row"));
    }
  }

  function surveyPayload() {
    return {
      schema: "ath-ism-response",
      version: ISM_MODEL_VERSION,
      questionnaire: questionnairePayload(),
      completedAt: new Date().toISOString(),
      expert: elements.expertName.value.trim(),
      relationships: Array.from(relationships.entries()).map(([key, symbol]) => {
        const [leftId, rightId] = key.split("::");
        return { leftId, rightId, symbol };
      }),
      note: "Relationships are expert judgements for the stated context and do not establish statistical causality."
    };
  }

  function exportSurvey() {
    setError(elements.relationshipError);
    setError(elements.surveyImportError);
    setActionMessage(elements.surveyActionMessage);
    const error = validateCompletedRelationships();
    if (error) {
      showIncompleteRelationships(error);
      return;
    }
    downloadBlob(
      "ath-ism-response.json",
      JSON.stringify(surveyPayload(), null, 2),
      "application/json;charset=utf-8"
    );
    setActionMessage(elements.surveyActionMessage, "Completed survey JSON downloaded. Import this response in Analysis.", "success");
  }

  function validateSurveyResponse(data) {
    if (!data || data.schema !== "ath-ism-response" || data.version !== ISM_MODEL_VERSION) {
      throw new Error("This file is not a compatible ATH ISM expert response.");
    }
    validateQuestionnaire(data.questionnaire);
    const ids = validateFactorPayload(data.questionnaire.factors);
    const expected = data.questionnaire.factors.length * (data.questionnaire.factors.length - 1) / 2;
    if (!Array.isArray(data.relationships) || data.relationships.length !== expected) {
      throw new Error("The expert response does not contain every required pairwise judgement.");
    }
    const expectedPairs = new Set();
    for (let i = 0; i < data.questionnaire.factors.length; i += 1) {
      for (let j = i + 1; j < data.questionnaire.factors.length; j += 1) {
        expectedPairs.add(relationshipKey(data.questionnaire.factors[i].id, data.questionnaire.factors[j].id));
      }
    }
    const pairs = new Set();
    data.relationships.forEach((relationship) => {
      if (!ids.has(relationship.leftId) || !ids.has(relationship.rightId) || relationship.leftId === relationship.rightId || !VALID_SYMBOLS.has(relationship.symbol)) {
        throw new Error("One or more relationship judgements are invalid.");
      }
      const key = relationshipKey(relationship.leftId, relationship.rightId);
      if (!expectedPairs.has(key) || pairs.has(key)) {
        throw new Error("The expert response contains a duplicate or incorrectly ordered relationship.");
      }
      pairs.add(key);
    });
  }

  function renderRelationships() {
    const rows = [];
    for (let i = 0; i < factors.length; i += 1) {
      for (let j = i + 1; j < factors.length; j += 1) {
        const key = relationshipKey(factors[i].id, factors[j].id);
        const selected = relationships.get(key) || "";
        rows.push(`
          <div class="relationship-row" data-relationship-row-key="${escapeHtml(key)}">
            <p><span>${escapeHtml(factors[i].code)}</span> ${escapeHtml(factors[i].name)} compared with <span>${escapeHtml(factors[j].code)}</span> ${escapeHtml(factors[j].name)}</p>
            <label>
              Relationship judgement
              <select data-relationship-key="${escapeHtml(key)}" aria-label="Relationship between ${escapeHtml(factors[i].code)} and ${escapeHtml(factors[j].code)}">
                <option value="" ${selected ? "" : "selected"}>Select V, A, X, or O</option>
                <option value="V" ${selected === "V" ? "selected" : ""}>V — ${escapeHtml(factors[i].code)} influences ${escapeHtml(factors[j].code)}</option>
                <option value="A" ${selected === "A" ? "selected" : ""}>A — ${escapeHtml(factors[j].code)} influences ${escapeHtml(factors[i].code)}</option>
                <option value="X" ${selected === "X" ? "selected" : ""}>X — Both influence each other</option>
                <option value="O" ${selected === "O" ? "selected" : ""}>O — No direct relationship</option>
              </select>
            </label>
          </div>
        `);
      }
    }
    elements.relationshipList.innerHTML = rows.join("");
    updateRelationshipProgress();
  }

  function updateRelationshipProgress() {
    const total = factors.length * (factors.length - 1) / 2;
    const confirmed = Array.from(relationships.values()).filter((symbol) => VALID_SYMBOLS.has(symbol)).length;
    elements.relationshipProgress.textContent = `${confirmed} / ${total} confirmed`;
  }

  function renderMatrix(matrix, options = {}) {
    const { ssim = false, transitive = null } = options;
    const headers = factors.map((factor) => `<th scope="col">${escapeHtml(factor.code)}</th>`).join("");
    const rows = factors.map((factor, rowIndex) => {
      const cells = factors.map((_, columnIndex) => {
        let value = matrix[rowIndex][columnIndex];
        let className = "";
        if (ssim) {
          if (rowIndex === columnIndex) value = "-";
          if (rowIndex > columnIndex) value = "";
        } else if (transitive?.[rowIndex]?.[columnIndex]) {
          value = "1*";
          className = " class=\"transitive-cell\"";
        }
        return `<td${className}>${escapeHtml(value)}</td>`;
      }).join("");
      return `<tr><th scope="row">${escapeHtml(factor.code)} — ${escapeHtml(factor.name)}</th>${cells}</tr>`;
    }).join("");

    return `
      <table class="matrix-table">
        <thead><tr><th scope="col">Factor</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function buildSsimMatrix() {
    return factors.map((factor, i) => factors.map((other, j) => {
      if (i >= j) return "";
      return relationships.get(relationshipKey(factor.id, other.id)) || "";
    }));
  }

  function listFactorNames(indexes, limit = indexes.length) {
    const visible = indexes.slice(0, limit).map((index) => `${factors[index].code} ${factors[index].name}`);
    const remaining = indexes.length - visible.length;
    return `${visible.join(", ")}${remaining > 0 ? `, and ${remaining} more` : ""}`;
  }

  function renderHierarchySvg(showTransitive = false, showDirect = true) {
    if (!results) return "";
    const horizontalPadding = 70;
    const topPadding = 70;
    const levelGap = 150;
    const nodeWidth = 184;
    const nodeHeight = 58;
    const nodeGap = 24;
    const widestLevel = Math.max(...results.levels.map((indexes) => indexes.length), 1);
    const width = Math.max(820, horizontalPadding * 2 + widestLevel * nodeWidth + (widestLevel - 1) * nodeGap);
    const height = Math.max(190, topPadding * 2 + (results.levels.length - 1) * levelGap + nodeHeight);
    const positions = {};

    results.levels.forEach((indexes, levelIndex) => {
      const availableWidth = width - horizontalPadding * 2;
      const gap = availableWidth / Math.max(indexes.length, 1);
      indexes.forEach((factorIndex, positionIndex) => {
        positions[factorIndex] = {
          x: horizontalPadding + gap * positionIndex + gap / 2,
          y: topPadding + levelIndex * levelGap
        };
      });
    });

    const edgePaths = [];
    for (let from = 0; from < factors.length; from += 1) {
      for (let to = 0; to < factors.length; to += 1) {
        if (from === to || !results.finalMatrix[from][to]) continue;
        const isTransitive = results.transitive[from][to];
        if (isTransitive && !showTransitive) continue;
        if (!isTransitive && !showDirect) continue;
        const source = positions[from];
        const target = positions[to];
        const sameLevel = Math.abs(source.y - target.y) < 1;
        const className = isTransitive ? "ism-edge transitive-edge" : "ism-edge direct-edge";
        if (sameLevel) {
          const leftToRight = source.x < target.x;
          const sourceX = source.x + (leftToRight ? nodeWidth / 2 : -nodeWidth / 2);
          const targetX = target.x + (leftToRight ? -nodeWidth / 2 : nodeWidth / 2);
          const curveY = source.y - nodeHeight / 2 - 22 - ((from + to) % 4) * 12;
          edgePaths.push(
            `<path class="${className}" d="M ${sourceX} ${source.y} C ${sourceX} ${curveY}, ${targetX} ${curveY}, ${targetX} ${target.y}" marker-end="url(#${isTransitive ? "arrowTransitive" : "arrowDirect"})"/>`
          );
          continue;
        }
        const sourceY = source.y > target.y ? source.y - nodeHeight / 2 : source.y + nodeHeight / 2;
        const targetY = source.y > target.y ? target.y + nodeHeight / 2 : target.y - nodeHeight / 2;
        const midY = (sourceY + targetY) / 2;
        edgePaths.push(
          `<path class="${className}" d="M ${source.x} ${sourceY} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${targetY}" marker-end="url(#${isTransitive ? "arrowTransitive" : "arrowDirect"})"/>`
        );
      }
    }

    const levelLabels = results.levels.map((_, index) => {
      const y = topPadding + index * levelGap;
      return `<text x="18" y="${y + 5}" class="level-label">Level ${index + 1}</text>`;
    }).join("");

    const nodes = factors.map((factor, index) => {
      const position = positions[index];
      const classification = results.classifications[index];
      return `
        <g class="ism-node" transform="translate(${position.x - nodeWidth / 2} ${position.y - nodeHeight / 2})">
          <rect width="${nodeWidth}" height="${nodeHeight}" rx="8"/>
          <text x="12" y="22" class="node-code">${escapeXml(factor.code)}</text>
          <text x="12" y="42" class="node-name">${escapeXml(factor.name.length > 22 ? `${factor.name.slice(0, 21)}...` : factor.name)}</text>
          <title>${escapeXml(`${factor.code} ${factor.name}; Level ${results.factorLevels[index]}; ${classification}`)}</title>
        </g>
      `;
    }).join("");

    const linkDescription = [
      showDirect ? "Direct expert-defined links are shown as solid lines." : "Direct links are hidden.",
      showTransitive ? "Transitive links are shown as dashed lines." : "Transitive links are hidden."
    ].join(" ");
    return `
      <svg id="ismHierarchySvg" viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-labelledby="hierarchySvgTitle hierarchySvgDescription" xmlns="http://www.w3.org/2000/svg">
        <title id="hierarchySvgTitle">Interpretive Structural Modeling hierarchy</title>
        <desc id="hierarchySvgDescription">Factors are arranged by ISM level with foundational driving factors at the bottom. ${escapeXml(linkDescription)}</desc>
        <defs>
          <marker id="arrowDirect" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#1f6feb"/></marker>
          <marker id="arrowTransitive" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#b54708"/></marker>
        </defs>
        <style>
          .ism-edge{fill:none;stroke-width:2}.direct-edge{stroke:#1f6feb}.transitive-edge{stroke:#b54708;stroke-dasharray:7 6;opacity:.78}
          .ism-node rect{fill:#fff;stroke:#98baf4;stroke-width:1.5}.node-code{font:800 13px Inter,sans-serif;fill:#1f6feb}
          .node-name{font:700 12px Inter,sans-serif;fill:#06172b}.level-label{font:800 12px Inter,sans-serif;fill:#475467}
        </style>
        ${levelLabels}
        ${edgePaths.join("")}
        ${nodes}
      </svg>
    `;
  }

  function renderMicmacSvg() {
    const width = 640;
    const height = 420;
    const left = 64;
    const right = 24;
    const top = 38;
    const bottom = 58;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = Math.max(factors.length, ...results.driving, ...results.dependence);
    const x = (value) => left + (value / Math.max(1, maxValue + 1)) * plotWidth;
    const y = (value) => top + plotHeight - (value / Math.max(1, maxValue + 1)) * plotHeight;
    const splitX = x(results.averageDependence);
    const splitY = y(results.averageDriving);

    const groupedPoints = new Map();
    factors.forEach((factor, index) => {
      const key = `${results.dependence[index]}::${results.driving[index]}`;
      const group = groupedPoints.get(key) || {
        dependence: results.dependence[index],
        driving: results.driving[index],
        indexes: []
      };
      group.indexes.push(index);
      groupedPoints.set(key, group);
    });

    const points = Array.from(groupedPoints.values()).map((group) => {
      const codes = group.indexes.map((index) => factors[index].code);
      const shortLabel = codes.length > 4
        ? `${codes.slice(0, 3).join(", ")} +${codes.length - 3}`
        : codes.join(", ");
      const title = group.indexes.map((index) =>
        `${factors[index].code} ${factors[index].name}`
      ).join("; ");
      const pointX = x(group.dependence);
      const placeLabelLeft = pointX > left + plotWidth * .72;
      return `
        <g transform="translate(${pointX} ${y(group.driving)})">
          <circle r="${group.indexes.length > 1 ? 12 : 9}" fill="#1f6feb" stroke="#fff" stroke-width="3"/>
          <text x="${placeLabelLeft ? -16 : 16}" y="4" text-anchor="${placeLabelLeft ? "end" : "start"}">${escapeXml(shortLabel)}</text>
          <title>${escapeXml(`${title}: driving ${group.driving}, dependence ${group.dependence}`)}</title>
        </g>
      `;
    }).join("");

    return `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="micmacTitle micmacDescription" xmlns="http://www.w3.org/2000/svg">
        <title id="micmacTitle">MICMAC-style driving and dependence classification</title>
        <desc id="micmacDescription">Factors are plotted by final reachability matrix driving and dependence totals. Average values divide the four interpretive quadrants.</desc>
        <style>
          text{font-family:Inter,sans-serif;fill:#475467;font-size:12px}.quad{font-weight:800;fill:#06172b}
          .axis{stroke:#667085;stroke-width:1.5}.split{stroke:#98a2b3;stroke-dasharray:6 5}.point-label{font-weight:800}
        </style>
        <rect x="${left}" y="${top}" width="${Math.max(0, splitX - left)}" height="${Math.max(0, splitY - top)}" fill="#eef3f9"/>
        <rect x="${splitX}" y="${top}" width="${Math.max(0, left + plotWidth - splitX)}" height="${Math.max(0, splitY - top)}" fill="#fff4e5"/>
        <rect x="${left}" y="${splitY}" width="${Math.max(0, splitX - left)}" height="${Math.max(0, top + plotHeight - splitY)}" fill="#f2f4f7"/>
        <rect x="${splitX}" y="${splitY}" width="${Math.max(0, left + plotWidth - splitX)}" height="${Math.max(0, top + plotHeight - splitY)}" fill="#e8f8f1"/>
        <line class="axis" x1="${left}" y1="${top + plotHeight}" x2="${left + plotWidth}" y2="${top + plotHeight}"/>
        <line class="axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}"/>
        <line class="split" x1="${splitX}" y1="${top}" x2="${splitX}" y2="${top + plotHeight}"/>
        <line class="split" x1="${left}" y1="${splitY}" x2="${left + plotWidth}" y2="${splitY}"/>
        <text class="quad" x="${left + 10}" y="${top + 20}">Independent / driving</text>
        <text class="quad" x="${left + plotWidth - 10}" y="${top + 20}" text-anchor="end">Linkage</text>
        <text class="quad" x="${left + 10}" y="${top + plotHeight - 12}">Autonomous</text>
        <text class="quad" x="${left + plotWidth - 10}" y="${top + plotHeight - 12}" text-anchor="end">Dependent</text>
        <text x="${left + plotWidth / 2 - 36}" y="${height - 16}">Dependence power</text>
        <text transform="translate(18 ${top + plotHeight / 2 + 36}) rotate(-90)">Driving power</text>
        <g class="point-label">${points}</g>
      </svg>
    `;
  }

  function strongestIndexes(values, mode = "max") {
    const target = mode === "min" ? Math.min(...values) : Math.max(...values);
    return values.map((value, index) => value === target ? index : -1).filter((index) => index >= 0);
  }

  function findStronglyConnectedGroups(matrix) {
    const size = matrix.length;
    const indexes = Array(size).fill(-1);
    const lowLinks = Array(size).fill(0);
    const stack = [];
    const onStack = new Set();
    const groups = [];
    let nextIndex = 0;

    function visit(node) {
      indexes[node] = nextIndex;
      lowLinks[node] = nextIndex;
      nextIndex += 1;
      stack.push(node);
      onStack.add(node);

      for (let target = 0; target < size; target += 1) {
        if (node === target || !matrix[node][target]) continue;
        if (indexes[target] === -1) {
          visit(target);
          lowLinks[node] = Math.min(lowLinks[node], lowLinks[target]);
        } else if (onStack.has(target)) {
          lowLinks[node] = Math.min(lowLinks[node], indexes[target]);
        }
      }

      if (lowLinks[node] !== indexes[node]) return;
      const group = [];
      let current = -1;
      do {
        current = stack.pop();
        onStack.delete(current);
        group.push(current);
      } while (current !== node);
      if (group.length > 1) groups.push(group.sort((left, right) => left - right));
    }

    for (let node = 0; node < size; node += 1) {
      if (indexes[node] === -1) visit(node);
    }
    return groups.sort((left, right) => right.length - left.length);
  }

  function getHierarchyDiagnostic() {
    const reciprocalKeys = [];
    for (let i = 0; i < factors.length; i += 1) {
      for (let j = i + 1; j < factors.length; j += 1) {
        const key = relationshipKey(factors[i].id, factors[j].id);
        if (relationships.get(key) === "X") reciprocalKeys.push(key);
      }
    }

    const circularGroups = findStronglyConnectedGroups(results.initialMatrix);
    const reviewKeys = new Set(reciprocalKeys);
    circularGroups.forEach((group) => {
      for (let left = 0; left < group.length; left += 1) {
        for (let right = left + 1; right < group.length; right += 1) {
          const first = Math.min(group[left], group[right]);
          const second = Math.max(group[left], group[right]);
          const key = relationshipKey(factors[first].id, factors[second].id);
          if (relationships.get(key) !== "O") reviewKeys.add(key);
        }
      }
    });

    return {
      reciprocalKeys,
      circularGroups,
      reviewKeys: Array.from(reviewKeys)
    };
  }

  function renderHierarchyDiagnostic() {
    const diagnostic = getHierarchyDiagnostic();
    const collapsed = results.levels.length === 1 && factors.length > 2;
    const groupText = diagnostic.circularGroups.slice(0, 3).map((group) =>
      listFactorNames(group, 6)
    );

    elements.hierarchyDiagnostic.classList.toggle("is-clear", !collapsed && diagnostic.circularGroups.length === 0);
    elements.hierarchyDiagnostic.innerHTML = `
      <div class="diagnostic-heading">
        <div>
          <span class="diagnostic-label">Hierarchy diagnostic</span>
          <h3>${collapsed ? "The model has collapsed into one level" : `${results.levels.length} hierarchy levels identified`}</h3>
        </div>
        ${diagnostic.reviewKeys.length ? `<button type="button" class="secondary-button" data-review-relationships>Review flagged relationships</button>` : ""}
      </div>
      ${collapsed ? `
        <p>Every factor can reach every other factor after direct and transitive links are considered. Separate levels would therefore misrepresent the current expert response.</p>
      ` : `
        <p>The current directional judgements support a multi-level structure. Level I contains the most dependent outcomes; the highest numbered level contains the foundational driving factors.</p>
      `}
      <dl class="diagnostic-metrics">
        <div><dt>Reciprocal X judgements</dt><dd>${diagnostic.reciprocalKeys.length}</dd></div>
        <div><dt>Circular factor groups</dt><dd>${diagnostic.circularGroups.length}</dd></div>
        <div><dt>Relationships to review</dt><dd>${diagnostic.reviewKeys.length}</dd></div>
      </dl>
      ${groupText.length ? `
        <div class="diagnostic-groups">
          <strong>Connected groups that can prevent separation into levels</strong>
          <ul>${groupText.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>
        </div>
      ` : ""}
      <p class="diagnostic-guidance"><strong>Review principle:</strong> Use X only for genuine direct reciprocal influence, use O where no direct contextual influence exists, and check directional loops such as F1 → F2 → F3 → F1. The tool will not alter these judgements automatically.</p>
    `;
    elements.hierarchyDiagnostic.dataset.reviewKeys = diagnostic.reviewKeys.join(",");
  }

  function renderInterpretation() {
    const strongestDrivers = strongestIndexes(results.driving);
    const strongestDependents = strongestIndexes(results.dependence);
    const linkage = results.classifications.map((value, index) => value === "Linkage" ? index : -1).filter((index) => index >= 0);
    const baseLevel = Math.max(...results.factorLevels);
    const baseFactors = results.factorLevels.map((value, index) => value === baseLevel ? index : -1).filter((index) => index >= 0);
    const earlyAttention = Array.from(new Set([...baseFactors, ...strongestDrivers, ...linkage])).slice(0, 6);

    elements.resultSummary.innerHTML = `
      <h3>What This Structure Means</h3>
      <ul>
        <li><strong>Strongest driving power:</strong> ${escapeHtml(listFactorNames(strongestDrivers, 4))}.</li>
        <li><strong>Highest dependence:</strong> ${escapeHtml(listFactorNames(strongestDependents, 4))}.</li>
        <li><strong>Linkage factors:</strong> ${linkage.length ? escapeHtml(listFactorNames(linkage, 4)) : "None under the average-based split used by this model"}.</li>
        <li><strong>Base of the hierarchy:</strong> ${escapeHtml(listFactorNames(baseFactors, 4))}.</li>
        <li><strong>Early management attention:</strong> Review ${escapeHtml(listFactorNames(earlyAttention, 4))} first, then test the assumed relationships against operational evidence.</li>
      </ul>
      <p><strong>Interpretation safeguard:</strong> ISM structures expert judgement. Driving power and hierarchy position do not establish statistical causality or effect size.</p>
    `;
  }

  function renderResults() {
    const directLinks = results.initialMatrix.reduce((total, row, i) =>
      total + row.reduce((sum, value, j) => sum + (i !== j && value ? 1 : 0), 0), 0
    );
    const transitiveLinks = results.transitive.reduce((total, row) =>
      total + row.reduce((sum, value) => sum + (value ? 1 : 0), 0), 0
    );
    const denseSingleLevelModel = results.levels.length === 1 && directLinks > factors.length * 2;
    elements.directLinksToggle.checked = !denseSingleLevelModel;

    renderHierarchyDiagnostic();
    renderInterpretation();
    elements.resultMetrics.innerHTML = [
      ["Factors", factors.length],
      ["Hierarchy levels", results.levels.length],
      ["Direct links", directLinks],
      ["Transitive links", transitiveLinks]
    ].map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

    elements.hierarchyDiagram.innerHTML = renderHierarchySvg(
      elements.transitiveToggle.checked,
      elements.directLinksToggle.checked
    );
    elements.hierarchyTextSummary.textContent = results.levels.map((indexes, index) =>
      `Level ${index + 1}: ${listFactorNames(indexes, 6)}`
    ).join(". ");
    elements.finalMatrixTable.innerHTML = renderMatrix(results.finalMatrix, { transitive: results.transitive });

    const assignedPartitions = results.partitions.filter((row) => row.assigned);
    elements.partitionTable.innerHTML = `
      <table class="partition-table">
        <thead><tr><th>Iteration</th><th>Factor</th><th>Reachability set</th><th>Antecedent set</th><th>Intersection</th><th>Assigned level</th></tr></thead>
        <tbody>
          ${assignedPartitions.map((row) => `
            <tr>
              <td>${row.iteration}</td>
              <td>${escapeHtml(factors[row.factorIndex].code)} — ${escapeHtml(factors[row.factorIndex].name)}</td>
              <td>${escapeHtml(setFromIndexes(row.reachability, factors).join(", "))}</td>
              <td>${escapeHtml(setFromIndexes(row.antecedent, factors).join(", "))}</td>
              <td>${escapeHtml(setFromIndexes(row.intersection, factors).join(", "))}</td>
              <td>Level ${results.factorLevels[row.factorIndex]}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    elements.powerTable.innerHTML = `
      <table class="power-table">
        <thead><tr><th>Factor</th><th>Level</th><th>Driving</th><th>Dependence</th><th>Classification</th></tr></thead>
        <tbody>
          ${factors.map((factor, index) => `
            <tr>
              <td>${escapeHtml(factor.code)} — ${escapeHtml(factor.name)}</td>
              <td>${results.factorLevels[index]}</td>
              <td>${results.driving[index]}</td>
              <td>${results.dependence[index]}</td>
              <td><span class="classification-badge">${escapeHtml(results.classifications[index])}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    elements.micmacChart.innerHTML = renderMicmacSvg();
    elements.micmacSummary.textContent = `Average split: driving ${results.averageDriving.toFixed(2)}, dependence ${results.averageDependence.toFixed(2)}. This is a transparent descriptive classification, not a universal statistical threshold.`;
    elements.results.hidden = false;
    updateWorkflow("results");
    scrollToElement(elements.results);
  }

  function setDirectedRelationship(fromIndex, toIndex) {
    const leftIndex = Math.min(fromIndex, toIndex);
    const rightIndex = Math.max(fromIndex, toIndex);
    const key = relationshipKey(factors[leftIndex].id, factors[rightIndex].id);
    relationships.set(key, fromIndex < toIndex ? "V" : "A");
  }

  function loadSampleResponse() {
    activeTemplateKey = "custom";
    questionnaireId = createQuestionnaireId();
    elements.problemSelect.value = "custom";
    elements.problemTitle.value = multiLevelDemonstration.title;
    elements.problemDescription.value = multiLevelDemonstration.description;
    elements.suggestedFactorsNote.hidden = false;
    factors = multiLevelDemonstration.factors.map(([code, name, description]) =>
      makeFactor(code, name, description)
    );
    relationships = new Map();

    for (let i = 0; i < factors.length; i += 1) {
      for (let j = i + 1; j < factors.length; j += 1) {
        relationships.set(relationshipKey(factors[i].id, factors[j].id), "O");
      }
    }

    const factorIndexByCode = new Map(factors.map((factor, index) => [factor.code, index]));
    multiLevelDemonstration.directLinks.forEach(([fromCode, toCode]) => {
      setDirectedRelationship(factorIndexByCode.get(fromCode), factorIndexByCode.get(toCode));
    });

    elements.expertName.value = "Illustrative demonstration - not validated";
    elements.surveyProblemTitle.textContent = multiLevelDemonstration.title;
    renderFactors();
    renderRelationships();
    elements.surveyWorkspace.hidden = false;
    prepareAnalysis(false);
    setError(elements.analysisError, "Sample response loaded. Review the SSIM and initial reachability matrix, then apply transitivity to generate the illustrative hierarchy.");
    scrollToElement(elements.matrixReview);
  }

  function downloadBlob(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    if (!results) return;
    const rows = [];
    rows.push(["Interpretive Structural Modeling Model"]);
    rows.push(["Problem", elements.problemTitle.value.trim()]);
    rows.push(["Description", elements.problemDescription.value.trim()]);
    rows.push([]);
    rows.push(["Factors"]);
    rows.push(["Code", "Name", "Description", "Level", "Driving Power", "Dependence Power", "MICMAC Classification"]);
    factors.forEach((factor, index) => rows.push([
      factor.code,
      factor.name,
      factor.description,
      results.factorLevels[index],
      results.driving[index],
      results.dependence[index],
      results.classifications[index]
    ]));

    const addMatrix = (title, matrix, transitive = null) => {
      rows.push([]);
      rows.push([title]);
      rows.push(["Factor", ...factors.map((factor) => factor.code)]);
      matrix.forEach((row, i) => rows.push([
        factors[i].code,
        ...row.map((value, j) => transitive?.[i]?.[j] ? "1*" : value)
      ]));
    };
    addMatrix("Structural Self-Interaction Matrix", buildSsimMatrix());
    addMatrix("Initial Reachability Matrix", results.initialMatrix);
    addMatrix("Final Reachability Matrix", results.finalMatrix, results.transitive);

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadBlob("ath-ism-model.csv", csv, "text/csv;charset=utf-8");
  }

  function exportSvg() {
    const svg = document.getElementById("ismHierarchySvg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    downloadBlob("ath-ism-hierarchy.svg", serialized, "image/svg+xml;charset=utf-8");
  }

  function resetTool() {
    elements.problemSelect.value = "custom";
    elements.questionnaireFileInput.value = "";
    elements.responseFileInput.value = "";
    elements.expertName.value = "";
    elements.transitiveToggle.checked = false;
    elements.directLinksToggle.checked = true;
    setError(elements.setupError);
    setError(elements.factorError);
    setError(elements.relationshipError);
    setError(elements.surveyImportError);
    setError(elements.analysisError);
    setActionMessage(elements.factorActionMessage);
    setActionMessage(elements.surveyActionMessage);
    loadTemplate("custom");
    document.getElementById("problem-setup").scrollIntoView({ behavior: "auto", block: "start" });
  }

  elements.loadTemplateButton.addEventListener("click", () => loadTemplate(elements.problemSelect.value));
  elements.resetToolButton.addEventListener("click", resetTool);
  elements.exportQuestionnaireButton.addEventListener("click", exportQuestionnaire);
  elements.loadQuestionnaireButton.addEventListener("click", loadQuestionnaire);
  elements.exportSurveyButton.addEventListener("click", exportSurvey);

  elements.problemTitle.addEventListener("input", () => {
    questionnaireId = "";
    elements.surveyProblemTitle.textContent = elements.problemTitle.value.trim() || "Untitled questionnaire";
    hideDownstream();
  });
  elements.problemDescription.addEventListener("input", () => {
    questionnaireId = "";
    hideDownstream();
  });

  elements.addFactorButton.addEventListener("click", () => {
    if (factors.length >= MAX_FACTORS) {
      setError(elements.factorError, `This browser tool supports up to ${MAX_FACTORS} factors to keep pairwise entry manageable.`);
      return;
    }
    factors.push(makeFactor(`F${factors.length + 1}`));
    questionnaireId = "";
    renderFactors();
    resetRelationships("Factor structure changed. Pairwise relationships must be confirmed again.");
  });

  elements.factorList.addEventListener("input", (event) => {
    const input = event.target.closest("[data-factor-field]");
    if (!input) return;
    const row = input.closest("[data-factor-id]");
    const factor = factors.find((item) => item.id === row.dataset.factorId);
    if (!factor) return;
    factor[input.dataset.factorField] = input.value;
    questionnaireId = "";
    if (input.dataset.factorField === "description") {
      hideDownstream();
    } else {
      resetRelationships("Factor definitions changed. Pairwise relationships must be confirmed again.");
    }
    setError(elements.factorError);
  });

  elements.factorList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-factor-id]");
    if (!row) return;
    const index = factors.findIndex((factor) => factor.id === row.dataset.factorId);
    if (index < 0) return;

    if (event.target.closest(".remove-factor")) {
      if (factors.length <= 2) {
        setError(elements.factorError, "ISM requires at least two factors.");
        return;
      }
      factors.splice(index, 1);
      questionnaireId = "";
      renderFactors();
      resetRelationships("Factor structure changed. Pairwise relationships must be confirmed again.");
      return;
    }

    const moveButton = event.target.closest(".move-factor");
    if (!moveButton) return;
    const direction = Number(moveButton.dataset.direction);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= factors.length) return;
    [factors[index], factors[targetIndex]] = [factors[targetIndex], factors[index]];
    questionnaireId = "";
    renderFactors();
    resetRelationships("Factor order changed. Pairwise relationships must be confirmed again.");
  });

  elements.prepareRelationshipsButton.addEventListener("click", () => {
    setError(elements.factorError);
    setActionMessage(elements.factorActionMessage);
    const error = validateFactors();
    if (error) {
      setError(elements.factorError, error);
      setActionMessage(elements.factorActionMessage, error, "error");
      return;
    }
    renderFactors();
    renderRelationships();
    if (!questionnaireId) questionnaireId = createQuestionnaireId();
    elements.surveyProblemTitle.textContent = elements.problemTitle.value.trim();
    elements.surveyWorkspace.hidden = false;
    elements.analysisWorkspace.hidden = true;
    elements.results.hidden = true;
    updateWorkflow("relationships");
    scrollToElement(elements.relationshipEntry);
  });

  elements.relationshipList.addEventListener("change", (event) => {
    const select = event.target.closest("[data-relationship-key]");
    if (!select) return;
    if (VALID_SYMBOLS.has(select.value)) {
      relationships.set(select.dataset.relationshipKey, select.value);
    } else {
      relationships.delete(select.dataset.relationshipKey);
    }
    setError(elements.relationshipError);
    setActionMessage(elements.surveyActionMessage);
    select.closest(".relationship-row")?.classList.remove("incomplete-relationship");
    elements.analysisWorkspace.hidden = true;
    elements.results.hidden = true;
    results = null;
    updateRelationshipProgress();
  });

  function prepareAnalysis(scroll = true, showSurveyFeedback = false) {
    const error = validateCompletedRelationships();
    if (error) {
      if (showSurveyFeedback) {
        showIncompleteRelationships(error);
      } else {
        setError(elements.relationshipError, error);
      }
      return false;
    }
    setError(elements.relationshipError);
    setActionMessage(elements.surveyActionMessage);
    setError(elements.analysisError);
    const ssim = buildSsimMatrix();
    const initial = buildInitialMatrix(factors, relationships);
    elements.ssimTable.innerHTML = renderMatrix(ssim, { ssim: true });
    elements.initialMatrixTable.innerHTML = renderMatrix(initial);
    elements.analysisWorkspace.hidden = false;
    elements.results.hidden = true;
    results = null;
    updateWorkflow("matrices");
    if (scroll) scrollToElement(elements.matrixReview);
    return true;
  }

  async function loadResponse() {
    setError(elements.analysisError);
    try {
      const data = await readJsonFile(
        elements.responseFileInput,
        "Choose a completed ATH ISM survey JSON file first."
      );
      validateSurveyResponse(data);
      applyQuestionnaire(data.questionnaire);
      elements.expertName.value = String(data.expert || "").slice(0, 120);
      relationships = new Map(data.relationships.map((relationship) => [
        relationshipKey(relationship.leftId, relationship.rightId),
        relationship.symbol
      ]));
      renderRelationships();
      prepareAnalysis(false);
      scrollToElement(elements.matrixReview);
    } catch (error) {
      setError(elements.analysisError, error.message || "The expert response could not be loaded.");
    }
  }

  elements.buildMatricesButton.addEventListener("click", () => prepareAnalysis(true, true));
  elements.loadResponseButton.addEventListener("click", loadResponse);
  elements.loadSampleResponseButton.addEventListener("click", loadSampleResponse);

  elements.hierarchyDiagnostic.addEventListener("click", (event) => {
    const reviewButton = event.target.closest("[data-review-relationships]");
    if (!reviewButton) return;
    const reviewKeys = new Set((elements.hierarchyDiagnostic.dataset.reviewKeys || "").split(",").filter(Boolean));
    document.querySelectorAll("[data-relationship-row-key]").forEach((row) => {
      row.classList.toggle("diagnostic-review", reviewKeys.has(row.dataset.relationshipRowKey));
    });
    setError(elements.relationshipError, "Highlighted judgements contribute to reciprocal or circular paths. Review their direction and use O where no direct relationship exists.");
    scrollToElement(elements.relationshipEntry);
  });

  function selectMatrixTab(tab) {
    const showSsim = tab === "ssim";
    elements.ssimTab.setAttribute("aria-selected", String(showSsim));
    elements.initialTab.setAttribute("aria-selected", String(!showSsim));
    elements.ssimPanel.hidden = !showSsim;
    elements.initialPanel.hidden = showSsim;
    (showSsim ? elements.ssimTab : elements.initialTab).focus();
  }

  elements.ssimTab.addEventListener("click", () => selectMatrixTab("ssim"));
  elements.initialTab.addEventListener("click", () => selectMatrixTab("initial"));
  [elements.ssimTab, elements.initialTab].forEach((tab, index, tabs) => {
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const targetIndex = event.key === "Home" ? 0 :
        event.key === "End" ? tabs.length - 1 :
        event.key === "ArrowRight" ? (index + 1) % tabs.length :
        (index - 1 + tabs.length) % tabs.length;
      selectMatrixTab(targetIndex === 0 ? "ssim" : "initial");
    });
  });

  elements.generateResultsButton.addEventListener("click", () => {
    results = analyzeModel(factors, relationships);
    renderResults();
  });

  elements.transitiveToggle.addEventListener("change", () => {
    elements.hierarchyDiagram.innerHTML = renderHierarchySvg(
      elements.transitiveToggle.checked,
      elements.directLinksToggle.checked
    );
  });
  elements.directLinksToggle.addEventListener("change", () => {
    elements.hierarchyDiagram.innerHTML = renderHierarchySvg(
      elements.transitiveToggle.checked,
      elements.directLinksToggle.checked
    );
  });
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.printReportButton.addEventListener("click", () => window.print());
  elements.exportSvgButton.addEventListener("click", exportSvg);

  loadTemplate("custom");
}

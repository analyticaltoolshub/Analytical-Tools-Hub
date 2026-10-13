const ISM_MODEL_VERSION = 1;
const MAX_FACTORS = 12;
const VALID_SYMBOLS = new Set(["V", "A", "X", "O"]);

const multiLevelDemonstration = {
  title: "Electronics manufacturer supply continuity barriers",
  description: "Illustrative completed response for a multi-site electronics manufacturer that depends on specialised components and contract suppliers. The model examines organisational and network conditions that can delay disruption response and service recovery. Its relationships are synthetic teaching judgements, not validated evidence; review every factor and relationship before using the structure in practice.",
  scope: "Use this completed example to inspect a multi-level hierarchy and the full analysis workflow. It is not a reusable industry benchmark.",
  factors: [
    ["F1", "Fragmented risk ownership", "Business units and sites do not share clear accountability for prevention, escalation, and recovery decisions, which delays coordinated action."],
    ["F2", "Delayed supplier risk data", "Capacity, material, and shipment exceptions arrive late or through disconnected channels, reducing the time available to respond."],
    ["F3", "Limited sub-tier visibility", "Critical dependencies below direct suppliers are not mapped, so hidden concentration and disruption exposure remain unidentified."],
    ["F4", "Weak supplier contingency alignment", "Critical suppliers do not routinely align continuity plans, escalation contacts, and recovery priorities with the manufacturer."],
    ["F5", "Slow disruption escalation", "Confirmed disruption signals do not reach accountable decision-makers within defined response times."],
    ["F6", "Constrained alternate capacity", "Approved suppliers, production lines, and logistics routes cannot provide enough short-notice replacement capacity."],
    ["F7", "Untested recovery playbooks", "Cross-functional continuity procedures have not been exercised against realistic component, site, or transport disruption scenarios."],
    ["F8", "Delayed containment action", "Allocation, substitution, rerouting, and customer-priority decisions begin too late to contain service impact."],
    ["F9", "Prolonged service recovery", "Production and customer service take longer than the agreed recovery objective to return to stable performance."]
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
    title: "Supplier selection decision barriers",
    description: "Identify the organisational, information, and evaluation barriers that can weaken a sourcing team's selection of a supplier for a material, service, or outsourced capability. Use the model to explore why evidence is incomplete, stakeholders reach different conclusions, or short-term price dominates total value and risk.",
    scope: "Use for barriers within the supplier evaluation and award process. Use the Kraljic template or tool for portfolio positioning, and the AHP tool when the objective is to rank named supplier alternatives.",
    factors: [
      ["F1", "Incomplete supplier evidence", "Audited evidence on capability, quality, delivery, financial health, and compliance is incomplete or inconsistent, weakening comparison between bidders."],
      ["F2", "Ambiguous requirements", "Technical, service, volume, and compliance requirements are not sufficiently specific, so suppliers respond to different interpretations."],
      ["F3", "Misaligned evaluation criteria", "Procurement, operations, quality, finance, and engineering do not agree on criteria or priorities, producing inconsistent scoring."],
      ["F4", "Incomplete total-cost analysis", "Price is visible but logistics, quality failure, inventory, transition, tooling, and exit costs are not consistently included."],
      ["F5", "Weak supplier due diligence", "Financial, capacity, continuity, cyber, geopolitical, and compliance exposures are not examined to a depth proportionate to the award."],
      ["F6", "Unverified capacity capability", "Quoted capacity, ramp-up capability, bottlenecks, and surge flexibility have not been validated against expected demand."],
      ["F7", "Unclear decision governance", "Accountability for evaluation, challenge, approval, and conflict resolution is unclear, slowing or distorting the award decision."],
      ["F8", "Short-term price bias", "Unit price is given disproportionate influence over quality, resilience, service, innovation, and lifecycle value."]
    ]
  },
  resilience: {
    title: "Supply-chain resilience barriers",
    description: "Examine the organisational and network conditions that reduce the ability to anticipate disruptions, absorb operational impact, respond quickly, and restore supply. Use this template for resilience capability improvement rather than for cataloguing individual risk events.",
    scope: "Focuses on preparedness, response, and recovery capability. Use Supply-chain risk exposure drivers when the question concerns the sources of disruption exposure.",
    factors: [
      ["F1", "Limited multi-tier visibility", "Critical materials, sub-tier dependencies, capacity, and shipment status are not visible early enough to support preventive action."],
      ["F2", "Concentrated supply dependency", "Critical supply depends on one supplier, site, technology, route, or geographic region, limiting viable alternatives during disruption."],
      ["F3", "Weak resilience governance", "Risk ownership, escalation thresholds, decision rights, and recovery priorities are not clearly assigned across functions."],
      ["F4", "Insufficient operational buffers", "Inventory, capacity, labour, tooling, or transport buffers are too small or poorly positioned to absorb disruption."],
      ["F5", "Limited supplier continuity collaboration", "Critical suppliers do not routinely share risk signals, continuity plans, recovery assumptions, or escalation contacts."],
      ["F6", "Fragmented risk information", "Supplier, logistics, demand, and operational risk data is dispersed across systems and cannot be combined into a timely view."],
      ["F7", "Slow disruption escalation", "Warning signals and confirmed exceptions do not reach accountable decision-makers within defined response times."],
      ["F8", "Untested continuity arrangements", "Response plans, alternate sources, substitutions, and recovery procedures have not been exercised under realistic conditions."],
      ["F9", "Constrained recovery resources", "Funding, people, technical support, and emergency procurement authority are unavailable when recovery actions must begin."]
    ]
  },
  sustainable: {
    title: "Sustainable supply-chain implementation barriers",
    description: "Explore why environmental and social objectives are not consistently embedded across product design, sourcing, manufacturing, logistics, supplier development, and performance management. Use the model to identify system-wide implementation barriers rather than evaluate one procurement event.",
    scope: "Covers end-to-end environmental and social implementation. Use Green procurement barriers for the narrower sourcing-policy and supplier-selection process.",
    factors: [
      ["F1", "Weak executive sponsorship", "Leaders do not translate sustainability commitments into operating priorities, investment decisions, or accountable performance objectives."],
      ["F2", "Inconsistent performance measures", "Environmental and social targets, boundaries, baselines, and calculation methods differ across functions and suppliers."],
      ["F3", "Limited supplier transition capability", "Suppliers lack the skills, technology, finance, or process maturity needed to meet new environmental and social requirements."],
      ["F4", "Constrained transition investment", "Capital and operating funds for cleaner technology, traceability, redesign, and supplier development compete with short-term priorities."],
      ["F5", "Insufficient value-chain traceability", "Material origin, labour conditions, emissions, and environmental impacts cannot be reliably traced across supply tiers."],
      ["F6", "Short-term commercial pressure", "Price, margin, availability, and delivery targets repeatedly take precedence over longer-term sustainability outcomes."],
      ["F7", "Complex compliance landscape", "Different product, customer, reporting, and jurisdictional requirements create uncertainty and duplicated implementation effort."],
      ["F8", "Fragmented functional accountability", "Procurement, design, operations, logistics, finance, and compliance do not share clear ownership for end-to-end outcomes."],
      ["F9", "Unreliable sustainability data", "Supplier, emissions, waste, energy, and social-performance data is incomplete, inconsistent, or difficult to verify."]
    ]
  },
  digital: {
    title: "Digital supply-chain adoption barriers",
    description: "Identify barriers to adopting connected planning, control-tower visibility, master-data integration, workflow automation, and digital collaboration across the supply network. Use this template for enterprise and inter-organisational information flows rather than shop-floor automation.",
    scope: "Covers planning, visibility, data integration, and partner connectivity across the supply chain. Use Industry 4.0 adoption challenges for connected manufacturing assets and factory automation.",
    factors: [
      ["F1", "Legacy application constraints", "Planning and execution systems lack modern interfaces or require costly custom integration, limiting reliable data exchange."],
      ["F2", "Unreliable master data", "Product, supplier, customer, inventory, location, and lead-time records are incomplete or governed inconsistently."],
      ["F3", "Limited digital capability", "Teams lack the process, data, analytics, integration, and change skills needed to design and sustain the new way of working."],
      ["F4", "Unclear operational value case", "Target decisions, users, benefits, process changes, ownership, and adoption measures are not defined before technology selection."],
      ["F5", "Data-sharing security concerns", "Cybersecurity, privacy, access, and commercial confidentiality concerns restrict internal and partner data exchange."],
      ["F6", "Resistance to workflow change", "Users continue spreadsheets and local workarounds because roles, incentives, controls, or usability needs are not addressed."],
      ["F7", "Partner connectivity gaps", "Suppliers, customers, and logistics partners use incompatible standards or lack the capability to exchange timely structured data."],
      ["F8", "Fragmented data governance", "Ownership, definitions, standards, access rights, and issue-resolution responsibilities are unclear across functions."],
      ["F9", "Insufficient programme funding", "Funding does not cover integration, cleansing, training, process redesign, support, and benefits realisation beyond software purchase."]
    ]
  },
  circular: {
    title: "Circular supply-chain barriers",
    description: "Explore the system-wide barriers to designing products and networks for reuse, repair, refurbishment, remanufacturing, recycling, and closed-loop material flows. Use the model when the decision spans product design, commercial models, forward supply, recovery operations, and secondary markets.",
    scope: "Covers the wider circular operating model. Use Reverse logistics barriers when the focus is specifically the collection, inspection, routing, and disposition of returns.",
    factors: [
      ["F1", "Non-circular product design", "Products and packaging are not designed for durability, modular repair, disassembly, reuse, or economical material recovery."],
      ["F2", "Unpredictable recovery supply", "The timing, volume, location, ownership, and condition of products available for recovery cannot be planned reliably."],
      ["F3", "Insufficient recovery network", "Collection, consolidation, inspection, repair, remanufacturing, and recycling capacity is unavailable or poorly located."],
      ["F4", "Uncertain secondary-market demand", "Demand, price, warranty expectations, and customer acceptance for recovered products and materials are unstable."],
      ["F5", "Variable recovered-product quality", "Returned products and recovered materials have inconsistent condition, specification, contamination, and remaining useful life."],
      ["F6", "Unfavourable recovery economics", "Collection, inspection, transport, processing, yield loss, and remarketing costs exceed expected retained value."],
      ["F7", "Misaligned partner incentives", "Manufacturers, customers, service partners, recyclers, and retailers do not share responsibilities, costs, and recovered value fairly."],
      ["F8", "Unclear circular standards", "Definitions, quality grades, liability, warranty, waste status, and recycled-content rules are inconsistent or uncertain."],
      ["F9", "Limited product traceability", "Material composition, component history, ownership, repair records, and recovery status are not reliably available."]
    ]
  },
  "green-procurement": {
    title: "Green procurement barriers",
    description: "Identify barriers that prevent procurement teams from incorporating environmental requirements into specifications, tender evaluation, supplier approval, contracting, and performance review. Use the template for the sourcing process rather than for an organisation-wide sustainability transformation.",
    scope: "Focuses on environmental criteria in procurement and supplier management. Use Sustainable supply-chain implementation barriers for broader environmental and social change across the value chain.",
    factors: [
      ["F1", "Ambiguous environmental specifications", "Tender requirements do not define measurable environmental attributes, evidence standards, thresholds, or acceptable alternatives."],
      ["F2", "Incomplete supplier environmental data", "Comparable evidence on emissions, materials, energy, waste, certifications, and improvement performance is unavailable or inconsistent."],
      ["F3", "Purchase-price bias", "Evaluation focuses on acquisition price and discounts environmental benefits or costs that occur during use and end-of-life."],
      ["F4", "Weak lifecycle-cost capability", "Buyers cannot consistently evaluate energy, maintenance, consumables, disposal, carbon, and residual-value implications."],
      ["F5", "Limited buyer expertise", "Category teams lack the technical knowledge to set environmental requirements, assess evidence, and challenge unsupported claims."],
      ["F6", "Constrained qualified supply market", "Few suppliers can meet technical, commercial, service, and environmental requirements at the required scale."],
      ["F7", "Low environmental decision weight", "Environmental performance is included in policy but receives insufficient weighting in approvals, evaluation, and supplier reviews."],
      ["F8", "Weak claim verification", "Certifications, product declarations, recycled-content claims, and supplier-reported data cannot be validated consistently."]
    ]
  },
  "industry-4": {
    title: "Industry 4.0 adoption challenges",
    description: "Examine barriers to adopting connected production equipment, industrial internet of things, advanced automation, real-time process data, digital twins, and cyber-physical control in manufacturing operations. Use this template for factory and production technology transformation.",
    scope: "Focuses on connected manufacturing assets, operational technology, and shop-floor transformation. Use Digital supply-chain adoption barriers for planning systems, visibility, enterprise data, and partner connectivity.",
    factors: [
      ["F1", "Legacy equipment connectivity gaps", "Machines and control systems lack supported interfaces, sensors, or data access needed for reliable integration."],
      ["F2", "Constrained capital investment", "Funding is insufficient for equipment, connectivity, cybersecurity, integration, commissioning, training, and lifecycle support."],
      ["F3", "Operational technology skills gap", "Engineering, maintenance, operations, and IT teams lack the combined automation, data, and cyber capability required."],
      ["F4", "Cyber-physical security exposure", "Connected operational assets increase the risk that cyber incidents affect safety, quality, availability, or production continuity."],
      ["F5", "Industrial interoperability gaps", "Machines, sensors, historians, manufacturing systems, and enterprise applications use incompatible protocols and data models."],
      ["F6", "Uncertain operational return", "Benefits such as uptime, yield, flexibility, energy reduction, and labour productivity are not baselined or measured credibly."],
      ["F7", "Workforce adoption resistance", "Employees resist changed roles, monitoring, decision authority, or standard work because impacts and safeguards are unclear."],
      ["F8", "Fragmented transformation roadmap", "Use cases are selected as isolated technology pilots rather than sequenced around plant constraints and business priorities."],
      ["F9", "Vendor ecosystem dependency", "Proprietary platforms, uneven supplier maturity, and limited support options create integration and lock-in risks."]
    ]
  },
  blockchain: {
    title: "Blockchain adoption in supply chains",
    description: "Assess barriers to using a distributed ledger where multiple organisations need a shared, auditable transaction or traceability record without relying on one party's database. Use this template only after confirming that the use case genuinely requires multi-party governance and shared record integrity.",
    scope: "Focuses on distributed-ledger adoption for a defined multi-party use case. It is not a general digitalisation template and does not assume blockchain is the preferred solution.",
    factors: [
      ["F1", "Unproven distributed-ledger need", "The use case does not demonstrate why a shared ledger is preferable to governed integration, a trusted database, or existing traceability standards."],
      ["F2", "Insufficient network participation", "Critical suppliers, customers, logistics providers, regulators, or certifiers will not join, reducing record completeness and network value."],
      ["F3", "Unreliable source data", "Identifiers, sensor readings, certificates, and manual events may be inaccurate before entry, and immutability does not make them truthful."],
      ["F4", "Complex legacy integration", "The ledger cannot create value unless it connects reliably with ERP, warehouse, transport, product, identity, and partner systems."],
      ["F5", "Unresolved consortium governance", "Participants have not agreed access, validation, funding, data ownership, onboarding, upgrades, liability, or dispute resolution."],
      ["F6", "Inadequate transaction performance", "Throughput, latency, storage, availability, and transaction cost may not meet operational volume and response-time requirements."],
      ["F7", "Legal and regulatory uncertainty", "Privacy, cross-border data, electronic records, competition, sector, and contractual requirements are not resolved for all participants."],
      ["F8", "Specialist capability dependency", "Scarce internal knowledge and reliance on a small vendor ecosystem create implementation, support, and lock-in exposure."],
      ["F9", "Commercial confidentiality constraints", "Participants will not expose sensitive pricing, volumes, formulations, customer data, or supplier relationships at the required detail."]
    ]
  },
  risk: {
    title: "Supply-chain risk exposure drivers",
    description: "Explore how structural exposure drivers across suppliers, demand, capacity, logistics, quality, geopolitics, and information flows may reinforce one another before a disruption occurs. The template focuses on underlying conditions that increase likelihood or impact, not on mixing causes with outcomes such as stockouts or lost sales.",
    scope: "Use to structure sources of disruption exposure. Use Supply-chain resilience barriers when the objective is to improve preparedness, response, and recovery capability.",
    factors: [
      ["F1", "Supplier concentration exposure", "Critical requirements depend on too few approved suppliers, sites, technologies, or ownership groups, limiting substitution options."],
      ["F2", "Supplier financial fragility", "A critical supplier has weak liquidity, profitability, credit access, or investment capacity, increasing continuity exposure."],
      ["F3", "Demand volatility exposure", "Demand volume, timing, mix, or customer priority changes beyond the range supported by current planning assumptions."],
      ["F4", "Lead-time variability exposure", "Supplier production, border, transport, and receiving times fluctuate materially, reducing replenishment predictability."],
      ["F5", "Capacity inflexibility", "Internal and external capacity cannot change volume, mix, shift pattern, tooling, or routing quickly enough to absorb variation."],
      ["F6", "Logistics network concentration", "Critical flows depend on a small number of ports, routes, carriers, hubs, or transport modes with limited alternatives."],
      ["F7", "Geopolitical and trade exposure", "Supply depends on jurisdictions vulnerable to conflict, sanctions, tariffs, export controls, policy shifts, or border restrictions."],
      ["F8", "Supplier quality-control weakness", "Process control, traceability, change management, or corrective-action capability is insufficient to prevent supply interruption."],
      ["F9", "Risk information latency", "Material changes in supplier, demand, logistics, quality, or external conditions are detected or communicated too late for preventive action."]
    ]
  },
  outsourcing: {
    title: "Logistics outsourcing barriers",
    description: "Identify barriers to designing, selecting, transitioning, governing, and improving an outsourced warehousing, transport, fulfilment, or lead-logistics arrangement. Use the model to examine why the organisation may struggle to transfer operations without losing service control, data visibility, or commercial flexibility.",
    scope: "Covers the outsourcing lifecycle and provider operating model. Use AHP to rank named logistics providers when the criteria and alternatives are already defined.",
    factors: [
      ["F1", "Ambiguous service scope", "Activities, volumes, service levels, exception ownership, interfaces, and change responsibilities are not defined precisely enough for delivery or pricing."],
      ["F2", "Reduced operational control", "Decision rights, escalation access, and direct influence over labour, capacity, priorities, and daily execution become weaker after transfer."],
      ["F3", "Unverified provider capability", "Sector knowledge, site capacity, network reach, technology, labour resilience, and peak capability are not validated against realistic requirements."],
      ["F4", "Data integration difficulty", "Order, inventory, transport, billing, master-data, and event interfaces cannot exchange complete and timely information reliably."],
      ["F5", "Underestimated transition cost", "Migration, dual running, inventory transfer, systems integration, training, redundancy, stabilisation, and exit costs are omitted or understated."],
      ["F6", "Weak performance governance", "KPIs, data definitions, review cadence, root-cause ownership, service credits, and continuous-improvement processes are insufficient."],
      ["F7", "Provider dependency exposure", "Concentration, proprietary processes, data portability limits, and high switching costs reduce leverage and exit flexibility."],
      ["F8", "Operating-model misalignment", "The client and provider differ in planning routines, decision speed, risk appetite, communication, and continuous-improvement expectations."],
      ["F9", "Third-party data exposure", "Customer, employee, pricing, shipment, and operational data is accessed or stored outside the organisation without adequate controls."]
    ]
  },
  "last-mile": {
    title: "Last-mile delivery challenges",
    description: "Explore operational conditions that drive last-mile cost, capacity pressure, delivery reliability, and customer experience across a defined service region. The factors are framed as controllable or observable drivers, rather than outcomes such as the failed-delivery rate itself.",
    scope: "Use for parcel, retail, grocery, service-parts, or direct-to-customer delivery networks. Adapt factors to the service promise, geography, fleet model, and delivery channel.",
    factors: [
      ["F1", "Low delivery density", "Stops are dispersed across the service area, increasing distance, travel time, vehicle use, and cost per successful delivery."],
      ["F2", "Recipient availability uncertainty", "The likelihood that a recipient or secure delivery option is available is unknown, increasing the risk of an unsuccessful first attempt."],
      ["F3", "Urban access constraints", "Congestion, parking limits, restricted zones, building access, and loading rules reduce route productivity and schedule reliability."],
      ["F4", "Peak-volume volatility", "Daily, weekly, promotional, and seasonal volume peaks exceed normal route, depot, vehicle, or labour capacity."],
      ["F5", "Poor address and instruction data", "Incomplete addresses, access codes, contact details, geocodes, or delivery instructions create avoidable search time and exceptions."],
      ["F6", "Limited execution visibility", "Dispatchers and customers lack timely vehicle, stop, capacity, and exception status needed to adjust plans or expectations."],
      ["F7", "Constrained driver capacity", "Recruitment, retention, skills, legal hours, scheduling, and subcontractor availability limit reliable delivery capacity."],
      ["F8", "Rigid delivery-window design", "Narrow or poorly allocated delivery windows create route inefficiency and increase the chance that actual arrival does not match customer availability."],
      ["F9", "Emissions operating constraints", "Emission zones, carbon targets, noise restrictions, and fleet-transition requirements constrain vehicle and route choices."]
    ]
  },
  inventory: {
    title: "Inventory management barriers",
    description: "Identify the planning, data, policy, supplier, and governance barriers that prevent inventory from meeting service requirements at an appropriate working-capital level. Use the model to understand why replenishment controls perform poorly across a portfolio, not to calculate one item's stock parameters.",
    scope: "Covers system-level inventory management barriers. Use ABC Analysis, EOQ, or Safety Stock and Reorder Point for item-level quantitative decisions.",
    factors: [
      ["F1", "Limited demand visibility", "Future demand, promotions, product changes, customer priorities, and demand drivers are not visible at the level needed for replenishment."],
      ["F2", "Inaccurate inventory records", "System balances differ from physical, available, quality-approved, or correctly located stock, causing false planning signals."],
      ["F3", "Extended replenishment lead time", "Long sourcing, production, transport, inspection, and approval times require earlier commitment and more exposure to forecast error."],
      ["F4", "Unstable replenishment lead time", "Actual replenishment time varies materially from the planning parameter, making reorder timing and safety stock unreliable."],
      ["F5", "Weak item segmentation", "Items with different value, demand variability, criticality, lifecycle, and lead-time characteristics use the same planning policy."],
      ["F6", "Undefined service targets", "Availability, fill-rate, response-time, and customer-priority targets are not set by item segment or business need."],
      ["F7", "Outdated planning parameters", "Safety stock, reorder points, order quantities, lead times, pack sizes, and review rules are not recalculated when conditions change."],
      ["F8", "Unreliable supplier performance", "Confirmed quantity, delivery timing, quality, and communication performance differs repeatedly from planning assumptions."],
      ["F9", "Fragmented inventory accountability", "Sales, planning, procurement, operations, finance, and service teams optimise conflicting objectives without shared policy ownership."]
    ]
  },
  "reverse-logistics": {
    title: "Reverse logistics barriers",
    description: "Examine operational barriers affecting product returns from authorisation and collection through inspection, disposition, repair, resale, recycling, and final credit. Use the model to improve the reverse flow and value-recovery process for an existing return stream.",
    scope: "Focuses on execution of returns and recovery flows. Use Circular supply-chain barriers when the question includes product design, commercial models, forward supply, and secondary markets.",
    factors: [
      ["F1", "Unpredictable return flow", "Return timing, volume, location, product mix, reason, and condition vary, making labour, transport, and recovery capacity difficult to plan."],
      ["F2", "Inconsistent return authorisation", "Eligibility, evidence, customer instruction, routing, credit, and exception decisions differ across channels and teams."],
      ["F3", "Insufficient collection coverage", "Customers lack convenient, economical, and traceable channels for returning products to the correct recovery location."],
      ["F4", "Delayed inspection and grading", "Returned items wait too long for identity, condition, fault, warranty, safety, and recoverable-value assessment."],
      ["F5", "Ambiguous disposition rules", "Repair, restock, refurbish, return-to-vendor, harvest, recycle, donate, and dispose decisions are not consistently defined."],
      ["F6", "Limited return-status visibility", "Customers and operations cannot see authorisation, movement, inspection, disposition, credit, or recovered-inventory status."],
      ["F7", "High reverse-processing cost", "Collection, transport, handling, inspection, repair, administration, and write-off costs consume recoverable value."],
      ["F8", "Fragmented partner coordination", "Retailers, carriers, warehouses, repairers, suppliers, recyclers, and finance teams use disconnected handoffs and data."],
      ["F9", "Uncertain recovered-value demand", "Demand, price, warranty acceptance, and channel access for repaired products, parts, and recovered materials are unstable."]
    ]
  },
  "cold-chain": {
    title: "Cold-chain implementation barriers",
    description: "Identify barriers to maintaining product temperature, traceability, remaining shelf life, and compliant handling from origin through storage, transport, handovers, and final receipt. Use the model for a defined product family, temperature range, lane, and regulatory context.",
    scope: "Covers temperature-controlled product integrity and continuity. Define the product, required temperature range, lane, handovers, and excursion rules before confirming relationships.",
    factors: [
      ["F1", "Insufficient controlled infrastructure", "Qualified cold rooms, staging areas, vehicles, containers, power backup, and handling capacity are unavailable at required nodes and volumes."],
      ["F2", "Inadequate thermal packaging", "Packaging configuration and coolant duration are not validated for product, lane, season, delays, and worst-case exposure."],
      ["F3", "Incomplete temperature monitoring", "Temperature is not measured, associated with the shipment, and retained across storage, transport, handover, and receipt."],
      ["F4", "Inconsistent handling compliance", "Preconditioning, loading, door-open time, segregation, handover, and receiving procedures vary between people, shifts, and partners."],
      ["F5", "Unreliable refrigeration equipment", "Refrigeration, sensors, alarms, power, and backup systems are not maintained or proven sufficiently for continuous operation."],
      ["F6", "Uneven partner cold-chain capability", "Suppliers, carriers, hubs, customs agents, and receiving sites differ in qualification, training, equipment, and control maturity."],
      ["F7", "Excessive lane exposure time", "Long transit, customs delay, multiple handovers, dwell time, and weak contingency routing consume thermal protection and shelf life."],
      ["F8", "Slow excursion response", "Alarms, quarantine, product assessment, escalation, rerouting, and replacement decisions do not occur within defined response times."],
      ["F9", "Volatile demand", "Demand changes beyond forecast and replenishment assumptions, increasing expiry, emergency shipment, and availability risk."],
      ["F10", "Limited remaining shelf life", "Product arrives with insufficient usable life because production age, transit time, release delay, or stock rotation is not controlled."]
    ]
  }
};

const { relationshipKey } = ATHIsm;

function setFromIndexes(indexes, factors) {
  return indexes.map((index) => factors[index].code);
}

globalThis.ISMCore = ATHIsm;

if (typeof document !== "undefined") {
  const elements = {
    problemSelect: document.getElementById("problemSelect"),
    loadTemplateButton: document.getElementById("loadTemplateButton"),
    resetToolButton: document.getElementById("resetToolButton"),
    problemTitle: document.getElementById("problemTitle"),
    problemDescription: document.getElementById("problemDescription"),
    suggestedFactorsNote: document.getElementById("suggestedFactorsNote"),
    templateScopeNote: document.getElementById("templateScopeNote"),
    templateScopeText: document.getElementById("templateScopeText"),
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
      elements.templateScopeNote.hidden = true;
      elements.templateScopeText.textContent = "";
      factors = [makeFactor("F1"), makeFactor("F2")];
    } else {
      const template = problemTemplates[templateKey];
      if (!template) return;
      elements.problemTitle.value = template.title;
      elements.problemDescription.value = template.description;
      elements.suggestedFactorsNote.hidden = false;
      elements.templateScopeText.textContent = template.scope;
      elements.templateScopeNote.hidden = false;
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
        <label class="factor-field factor-name">
          Factor name
          <textarea rows="2" maxlength="100" data-factor-field="name" aria-label="Factor ${index + 1} name">${escapeHtml(factor.name)}</textarea>
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
        description: elements.problemDescription.value.trim(),
        scope: elements.templateScopeNote.hidden ? "" : elements.templateScopeText.textContent.trim()
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
    const templateScope = activeTemplateKey in problemTemplates
      ? problemTemplates[activeTemplateKey].scope
      : String(data.problem.scope || "").slice(0, 400);
    elements.templateScopeText.textContent = templateScope;
    elements.templateScopeNote.hidden = !templateScope;
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
    elements.templateScopeText.textContent = multiLevelDemonstration.scope;
    elements.templateScopeNote.hidden = false;
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
    rows.push(["Template scope", elements.templateScopeNote.hidden ? "" : elements.templateScopeText.textContent.trim()]);
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
    const initial = ATHIsm.buildInitialMatrix(factors, relationships);
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
    results = ATHIsm.analyzeModel(factors, relationships);
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

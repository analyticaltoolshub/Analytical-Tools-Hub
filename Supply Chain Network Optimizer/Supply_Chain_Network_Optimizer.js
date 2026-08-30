(function initialiseNetworkTool() {
  "use strict";

  const core = window.ATHSupplyChainNetwork;
  const diagnosticsRenderer = window.ATHDiagnostics;
  const formatCurrency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  const formatNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

  const sampleFacilities = [
    { name: "Midlands DC", latitude: 52.4862, longitude: -1.8904, capacity: 5200, fixedCost: 32000 },
    { name: "Northern DC", latitude: 53.4808, longitude: -2.2426, capacity: 3600, fixedCost: 24000 },
    { name: "Southern DC", latitude: 51.5072, longitude: -0.1276, capacity: 4200, fixedCost: 30000 },
    { name: "Western DC", latitude: 51.4545, longitude: -2.5879, capacity: 2400, fixedCost: 18000 },
  ];

  const sampleCustomers = [
    { name: "London Region", latitude: 51.5072, longitude: -0.1276, demand: 2600, currentFacility: "Southern DC" },
    { name: "Birmingham Region", latitude: 52.4862, longitude: -1.8904, demand: 2100, currentFacility: "Midlands DC" },
    { name: "Manchester Region", latitude: 53.4808, longitude: -2.2426, demand: 1900, currentFacility: "Northern DC" },
    { name: "Leeds Region", latitude: 53.8008, longitude: -1.5491, demand: 1300, currentFacility: "Northern DC" },
    { name: "Bristol Region", latitude: 51.4545, longitude: -2.5879, demand: 1200, currentFacility: "Southern DC" },
    { name: "Cardiff Region", latitude: 51.4816, longitude: -3.1791, demand: 800, currentFacility: "Midlands DC" },
  ];

  const state = {
    facilities: [],
    customers: [],
    routeDistances: [],
    result: null,
    map: null,
    mapLayer: null,
    mapControls: {
      showFacilityLabels: true,
      showDemandLabels: true,
      showFlowVolumes: true,
      showRouteCosts: false,
      lineThicknessMode: "flow",
    },
  };

  const selectors = {
    transportCost: document.getElementById("transportCost"),
    facilityBody: document.querySelector("#facilityTable tbody"),
    customerBody: document.querySelector("#customerTable tbody"),
    importStatus: document.getElementById("importStatus"),
    csvFile: document.getElementById("csvFile"),
    routeDistanceFile: document.getElementById("routeDistanceFile"),
    routeDistanceStatus: document.getElementById("routeDistanceStatus"),
    errorMessage: document.getElementById("errorMessage"),
    results: document.getElementById("results"),
    mapSection: document.getElementById("network-map-section"),
    kpiGrid: document.getElementById("kpiGrid"),
    comparisonGrid: document.getElementById("comparisonGrid"),
    interpretationPanel: document.getElementById("interpretationPanel"),
    allocationBody: document.querySelector("#allocationTable tbody"),
    mapElement: document.getElementById("networkMap"),
    fallback: document.getElementById("mapFallback"),
    mapDetails: document.getElementById("mapDetails"),
    showFacilityLabels: document.getElementById("showFacilityLabels"),
    showDemandLabels: document.getElementById("showDemandLabels"),
    showFlowVolumes: document.getElementById("showFlowVolumes"),
    showRouteCosts: document.getElementById("showRouteCosts"),
    lineThicknessMode: document.getElementById("lineThicknessMode"),
  };

  function setWorkflow(step) {
    document.querySelectorAll("[data-workflow-step]").forEach((item) => {
      const active = item.dataset.workflowStep === String(step);
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function makeInput(value, type = "text", step = "any") {
    const input = document.createElement("input");
    input.type = type;
    input.step = step;
    input.value = value ?? "";
    return input;
  }

  function renderEditableTables() {
    selectors.facilityBody.textContent = "";
    state.facilities.forEach((facility, index) => {
      const row = document.createElement("tr");
      [
        makeInput(facility.name),
        makeInput(facility.latitude, "number", "0.0001"),
        makeInput(facility.longitude, "number", "0.0001"),
        makeInput(facility.capacity, "number", "1"),
        makeInput(facility.fixedCost, "number", "1"),
      ].forEach((input) => {
        input.addEventListener("input", syncStateFromTables);
        const cell = document.createElement("td");
        cell.appendChild(input);
        row.appendChild(cell);
      });
      const removeCell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "remove-row";
      button.textContent = "X";
      button.setAttribute("aria-label", `Remove ${facility.name || `facility ${index + 1}`}`);
      button.addEventListener("click", () => {
        state.facilities.splice(index, 1);
        renderEditableTables();
      });
      removeCell.appendChild(button);
      row.appendChild(removeCell);
      selectors.facilityBody.appendChild(row);
    });

    selectors.customerBody.textContent = "";
    state.customers.forEach((customer, index) => {
      const row = document.createElement("tr");
      [
        makeInput(customer.name),
        makeInput(customer.latitude, "number", "0.0001"),
        makeInput(customer.longitude, "number", "0.0001"),
        makeInput(customer.demand, "number", "1"),
        makeInput(customer.currentFacility),
      ].forEach((input) => {
        input.addEventListener("input", syncStateFromTables);
        const cell = document.createElement("td");
        cell.appendChild(input);
        row.appendChild(cell);
      });
      const removeCell = document.createElement("td");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "remove-row";
      button.textContent = "X";
      button.setAttribute("aria-label", `Remove ${customer.name || `customer ${index + 1}`}`);
      button.addEventListener("click", () => {
        state.customers.splice(index, 1);
        renderEditableTables();
      });
      removeCell.appendChild(button);
      row.appendChild(removeCell);
      selectors.customerBody.appendChild(row);
    });
  }

  function syncStateFromTables() {
    state.facilities = [...selectors.facilityBody.querySelectorAll("tr")].map((row) => {
      const inputs = row.querySelectorAll("input");
      return { name: inputs[0].value, latitude: inputs[1].value, longitude: inputs[2].value, capacity: inputs[3].value, fixedCost: inputs[4].value };
    });
    state.customers = [...selectors.customerBody.querySelectorAll("tr")].map((row) => {
      const inputs = row.querySelectorAll("input");
      return { name: inputs[0].value, latitude: inputs[1].value, longitude: inputs[2].value, demand: inputs[3].value, currentFacility: inputs[4].value };
    });
  }

  function showError(message) {
    selectors.errorMessage.hidden = false;
    selectors.errorMessage.textContent = message;
  }

  function clearError() {
    selectors.errorMessage.hidden = true;
    selectors.errorMessage.textContent = "";
  }

  function renderKpis(result) {
    const { summary } = result;
    const kpis = [
      ["Total optimized cost", formatCurrency.format(summary.totalOptimizedCost)],
      ["Transport cost", formatCurrency.format(summary.transportCost)],
      ["Facility cost", formatCurrency.format(summary.facilityCost)],
      ["Average distance", `${formatNumber.format(summary.averageDistanceKm)} km`],
      ["Capacity utilization", `${formatNumber.format(summary.capacityUtilization * 100)}%`],
      ["Unmet demand", formatNumber.format(summary.unmetDemand)],
    ];
    selectors.kpiGrid.textContent = "";
    kpis.forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "kpi-card";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      card.append(labelNode, valueNode);
      selectors.kpiGrid.appendChild(card);
    });
  }

  function renderComparison(result) {
    selectors.comparisonGrid.textContent = "";
    const rows = [
      ["Optimized network", formatCurrency.format(result.summary.totalOptimizedCost), `${result.summary.openFacilities.length} open facilities`],
    ];
    if (result.current) {
      rows.unshift(["Current network", formatCurrency.format(result.current.totalCost), `${result.current.openFacilities.length} assigned facilities`]);
      rows.push(["Estimated savings", formatCurrency.format(result.summary.savings), `${formatNumber.format(result.summary.savingsPercent * 100)}%`]);
    } else {
      rows.push(["Current network", "Not provided", "Add current facility names for comparison"]);
    }
    rows.forEach(([label, value, note]) => {
      const card = document.createElement("article");
      card.className = "comparison-card";
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.textContent = value;
      const noteNode = document.createElement("p");
      noteNode.textContent = note;
      card.append(labelNode, valueNode, noteNode);
      selectors.comparisonGrid.appendChild(card);
    });
  }

  function renderInterpretation(result) {
    const open = result.summary.openFacilities.join(", ");
    const savings = result.summary.savings === null
      ? "No current assignment was provided, so the result is an optimized baseline rather than a savings estimate."
      : `Compared with the current assignment, the optimized network reduces estimated cost by ${formatCurrency.format(result.summary.savings)} (${formatNumber.format(result.summary.savingsPercent * 100)}%).`;
    selectors.interpretationPanel.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = "Management interpretation: ";
    selectors.interpretationPanel.append(strong, `The model opens ${open} and allocates ${formatNumber.format(result.summary.totalDemand)} units of demand while using ${formatNumber.format(result.summary.capacityUtilization * 100)}% of open capacity. ${savings} Review operational constraints such as service times, route reliability, and resilience before implementation.`);
  }

  function renderAllocations(result) {
    selectors.allocationBody.textContent = "";
    result.optimized.allocations
      .sort((a, b) => a.facility.localeCompare(b.facility) || a.customer.localeCompare(b.customer))
      .forEach((allocation) => {
        const row = document.createElement("tr");
        [
          allocation.facility,
          allocation.customer,
          formatNumber.format(allocation.flow),
          formatNumber.format(allocation.distanceKm),
          allocation.distanceSource === "uploaded" ? "Uploaded route matrix" : "Straight-line fallback",
          formatCurrency.format(allocation.transportCost),
        ].forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        selectors.allocationBody.appendChild(row);
      });
  }

  function detailText(title, details) {
    selectors.mapDetails.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = `${title}: `;
    selectors.mapDetails.append(strong, details);
  }

  function mapIcon(type) {
    const isFacility = type === "facility";
    return L.divIcon({
      className: `network-map-marker ${isFacility ? "facility-map-marker" : "customer-map-marker"}`,
      html: `<span aria-hidden="true"></span>`,
      iconSize: [28, 28],
      iconAnchor: isFacility ? [19, 19] : [9, 9],
      popupAnchor: isFacility ? [-5, -18] : [8, -10],
    });
  }

  function routeWeight(allocation, result) {
    if (state.mapControls.lineThicknessMode === "uniform") return 4;
    const basis = state.mapControls.lineThicknessMode === "cost" ? allocation.transportCost : allocation.flow;
    const values = result.optimized.allocations.map((item) => state.mapControls.lineThicknessMode === "cost" ? item.transportCost : item.flow);
    const maxValue = Math.max(...values, 1);
    return Math.max(2.5, Math.min(9, 2.5 + (basis / maxValue) * 6));
  }

  function bindMapLabel(marker, label, type) {
    marker.bindTooltip(escapeHtml(label), {
      permanent: true,
      direction: type === "facility" ? "top" : "bottom",
      offset: type === "facility" ? [0, -12] : [0, 12],
      className: `network-point-label ${type}-point-label`,
    });
  }

  function addRouteLabel(allocation, facility, customer) {
    const parts = [];
    if (state.mapControls.showFlowVolumes) parts.push(`${formatNumber.format(allocation.flow)} units`);
    if (state.mapControls.showRouteCosts) parts.push(formatCurrency.format(allocation.transportCost));
    if (!parts.length) return;
    const midpoint = [
      (facility.latitude + customer.latitude) / 2,
      (facility.longitude + customer.longitude) / 2,
    ];
    const label = L.marker(midpoint, {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "route-map-label",
        html: `<span>${escapeHtml(parts.join(" | "))}</span>`,
        iconSize: [128, 28],
        iconAnchor: [64, 14],
      }),
    });
    label.addTo(state.mapLayer);
  }

  function renderLeafletMap(result) {
    if (!window.L) return false;
    selectors.fallback.hidden = true;
    selectors.mapElement.hidden = false;
    if (!state.map) {
      state.map = L.map(selectors.mapElement, { scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(state.map);
    }
    if (state.mapLayer) state.mapLayer.remove();
    state.mapLayer = L.layerGroup().addTo(state.map);
    const bounds = [];
    result.facilities.forEach((facility, index) => {
      const use = result.summary.facilityUse[index] || 0;
      const marker = L.marker([facility.latitude, facility.longitude], {
        icon: mapIcon("facility"),
        title: `${facility.name} facility`,
        keyboard: true,
        zIndexOffset: 500,
      });
      marker.bindPopup(`<strong>${escapeHtml(facility.name)}</strong><br>Capacity: ${formatNumber.format(facility.capacity)}<br>Utilization: ${formatNumber.format(use / facility.capacity * 100)}%<br>Fixed cost: ${formatCurrency.format(facility.fixedCost)}`);
      marker.on("click", () => detailText(facility.name, `capacity ${formatNumber.format(facility.capacity)}, optimized flow ${formatNumber.format(use)}, utilization ${formatNumber.format(use / facility.capacity * 100)}%, fixed cost ${formatCurrency.format(facility.fixedCost)}.`));
      if (state.mapControls.showFacilityLabels) bindMapLabel(marker, facility.name, "facility");
      marker.addTo(state.mapLayer);
      bounds.push([facility.latitude, facility.longitude]);
    });
    result.customers.forEach((customer) => {
      const marker = L.marker([customer.latitude, customer.longitude], {
        icon: mapIcon("customer"),
        title: `${customer.name} demand point`,
        keyboard: true,
        zIndexOffset: 650,
      });
      marker.bindPopup(`<strong>${escapeHtml(customer.name)}</strong><br>Demand: ${formatNumber.format(customer.demand)}`);
      marker.on("click", () => detailText(customer.name, `demand ${formatNumber.format(customer.demand)} units.`));
      if (state.mapControls.showDemandLabels) bindMapLabel(marker, customer.name, "customer");
      marker.addTo(state.mapLayer);
      bounds.push([customer.latitude, customer.longitude]);
    });
    result.optimized.allocations.forEach((allocation) => {
      const facility = result.facilities[allocation.facilityIndex];
      const customer = result.customers[allocation.customerIndex];
      const route = L.polyline([[facility.latitude, facility.longitude], [customer.latitude, customer.longitude]], {
        color: "#1f6feb",
        weight: routeWeight(allocation, result),
        opacity: .68,
      });
      const distanceSourceLabel = allocation.distanceSource === "uploaded" ? "uploaded route matrix" : "straight-line fallback";
      route.bindPopup(`<strong>${escapeHtml(facility.name)} to ${escapeHtml(customer.name)}</strong><br>Flow: ${formatNumber.format(allocation.flow)}<br>Distance: ${formatNumber.format(allocation.distanceKm)} km (${distanceSourceLabel})<br>Cost: ${formatCurrency.format(allocation.transportCost)}`);
      route.on("click", () => detailText(`${facility.name} to ${customer.name}`, `flow ${formatNumber.format(allocation.flow)}, distance ${formatNumber.format(allocation.distanceKm)} km (${distanceSourceLabel}), transport cost ${formatCurrency.format(allocation.transportCost)}.`));
      route.addTo(state.mapLayer);
      addRouteLabel(allocation, facility, customer);
    });
    if (bounds.length) state.map.fitBounds(bounds, { padding: [24, 24] });
    setTimeout(() => state.map.invalidateSize(), 50);
    return true;
  }

  function renderFallbackMap(result) {
    selectors.mapElement.hidden = true;
    selectors.fallback.hidden = false;
    const allPoints = [...result.facilities, ...result.customers];
    const minLat = Math.min(...allPoints.map((point) => point.latitude));
    const maxLat = Math.max(...allPoints.map((point) => point.latitude));
    const minLon = Math.min(...allPoints.map((point) => point.longitude));
    const maxLon = Math.max(...allPoints.map((point) => point.longitude));
    const x = (lon) => 60 + ((lon - minLon) / Math.max(.0001, maxLon - minLon)) * 760;
    const y = (lat) => 340 - ((lat - minLat) / Math.max(.0001, maxLat - minLat)) * 280;
    selectors.fallback.textContent = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 880 390");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Fallback network map showing optimized routes");
    result.optimized.allocations.forEach((allocation) => {
      const facility = result.facilities[allocation.facilityIndex];
      const customer = result.customers[allocation.customerIndex];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x(facility.longitude));
      line.setAttribute("y1", y(facility.latitude));
      line.setAttribute("x2", x(customer.longitude));
      line.setAttribute("y2", y(customer.latitude));
      line.setAttribute("stroke-width", String(Math.max(2, Math.min(8, allocation.flow / 500))));
      line.classList.add("route-line");
      svg.appendChild(line);
    });
    result.facilities.forEach((facility, index) => {
      const use = result.summary.facilityUse[index] || 0;
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `${facility.name} facility details`);
      group.addEventListener("click", () => detailText(facility.name, `capacity ${formatNumber.format(facility.capacity)}, optimized flow ${formatNumber.format(use)}, utilization ${formatNumber.format(use / facility.capacity * 100)}%.`));
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x(facility.longitude));
      circle.setAttribute("cy", y(facility.latitude));
      circle.setAttribute("r", "10");
      circle.classList.add("facility-node");
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x(facility.longitude) + 14);
      label.setAttribute("y", y(facility.latitude) + 4);
      label.classList.add("map-label");
      label.textContent = facility.name;
      group.append(circle, label);
      svg.appendChild(group);
    });
    result.customers.forEach((customer) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x(customer.longitude));
      circle.setAttribute("cy", y(customer.latitude));
      circle.setAttribute("r", "7");
      circle.classList.add("customer-node");
      svg.appendChild(circle);
    });
    selectors.fallback.appendChild(svg);
  }

  function renderMap(result) {
    if (!renderLeafletMap(result)) renderFallbackMap(result);
  }

  function syncMapControls() {
    state.mapControls.showFacilityLabels = selectors.showFacilityLabels.checked;
    state.mapControls.showDemandLabels = selectors.showDemandLabels.checked;
    state.mapControls.showFlowVolumes = selectors.showFlowVolumes.checked;
    state.mapControls.showRouteCosts = selectors.showRouteCosts.checked;
    state.mapControls.lineThicknessMode = selectors.lineThicknessMode.value;
    if (state.result && !selectors.mapSection.hidden) renderMap(state.result);
  }

  function renderResults(result) {
    state.result = result;
    selectors.results.hidden = false;
    selectors.mapSection.hidden = false;
    renderKpis(result);
    renderComparison(result);
    renderInterpretation(result);
    renderAllocations(result);
    renderMap(result);
    setWorkflow(4);
  }

  function runOptimization() {
    clearError();
    syncStateFromTables();
    setWorkflow(2);
    try {
      const result = core.optimizeNetwork({
        facilities: state.facilities,
        customers: state.customers,
        transportCostPerUnitKm: selectors.transportCost.value,
        routeDistances: state.routeDistances,
      });
      diagnosticsRenderer?.render("#networkDiagnostics", result.diagnostics, { heading: "Network Diagnostics" });
      if (!result.feasible) {
        selectors.results.hidden = true;
        selectors.mapSection.hidden = true;
        showError(result.error || "The entered network is not feasible.");
        return;
      }
      setWorkflow(3);
      renderResults(result);
    } catch (error) {
      selectors.results.hidden = true;
      selectors.mapSection.hidden = true;
      diagnosticsRenderer?.render("#networkDiagnostics", core.diagnoseNetwork({
        facilities: state.facilities,
        customers: state.customers,
        transportCostPerUnitKm: selectors.transportCost.value,
        routeDistances: state.routeDistances,
      }), { heading: "Network Diagnostics" });
      showError(error.message);
    }
  }

  function quoteCsv(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    if (!state.result?.feasible) {
      showError("Run a feasible optimization before exporting results.");
      return;
    }
    const result = state.result;
    const lines = [
      ["Section", "Metric", "Value"].map(quoteCsv).join(","),
      ["Metadata", "Generated", new Date().toISOString()].map(quoteCsv).join(","),
      ["Metadata", "Method", "Exact open-facility enumeration with min-cost flow allocation"].map(quoteCsv).join(","),
      ["Metadata", "Distance source", result.distanceSource].map(quoteCsv).join(","),
      ["Metadata", "Uploaded distance lanes", result.distanceSummary.uploadedLaneCount].map(quoteCsv).join(","),
      ["Metadata", "Straight-line fallback lanes", result.distanceSummary.haversineLaneCount].map(quoteCsv).join(","),
      ["Summary", "Total optimized cost", result.summary.totalOptimizedCost].map(quoteCsv).join(","),
      ["Summary", "Transport cost", result.summary.transportCost].map(quoteCsv).join(","),
      ["Summary", "Facility cost", result.summary.facilityCost].map(quoteCsv).join(","),
      ["Summary", "Average distance km", result.summary.averageDistanceKm].map(quoteCsv).join(","),
      ["Summary", "Capacity utilization", result.summary.capacityUtilization].map(quoteCsv).join(","),
      ["Summary", "Current cost", result.summary.currentCost ?? ""].map(quoteCsv).join(","),
      ["Summary", "Savings", result.summary.savings ?? ""].map(quoteCsv).join(","),
      "",
      ["Facility", "Customer", "Flow", "Distance km", "Distance source", "Transport cost"].map(quoteCsv).join(","),
      ...result.optimized.allocations.map((allocation) => [
        allocation.facility,
        allocation.customer,
        allocation.flow,
        allocation.distanceKm,
        allocation.distanceSource,
        allocation.transportCost,
      ].map(quoteCsv).join(",")),
      "",
      ["Diagnostics"].map(quoteCsv).join(","),
      ...(diagnosticsRenderer?.summarize(result.diagnostics) || []).map((item) => [item].map(quoteCsv).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ath-supply-chain-network-optimization.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function loadSample() {
    state.facilities = structuredClone(sampleFacilities);
    state.customers = structuredClone(sampleCustomers);
    state.routeDistances = [];
    selectors.transportCost.value = "0.035";
    selectors.importStatus.textContent = "Sample network loaded. Review and edit the facility, customer, and cost assumptions before using the result.";
    selectors.routeDistanceStatus.textContent = "No distance matrix uploaded. Straight-line distance will be used.";
    selectors.routeDistanceFile.value = "";
    clearError();
    renderEditableTables();
    setWorkflow(1);
  }

  function resetTool() {
    state.facilities = [];
    state.customers = [];
    state.routeDistances = [];
    state.result = null;
    selectors.results.hidden = true;
    selectors.mapSection.hidden = true;
    selectors.importStatus.textContent = "";
    selectors.csvFile.value = "";
    selectors.routeDistanceFile.value = "";
    selectors.routeDistanceStatus.textContent = "No distance matrix uploaded. Straight-line distance will be used.";
    selectors.transportCost.value = "0.035";
    clearError();
    diagnosticsRenderer?.render("#networkDiagnostics", []);
    renderEditableTables();
    setWorkflow(1);
  }

  function importCsv() {
    const file = selectors.csvFile.files?.[0];
    if (!file) {
      selectors.importStatus.textContent = "Choose a CSV file before importing.";
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 1024 * 1024) {
      showError("Use a CSV file up to 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = core.parseNetworkCsv(String(reader.result || ""));
        state.facilities = parsed.facilities;
        state.customers = parsed.customers;
        renderEditableTables();
        selectors.importStatus.textContent = `${parsed.facilities.length} facilities and ${parsed.customers.length} customers imported.`;
        clearError();
        setWorkflow(1);
      } catch (error) {
        showError(error.message);
      }
    };
    reader.readAsText(file);
  }

  function importRouteDistances() {
    const file = selectors.routeDistanceFile.files?.[0];
    if (!file) {
      selectors.routeDistanceStatus.textContent = "Choose a route distance CSV before importing.";
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 1024 * 1024) {
      showError("Use a route distance CSV file up to 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.routeDistances = core.parseRouteDistanceCsv(String(reader.result || ""));
        selectors.routeDistanceStatus.textContent = `${state.routeDistances.length} route distance lane${state.routeDistances.length === 1 ? "" : "s"} imported. Run Optimize Network to apply matching uploaded distances.`;
        clearError();
      } catch (error) {
        state.routeDistances = [];
        selectors.routeDistanceStatus.textContent = "No valid distance matrix loaded.";
        showError(error.message);
      }
    };
    reader.readAsText(file);
  }

  document.getElementById("loadSampleButton").addEventListener("click", loadSample);
  document.getElementById("resetButton").addEventListener("click", resetTool);
  document.getElementById("addFacilityButton").addEventListener("click", () => {
    syncStateFromTables();
    state.facilities.push({ name: `Facility ${state.facilities.length + 1}`, latitude: "", longitude: "", capacity: "", fixedCost: "" });
    renderEditableTables();
  });
  document.getElementById("addCustomerButton").addEventListener("click", () => {
    syncStateFromTables();
    state.customers.push({ name: `Customer ${state.customers.length + 1}`, latitude: "", longitude: "", demand: "", currentFacility: "" });
    renderEditableTables();
  });
  document.getElementById("importCsvButton").addEventListener("click", importCsv);
  document.getElementById("importRouteDistanceButton").addEventListener("click", importRouteDistances);
  document.getElementById("optimizeButton").addEventListener("click", runOptimization);
  document.getElementById("exportCsvButton").addEventListener("click", exportCsv);
  [
    selectors.showFacilityLabels,
    selectors.showDemandLabels,
    selectors.showFlowVolumes,
    selectors.showRouteCosts,
    selectors.lineThicknessMode,
  ].forEach((control) => control.addEventListener("change", syncMapControls));

  renderEditableTables();
}());

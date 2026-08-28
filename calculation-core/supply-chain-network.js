(function initialiseSupplyChainNetwork(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ATHSupplyChainNetwork = api;
}(typeof globalThis !== "undefined" ? globalThis : window, function supplyChainNetworkFactory() {
  "use strict";

  const EARTH_RADIUS_KM = 6371;
  const EPSILON = 1e-7;

  function toNumber(value, label) {
    if (value === null || value === undefined || String(value).trim() === "") {
      throw new Error(`${label} is required.`);
    }
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${label} must be a valid number.`);
    return number;
  }

  function cleanName(value, fallback) {
    return String(value || fallback || "").trim();
  }

  function normaliseFacilities(facilities) {
    if (!Array.isArray(facilities) || facilities.length < 1) throw new Error("Add at least one facility.");
    const names = new Set();
    return facilities.map((facility, index) => {
      const name = cleanName(facility.name || facility.location, `Facility ${index + 1}`);
      if (names.has(name.toLowerCase())) throw new Error(`Facility names must be unique. Duplicate: ${name}.`);
      names.add(name.toLowerCase());
      const latitude = toNumber(facility.latitude, `${name} latitude`);
      const longitude = toNumber(facility.longitude, `${name} longitude`);
      const capacity = toNumber(facility.capacity, `${name} capacity`);
      const fixedCost = toNumber(facility.fixedCost, `${name} fixed cost`);
      if (latitude < -90 || latitude > 90) throw new Error(`${name} latitude must be between -90 and 90.`);
      if (longitude < -180 || longitude > 180) throw new Error(`${name} longitude must be between -180 and 180.`);
      if (capacity < 0) throw new Error(`${name} capacity cannot be negative.`);
      if (fixedCost < 0) throw new Error(`${name} fixed cost cannot be negative.`);
      return { id: `F${index + 1}`, name, latitude, longitude, capacity, fixedCost };
    });
  }

  function normaliseCustomers(customers) {
    if (!Array.isArray(customers) || customers.length < 1) throw new Error("Add at least one customer or demand point.");
    const names = new Set();
    return customers.map((customer, index) => {
      const name = cleanName(customer.name || customer.location, `Customer ${index + 1}`);
      if (names.has(name.toLowerCase())) throw new Error(`Customer names must be unique. Duplicate: ${name}.`);
      names.add(name.toLowerCase());
      const latitude = toNumber(customer.latitude, `${name} latitude`);
      const longitude = toNumber(customer.longitude, `${name} longitude`);
      const demand = toNumber(customer.demand, `${name} demand`);
      if (latitude < -90 || latitude > 90) throw new Error(`${name} latitude must be between -90 and 90.`);
      if (longitude < -180 || longitude > 180) throw new Error(`${name} longitude must be between -180 and 180.`);
      if (demand < 0) throw new Error(`${name} demand cannot be negative.`);
      return { id: `C${index + 1}`, name, latitude, longitude, demand, currentFacility: cleanName(customer.currentFacility, "") };
    });
  }

  function haversineKm(a, b) {
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
  }

  function buildDistanceMatrix(facilities, customers, transportCostPerUnitKm) {
    return facilities.map((facility) => customers.map((customer) => {
      const distanceKm = haversineKm(facility, customer);
      return { distanceKm, unitCost: distanceKm * transportCostPerUnitKm };
    }));
  }

  function addEdge(graph, from, to, capacity, cost, metadata = null) {
    const forward = { to, rev: graph[to].length, capacity, cost, originalCapacity: capacity, metadata };
    const reverse = { to: from, rev: graph[from].length, capacity: 0, cost: -cost, originalCapacity: 0, metadata: null };
    graph[from].push(forward);
    graph[to].push(reverse);
  }

  function minCostFlow(facilities, customers, distanceMatrix, openSet) {
    const facilityCount = facilities.length;
    const customerCount = customers.length;
    const source = 0;
    const facilityOffset = 1;
    const customerOffset = facilityOffset + facilityCount;
    const sink = customerOffset + customerCount;
    const graph = Array.from({ length: sink + 1 }, () => []);
    facilities.forEach((facility, facilityIndex) => {
      addEdge(graph, source, facilityOffset + facilityIndex, openSet.has(facilityIndex) ? facility.capacity : 0, 0);
    });
    facilities.forEach((facility, facilityIndex) => {
      customers.forEach((customer, customerIndex) => {
        addEdge(graph, facilityOffset + facilityIndex, customerOffset + customerIndex, customer.demand, distanceMatrix[facilityIndex][customerIndex].unitCost, { facilityIndex, customerIndex });
      });
    });
    customers.forEach((customer, customerIndex) => addEdge(graph, customerOffset + customerIndex, sink, customer.demand, 0));

    const required = customers.reduce((sum, customer) => sum + customer.demand, 0);
    let flow = 0;
    let cost = 0;
    while (flow < required - EPSILON) {
      const dist = Array(graph.length).fill(Infinity);
      const previousNode = Array(graph.length).fill(-1);
      const previousEdge = Array(graph.length).fill(-1);
      const inQueue = Array(graph.length).fill(false);
      const queue = [source];
      dist[source] = 0;
      inQueue[source] = true;
      while (queue.length) {
        const node = queue.shift();
        inQueue[node] = false;
        graph[node].forEach((edge, edgeIndex) => {
          if (edge.capacity > EPSILON && dist[edge.to] > dist[node] + edge.cost + EPSILON) {
            dist[edge.to] = dist[node] + edge.cost;
            previousNode[edge.to] = node;
            previousEdge[edge.to] = edgeIndex;
            if (!inQueue[edge.to]) {
              queue.push(edge.to);
              inQueue[edge.to] = true;
            }
          }
        });
      }
      if (!Number.isFinite(dist[sink])) break;
      let increment = required - flow;
      for (let node = sink; node !== source; node = previousNode[node]) {
        increment = Math.min(increment, graph[previousNode[node]][previousEdge[node]].capacity);
      }
      for (let node = sink; node !== source; node = previousNode[node]) {
        const edge = graph[previousNode[node]][previousEdge[node]];
        edge.capacity -= increment;
        graph[edge.to][edge.rev].capacity += increment;
        cost += increment * edge.cost;
      }
      flow += increment;
    }

    const allocations = [];
    graph.forEach((edges) => {
      edges.forEach((edge) => {
        if (!edge.metadata) return;
        const quantity = edge.originalCapacity - edge.capacity;
        if (quantity <= EPSILON) return;
        const { facilityIndex, customerIndex } = edge.metadata;
        const distance = distanceMatrix[facilityIndex][customerIndex];
        allocations.push({
          facility: facilities[facilityIndex].name,
          customer: customers[customerIndex].name,
          facilityIndex,
          customerIndex,
          flow: quantity,
          distanceKm: distance.distanceKm,
          transportCost: quantity * distance.unitCost,
        });
      });
    });
    return { flow, transportCost: cost, allocations };
  }

  function enumerateOpenSets(facilityCount, maxCombinations) {
    if (facilityCount > 14) throw new Error("The browser optimizer is limited to 14 facilities for exact open-facility enumeration.");
    const combinations = 2 ** facilityCount - 1;
    if (combinations > maxCombinations) throw new Error(`This model creates ${combinations} facility combinations. Reduce facilities or use a pre-selected network.`);
    const sets = [];
    for (let mask = 1; mask < 2 ** facilityCount; mask += 1) {
      const openSet = new Set();
      for (let index = 0; index < facilityCount; index += 1) {
        if (mask & (1 << index)) openSet.add(index);
      }
      sets.push(openSet);
    }
    return sets;
  }

  function evaluateOpenSet(facilities, customers, distanceMatrix, openSet) {
    const demand = customers.reduce((sum, customer) => sum + customer.demand, 0);
    const capacity = facilities.reduce((sum, facility, index) => sum + (openSet.has(index) ? facility.capacity : 0), 0);
    if (capacity + EPSILON < demand) return null;
    const flowResult = minCostFlow(facilities, customers, distanceMatrix, openSet);
    if (flowResult.flow + EPSILON < demand) return null;
    const facilityCost = facilities.reduce((sum, facility, index) => sum + (openSet.has(index) ? facility.fixedCost : 0), 0);
    return {
      openFacilities: [...openSet].map((index) => facilities[index].name),
      transportCost: flowResult.transportCost,
      facilityCost,
      totalCost: flowResult.transportCost + facilityCost,
      allocations: flowResult.allocations,
      totalFlow: flowResult.flow,
      totalCapacity: capacity,
    };
  }

  function currentNetworkCost(facilities, customers, distanceMatrix, transportCostPerUnitKm) {
    const facilityByName = new Map(facilities.map((facility, index) => [facility.name.toLowerCase(), { facility, index }]));
    if (!customers.some((customer) => customer.currentFacility)) return null;
    const used = new Set();
    const capacityUse = Array(facilities.length).fill(0);
    const allocations = [];
    customers.forEach((customer, customerIndex) => {
      if (!customer.currentFacility) throw new Error(`${customer.name} needs a current facility for current-network comparison.`);
      const match = facilityByName.get(customer.currentFacility.toLowerCase());
      if (!match) throw new Error(`${customer.name} references current facility "${customer.currentFacility}", which is not in the facility list.`);
      capacityUse[match.index] += customer.demand;
      used.add(match.index);
      const distance = distanceMatrix[match.index][customerIndex];
      allocations.push({
        facility: match.facility.name,
        customer: customer.name,
        facilityIndex: match.index,
        customerIndex,
        flow: customer.demand,
        distanceKm: distance.distanceKm,
        transportCost: customer.demand * distance.distanceKm * transportCostPerUnitKm,
      });
    });
    const transportCost = allocations.reduce((sum, allocation) => sum + allocation.transportCost, 0);
    const facilityCost = [...used].reduce((sum, index) => sum + facilities[index].fixedCost, 0);
    return {
      openFacilities: [...used].map((index) => facilities[index].name),
      transportCost,
      facilityCost,
      totalCost: transportCost + facilityCost,
      allocations,
      capacityUse,
      overCapacityFacilities: facilities.filter((_, index) => capacityUse[index] > facilities[index].capacity + EPSILON).map((facility) => facility.name),
    };
  }

  function summarise(facilities, customers, solution, current = null) {
    const totalDemand = customers.reduce((sum, customer) => sum + customer.demand, 0);
    const facilityUse = Array(facilities.length).fill(0);
    solution.allocations.forEach((allocation) => { facilityUse[allocation.facilityIndex] += allocation.flow; });
    const weightedDistance = solution.allocations.reduce((sum, allocation) => sum + allocation.flow * allocation.distanceKm, 0);
    const averageDistanceKm = totalDemand ? weightedDistance / totalDemand : 0;
    const capacityUtilization = solution.totalCapacity ? totalDemand / solution.totalCapacity : 0;
    const savings = current ? current.totalCost - solution.totalCost : null;
    return {
      totalDemand,
      totalOptimizedCost: solution.totalCost,
      transportCost: solution.transportCost,
      facilityCost: solution.facilityCost,
      averageDistanceKm,
      capacityUtilization,
      unmetDemand: Math.max(0, totalDemand - solution.totalFlow),
      openFacilities: solution.openFacilities,
      facilityUse,
      currentCost: current?.totalCost ?? null,
      savings,
      savingsPercent: current && current.totalCost ? savings / current.totalCost : null,
    };
  }

  function diagnoseNetwork(input, result = null) {
    const diagnostics = [];
    const facilities = input.facilities || [];
    const customers = input.customers || [];
    const totalCapacity = facilities.reduce((sum, facility) => sum + Number(facility.capacity || 0), 0);
    const totalDemand = customers.reduce((sum, customer) => sum + Number(customer.demand || 0), 0);
    const missingCoordinates = [...facilities, ...customers].filter((row) => !Number.isFinite(Number(row.latitude)) || !Number.isFinite(Number(row.longitude)));
    if (missingCoordinates.length) {
      diagnostics.push({
        level: "high-risk",
        title: "Missing or invalid coordinates",
        detected: `${missingCoordinates.length} location record${missingCoordinates.length === 1 ? "" : "s"} cannot be mapped or costed.`,
        why: "Distance-based allocation requires latitude and longitude for every facility and demand point.",
        consider: "Correct coordinates before optimizing the network.",
      });
    }
    if (totalCapacity + EPSILON < totalDemand) {
      diagnostics.push({
        level: "high-risk",
        title: "Insufficient total capacity",
        detected: `Capacity ${totalCapacity.toFixed(1)} versus demand ${totalDemand.toFixed(1)}.`,
        why: "The model cannot satisfy all demand when total available capacity is lower than demand.",
        consider: "Add capacity, reduce demand, or allow unmet-demand penalties in a future model.",
      });
    }
    if (result?.summary?.capacityUtilization > 0.95) {
      diagnostics.push({
        level: "caution",
        title: "High network utilization",
        detected: `${(result.summary.capacityUtilization * 100).toFixed(1)}% of open capacity is used.`,
        why: "A tightly loaded network may be sensitive to demand spikes, disruptions, or travel-time variability.",
        consider: "Test a resilience scenario with extra capacity or an alternative open-facility set.",
      });
    }
    if (result?.current?.overCapacityFacilities?.length) {
      diagnostics.push({
        level: "caution",
        title: "Current network exceeds capacity",
        detected: result.current.overCapacityFacilities.join(", "),
        why: "The current assignment is not capacity-feasible even if the optimized assignment is feasible.",
        consider: "Use the comparison as a redesign signal rather than a like-for-like savings estimate.",
      });
    }
    if (facilities.length > 10) {
      diagnostics.push({
        level: "info",
        title: "Large exact enumeration",
        detected: `${facilities.length} candidate facilities create ${2 ** facilities.length - 1} open-network combinations.`,
        why: "The browser solves this exactly for modest cases by checking feasible facility sets.",
        consider: "For larger strategic design problems, use pre-screened candidate facilities or a dedicated MILP solver.",
      });
    }
    diagnostics.push({
      level: "info",
      title: "Model boundary",
      detected: "Single-echelon facility-to-customer allocation.",
      why: "The tool optimizes distance-based flow and fixed facility cost; it does not yet model service time, inventory, carbon, or disruption probability.",
      consider: "Treat the result as a network design baseline before applying operational constraints not included in the model.",
    });
    return diagnostics;
  }

  function optimizeNetwork(input) {
    const facilities = normaliseFacilities(input.facilities);
    const customers = normaliseCustomers(input.customers);
    const transportCostPerUnitKm = toNumber(input.transportCostPerUnitKm, "Transportation cost per unit/km");
    if (transportCostPerUnitKm < 0) throw new Error("Transportation cost per unit/km cannot be negative.");
    const totalDemand = customers.reduce((sum, customer) => sum + customer.demand, 0);
    if (totalDemand <= 0) throw new Error("Total demand must be greater than zero.");
    const totalCapacity = facilities.reduce((sum, facility) => sum + facility.capacity, 0);
    if (totalCapacity + EPSILON < totalDemand) {
      return {
        feasible: false,
        facilities,
        customers,
        diagnostics: diagnoseNetwork({ facilities, customers, transportCostPerUnitKm }),
        error: "Insufficient capacity to satisfy demand.",
      };
    }
    const distanceMatrix = buildDistanceMatrix(facilities, customers, transportCostPerUnitKm);
    let best = null;
    enumerateOpenSets(facilities.length, Number(input.maxCombinations || 4096)).forEach((openSet) => {
      const candidate = evaluateOpenSet(facilities, customers, distanceMatrix, openSet);
      if (candidate && (!best || candidate.totalCost < best.totalCost - EPSILON)) best = candidate;
    });
    if (!best) throw new Error("No feasible allocation found.");
    const current = currentNetworkCost(facilities, customers, distanceMatrix, transportCostPerUnitKm);
    const summary = summarise(facilities, customers, best, current);
    const result = {
      feasible: true,
      facilities,
      customers,
      transportCostPerUnitKm,
      distanceMatrix,
      optimized: best,
      current,
      summary,
    };
    result.diagnostics = diagnoseNetwork({ facilities, customers, transportCostPerUnitKm }, result);
    return result;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (char !== "\r") field += char;
    }
    if (quoted) throw new Error("CSV has an unclosed quoted field.");
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
    return rows;
  }

  function parseNetworkCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error("CSV needs a header row and at least one data row.");
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const indexOf = (names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
    const typeIndex = indexOf(["type", "record type"]);
    const nameIndex = indexOf(["name", "location"]);
    const latIndex = indexOf(["latitude", "lat"]);
    const lonIndex = indexOf(["longitude", "lon", "lng"]);
    if ([typeIndex, nameIndex, latIndex, lonIndex].some((index) => index === undefined)) {
      throw new Error("CSV must include Type, Name, Latitude, and Longitude columns.");
    }
    const capacityIndex = indexOf(["capacity"]);
    const fixedCostIndex = indexOf(["fixed cost", "fixedcost"]);
    const demandIndex = indexOf(["demand"]);
    const currentFacilityIndex = indexOf(["current facility", "currentfacility", "assigned facility"]);
    const facilities = [];
    const customers = [];
    rows.slice(1).forEach((row, rowIndex) => {
      const type = String(row[typeIndex] || "").trim().toLowerCase();
      if (!type) return;
      if (type.startsWith("fac")) {
        if (capacityIndex === undefined || fixedCostIndex === undefined) throw new Error("Facility rows require Capacity and Fixed Cost columns.");
        facilities.push({ name: row[nameIndex], latitude: row[latIndex], longitude: row[lonIndex], capacity: row[capacityIndex], fixedCost: row[fixedCostIndex] });
      } else if (type.startsWith("cust") || type.startsWith("demand")) {
        if (demandIndex === undefined) throw new Error("Customer rows require a Demand column.");
        customers.push({ name: row[nameIndex], latitude: row[latIndex], longitude: row[lonIndex], demand: row[demandIndex], currentFacility: currentFacilityIndex === undefined ? "" : row[currentFacilityIndex] });
      } else {
        throw new Error(`CSV row ${rowIndex + 2} has unknown Type "${row[typeIndex]}". Use Facility or Customer.`);
      }
    });
    return { facilities, customers };
  }

  return { optimizeNetwork, diagnoseNetwork, haversineKm, parseNetworkCsv };
}));

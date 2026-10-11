(function (root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('../assets/vendor/astar-0.4.1.js'), require('./data-utils.js'))
    : factory({ Graph: root.Graph, astar: root.astar }, root.ATHData);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ATHWarehouse = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (pathfinding, data) {
  'use strict';
  const METHOD = '1 m orthogonal A* paths; nearest eligible location with available stock; induction to drop-off';
  function numeric(value, label, min, max, integer = false) {
    const n = data.number(value, label, min);
    if (n > max || (integer && !Number.isInteger(n))) throw new Error(`${label} must be ${integer ? 'a whole number ' : ''}between ${min} and ${max}.`);
    return n;
  }
  function name(value, label) {
    if (typeof value !== 'string' || !value.trim() || value.length > 80) throw new Error(`${label} needs 1 to 80 characters.`);
    return value.trim();
  }
  function settings(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Simulation settings are required.');
    const sequenceMode = raw.sequenceMode ?? 'nearest';
    if (!['nearest', 'fixed'].includes(sequenceMode)) throw new Error('Pick sequence mode must be nearest or fixed.');
    return {
      sequenceMode,
      orders: numeric(raw.orders, 'Orders', 1, 20000, true),
      picks: numeric(raw.picks, 'Picks per order', 1, 30, true),
      speed: numeric(raw.speed, 'Picker speed (m/s)', 0.1, 5),
      pickTime: numeric(raw.pickTime, 'Pick time (seconds per unit)', 0, 600),
      seed: numeric(raw.seed, 'Seed', 0, 4294967295, true)
    };
  }
  function layout(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('A layout is required.');
    const result = {
      id: name(raw.id, 'Layout ID'), name: name(raw.name, 'Layout name'),
      width: numeric(raw.width, 'Warehouse width', 8, 80, true),
      height: numeric(raw.height, 'Warehouse depth', 8, 80, true),
      aisle: numeric(raw.aisle, 'Aisle width', 1, 6, true),
      start: { x: numeric((raw.start || raw.depot)?.x, 'Start X cell', 0, 79, true), y: numeric((raw.start || raw.depot)?.y, 'Start Y cell', 0, 79, true) },
      samePoint: raw.samePoint === undefined ? true : raw.samePoint,
      locations: []
    };
    if (typeof result.samePoint !== 'boolean') throw new Error('Same start/end must be true or false.');
    result.end = result.samePoint ? { ...result.start } : { x: numeric(raw.end?.x, 'End X cell', 0, 79, true), y: numeric(raw.end?.y, 'End Y cell', 0, 79, true) };
    for (const p of [result.start, result.end]) if (p.x >= result.width || p.y >= result.height) throw new Error('Start and end must be inside the warehouse.');
    const locations = raw.locations || raw.racks;
    if (!Array.isArray(locations) || locations.length > 30) throw new Error('Use up to 30 locations per layout.');
    result.locations = locations.map((r, i) => {
      const label = `Location ${i + 1}`;
      if (!r || typeof r !== 'object') throw new Error(`${label} is invalid.`);
      const rack = {
        id: name(r.id === undefined && raw.racks ? `LOC-${i + 1}` : r.id, `${label} ID`),
        x: numeric(r.x, `${label} X`, 0, 79, true), y: numeric(r.y, `${label} Y`, 0, 79, true),
        w: numeric(r.w, `${label} width`, 1, 20, true), h: numeric(r.h, `${label} depth`, 1, 20, true),
        side: r.side,
        assignments: []
      };
      const assignments = r.assignments || (r.sku ? [{ sku: r.sku, quantity: 1000000 }] : []);
      if (!Array.isArray(assignments) || assignments.length > 30) throw new Error(`${label}: use up to 30 SKU assignments.`);
      rack.assignments = assignments.map((a) => ({ sku: name(a?.sku, `${label} SKU`), quantity: numeric(a?.quantity, `${label} available units`, 0, 1000000000, true) }));
      if (new Set(rack.assignments.map((a) => a.sku)).size !== rack.assignments.length) throw new Error(`${rack.id}: combine duplicate SKU assignment quantities.`);
      if (!['N', 'S', 'E', 'W'].includes(rack.side)) throw new Error(`${label} needs a valid pick face.`);
      if (rack.x + rack.w > result.width || rack.y + rack.h > result.height) throw new Error(`${rack.id} extends outside the warehouse.`);
      return rack;
    });
    const ids = new Set();
    result.locations.forEach((r, i) => {
      if (ids.has(r.id)) throw new Error(`Duplicate location ID: ${r.id}.`);
      ids.add(r.id);
      result.locations.slice(0, i).forEach((s) => {
        if (r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y) throw new Error(`${r.id} overlaps ${s.id}.`);
      });
    });
    return result;
  }
  function project(raw) {
    if (!raw || ![1, 2].includes(raw.version) || raw.type !== 'ath-warehouse-layout') throw new Error('Expected an ATH warehouse project, version 1 or 2.');
    if (!Array.isArray(raw.layouts) || raw.layouts.length < 1 || raw.layouts.length > 6) throw new Error('A project needs 1 to 6 layouts.');
    const layouts = raw.layouts.map(layout);
    if (new Set(layouts.map((l) => l.id)).size !== layouts.length) throw new Error('Layout IDs must be unique.');
    let catalog = raw.skus;
    if (raw.version === 1) {
      const legacy = raw.layouts[0].racks.map((r) => ({ sku: r.sku, weight: r.weight })).sort((a, b) => a.sku.localeCompare(b.sku));
      raw.layouts.forEach((l) => {
        const other = l.racks.map((r) => ({ sku: r.sku, weight: r.weight })).sort((a, b) => a.sku.localeCompare(b.sku));
        if (JSON.stringify(other) !== JSON.stringify(legacy)) throw new Error('Legacy layouts have different SKU weights; align them before importing.');
      });
      catalog = legacy;
    }
    if (!Array.isArray(catalog) || catalog.length > 30) throw new Error('Use up to 30 SKUs in the shared demand catalogue.');
    const skus = catalog.map((r) => ({ sku: name(r?.sku, 'SKU name'), weight: numeric(r?.weight, 'SKU frequency weight', 0, 1000000) }));
    const skuIds = new Set(skus.map((r) => r.sku));
    if (skuIds.size !== skus.length) throw new Error('SKU demand names must be unique.');
    layouts.forEach((l) => l.locations.forEach((r) => r.assignments.forEach((a) => { if (!skuIds.has(a.sku)) throw new Error(`${l.name}, ${r.id}: unknown SKU ${a.sku}. Add it to the shared demand catalogue.`); })));
    return { type: raw.type, version: 2, settings: settings(raw.settings), skus, layouts };
  }
  function demandCsv(text) {
    const rows = data.parseCsv(text);
    if (rows.length < 2) throw new Error('Demand CSV needs a header and at least one SKU row.');
    const headers = rows[0].map((v) => v.trim().toLowerCase().replace(/[ _-]/g, ''));
    if (new Set(headers).size !== headers.length) throw new Error('Demand CSV column names must be unique.');
    const skuIndex = headers.indexOf('sku'), weightIndex = headers.indexOf('frequencyweight');
    if (skuIndex < 0 || weightIndex < 0) throw new Error('Demand CSV must include SKU and FrequencyWeight columns.');
    const result = [], names = new Set();
    rows.slice(1).forEach((row, i) => {
      if (row.every((v) => !v.trim())) return;
      if (row.length !== headers.length) throw new Error(`CSV row ${i + 2} has ${row.length} fields; expected ${headers.length}.`);
      const sku = name(row[skuIndex], `CSV row ${i + 2} SKU`);
      if (names.has(sku)) throw new Error(`CSV row ${i + 2}: duplicate SKU ${sku}.`);
      names.add(sku);
      result.push({ sku, weight: numeric(row[weightIndex], `CSV row ${i + 2} frequency weight`, 0, 1000000) });
    });
    if (!result.length || result.length > 30) throw new Error('Demand CSV must contain 1 to 30 unique SKU records.');
    return result;
  }
  function pickPoint(r, aisle) {
    if (r.side === 'N') return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y - aisle / 2) };
    if (r.side === 'S') return { x: Math.floor(r.x + r.w / 2), y: Math.ceil(r.y + r.h + aisle / 2 - 1) };
    if (r.side === 'W') return { x: Math.floor(r.x - aisle / 2), y: Math.floor(r.y + r.h / 2) };
    return { x: Math.ceil(r.x + r.w + aisle / 2 - 1), y: Math.floor(r.y + r.h / 2) };
  }
  function walkGrid(l) {
    // A 1 m route cell plus this margin reserves the requested aisle envelope.
    const margin = (l.aisle - 1) / 2;
    return Array.from({ length: l.width }, (_, x) => Array.from({ length: l.height }, (_, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (cx < l.aisle / 2 || cy < l.aisle / 2 || cx > l.width - l.aisle / 2 || cy > l.height - l.aisle / 2) return 0;
      return l.locations.some((r) => cx > r.x - margin && cx < r.x + r.w + margin && cy > r.y - margin && cy < r.y + r.h + margin) ? 0 : 1;
    }));
  }
  function prepare(raw) {
    const l = layout(raw);
    if (!l.locations.length) throw new Error(`${l.name}: add at least one location.`);
    const grid = walkGrid(l);
    const points = [l.start, ...l.locations.map((r) => pickPoint(r, l.aisle)), l.end];
    const labelAt = (i) => i === 0 ? 'induction/start point' : i === points.length - 1 ? 'drop-off/end point' : `${l.locations[i - 1].id} pick face`;
    points.forEach((p, i) => {
      if (!grid[p.x]?.[p.y]) throw new Error(`${l.name}: ${labelAt(i)} is blocked by a location, wall, or aisle clearance. Move it or choose another face.`);
    });
    const graph = new pathfinding.Graph(grid);
    const cache = new Map();
    function path(a, b) {
      const key = `${a}:${b}`;
      if (cache.has(key)) return cache.get(key);
      const start = graph.grid[points[a].x][points[a].y], end = graph.grid[points[b].x][points[b].y];
      // Version 0.4.1 does not mark the start node dirty; reset between queries.
      graph.init();
      const nodes = start === end ? [] : pathfinding.astar.search(graph, start, end);
      if (start !== end && !nodes.length) throw new Error(`${l.name}: no aisle route to ${labelAt(b)}. Open a connected aisle.`);
      const route = [points[a], ...nodes.map((n) => ({ x: n.x, y: n.y }))];
      cache.set(key, route);
      cache.set(`${b}:${a}`, [...route].reverse());
      return route;
    }
    points.forEach((_, i) => path(0, i));
    return { layout: l, grid, points, path };
  }
  function route(prepared, order, includePath = false) {
    const pending = new Map();
    order.forEach((sku) => pending.set(sku, (pending.get(sku) || 0) + 1));
    const available = prepared.layout.locations.map((r) => new Map(r.assignments.map((a) => [a.sku, a.quantity])));
    pending.forEach((quantity, sku) => { if (available.reduce((sum, stock) => sum + (stock.get(sku) || 0), 0) < quantity) throw new Error(`${prepared.layout.name}: insufficient available units for ${sku} in a sampled order (${quantity} needed). Increase assigned quantity or reduce picks per order.`); });
    let current = 0, distance = 0;
    const points = [prepared.points[0]], sequence = [], stops = [];
    while (pending.size) {
      let best = -1, bestLength = Infinity;
      prepared.layout.locations.forEach((location, i) => {
        if (![...pending].some(([sku, quantity]) => quantity > 0 && available[i].get(sku) > 0)) return;
        const length = prepared.path(current, i + 1).length - 1;
        if (length < bestLength || (length === bestLength && location.id < prepared.layout.locations[best].id)) { best = i; bestLength = length; }
      });
      const next = best + 1;
      const segment = prepared.path(current, next);
      distance += bestLength;
      if (includePath) points.push(...segment.slice(1));
      const picked = [];
      pending.forEach((quantity, sku) => {
        const units = Math.min(quantity, available[best].get(sku) || 0);
        if (!units) return;
        available[best].set(sku, available[best].get(sku) - units);
        if (units === quantity) pending.delete(sku); else pending.set(sku, quantity - units);
        picked.push({ sku, quantity: units });
      });
      sequence.push(prepared.layout.locations[best].id);
      stops.push({ location: prepared.layout.locations[best].id, picked });
      current = next;
    }
    const home = prepared.path(current, prepared.points.length - 1);
    distance += home.length - 1;
    if (includePath) points.push(...home.slice(1));
    return { distance, points: includePath ? points : [], sequence, stops };
  }
  function random(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fixedStops(model, order) {
    const available = model.layout.locations.map((r) => new Map(r.assignments.map((a) => [a.sku, a.quantity])));
    let current = 0;
    const stops = [];
    for (const sku of order) {
      let best = -1, distance = Infinity;
      model.layout.locations.forEach((loc, i) => {
        if (!(available[i].get(sku) > 0)) return;
        const d = model.path(current, i + 1).length - 1;
        if (d < distance || (d === distance && loc.id < model.layout.locations[best].id)) { best = i; distance = d; }
      });
      if (best < 0) throw new Error(`${model.layout.name}: insufficient available units for ${sku} in fixed pick sequence.`);
      available[best].set(sku, available[best].get(sku) - 1);
      const location = model.layout.locations[best].id;
      let stop = stops.at(-1);
      if (!stop || stop.location !== location) { stop = { location, picked: [] }; stops.push(stop); }
      const pick = stop.picked.find((p) => p.sku === sku);
      if (pick) pick.quantity++; else stop.picked.push({ sku, quantity: 1 });
      current = best + 1;
    }
    const grouped = new Map();
    stops.forEach((stop) => {
      if (!grouped.has(stop.location)) grouped.set(stop.location, { location: stop.location, picked: [] });
      const target = grouped.get(stop.location);
      stop.picked.forEach((pick) => {
        const existing = target.picked.find((p) => p.sku === pick.sku);
        if (existing) existing.quantity += pick.quantity;
        else target.picked.push({ ...pick });
      });
    });
    const alphabetical = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    return [...grouped.values()].sort((a, b) => alphabetical.compare(a.location, b.location) || (a.location < b.location ? -1 : a.location > b.location ? 1 : 0));
  }
  function fixedRoute(model, stops, includePath = false) {
    const indices = new Map(model.layout.locations.map((loc, i) => [loc.id, i + 1]));
    const stock = model.layout.locations.map((loc) => new Map(loc.assignments.map((a) => [a.sku, a.quantity])));
    let current = 0, distance = 0;
    const points = [model.points[0]];
    for (const stop of stops) {
      const index = indices.get(stop.location);
      if (index === undefined) throw new Error(`${model.layout.name}: fixed sequence location ${stop.location} is missing.`);
      stop.picked.forEach((p) => {
        if ((stock[index - 1].get(p.sku) || 0) < p.quantity) throw new Error(`${model.layout.name}: fixed sequence requires ${p.quantity} units of ${p.sku} at ${stop.location}. Match the baseline assignment and stock.`);
        stock[index - 1].set(p.sku, stock[index - 1].get(p.sku) - p.quantity);
      });
      const segment = model.path(current, index); distance += segment.length - 1;
      if (includePath) points.push(...segment.slice(1)); current = index;
    }
    const end = model.path(current, model.points.length - 1); distance += end.length - 1;
    if (includePath) points.push(...end.slice(1));
    return { distance, points: includePath ? points : [], sequence: stops.map((s) => s.location), stops };
  }
  function stats(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.length > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1) : 0;
    return { mean, min: Math.min(...values), max: Math.max(...values), standardError: Math.sqrt(variance / values.length) };
  }
  function* simulateSteps(raw) {
    const p = project(raw), s = p.settings;
    const catalog = [...p.skus].sort((a, b) => a.sku < b.sku ? -1 : 1);
    if (!catalog.some((r) => r.weight > 0)) throw new Error('Add at least one positive-weight SKU in shared demand.');
    p.layouts.forEach((l) => catalog.filter((r) => r.weight > 0).forEach((r) => {
      if (!l.locations.some((loc) => loc.assignments.some((a) => a.sku === r.sku && a.quantity > 0))) throw new Error(`${l.name}: assign available units for ${r.sku} to a location before comparing.`);
    }));
    const prepared = p.layouts.map(prepare);
    const totalWeight = catalog.reduce((sum, r) => sum + r.weight, 0), rng = random(s.seed);
    const orders = Array.from({ length: s.orders }, () => Array.from({ length: s.picks }, () => {
      let target = rng() * totalWeight;
      for (const r of catalog) { target -= r.weight; if (target < 0) return r.sku; }
      return catalog[catalog.length - 1].sku;
    }));
    const frequency = catalog.map((r) => ({ sku: r.sku, picks: 0, visits: 0 }));
    const frequencies = new Map(frequency.map((r) => [r.sku, r]));
    orders.forEach((order) => { order.forEach((sku) => frequencies.get(sku).picks++); new Set(order).forEach((sku) => frequencies.get(sku).visits++); });
    const sequences = [];
    if (s.sequenceMode === 'fixed') {
      for (let i = 0; i < orders.length; i++) {
        if (i % 100 === 0) yield 0.15 * i / orders.length;
        sequences.push(fixedStops(prepared[0], orders[i]));
      }
    }
    const results = [];
    for (let layoutIndex = 0; layoutIndex < prepared.length; layoutIndex++) {
      const model = prepared[layoutIndex], distances = [];
      const locationFrequency = model.layout.locations.map((loc) => ({ location: loc.id, picks: 0, visits: 0 }));
      const locationCounts = new Map(locationFrequency.map((f) => [f.location, f]));
      for (let i = 0; i < orders.length; i++) {
        if (i % 100 === 0) yield (s.sequenceMode === 'fixed' ? .15 : 0) + (s.sequenceMode === 'fixed' ? .85 : 1) * (layoutIndex + i / s.orders) / prepared.length;
        const trip = s.sequenceMode === 'fixed' ? fixedRoute(model, sequences[i]) : route(model, orders[i]);
        distances.push(trip.distance);
        const visited = new Set();
        trip.stops.forEach((stop) => { const count = locationCounts.get(stop.location); if (!visited.has(stop.location)) count.visits++; visited.add(stop.location); count.picks += stop.picked.reduce((sum, a) => sum + a.quantity, 0); });
      }
      const travel = distances.map((d) => d / s.speed), times = travel.map((t) => t + s.picks * s.pickTime);
      const examples = orders.slice(0, 20).map((order, i) => ({ ...(s.sequenceMode === 'fixed' ? fixedRoute(model, sequences[i], true) : route(model, order, true)), order }));
      const diagnostics = [];
      const alteredStock = catalog.filter((sku) => {
        const sum = (l) => l.locations.reduce((total, loc) => total + loc.assignments.filter((a) => a.sku === sku.sku).reduce((n, a) => n + a.quantity, 0), 0);
        return sum(model.layout) !== sum(p.layouts[0]);
      });
      if (alteredStock.length) diagnostics.push({ level: 'caution', title: 'Different available stock from baseline', detected: alteredStock.map((r) => r.sku).join(', '), why: 'Quantity differences can alter which locations supply an order.', consider: 'Use equal total available quantities per SKU to isolate layout and placement effects.' });
      if (s.orders < 1000) diagnostics.push({ level: 'caution', title: 'Small simulation', detected: `${s.orders} orders sampled.`, why: 'The sample mean may vary appreciably between seeds.', consider: 'Use several thousand orders and repeat with another seed before selecting a layout.' });
      const peak = Math.max(...catalog.map((r) => r.weight)) / totalWeight;
      if (peak > 0.5) diagnostics.push({ level: 'caution', title: 'Concentrated picking demand', detected: `One SKU has ${(100 * peak).toFixed(1)}% of the sampling weight.`, why: 'Its position can dominate the comparison.', consider: 'Check that weights represent expected unit picks for the same period.' });
      if (s.speed > 2) diagnostics.push({ level: 'caution', title: 'High walking speed', detected: `${s.speed} m/s assumed.`, why: 'Loaded walking and turns can be slower.', consider: 'Calibrate against observed picker travel times.' });
      results.push({ id: model.layout.id, name: model.layout.name, distance: stats(distances), travel: stats(travel), total: stats(times), distances, times, examples, frequency, locationFrequency, diagnostics });
    }
    results.forEach((r) => {
      r.distanceImprovement = results[0].distance.mean === 0 ? null : 100 * (results[0].distance.mean - r.distance.mean) / results[0].distance.mean;
      r.timeImprovement = results[0].total.mean === 0 ? null : 100 * (results[0].total.mean - r.total.mean) / results[0].total.mean;
      r.pairedDistanceDifference = stats(results[0].distances.map((d, i) => d - r.distances[i]));
      const diff = r.pairedDistanceDifference;
      if (r !== results[0] && Math.abs(diff.mean) <= 2 * diff.standardError) r.diagnostics.push({
        level: 'caution', title: 'Small difference relative to simulation noise',
        detected: `Paired distance saving ${diff.mean.toFixed(2)} m/order; standard error ${diff.standardError.toFixed(2)} m.`,
        why: 'The sampled difference does not clearly exceed Monte Carlo variation.',
        consider: 'Increase orders and repeat with other seeds. This is not a formal confidence interval or model validation.'
      });
    });
    return { version: 2, generatedAt: new Date().toISOString(), method: s.sequenceMode === 'fixed' ? '1 m orthogonal A* paths; alphabetical location sequence (natural numeric bay order); identical stops in every layout; induction to drop-off' : METHOD,
      assumptions: ['One picker; constant speed; no congestion or turning delays.', s.sequenceMode === 'fixed' ? 'Baseline allocates requested units to stocked locations; repeated location picks are combined and sorted alphabetically with numeric bay ordering, then replayed in every layout.' : 'Independent weighted unit picks with replacement; nearest eligible location allocation.', 'Assigned quantities reset before every order; no stock depletion across orders.', 'One metre orthogonal grid with conservative aisle-clearance envelope.', 'No replenishment, batching, basket correlation, or safety certification.'],
      project: p, results };
  }
  function simulate(raw, progress = () => {}) {
    const iterator = simulateSteps(raw);
    let next = iterator.next();
    while (!next.done) { progress(next.value); next = iterator.next(); }
    progress(1);
    return next.value;
  }
  function sample() {
    const ids = Array.from({ length: 30 }, (_, i) => `${'ABCDEF'[Math.floor(i / 5)]}${i % 5 + 1}`);
    const layouts = [0, 1].map((index) => ({
      id: `layout-${index + 1}`, name: index ? 'Layout 2 - Transverse aisles' : 'Layout 1 - Longitudinal aisles', width: 28, height: 24, aisle: 2,
      start: { x: 2, y: 2 }, end: { x: 2, y: 2 }, samePoint: true,
      locations: ids.map((id, i) => {
        const bank = Math.floor(i / 5), bay = i % 5;
        return { id, x: index ? 6 + bay * 3 : [2,8,10,16,18,24][bank], y: index ? [2,6,8,12,14,18][bank] : 4 + bay * 3,
          w: index ? 3 : 2, h: index ? 2 : 3, side: index ? (bank % 2 ? 'N' : 'S') : (bank % 2 ? 'W' : 'E'), assignments: [{ sku: `SKU-${id}`, quantity: 30 }] };
      })
    }));
    return { type: 'ath-warehouse-layout', version: 2,
      settings: { orders: 3000, picks: 5, speed: 1.2, pickTime: 8, seed: 42, sequenceMode: 'fixed' },
      skus: ids.map((id, i) => ({ sku: `SKU-${id}`, weight: i < 5 ? 20 : i < 15 ? 8 : 3 })), layouts };
  }
  return { METHOD, layout, project, settings, demandCsv, prepare, walkGrid, pickPoint, route, fixedStops, fixedRoute, simulate, simulateSteps, sample };
}));

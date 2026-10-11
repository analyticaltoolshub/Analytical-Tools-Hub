const test = require('node:test');
const assert = require('node:assert/strict');
const warehouse = require('../calculation-core/warehouse-layout.js');
test('Warehouse demand CSV validates complete records, quoted names and header mapping', () => {
  assert.deepEqual(warehouse.demandCsv('\uFEFFFrequencyWeight,SKU\r\n40,"Product, blue"\r\n0,"Product ""red"""\r\n'), [{ sku: 'Product, blue', weight: 40 }, { sku: 'Product "red"', weight: 0 }]);
  for (const text of ['SKU,FrequencyWeight\nA,', 'SKU,FrequencyWeight\nA,-1', 'SKU,FrequencyWeight\nA,NaN', 'SKU,FrequencyWeight\nA,3\nA,4', 'SKU,FrequencyWeight\nA,3,extra', 'SKU;FrequencyWeight\nA;3', 'SKU,FrequencyWeight\n"A,3', 'SKU,FrequencyWeight\n"A"junk,3']) assert.throws(() => warehouse.demandCsv(text));
  assert.throws(() => warehouse.demandCsv('SKU,FrequencyWeight\n' + Array.from({ length: 31 }, (_, i) => `SKU-${i},1`).join('\n')), /1 to 30/);
});
function small() {
  return { type: 'ath-warehouse-layout', version: 1, settings: { orders: 10, picks: 2, speed: 2, pickTime: 3, seed: 0 }, layouts: [{ id: 'one', name: 'One', width: 12, height: 12, aisle: 1, depot: { x: 0, y: 0 }, racks: [{ sku: 'A', x: 4, y: 4, w: 1, h: 1, side: 'N', weight: 1 }] }] };
}
test('Warehouse hand calculation: return trip, repeated picks, and time', () => {
  // Depot (0.5,0.5) to north face (4.5,3.5): 7 m each way.
  const r = warehouse.simulate(small()).results[0];
  assert.equal(r.distance.mean, 14); assert.equal(r.travel.mean, 7); assert.equal(r.total.mean, 13);
  assert.equal(r.distance.min, r.distance.max);
  assert.deepEqual(r.frequency, [{ sku: 'A', picks: 20, visits: 10 }]);
  assert.equal(r.examples[0].points.length - 1, 14);
});
test('Warehouse repeated A* searches match independent breadth-first reference', () => {
  const prepared = warehouse.prepare(warehouse.sample().layouts[0]);
  function bfs(start, end) {
    const queue = [[start.x, start.y, 0]], seen = new Set([`${start.x},${start.y}`]);
    for (let head = 0; head < queue.length; head++) {
      const [x, y, d] = queue[head]; if (x === end.x && y === end.y) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
        if (prepared.grid[nx]?.[ny] && !seen.has(key)) { seen.add(key); queue.push([nx, ny, d + 1]); }
      }
    }
    return Infinity;
  }
  prepared.points.forEach((a, i) => prepared.points.forEach((b, j) => {
    const route = prepared.path(i, j); assert.equal(route.length - 1, bfs(a, b));
    route.forEach((p) => assert.equal(prepared.grid[p.x][p.y], 1));
  }));
});
test('Warehouse realistic weighted demand is reproducible and identical across duplicate layouts', () => {
  const p = warehouse.sample(); p.layouts.push({ ...structuredClone(p.layouts[0]), id: 'two', name: 'Copy' });
  const a = warehouse.simulate(p), b = warehouse.simulate(p);
  assert.deepEqual(a.results, b.results); assert.deepEqual(a.results[0].distances, a.results[2].distances);
  assert.equal(a.results[2].distanceImprovement, 0);
  assert.ok(a.results[2].diagnostics.some((d) => d.title.includes('simulation noise')));
  assert.ok(a.assumptions.length);
  assert.ok(a.results[0].frequency.find((f) => f.sku === 'SKU-A1').picks > a.results[0].frequency.find((f) => f.sku === 'SKU-F5').picks * 5);
  assert.equal(a.results[0].frequency.reduce((s, r) => s + r.picks, 0), 15000);
});
test('Warehouse known improvement and zero-baseline boundary', () => {
  const p = small(), copy = structuredClone(p.layouts[0]); copy.id = 'two'; copy.racks[0].x = 2; p.layouts.push(copy);
  assert.ok(Math.abs(warehouse.simulate(p).results[1].distanceImprovement - 100 * 4 / 14) < 1e-10);
  const zero = small(); zero.layouts[0].depot = { x: 4, y: 3 }; zero.settings.pickTime = 0;
  const r = warehouse.simulate(zero).results[0]; assert.equal(r.distance.mean, 0); assert.equal(r.timeImprovement, null);
});
test('Warehouse rejects invalid numbers, overlap, inaccessible faces, mismatched demand and oversized jobs', () => {
  const mutations = [
    (p) => { p.settings.speed = ''; }, (p) => { p.settings.orders = 20001; }, (p) => { p.settings.seed = -1; },
    (p) => { p.layouts[0].racks[0].weight = -1; }, (p) => { p.layouts[0].racks[0].weight = 0; },
    (p) => { p.layouts[0].racks[0].x = 12; }, (p) => { p.layouts[0].racks.push({ ...p.layouts[0].racks[0], sku: 'B' }); },
    (p) => { p.layouts[0].racks[0].y = 0; },
    (p) => { p.layouts.push({ ...structuredClone(p.layouts[0]), id: 'two' }); p.layouts[1].racks[0].weight = 2; }
  ];
  mutations.forEach((mutate) => { const p = small(); mutate(p); assert.throws(() => warehouse.simulate(p)); });
  const wall = small(); wall.layouts[0].racks[0] = { sku: 'A', x: 4, y: 0, w: 1, h: 12, side: 'E', weight: 1 };
  assert.throws(() => warehouse.simulate(wall), /no aisle route/);
});
test('Warehouse aisle clearance changes feasibility; zero-weight SKUs never get drawn', () => {
  const p = small(); p.layouts[0].racks.push({ sku: 'B', x: 8, y: 4, w: 1, h: 1, side: 'N', weight: 0 });
  assert.equal(warehouse.simulate(p).results[0].frequency[1].picks, 0);
  p.layouts[0].aisle = 2; assert.throws(() => warehouse.simulate(p), /start point.*blocked/);
});
test('Warehouse unique locations support repeated SKUs and split stock without duplicating demand', () => {
  const p = warehouse.project(small()); p.settings.orders = 1; p.settings.picks = 3;
  const l = p.layouts[0]; l.locations[0].id = 'Near'; l.locations[0].assignments[0].quantity = 1;
  l.locations.push({ ...structuredClone(l.locations[0]), id: 'Far', x: 8, assignments: [{ sku: 'A', quantity: 3 }] });
  const r = warehouse.simulate(p).results[0];
  assert.equal(r.distance.mean, 22); // 7 m to near, 4 m onward, 11 m home.
  assert.equal(r.frequency[0].picks, 3);
  assert.deepEqual(r.examples[0].stops.map((s) => [s.location, s.picked[0].quantity]), [['Near', 1], ['Far', 2]]);
  assert.deepEqual(r.locationFrequency, [{ location: 'Near', picks: 1, visits: 1 }, { location: 'Far', picks: 2, visits: 1 }]);
  l.locations[1].id = 'Near'; assert.throws(() => warehouse.simulate(p), /Duplicate location/);
});
test('Warehouse separate drop-off uses end point and shared points remain synchronized', () => {
  const p = warehouse.project(small()), l = p.layouts[0];
  l.samePoint = false; l.end = { x: 4, y: 3 };
  assert.equal(warehouse.simulate(p).results[0].distance.mean, 7);
  l.samePoint = true; assert.equal(warehouse.project(p).layouts[0].end.x, 0);
  assert.equal(warehouse.simulate(p).results[0].distance.mean, 14);
});
test('Warehouse version 1 migration preserves demand and per-order stock resets', () => {
  const p = warehouse.project(small()); assert.equal(p.version, 2); assert.equal(p.layouts[0].locations[0].id, 'LOC-1');
  p.layouts[0].locations[0].assignments[0].quantity = 2;
  assert.equal(warehouse.simulate(p).results[0].frequency[0].picks, 20);
  p.layouts[0].locations[0].assignments[0].quantity = 1;
  assert.throws(() => warehouse.simulate(p), /insufficient available/);
});
test('Warehouse dense samples have 30 aisle bays and identical fixed sequences', () => {
  const p = warehouse.sample(); assert.equal(p.layouts.length, 2);
  assert.equal(p.layouts[0].locations.length, 30);
  assert.deepEqual(p.layouts[0].locations.slice(0, 5).map((r) => r.id), ['A1','A2','A3','A4','A5']);
  const r = warehouse.simulate(p); assert.deepEqual(r.results[0].frequency, r.results[1].frequency);
  assert.deepEqual(r.results[0].examples.map((e) => e.order), r.results[1].examples.map((e) => e.order));
  assert.deepEqual(r.results[0].examples.map((e) => e.sequence), r.results[1].examples.map((e) => e.sequence));
  r.results.forEach((x) => assert.equal(x.locationFrequency.reduce((s, f) => s + f.picks, 0), 15000));
});
test('Warehouse fixed mode sorts locations and consolidates repeated picks across geometries', () => {
  const p = warehouse.project(small()), l = p.layouts[0];
  l.locations[0].id = 'A1'; l.locations.push({ ...structuredClone(l.locations[0]), id: 'B1', x: 8, assignments: [{ sku: 'B', quantity: 30 }] });
  const model = warehouse.prepare(l), order = ['B', 'A', 'B'];
  const stops = warehouse.fixedStops(model, order);
  assert.deepEqual(stops.map((s) => s.location), ['A1','B1']);
  assert.equal(stops[1].picked[0].quantity, 2);
  const trip = warehouse.fixedRoute(model, stops, true);
  assert.equal(trip.distance, 22); // 7 to A1, 4 to B1, 11 home.
  const copy = structuredClone(l); copy.locations[0].x = 2;
  assert.deepEqual(warehouse.fixedRoute(warehouse.prepare(copy), stops).sequence, trip.sequence);
  copy.locations[1].assignments[0].quantity = 1;
  assert.throws(() => warehouse.fixedRoute(warehouse.prepare(copy), stops), /fixed sequence requires/);
  copy.locations[1].id = 'Other';
  assert.throws(() => warehouse.fixedRoute(warehouse.prepare(copy), stops), /missing/);
});
test('Warehouse fixed sequence matches alphabetical example and numeric bay ordering', () => {
  const model = warehouse.prepare(warehouse.sample().layouts[0]);
  const stops = warehouse.fixedStops(model, ['SKU-B5','SKU-B1','SKU-D4','SKU-C2','SKU-A2']);
  assert.deepEqual(stops.map((s) => s.location), ['A2','B1','B5','C2','D4']);
  const l = warehouse.project(small()).layouts[0];
  l.locations[0].id = 'A10';
  l.locations.push({ ...structuredClone(l.locations[0]), id: 'A2', x: 8, assignments: [{ sku: 'B', quantity: 30 }] });
  assert.deepEqual(warehouse.fixedStops(warehouse.prepare(l), ['A','B']).map((s) => s.location), ['A2','A10']);
});
test('Warehouse sequence mode validates and nearest mode still works independently', () => {
  const p = warehouse.sample(); p.settings.sequenceMode = 'bad'; assert.throws(() => warehouse.simulate(p), /sequence mode/);
  p.settings.sequenceMode = 'nearest'; p.settings.orders = 100;
  assert.ok(warehouse.simulate(p).results.every((r) => r.distance.mean > 0));
  assert.equal(warehouse.project(small()).settings.sequenceMode, 'nearest');
});
test('Warehouse batch fallback equals synchronous calculation at maximum order count', () => {
  const p = small(); p.settings.orders = 20000;
  const iterator = warehouse.simulateSteps(p); let last, batches = 0;
  do { last = iterator.next(); batches++; } while (!last.done);
  assert.ok(batches > 100); assert.deepEqual(last.value.results, warehouse.simulate(p).results);
  assert.equal(last.value.results[0].distances.length, 20000);
});

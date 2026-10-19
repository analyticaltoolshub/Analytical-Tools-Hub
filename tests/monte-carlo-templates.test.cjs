const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../calculation-core/monte-carlo.js');
const context = vm.createContext({ window: {}, document: { addEventListener() {} } });
vm.runInContext(fs.readFileSync(require.resolve('../Monte_Carlo_Risk_Simulation/monte-carlo.js'), 'utf8') + '\nthis.models = templates;', context);
const cases = {
  profit: [{ Selling_Price: 50, Variable_Cost: 30, Demand: 10000, Fixed_Cost: 150000 }, 50000],
  cost: [{ Labour_Cost: 100, Material_Cost: 200, Equipment_Cost: 50, Contingency_Cost: 25 }, 375],
  inventory: [{ Opening_Inventory: 100, Replenishment_Quantity: 200, Demand: 350 }, -50],
  leadTimeStockout: [{ Opening_Inventory: 1000, Daily_Demand: 85, Supplier_Lead_Time: 10, Receiving_Delay: 2, Backlog: 40, Reserved_Stock: 60 }, -120],
  transportCost: [{ Base_Freight: 4000, Fuel_Surcharge: 600, Accessorial_Cost: 250, Delay_Cost: 500 }, 5350],
  cashFlow: [{ Cash_Inflows: 900, Operating_Cost: 550, Capital_Spend: 100, Debt_Service: 90 }, 160],
  procurementCost: [{ Unit_Price: 100, Purchase_Quantity: 10000, Expediting_Cost: 35000, Quality_Failure_Cost: 15000 }, 1050000],
  supplierDelay: [{ Actual_Lead_Time: 10, Required_Lead_Time: 12 }, -2],
  warehouseCapacity: [{ Opening_Stock: 3500, Inbound_Quantity: 5000, Outbound_Demand: 2500 }, 6000],
  productionYield: [{ Planned_Production: 10000, Yield_Rate: 95, Downtime_Loss: 300 }, 9215],
  custom: [{ A: 10, B: 5 }, 15]
};
for (const [key, [values, expected]] of Object.entries(cases)) {
  test(`Monte Carlo ${key} template matches independent arithmetic and runs reproducibly`, async () => {
    const model = context.models[key];
    assert.equal(core.evaluateFormula(model.formula, values), expected);
    assert.deepEqual(Object.keys(values).sort(), Array.from(model.variables, v => v.id).sort());
    const config = { ...model, iterations: 1000, seed: 12345, confidenceLevel: 90 };
    const first = await core.runSimulation(config);
    const second = await core.runSimulation(config);
    assert.equal(first.invalidCount, 0);
    assert.deepEqual(first.summary, second.summary);
  });
}
test('Lead-time optional zero inputs preserve the original formula and buffer direction', () => {
  const model = context.models.leadTimeStockout;
  for (const demand of [80, 100, 120]) {
    const balance = core.evaluateFormula(model.formula, { Opening_Inventory: 1000, Daily_Demand: demand, Supplier_Lead_Time: 10, Receiving_Delay: 0, Backlog: 0, Reserved_Stock: 0 });
    assert.equal(balance, 1000 - demand * 10);
    assert.equal(core.targetPass(balance, 0, 'gte'), demand <= 100);
  }
});

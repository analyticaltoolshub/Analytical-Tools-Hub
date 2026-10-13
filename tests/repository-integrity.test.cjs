const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
test('legacy tool URLs migrate to underscore paths and preserve suffixes', () => {
  const paths = require('../tool-paths.js');
  assert.equal(paths.migrate('ABC%20Analysis/ABC_Analysis.html'), 'ABC_Analysis/ABC_Analysis.html');
  assert.equal(paths.migrate('/Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html?x=1#results'), '/Safety_Stock_%26_Reorder_Point/Safety_Stock_Reorder_Point.html?x=1#results');
  assert.equal(paths.migrate('/unknown/page.html'), '/unknown/page.html');
  assert.equal(paths.migrate('/%invalid/page.html'), '/%invalid/page.html');
});

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules") return [];
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(location) : [location];
  });
}

test("all JavaScript files pass a syntax check", () => {
  const scripts = walk(root).filter((file) => file.endsWith(".js") || file.endsWith(".cjs"));
  scripts.forEach((file) => {
    assert.doesNotThrow(
      () => new vm.Script(fs.readFileSync(file, "utf8"), { filename: file }),
      `${path.relative(root, file)} should contain valid JavaScript`
    );
  });
});

test("local HTML links and script sources resolve to files", () => {
  const pages = walk(root).filter((file) => file.endsWith(".html"));
  const missing = [];

  pages.forEach((page) => {
    const html = fs.readFileSync(page, "utf8");
    const references = [
      ...html.matchAll(/\bhref=["']([^"'#][^"']*)["']/gi),
      ...html.matchAll(/\bsrc=["']([^"']+)["']/gi),
    ];
    references.forEach((match) => {
      const reference = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference)) return;
      const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]);
      const destination = path.resolve(path.dirname(page), cleanReference);
      if (!fs.existsSync(destination)) {
        missing.push(`${path.relative(root, page)} -> ${reference}`);
      }
    });
  });

  assert.deepEqual(missing, []);
});

test("every HTML page has one H1 and no duplicate IDs", () => {
  const pages = walk(root).filter((file) => file.endsWith(".html"));
  pages.forEach((page) => {
    const html = fs.readFileSync(page, "utf8");
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.equal(h1Count, 1, `${path.relative(root, page)} should have exactly one H1`);
    assert.deepEqual([...new Set(duplicates)], [], `${path.relative(root, page)} should not contain duplicate IDs`);
  });
});

test("production pages load the tested calculation modules before their UI scripts", () => {
  const expected = {
    "Warehouse_Layout_Simulation/Warehouse_Layout_Simulation.html": ["../calculation-core/warehouse-layout.js", "Warehouse_Layout_Simulation.js"],
    "Break_Even_Analysis/Break_Even_Analysis.html": ["../calculation-core/break-even.js", "Break_Even_Analysis.js"],
    "Economic_Order_Quantity/Economic_Order_Quantity.html": ["../calculation-core/eoq.js", "Economic_Order_Quantity.js"],
    "Safety_Stock_&_Reorder_Point/Safety_Stock_Reorder_Point.html": ["../calculation-core/safety-stock.js", "Safety_Stock_Reorder_Point.js"],
    "Exponential_Smoothing/Exponential_Smoothing.html": ["../calculation-core/exponential-smoothing.js", "Exponential_Smoothing.js"],
    "Analytic_Hierarchy_Process/Analytic_Hierarchy_Process.html": ["../calculation-core/ahp.js", "Analytic_Hierarchy_Process.js"],
    "ABC_Analysis/ABC_Analysis.html": ["../calculation-core/abc.js", "ABC_Analysis.js"],
    "Gantt_Chart/Gantt_Chart.html": ["../calculation-core/gantt.js", "Gantt_Chart.js"],
    "Interpretive_Structural_Modeling/Interpretive_Structural_Modeling.html": ["../calculation-core/ism.js", "Interpretive_Structural_Modeling.js"],
    "Kraljic_Matrix/Kraljic_Matrix.html": ["../calculation-core/kraljic.js", "Kraljic_Matrix.js"],
    "Monte_Carlo_Risk_Simulation/Monte_Carlo_Risk_Simulation.html": ["../calculation-core/monte-carlo.js", "monte-carlo.js"],
    "Newsvendor_Model_Optimizer/Newsvendor_Model_Optimizer.html": ["../calculation-core/newsvendor.js", "Newsvendor_Model_Optimizer.js"],
    "Data_Envelopment_Analysis/Data_Envelopment_Analysis.html": ["../calculation-core/dea.js", "Data_Envelopment_Analysis.js"],
    "Multivariate_Input-Output_Estimator/Multivariate_Input_Output_Estimator.html": ["../calculation-core/multivariate-estimator.js", "Multivariate_Input_Output_Estimator.js"],
    "Supply_Chain_Network_Optimizer/Supply_Chain_Network_Optimizer.html": ["../calculation-core/supply-chain-network.js", "Supply_Chain_Network_Optimizer.js"],
  };

  Object.entries(expected).forEach(([relativePage, scripts]) => {
    const html = fs.readFileSync(path.join(root, relativePage), "utf8");
    const firstIndex = html.indexOf(`src="${scripts[0]}"`);
    const secondIndex = html.indexOf(`src="${scripts[1]}"`);
    assert.ok(firstIndex >= 0, `${relativePage} should load ${scripts[0]}`);
    assert.ok(secondIndex > firstIndex, `${scripts[0]} should load before ${scripts[1]}`);
  });
});

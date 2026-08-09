const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

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
    "Break Even Analysis/Break_Even_Analysis.html": ["../calculation-core/break-even.js", "Break_Even_Analysis.js"],
    "Economic Order Quantity/Economic_Order_Quantity.html": ["../calculation-core/eoq.js", "Economic_Order_Quantity.js"],
    "Safety Stock & Reorder Point/Safety_Stock_Reorder_Point.html": ["../calculation-core/safety-stock.js", "Safety_Stock_Reorder_Point.js"],
    "Exponential Smoothing/Exponential_Smoothing.html": ["../calculation-core/exponential-smoothing.js", "Exponential_Smoothing.js"],
    "Analytic Hierarchy Process/Analytic_Hierarchy_Process.html": ["../calculation-core/ahp.js", "Analytic_Hierarchy_Process.js"],
  };

  Object.entries(expected).forEach(([relativePage, scripts]) => {
    const html = fs.readFileSync(path.join(root, relativePage), "utf8");
    const firstIndex = html.indexOf(`src="${scripts[0]}"`);
    const secondIndex = html.indexOf(`src="${scripts[1]}"`);
    assert.ok(firstIndex >= 0, `${relativePage} should load ${scripts[0]}`);
    assert.ok(secondIndex > firstIndex, `${scripts[0]} should load before ${scripts[1]}`);
  });
});

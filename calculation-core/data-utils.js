(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ATHData = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function number(value, label = 'Value', minimum = -Infinity) {
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') throw new Error(`${label} is required.`);
    const result = Number(value);
    if (!Number.isFinite(result) || result < minimum) throw new Error(`${label} must be a finite number${Number.isFinite(minimum) ? ` at least ${minimum}` : ''}.`);
    return result;
  }

  function series(values, trimTrailing = true) {
    const entries = [...values];
    if (entries.length > 10000) throw new Error('Use at most 10,000 periods.');
    if (trimTrailing) while (entries.length && String(entries[entries.length - 1] ?? '').trim() === '') entries.pop();
    return entries.map((value, index) => number(value, `Period ${index + 1}`, 0));
  }

  function snapshot(value) {
    if (!value || typeof value !== 'object') return value;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error('Snapshots accept plain data objects and arrays only.');
    const copy = Array.isArray(value) ? value.map(snapshot) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]));
    return Object.freeze(copy);
  }

  function csv(rows) {
    return rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  return { number, series, snapshot, csv };
}));

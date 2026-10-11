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

  function parseCsv(text) {
    if (typeof text !== 'string') throw new Error('CSV text is required.');
    const rows = []; let row = [], cell = '', quoted = false, closed = false;
    const source = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (quoted) {
        if (char === '"') { if (source[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
        else cell += char;
      } else if (char === ',' || char === '\n' || char === '\r') {
        row.push(cell); cell = ''; closed = false;
        if (char !== ',') { rows.push(row); row = []; if (char === '\r' && source[i + 1] === '\n') i++; }
      } else if (char === '"') {
        if (cell.length || closed) throw new Error('CSV quotes must surround a complete field.');
        quoted = true;
      } else {
        if (closed) { if (!/\s/.test(char)) throw new Error('Unexpected text after a quoted CSV field.'); }
        else cell += char;
      }
    }
    if (quoted) throw new Error('CSV has an unclosed quoted field.');
    if (cell.length || row.length || closed) { row.push(cell); rows.push(row); }
    return rows;
  }
  return { number, series, snapshot, csv, parseCsv };
}));

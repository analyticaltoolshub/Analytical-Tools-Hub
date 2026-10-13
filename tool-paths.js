(function (root) {
  'use strict';
  const folders = ['ABC Analysis', 'Analytic Hierarchy Process', 'Break Even Analysis', 'Data Envelopment Analysis', 'Economic Order Quantity', 'Exponential Smoothing', 'Gantt Chart', 'Interpretive Structural Modeling', 'Kraljic Matrix', 'Monte Carlo Risk Simulation', 'Multivariate Input-Output Estimator', 'Newsvendor Model Optimizer', 'Safety Stock & Reorder Point', 'Supply Chain Network Optimizer', 'Warehouse Layout Simulation'];
  function migrate(url) {
    if (typeof url !== 'string') return url;
    const leading = url.startsWith('/') ? '/' : '';
    const path = url.slice(leading.length), slash = path.indexOf('/');
    if (slash < 0) return url;
    let folder;
    try { folder = decodeURIComponent(path.slice(0, slash)); } catch (_) { return url; }
    return folders.includes(folder) ? `${leading}${encodeURIComponent(folder.replace(/ /g, '_'))}${path.slice(slash)}` : url;
  }
  const api = { migrate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ATHPaths = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));

'use strict';
self.window = self; // The pinned UMD routing library uses window for browser exports.
importScripts('../assets/vendor/astar-0.4.1.js', '../calculation-core/data-utils.js', '../calculation-core/warehouse-layout.js');
self.onmessage = function (event) {
  try {
    const result = ATHWarehouse.simulate(event.data, (value) => self.postMessage({ type: 'progress', value }));
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};

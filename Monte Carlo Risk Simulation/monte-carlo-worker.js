'use strict';

importScripts('../calculation-core/monte-carlo.js');

let cancelled = false;

self.onmessage = (event) => {
  const { type, config } = event.data || {};

  if (type === 'cancel') {
    cancelled = true;
    return;
  }

  if (type !== 'run') return;

  cancelled = false;
  ATHMonteCarlo.runSimulation(
    config,
    (message) => self.postMessage(message),
    () => cancelled
  ).catch((error) => {
    self.postMessage({
      type: 'error',
      message: error.message || 'Simulation failed.'
    });
  });
};

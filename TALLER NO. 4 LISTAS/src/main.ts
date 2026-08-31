import { OrderProcess } from './domain/order-process.js';
import { renderLanes, updateAdvanceButton, updateStatus } from './ui/render.js';
import { setupControls } from './ui/controls.js';

/**
 * Bootstrap: instantiates OrderProcess and hooks up UI.
 */
function main(): void {
  const process = new OrderProcess();

  // Set up controls (also does initial render with edit support)
  setupControls(process);

  // Initial button state
  updateAdvanceButton(process.canAdvance(), process.isFinished());

  // Mark first step as active
  const firstStep = process.currentStep();
  if (firstStep) {
    updateStatus(`Ready: ${firstStep.action} (${firstStep.lane})`);
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

import { OrderProcess } from './domain/order-process.js';
import { updateAdvanceButton, updateStatus, } from './ui/render.js';
import { setupControls } from './ui/controls.js';
import { setupOrderEditor } from './ui/order-editor.js';
/**
 * Bootstrap: instantiates OrderProcess and hooks up UI.
 */
function main() {
    const process = new OrderProcess();
    const orderEditorContainer = document.getElementById('order-editor');
    // Set up order editor
    let orderEditor = null;
    if (orderEditorContainer) {
        orderEditor = setupOrderEditor(orderEditorContainer, process.getOrderItemService(), () => {
            // Refresh lanes when items change (optional visual feedback)
            setupControls(process, () => orderEditor?.render());
        });
    }
    // Set up controls (also does initial render with edit support)
    setupControls(process, () => orderEditor?.render());
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
}
else {
    main();
}

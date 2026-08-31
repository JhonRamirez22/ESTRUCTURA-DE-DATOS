import { StepEditor } from './editor.js';
import { renderLanes, updateStepVisual, showReceipt, hideReceipt, showError, updateStatus, updateAdvanceButton, } from './render.js';
/**
 * Sets up the control button listeners and the step editor.
 */
export function setupControls(process) {
    const btnAdvance = document.getElementById('btn-advance');
    const btnReset = document.getElementById('btn-reset');
    // Initialize editor
    const editor = new StepEditor();
    editor.setAllSteps(process.getAllSteps());
    editor.onSubmit_((data) => {
        // For now, the editor is display-only (the model uses const STEPS).
        // This shows the modal works; mutations could be wired to a mutable model later.
        renderLanes(process, handleEdit);
        updateAdvanceButton(process.canAdvance(), process.isFinished());
        updateStatus(`Updated: ${data.action}`);
    });
    function handleEdit(stepId) {
        const steps = process.getAllSteps();
        const step = steps.find((s) => s.id === stepId);
        if (step) {
            editor.open({
                id: step.id,
                action: step.action,
                description: step.description,
                lane: step.lane,
                dependsOn: [...step.dependsOn],
            });
        }
    }
    // Initial render with edit support
    renderLanes(process, handleEdit);
    if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
            try {
                const completedStep = process.advance();
                // Visually update the completed step
                updateStepVisual(process, completedStep.id);
                // If there's a next step, update it too
                const nextStep = process.currentStep();
                if (nextStep) {
                    updateStepVisual(process, nextStep.id);
                }
                // If "calculate-total" was completed, show receipt
                if (completedStep.id === 'calculate-total') {
                    const receipt = process.getReceipt();
                    showReceipt(receipt);
                    updateStatus('Receipt generated');
                }
                else if (process.isFinished()) {
                    updateStatus('Process completed');
                }
                else {
                    const next = process.currentStep();
                    updateStatus(next
                        ? `Next: ${next.action} (${next.lane})`
                        : 'Process completed');
                }
                // Update button state
                updateAdvanceButton(process.canAdvance(), process.isFinished());
            }
            catch (e) {
                showError(e.message);
            }
        });
    }
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            process.reset();
            hideReceipt();
            renderLanes(process, handleEdit);
            updateStatus('Process restarted');
            updateAdvanceButton(process.canAdvance(), process.isFinished());
        });
    }
}

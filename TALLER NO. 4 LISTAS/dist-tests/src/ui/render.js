import { LANES } from '../domain/process-step.js';
/**
 * Renders the 4 swimlane columns on the DOM.
 * Each step is displayed as a card with visual state and an edit button.
 */
export function renderLanes(process, onEdit) {
    const container = document.getElementById('swimlanes');
    if (!container)
        return;
    container.innerHTML = '';
    for (const lane of LANES) {
        const laneEl = document.createElement('div');
        laneEl.className = `lane lane--${lane.toLowerCase()}`;
        const header = document.createElement('div');
        header.className = 'lane__header';
        header.textContent = lane;
        laneEl.appendChild(header);
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'lane__steps';
        const steps = process.getStepsByLane(lane);
        for (const step of steps) {
            const stepEl = document.createElement('div');
            const state = process.getStepState(step.id);
            stepEl.className = `step step--${state}`;
            stepEl.setAttribute('data-step-id', step.id);
            const content = document.createElement('div');
            content.className = 'step__content';
            const action = document.createElement('div');
            action.className = 'step__action';
            action.textContent = step.action;
            const desc = document.createElement('div');
            desc.className = 'step__description';
            desc.textContent = step.description;
            const stateIcon = document.createElement('div');
            stateIcon.className = 'step__state-icon';
            content.appendChild(action);
            content.appendChild(desc);
            content.appendChild(stateIcon);
            const editBtn = document.createElement('button');
            editBtn.className = 'step__edit-btn';
            editBtn.setAttribute('aria-label', `Edit ${step.action}`);
            editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                onEdit?.(step.id);
            });
            stepEl.appendChild(content);
            stepEl.appendChild(editBtn);
            stepsContainer.appendChild(stepEl);
        }
        laneEl.appendChild(stepsContainer);
        container.appendChild(laneEl);
    }
}
/**
 * Updates the visual state of a specific step.
 */
export function updateStepVisual(process, stepId) {
    const container = document.getElementById('swimlanes');
    if (!container)
        return;
    const state = process.getStepState(stepId);
    const stepEl = container.querySelector(`[data-step-id="${stepId}"]`);
    if (stepEl) {
        stepEl.className = `step step--${state}`;
    }
}
/**
 * Shows the receipt in the corresponding panel.
 */
export function showReceipt(receipt) {
    const panel = document.getElementById('receipt-panel');
    const content = document.getElementById('receipt-content');
    if (!panel || !content || !receipt)
        return;
    const itemsHtml = receipt.items.length > 0
        ? receipt.items.map((item) => `
      <div class="receipt__item-row">
        <span>${item.name} x${item.quantity}</span>
        <span>$${(item.quantity * item.unitPrice).toFixed(2)}</span>
      </div>
    `).join('')
        : '<div class="receipt__item-row receipt__item-row--empty"><span>No items added</span></div>';
    content.innerHTML = `
    <div class="receipt__meta">
      <span>Order:</span>
      <span class="receipt__item-value">${receipt.order}</span>
    </div>
    <div class="receipt__meta">
      <span>Date:</span>
      <span>${receipt.date}</span>
    </div>
    <div class="receipt__divider"></div>
    <div class="receipt__items-header">
      <span>Item</span>
      <span>Price</span>
    </div>
    ${itemsHtml}
    <div class="receipt__divider"></div>
    <div class="receipt__line">
      <span>Subtotal</span>
      <span>$${receipt.subtotal.toFixed(2)}</span>
    </div>
    <div class="receipt__line">
      <span>Tax (${(receipt.taxRate * 100).toFixed(0)}%)</span>
      <span>$${receipt.tax.toFixed(2)}</span>
    </div>
    <div class="receipt__total">
      <span>TOTAL</span>
      <span>$${receipt.total.toFixed(2)}</span>
    </div>
  `;
    panel.classList.remove('receipt-panel--hidden');
}
/**
 * Hides the receipt panel.
 */
export function hideReceipt() {
    const panel = document.getElementById('receipt-panel');
    if (panel) {
        panel.classList.add('receipt-panel--hidden');
    }
}
/**
 * Shows a temporary error toast.
 */
export function showError(message) {
    const toast = document.getElementById('error-toast');
    const msgEl = document.getElementById('error-message');
    if (!toast || !msgEl)
        return;
    msgEl.textContent = message;
    toast.classList.remove('toast--hidden');
    setTimeout(() => {
        toast.classList.add('toast--hidden');
    }, 3000);
}
/**
 * Updates the status text.
 */
export function updateStatus(text) {
    const el = document.getElementById('status-text');
    if (el)
        el.textContent = text;
}
/**
 * Updates the advance button state.
 */
export function updateAdvanceButton(canAdvance, isFinished) {
    const btn = document.getElementById('btn-advance');
    if (!btn)
        return;
    btn.disabled = isFinished || !canAdvance;
}

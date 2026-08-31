import { OrderProcess } from '../domain/order-process.js';
import { LANES } from '../domain/process-step.js';

const LANE_ICONS: Record<string, string> = {
  Cliente: '<svg class="lane__header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  Mozo: '<svg class="lane__header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  Cocina: '<svg class="lane__header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M5 15h14M9 15v6h6v-6"/></svg>',
  Caja: '<svg class="lane__header-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="18" y1="5" x2="18" y2="19"/></svg>',
};

const LANE_STEP_ICONS: Record<string, string> = {
  Cliente: '<svg class="step__lane-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>',
  Mozo: '<svg class="step__lane-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  Cocina: '<svg class="step__lane-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M5 15h14M9 15v6h6v-6"/></svg>',
  Caja: '<svg class="step__lane-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="18" y1="5" x2="18" y2="19"/></svg>',
};



/**
 * Renders the 4 swimlane columns on the DOM.
 * Each step is displayed as a card with visual state and an edit button.
 */
export function renderLanes(process: OrderProcess, onEdit?: (stepId: string) => void): void {
  const container = document.getElementById('swimlanes');
  if (!container) return;

  container.innerHTML = '';

  for (const lane of LANES) {
    const laneEl = document.createElement('div');
    laneEl.className = `lane lane--${lane.toLowerCase()}`;

    const header = document.createElement('div');
    header.className = 'lane__header';
    header.innerHTML = `${LANE_ICONS[lane] || ''}<span>${lane}</span>`;
    laneEl.appendChild(header);

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'lane__steps';

    const steps = process.getStepsByLane(lane);
    for (const step of steps) {
      const stepEl = document.createElement('div');
      const state = process.getStepState(step.id);
      stepEl.className = `step step--${state}`;
      stepEl.setAttribute('data-step-id', step.id);
      stepEl.setAttribute('data-lane', lane.toLowerCase());

      const content = document.createElement('div');
      content.className = 'step__content';

      const action = document.createElement('div');
      action.className = 'step__action';
      action.textContent = step.action;

      const desc = document.createElement('div');
      desc.className = 'step__description';
      desc.textContent = step.description;

      // Lane-specific icon on step card
      const laneIcon = document.createElement('div');
      laneIcon.className = 'step__lane-icon-container';
      laneIcon.innerHTML = LANE_STEP_ICONS[lane] || '';

      // State icon (active pulse, waiting clock/bell)
      const stateIcon = document.createElement('div');
      stateIcon.className = 'step__state-icon';

      content.appendChild(laneIcon);
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

const CASHIER_WAITING_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

/**
 * Updates the visual state of a specific step.
 */
export function updateStepVisual(process: OrderProcess, stepId: string): void {
  const container = document.getElementById('swimlanes');
  if (!container) return;

  const state = process.getStepState(stepId);
  const stepEl = container.querySelector(`[data-step-id="${stepId}"]`);

  if (stepEl) {
    stepEl.className = `step step--${state}`;

    // Update Caja waiting state icon to bell
    const htmlStepEl = stepEl as HTMLElement;
    if (state === 'waiting' && htmlStepEl.dataset.lane === 'caja') {
      const stateIcon = stepEl.querySelector('.step__state-icon');
      if (stateIcon) {
        stateIcon.innerHTML = CASHIER_WAITING_ICON;
      }
    }
  }
}

/**
 * Shows the receipt in the corresponding panel.
 */
export function showReceipt(receipt: ReturnType<OrderProcess['getReceipt']>): void {
  const panel = document.getElementById('receipt-panel');
  const content = document.getElementById('receipt-content');
  if (!panel || !content || !receipt) return;

  const itemsHtml = receipt.items.length > 0
    ? receipt.items.map((item) => `
      <div class="receipt__item-row">
        <span class="receipt__item-name">${item.name}</span>
        <div class="receipt__item-qty-price">
          <span class="receipt__item-qty">x${item.quantity} @ $${item.unitPrice.toFixed(2)}</span>
          <span class="receipt__item-total">$${(item.quantity * item.unitPrice).toFixed(2)}</span>
        </div>
      </div>
    `).join('')
    : '<div class="receipt__item-row receipt__item-row--empty"><span>No items added</span></div>';

  content.innerHTML = `
    <div class="receipt__meta">
      <span class="receipt__meta-label">Order:</span>
      <span class="receipt__meta-value">${receipt.order}</span>
    </div>
    <div class="receipt__meta">
      <span class="receipt__meta-label">Date:</span>
      <span class="receipt__meta-value">${receipt.date}</span>
    </div>
    <div class="receipt__divider"></div>
    <div class="receipt__items-header">
      <span>Item</span>
      <span>Total</span>
    </div>
    ${itemsHtml}
    <div class="receipt__divider"></div>
    <div class="receipt__line receipt__line--subtotal">
      <span>Subtotal</span>
      <span>$${receipt.subtotal.toFixed(2)}</span>
    </div>
    <div class="receipt__line receipt__line--tax">
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
export function hideReceipt(): void {
  const panel = document.getElementById('receipt-panel');
  if (panel) {
    panel.classList.add('receipt-panel--hidden');
  }
}

/**
 * Shows a temporary error toast.
 */
export function showError(message: string): void {
  const toast = document.getElementById('error-toast');
  const msgEl = document.getElementById('error-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('toast--hidden');

  setTimeout(() => {
    toast.classList.add('toast--hidden');
  }, 3000);
}

/**
 * Updates the status text.
 */
export function updateStatus(text: string): void {
  const el = document.getElementById('status-text');
  if (el) el.textContent = text;
}

/**
 * Updates the advance button state.
 */
export function updateAdvanceButton(canAdvance: boolean, isFinished: boolean): void {
  const btn = document.getElementById('btn-advance') as HTMLButtonElement;
  if (!btn) return;

  btn.disabled = isFinished || !canAdvance;
}

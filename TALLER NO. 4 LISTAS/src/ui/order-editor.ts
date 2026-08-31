import { OrderItemService, type OrderItem } from '../domain/order-item.js';

/**
 * Creates the order item editor form.
 * Attaches to the #order-editor-container element in the DOM.
 */
export function setupOrderEditor(
  container: HTMLElement,
  service: OrderItemService,
  onItemChange: () => void
): { render: () => void } {
  let editingId: string | null = null;

  function render(): void {
    container.innerHTML = '';

    if (service.isLocked()) {
      container.innerHTML = `
        <div class="order-editor__locked">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Order locked (picked up)</span>
        </div>
      `;
      return;
    }

    const form = document.createElement('form');
    form.className = 'order-editor__form';
    form.addEventListener('submit', (e) => e.preventDefault());

    // Name input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'order-editor__field';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'order-editor__label';
    nameLabel.textContent = 'Item name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'order-editor__input';
    nameInput.placeholder = 'e.g. Pasta, Pizza, Salad...';
    nameInput.maxLength = 100;
    nameInput.setAttribute('aria-label', 'Item name');
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    // Quantity input
    const qtyGroup = document.createElement('div');
    qtyGroup.className = 'order-editor__field';
    const qtyLabel = document.createElement('label');
    qtyLabel.className = 'order-editor__label';
    qtyLabel.textContent = 'Qty';
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'order-editor__input order-editor__input--small';
    qtyInput.min = '1';
    qtyInput.max = '999';
    qtyInput.value = '1';
    qtyInput.setAttribute('aria-label', 'Quantity');
    qtyGroup.appendChild(qtyLabel);
    qtyGroup.appendChild(qtyInput);

    // Price input
    const priceGroup = document.createElement('div');
    priceGroup.className = 'order-editor__field';
    const priceLabel = document.createElement('label');
    priceLabel.className = 'order-editor__label';
    priceLabel.textContent = 'Price';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.className = 'order-editor__input order-editor__input--small';
    priceInput.min = '0';
    priceInput.max = '10000';
    priceInput.step = '0.01';
    priceInput.value = '0';
    priceInput.setAttribute('aria-label', 'Unit price');
    priceGroup.appendChild(priceLabel);
    priceGroup.appendChild(priceInput);

    // Error display
    const errorEl = document.createElement('div');
    errorEl.className = 'order-editor__error';
    errorEl.style.display = 'none';

    // Button row
    const btnRow = document.createElement('div');
    btnRow.className = 'order-editor__btn-row';

    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.className = 'btn btn--primary';
    addBtn.textContent = editingId ? 'Update' : 'Add';
    addBtn.setAttribute('aria-label', editingId ? 'Update item' : 'Add item');

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      render();
    });

    if (editingId) {
      btnRow.appendChild(cancelBtn);
    }
    btnRow.appendChild(addBtn);

    // On submit
    form.addEventListener('submit', () => {
      const name = nameInput.value.trim();
      const quantity = parseInt(qtyInput.value, 10);
      const unitPrice = parseFloat(priceInput.value);

      try {
        if (editingId) {
          service.updateItem(editingId, name, quantity, unitPrice);
          editingId = null;
        } else {
          service.addItem(name, quantity, unitPrice);
        }
        errorEl.style.display = 'none';
        onItemChange();
        render();
      } catch (err) {
        errorEl.textContent = err instanceof Error ? err.message : 'Invalid input';
        errorEl.style.display = 'block';
      }
    });

    form.appendChild(nameGroup);
    form.appendChild(qtyGroup);
    form.appendChild(priceGroup);
    form.appendChild(errorEl);
    form.appendChild(btnRow);
    container.appendChild(form);

    // Item list
    const items = service.getItems();
    if (items.length > 0) {
      const listEl = document.createElement('div');
      listEl.className = 'order-editor__list';

      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'order-editor__item';

        const info = document.createElement('div');
        info.className = 'order-editor__item-info';
        info.innerHTML = `
          <span class="order-editor__item-name">${escapeHtml(item.name)}</span>
          <span class="order-editor__item-meta">${item.quantity} x $${item.unitPrice.toFixed(2)}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'order-editor__item-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'order-editor__icon-btn';
        editBtn.setAttribute('aria-label', `Edit ${item.name}`);
        editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        editBtn.addEventListener('click', () => {
          editingId = item.id;
          nameInput.value = item.name;
          qtyInput.value = String(item.quantity);
          priceInput.value = String(item.unitPrice);
          nameInput.focus();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'order-editor__icon-btn order-editor__icon-btn--danger';
        deleteBtn.setAttribute('aria-label', `Remove ${item.name}`);
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        deleteBtn.addEventListener('click', () => {
          service.removeItem(item.id);
          onItemChange();
          render();
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        row.appendChild(info);
        row.appendChild(actions);
        listEl.appendChild(row);
      }

      container.appendChild(listEl);
    }
  }

  render();
  return { render };
}

/** Escapes HTML entities in a string. */
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

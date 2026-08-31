const TAX_RATE = 0.16;
/**
 * Generates the receipt from the order items.
 * Only called after "calculate-total" executes.
 */
export function generateReceipt(items) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return {
        order: 'ORD-' + Date.now().toString(36).toUpperCase(),
        items,
        subtotal,
        taxRate: TAX_RATE,
        tax,
        total,
        date: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

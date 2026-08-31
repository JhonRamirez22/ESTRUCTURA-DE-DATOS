/**
 * Generates the receipt from the completed steps history.
 * Only called after "calculate-total" executes.
 */
export function generateReceipt(history) {
    const items = history.map((step) => ({
        action: step.action,
        lane: step.lane,
        description: step.description,
    }));
    return {
        order: 'ORD-' + Date.now().toString(36).toUpperCase(),
        items,
        total: '$ ' + (items.length * 12.5).toFixed(2),
        date: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

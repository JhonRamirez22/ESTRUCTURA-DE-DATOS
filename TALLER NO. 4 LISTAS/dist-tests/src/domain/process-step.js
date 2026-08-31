/**
 * Exact process steps from the diagram.
 * Source of truth — do not rename or merge.
 *
 * Fork/join model with dependsOn:
 * - After "pick-up-order" the flow forks: Kitchen (prepare-order)
 *   and Cashier (receive-order) both depend on "pick-up-order".
 * - Before "calculate-total" there is a join: depends on "ask-for-bill"
 *   AND "receive-order".
 * - Trade-off vs explicit graph: simpler, but dependency validation
 *   requires history search (O(n) per step, negligible for 9 steps).
 */
export const STEPS = [
    {
        id: 'request-order',
        lane: 'Customer',
        action: 'Request order',
        description: 'The customer places an order with the waiter',
        dependsOn: [],
    },
    {
        id: 'pick-up-order',
        lane: 'Waiter',
        action: 'Pick up order',
        description: 'The waiter takes the order from the customer',
        dependsOn: ['request-order'],
    },
    {
        id: 'prepare-order',
        lane: 'Kitchen',
        action: 'Prepare order',
        description: 'The kitchen prepares the order',
        dependsOn: ['pick-up-order'],
    },
    {
        id: 'receive-order',
        lane: 'Cashier',
        action: 'Receive order',
        description: 'Cashier receives order notification',
        dependsOn: ['pick-up-order'],
    },
    {
        id: 'serve-order',
        lane: 'Waiter',
        action: 'Serve order',
        description: 'The waiter serves the order to the customer (requires kitchen ready)',
        dependsOn: ['prepare-order'],
    },
    {
        id: 'request-bill',
        lane: 'Customer',
        action: 'Request bill',
        description: 'The customer requests the bill',
        dependsOn: ['serve-order'],
    },
    {
        id: 'ask-for-bill',
        lane: 'Waiter',
        action: 'Ask for bill',
        description: 'The waiter requests the bill from cashier',
        dependsOn: ['request-bill'],
    },
    {
        id: 'calculate-total',
        lane: 'Cashier',
        action: 'Calculate total',
        description: 'Cashier calculates the total and issues the receipt',
        dependsOn: ['ask-for-bill', 'receive-order'],
    },
    {
        id: 'pay-order',
        lane: 'Customer',
        action: 'Pay order',
        description: 'The customer pays and the process ends',
        dependsOn: ['calculate-total'],
    },
];
/** Lanes list for UI iteration. */
export const LANES = ['Customer', 'Waiter', 'Kitchen', 'Cashier'];

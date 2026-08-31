import { LinkedList } from '../data-structures/linked-list.js';
import { STEPS } from './process-step.js';
import { generateReceipt } from './receipt.js';
import { OrderItemService } from './order-item.js';
/**
 * Orchestrates the order service process using linked lists.
 *
 * Modeling decision:
 * Uses a SINGLE LinkedList<ProcessStep> storing steps in sequential order
 * (following the diagram order). Parallelism (fork/join) is modeled
 * exclusively via each ProcessStep's `dependsOn` property:
 * - "prepare-order" and "receive-order" both depend on "pick-up-order" (fork).
 * - "calculate-total" depends on "ask-for-bill" AND "receive-order" (join).
 *
 * Fork/join support:
 * - `getNextReadyStep()` finds the first step whose dependencies are all
 *   completed and that hasn't been completed yet.
 * - Multiple steps can be "ready" simultaneously (fork).
 * - A step is blocked until all its dependencies complete (join).
 * - The UI can query `getReadySteps()` to show all available steps.
 */
export class OrderProcess {
    constructor() {
        this.steps = new LinkedList();
        this.completedSteps = [];
        this.receipt = null;
        this.stepStates = new Map();
        this.orderItems = new OrderItemService();
        // Load all steps into the linked list
        for (const step of STEPS) {
            this.steps.append(step);
            this.stepStates.set(step.id, 'pending');
        }
    }
    /** Returns the OrderItemService for adding/editing order items. */
    getOrderItemService() {
        return this.orderItems;
    }
    /** Returns the set of completed step IDs. */
    getCompletedIds() {
        return new Set(this.completedSteps.map((s) => s.id));
    }
    /**
     * Finds the next step that is ready to execute.
     * A step is ready if:
     * 1. It has not been completed yet
     * 2. All its dependencies are completed
     * Returns the first ready step in STEPS order.
     */
    getNextReadyStep() {
        const completedIds = this.getCompletedIds();
        for (const step of STEPS) {
            if (completedIds.has(step.id))
                continue;
            if (step.dependsOn.every((depId) => completedIds.has(depId))) {
                return step;
            }
        }
        return null;
    }
    /** Returns all steps that are currently ready to execute. */
    getReadySteps() {
        const completedIds = this.getCompletedIds();
        const ready = [];
        for (const step of STEPS) {
            if (completedIds.has(step.id))
                continue;
            if (step.dependsOn.every((depId) => completedIds.has(depId))) {
                ready.push(step);
            }
        }
        return ready;
    }
    /** Returns the current step (the next one that can be executed). */
    currentStep() {
        return this.getNextReadyStep();
    }
    /** Checks whether the next step can be executed (all dependencies fulfilled). */
    canAdvance() {
        return this.getNextReadyStep() !== null;
    }
    /**
     * Advances to the next process step.
     * @throws Error if cannot advance or if process already finished.
     */
    advance() {
        if (this.isFinished()) {
            throw new Error('Process already finished. Use reset() to restart.');
        }
        const step = this.getNextReadyStep();
        if (!step) {
            throw new Error('No steps available or all dependencies not met.');
        }
        // Mark as completed
        this.stepStates.set(step.id, 'completed');
        this.completedSteps.push(step);
        // Lock order editing after pick-up-order
        if (step.id === 'pick-up-order') {
            this.orderItems.lock();
        }
        // If it's "calculate-total", generate the receipt with real items
        if (step.id === 'calculate-total') {
            this.receipt = generateReceipt(this.orderItems.getItems());
        }
        // Update states of steps that are now ready (mark as active)
        for (const readyStep of this.getReadySteps()) {
            const currentState = this.stepStates.get(readyStep.id);
            if (currentState !== 'completed') {
                this.stepStates.set(readyStep.id, 'active');
            }
        }
        return step;
    }
    /** Indicates whether the process has reached the end. */
    isFinished() {
        return this.completedSteps.length >= STEPS.length;
    }
    /** Resets the process to initial state. */
    reset() {
        this.completedSteps = [];
        this.receipt = null;
        this.stepStates.clear();
        this.orderItems.clear();
        for (const step of STEPS) {
            this.stepStates.set(step.id, 'pending');
        }
    }
    /** Returns the generated receipt, or null if "calculate-total" hasn't run. */
    getReceipt() {
        return this.receipt;
    }
    /** Returns the history of completed steps. */
    history() {
        return [...this.completedSteps];
    }
    /** Returns the visual state of a step for the UI. */
    getStepState(stepId) {
        return this.stepStates.get(stepId) ?? 'pending';
    }
    /** Returns steps filtered by lane. */
    getStepsByLane(lane) {
        return STEPS.filter((s) => s.lane === lane);
    }
    /** Returns all steps. */
    getAllSteps() {
        return [...STEPS];
    }
}

import { LinkedList } from '../data-structures/linked-list.js';
import { STEPS } from './process-step.js';
import { generateReceipt } from './receipt.js';
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
 * Trade-off vs multiple lists (one per lane):
 * Single list simplifies iteration and history. The cost is that
 * `canAdvance()` must search history for completed steps from other lanes.
 * For 9 steps this is O(n²) = practical constant.
 * Multiple lists require explicit synchronization between lists, more code,
 * and more bug surface — no real benefit for this scope.
 */
export class OrderProcess {
    constructor() {
        this.steps = new LinkedList();
        this.completedSteps = [];
        this.currentStepIndex = 0;
        this.receipt = null;
        this.stepStates = new Map();
        // Load all steps into the linked list
        for (const step of STEPS) {
            this.steps.append(step);
            this.stepStates.set(step.id, 'pending');
        }
    }
    /** Returns the current step (the next one that can be executed). */
    currentStep() {
        const stepsArray = this.steps.toArray();
        if (this.currentStepIndex >= stepsArray.length) {
            return null;
        }
        return stepsArray[this.currentStepIndex];
    }
    /** Checks whether the next step can be executed (all dependencies fulfilled). */
    canAdvance() {
        const step = this.currentStep();
        if (!step)
            return false;
        // Verify all dependencies are in history
        const completedIds = new Set(this.completedSteps.map((s) => s.id));
        return step.dependsOn.every((depId) => completedIds.has(depId));
    }
    /**
     * Advances to the next process step.
     * @throws Error if cannot advance or if process already finished.
     */
    advance() {
        if (this.isFinished()) {
            throw new Error('Process already finished. Use reset() to restart.');
        }
        const step = this.currentStep();
        if (!step) {
            throw new Error('No steps available.');
        }
        if (!this.canAdvance()) {
            const missing = step.dependsOn.filter((depId) => !this.completedSteps.some((s) => s.id === depId));
            throw new Error(`Cannot advance to "${step.action}". Missing dependencies: ${missing.join(', ')}`);
        }
        // Mark as completed
        this.stepStates.set(step.id, 'completed');
        this.completedSteps.push(step);
        // If it's "calculate-total", generate the receipt
        if (step.id === 'calculate-total') {
            this.receipt = generateReceipt(this.completedSteps);
        }
        // Advance to next step
        this.currentStepIndex++;
        // Update state of next step
        const next = this.currentStep();
        if (next) {
            this.stepStates.set(next.id, 'active');
            // If next step has pending dependencies, mark as waiting
            if (!this.canAdvance()) {
                this.stepStates.set(next.id, 'waiting');
            }
        }
        return step;
    }
    /** Indicates whether the process has reached the end. */
    isFinished() {
        return this.currentStepIndex >= this.steps.size;
    }
    /** Resets the process to initial state. */
    reset() {
        this.completedSteps = [];
        this.currentStepIndex = 0;
        this.receipt = null;
        this.stepStates.clear();
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

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderProcess } from '../src/domain/order-process.js';
describe('OrderProcess — Fork/Join Diagram Fidelity', () => {
    describe('Fork after pick-up-order', () => {
        it('both prepare-order (Kitchen) and receive-order (Cashier) become ready after pick-up-order', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            // Fork: both should be ready
            assert.ok(readyIds.includes('prepare-order'), 'prepare-order should be ready');
            assert.ok(readyIds.includes('receive-order'), 'receive-order should be ready');
            assert.equal(ready.length, 2, 'Exactly 2 steps should be ready');
        });
        it('can advance prepare-order without receive-order (independence)', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order (Kitchen)
            // receive-order should still be available
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            assert.ok(readyIds.includes('receive-order'), 'receive-order should still be ready');
            assert.ok(!readyIds.includes('prepare-order'), 'prepare-order already completed');
        });
        it('both prepare-order and receive-order remain available after completing one', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order (first in STEPS order)
            // receive-order should still be available
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            assert.ok(readyIds.includes('receive-order'), 'receive-order should still be ready');
            assert.ok(!readyIds.includes('prepare-order'), 'prepare-order already completed');
        });
        it('can advance both prepare-order and receive-order in any order', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            // Advance in reverse order (Cashier before Kitchen)
            process.advance(); // receive-order (Cashier)
            process.advance(); // prepare-order (Kitchen)
            const history = process.history();
            const historyIds = history.map((s) => s.id);
            // Both should be completed
            assert.ok(historyIds.includes('prepare-order'), 'prepare-order should be completed');
            assert.ok(historyIds.includes('receive-order'), 'receive-order should be completed');
        });
    });
    describe('Join before calculate-total', () => {
        it('calculate-total not ready until ask-for-bill is completed', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // receive-order (Cashier)
            // ask-for-bill not yet done
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            assert.ok(!readyIds.includes('calculate-total'), 'calculate-total should NOT be ready');
        });
        it('calculate-total not ready until receive-order is completed', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order (Kitchen)
            process.advance(); // serve-order
            process.advance(); // request-bill
            process.advance(); // ask-for-bill
            // receive-order not yet done
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            assert.ok(!readyIds.includes('calculate-total'), 'calculate-total should NOT be ready');
        });
        it('calculate-total ready only when BOTH ask-for-bill AND receive-order completed', () => {
            const process = new OrderProcess();
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order (Kitchen)
            process.advance(); // receive-order (Cashier)
            process.advance(); // serve-order
            process.advance(); // request-bill
            process.advance(); // ask-for-bill
            // Both dependencies met
            const ready = process.getReadySteps();
            const readyIds = ready.map((s) => s.id);
            assert.ok(readyIds.includes('calculate-total'), 'calculate-total should be ready');
        });
        it('can advance calculate-total after both join dependencies met', () => {
            const process = new OrderProcess();
            // Complete all steps except calculate-total and pay-order
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order
            process.advance(); // receive-order
            process.advance(); // serve-order
            process.advance(); // request-bill
            process.advance(); // ask-for-bill
            // Now calculate-total should be advanceable
            const step = process.advance();
            assert.equal(step.id, 'calculate-total');
        });
    });
    describe('Full flow with fork/join', () => {
        it('can complete all 9 steps with fork/join', () => {
            const process = new OrderProcess();
            const executedIds = [];
            while (!process.isFinished()) {
                const step = process.advance();
                executedIds.push(step.id);
            }
            // All 9 steps should be completed
            assert.equal(executedIds.length, 9);
            assert.ok(executedIds.includes('request-order'));
            assert.ok(executedIds.includes('pick-up-order'));
            assert.ok(executedIds.includes('prepare-order'));
            assert.ok(executedIds.includes('receive-order'));
            assert.ok(executedIds.includes('serve-order'));
            assert.ok(executedIds.includes('request-bill'));
            assert.ok(executedIds.includes('ask-for-bill'));
            assert.ok(executedIds.includes('calculate-total'));
            assert.ok(executedIds.includes('pay-order'));
        });
        it('process completes all steps with fork/join', () => {
            const process = new OrderProcess();
            // Execute all steps
            process.advance(); // request-order
            process.advance(); // pick-up-order
            process.advance(); // prepare-order (Kitchen)
            process.advance(); // receive-order (Cashier)
            process.advance(); // serve-order
            process.advance(); // request-bill
            process.advance(); // ask-for-bill
            process.advance(); // calculate-total
            process.advance(); // pay-order
            // All steps completed
            assert.ok(process.isFinished());
            assert.equal(process.history().length, 9);
        });
    });
});

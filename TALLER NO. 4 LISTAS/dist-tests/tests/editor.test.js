import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderProcess } from '../src/domain/order-process.js';
import { STEPS, LANES } from '../src/domain/process-step.js';
describe('StepEditData — contract', () => {
    it('STEPS has 9 steps', () => {
        assert.equal(STEPS.length, 9);
    });
    it('LANES has 4 lanes', () => {
        assert.equal(LANES.length, 4);
        assert.deepEqual(LANES, ['Customer', 'Waiter', 'Kitchen', 'Cashier']);
    });
    it('every step has required fields', () => {
        for (const step of STEPS) {
            assert.ok(typeof step.id === 'string' && step.id.length > 0, `step.id missing for ${JSON.stringify(step)}`);
            assert.ok(typeof step.action === 'string' && step.action.length > 0, `step.action missing for ${step.id}`);
            assert.ok(typeof step.description === 'string' && step.description.length > 0, `step.description missing for ${step.id}`);
            assert.ok(LANES.includes(step.lane), `step.lane invalid for ${step.id}`);
            assert.ok(Array.isArray(step.dependsOn), `step.dependsOn not array for ${step.id}`);
        }
    });
    it('every dependsOn id references an existing step', () => {
        const ids = new Set(STEPS.map((s) => s.id));
        for (const step of STEPS) {
            for (const dep of step.dependsOn) {
                assert.ok(ids.has(dep), `Step "${step.id}" depends on non-existent "${dep}"`);
            }
        }
    });
    it('no step depends on itself', () => {
        for (const step of STEPS) {
            assert.ok(!step.dependsOn.includes(step.id), `Step "${step.id}" depends on itself`);
        }
    });
});
describe('OrderProcess — getAllSteps', () => {
    it('returns a copy (not the original array)', () => {
        const process = new OrderProcess();
        const all = process.getAllSteps();
        all.push({ id: 'fake', lane: 'Customer', action: 'Fake', description: '', dependsOn: [] });
        assert.equal(process.getAllSteps().length, 9);
    });
    it('returns all 9 steps in order', () => {
        const process = new OrderProcess();
        const all = process.getAllSteps();
        assert.equal(all.length, 9);
        assert.equal(all[0].id, 'request-order');
        assert.equal(all[8].id, 'pay-order');
    });
});
describe('OrderProcess — getStepsByLane', () => {
    it('returns steps for Customer lane', () => {
        const process = new OrderProcess();
        const steps = process.getStepsByLane('Customer');
        assert.equal(steps.length, 3);
        assert.equal(steps[0].id, 'request-order');
        assert.equal(steps[1].id, 'request-bill');
        assert.equal(steps[2].id, 'pay-order');
    });
    it('returns steps for Waiter lane', () => {
        const process = new OrderProcess();
        const steps = process.getStepsByLane('Waiter');
        assert.equal(steps.length, 3);
        assert.equal(steps[0].id, 'pick-up-order');
        assert.equal(steps[1].id, 'serve-order');
        assert.equal(steps[2].id, 'ask-for-bill');
    });
    it('returns steps for Kitchen lane', () => {
        const process = new OrderProcess();
        const steps = process.getStepsByLane('Kitchen');
        assert.equal(steps.length, 1);
        assert.equal(steps[0].id, 'prepare-order');
    });
    it('returns steps for Cashier lane', () => {
        const process = new OrderProcess();
        const steps = process.getStepsByLane('Cashier');
        assert.equal(steps.length, 2);
        assert.equal(steps[0].id, 'receive-order');
        assert.equal(steps[1].id, 'calculate-total');
    });
});
describe('OrderProcess — getStepState', () => {
    it('first step is "pending" initially (UI marks it active on render)', () => {
        const process = new OrderProcess();
        assert.equal(process.getStepState('request-order'), 'pending');
    });
    it('other steps are "pending" initially', () => {
        const process = new OrderProcess();
        assert.equal(process.getStepState('pick-up-order'), 'pending');
        assert.equal(process.getStepState('pay-order'), 'pending');
    });
    it('completed step has "completed" state', () => {
        const process = new OrderProcess();
        process.advance();
        assert.equal(process.getStepState('request-order'), 'completed');
    });
    it('next step after advance becomes "active" or "waiting"', () => {
        const process = new OrderProcess();
        process.advance();
        const state = process.getStepState('pick-up-order');
        assert.ok(state === 'active' || state === 'waiting');
    });
});
describe('OrderProcess — edge cases after reset with editor simulation', () => {
    it('reset after partial progress restores all states to pending', () => {
        const process = new OrderProcess();
        process.advance();
        process.advance();
        process.advance();
        process.advance();
        process.reset();
        assert.equal(process.getStepState('request-order'), 'pending');
        assert.equal(process.getStepState('pick-up-order'), 'pending');
        assert.equal(process.getStepState('pay-order'), 'pending');
        assert.equal(process.isFinished(), false);
        assert.equal(process.getReceipt(), null);
        assert.deepEqual(process.history(), []);
    });
});

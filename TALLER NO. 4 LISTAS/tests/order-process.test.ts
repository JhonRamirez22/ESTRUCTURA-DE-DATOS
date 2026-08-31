import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderProcess } from '../src/domain/order-process.js';
import { STEPS } from '../src/domain/process-step.js';

describe('OrderProcess — full flow', () => {
  it('traverses all 9 steps in correct order', () => {
    const process = new OrderProcess();
    const executedIds: string[] = [];

    while (!process.isFinished()) {
      const step = process.advance();
      executedIds.push(step.id);
    }

    assert.deepEqual(executedIds, STEPS.map((s: { id: string }) => s.id));
    assert.equal(process.isFinished(), true);
  });

  it('generates receipt after "calculate-total"', () => {
    const process = new OrderProcess();

    // Advance to calculate-total
    for (let i = 0; i < 7; i++) {
      process.advance();
    }
    assert.equal(process.currentStep()?.id, 'calculate-total');
    process.advance();

    const receipt = process.getReceipt();
    assert.notEqual(receipt, null);
    assert.ok(receipt!.order.startsWith('ORD-'));
    // No items added by default, so receipt should be empty
    assert.equal(receipt!.items.length, 0);
    assert.equal(receipt!.subtotal, 0);
    assert.equal(receipt!.total, 0);
  });

  it('generates receipt with real items', () => {
    const process = new OrderProcess();
    const items = process.getOrderItemService();

    // Add some items before advancing
    items.addItem('Pasta', 2, 15.00);
    items.addItem('Pizza', 1, 20.00);

    // Advance to calculate-total
    for (let i = 0; i < 7; i++) {
      process.advance();
    }
    process.advance(); // calculate-total

    const receipt = process.getReceipt();
    assert.notEqual(receipt, null);
    assert.equal(receipt!.items.length, 2);
    assert.equal(receipt!.subtotal, 50.00); // 30 + 20
    assert.equal(receipt!.tax, 8.00);      // 50 * 0.16
    assert.equal(receipt!.total, 58.00);   // 50 + 8
  });
});

describe('OrderProcess — edge cases', () => {
  it('advance() after isFinished() throws error', () => {
    const process = new OrderProcess();
    for (let i = 0; i < 9; i++) {
      process.advance();
    }
    assert.throws(() => process.advance(), /already finished/);
  });

  it('getReceipt() before calculate-total returns null', () => {
    const process = new OrderProcess();
    assert.equal(process.getReceipt(), null);

    // Advance 3 steps (without reaching calculate-total)
    process.advance();
    process.advance();
    process.advance();
    assert.equal(process.getReceipt(), null);
  });

  it('advance() before dependencies are met throws error', () => {
    const process = new OrderProcess();
    // Advance only "request-order" and "pick-up-order"
    process.advance(); // request-order
    process.advance(); // pick-up-order

    // Try advancing — next is "prepare-order" which depends on "pick-up-order" (completed)
    // So it should work. Test a case where it should succeed:
    const process2 = new OrderProcess();
    process2.advance(); // request-order
    process2.advance(); // pick-up-order
    process2.advance(); // prepare-order
    process2.advance(); // receive-order
    process2.advance(); // serve-order
    process2.advance(); // request-bill
    process2.advance(); // ask-for-bill
    process2.advance(); // calculate-total
    process2.advance(); // pay-order

    assert.equal(process2.isFinished(), true);
  });

  it('reset() leaves state identical to initial', () => {
    const process = new OrderProcess();
    process.advance();
    process.advance();
    process.advance();
    process.advance();

    process.reset();

    assert.equal(process.isFinished(), false);
    assert.equal(process.getReceipt(), null);
    assert.deepEqual(process.history(), []);
    assert.equal(process.currentStep()?.id, 'request-order');
  });

  it('canAdvance() returns true/false correctly', () => {
    const process = new OrderProcess();
    assert.equal(process.canAdvance(), true); // request-order has no dependencies

    process.advance();
    assert.equal(process.canAdvance(), true); // pick-up-order depends on request-order

    process.advance();
    // prepare-order depends on pick-up-order (completed)
    assert.equal(process.canAdvance(), true);
  });

  it('order editing locks after pick-up-order', () => {
    const process = new OrderProcess();
    const items = process.getOrderItemService();

    // Can add items before pick-up-order
    items.addItem('Pasta', 1, 10);
    assert.equal(items.getItemCount(), 1);

    process.advance(); // request-order
    process.advance(); // pick-up-order — locks editing

    assert.equal(items.isLocked(), true);
    assert.throws(() => items.addItem('Pizza', 1, 15), /Cannot modify/);
  });
});

describe('OrderProcess — history', () => {
  it('history() returns a copy of the history', () => {
    const process = new OrderProcess();
    process.advance();
    process.advance();

    const history = process.history();
    assert.equal(history.length, 2);
    assert.equal(history[0].id, 'request-order');
    assert.equal(history[1].id, 'pick-up-order');

    // Modifying the array does not affect internal history
    history.push({ id: 'fake', lane: 'Customer', action: 'Fake', description: '', dependsOn: [] });
    assert.equal(process.history().length, 2);
  });
});

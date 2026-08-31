import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderItemService } from '../src/domain/order-item.js';

describe('OrderItemService', () => {
  describe('addItem', () => {
    it('adds a new item with valid data', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 2, 15.50);

      assert.equal(item.name, 'Pasta');
      assert.equal(item.quantity, 2);
      assert.equal(item.unitPrice, 15.50);
      assert.ok(item.id.startsWith('item-'));
      assert.equal(service.getItemCount(), 1);
    });

    it('trims whitespace from name', () => {
      const service = new OrderItemService();
      const item = service.addItem('  Pasta  ', 1, 10);

      assert.equal(item.name, 'Pasta');
    });

    it('throws on empty name', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('', 1, 10), /name cannot be empty/);
    });

    it('throws on whitespace-only name', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('   ', 1, 10), /name cannot be empty/);
    });

    it('throws on name > 100 characters', () => {
      const service = new OrderItemService();
      const longName = 'A'.repeat(101);
      assert.throws(() => service.addItem(longName, 1, 10), /name too long/);
    });

    it('throws on quantity < 1', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('Pasta', 0, 10), /Quantity must be a positive integer/);
      assert.throws(() => service.addItem('Pasta', -1, 10), /Quantity must be a positive integer/);
    });

    it('throws on non-integer quantity', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('Pasta', 1.5, 10), /Quantity must be a positive integer/);
    });

    it('throws on quantity > 999', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('Pasta', 1000, 10), /Quantity cannot exceed 999/);
    });

    it('throws on negative unit price', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('Pasta', 1, -5), /Unit price must be a non-negative/);
    });

    it('throws on unit price > 10000', () => {
      const service = new OrderItemService();
      assert.throws(() => service.addItem('Pasta', 1, 10001), /Unit price cannot exceed 10,000/);
    });

    it('allows zero unit price', () => {
      const service = new OrderItemService();
      const item = service.addItem('Free item', 1, 0);
      assert.equal(item.unitPrice, 0);
    });
  });

  describe('updateItem', () => {
    it('updates an existing item', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 2, 15.50);
      const updated = service.updateItem(item.id, 'Pizza', 3, 20);

      assert.equal(updated.name, 'Pizza');
      assert.equal(updated.quantity, 3);
      assert.equal(updated.unitPrice, 20);
    });

    it('throws for non-existent item', () => {
      const service = new OrderItemService();
      assert.throws(() => service.updateItem('item-999', 'Pizza', 1, 10), /not found/);
    });

    it('validates updated data', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 1, 10);

      assert.throws(() => service.updateItem(item.id, '', 1, 10), /name cannot be empty/);
      assert.throws(() => service.updateItem(item.id, 'Pizza', 0, 10), /Quantity must be/);
    });
  });

  describe('removeItem', () => {
    it('removes an existing item', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 1, 10);
      assert.equal(service.getItemCount(), 1);

      service.removeItem(item.id);
      assert.equal(service.getItemCount(), 0);
    });

    it('throws for non-existent item', () => {
      const service = new OrderItemService();
      assert.throws(() => service.removeItem('item-999'), /not found/);
    });

    it('removes correct item when multiple exist', () => {
      const service = new OrderItemService();
      const item1 = service.addItem('Pasta', 1, 10);
      const item2 = service.addItem('Pizza', 1, 15);

      service.removeItem(item1.id);
      assert.equal(service.getItemCount(), 1);
      assert.equal(service.getItems()[0].name, 'Pizza');
    });
  });

  describe('getItems', () => {
    it('returns a copy (not the original array)', () => {
      const service = new OrderItemService();
      service.addItem('Pasta', 1, 10);

      const items = service.getItems();
      items.pop();

      assert.equal(service.getItemCount(), 1, 'original should not be affected');
    });
  });

  describe('totals', () => {
    it('calculates subtotal correctly', () => {
      const service = new OrderItemService();
      service.addItem('Pasta', 2, 15);   // 30
      service.addItem('Pizza', 1, 20);   // 20

      assert.equal(service.getSubtotal(), 50);
    });

    it('calculates total with 16% tax', () => {
      const service = new OrderItemService();
      service.addItem('Pasta', 2, 15);   // 30

      assert.equal(service.getTotal(), 34.8);  // 30 * 1.16
    });

    it('returns 0 for empty order', () => {
      const service = new OrderItemService();
      assert.equal(service.getSubtotal(), 0);
      assert.equal(service.getTotal(), 0);
    });
  });

  describe('lock', () => {
    it('blocks addItem when locked', () => {
      const service = new OrderItemService();
      service.lock();

      assert.throws(() => service.addItem('Pasta', 1, 10), /Cannot modify/);
    });

    it('blocks updateItem when locked', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 1, 10);
      service.lock();

      assert.throws(() => service.updateItem(item.id, 'Pizza', 1, 10), /Cannot modify/);
    });

    it('blocks removeItem when locked', () => {
      const service = new OrderItemService();
      const item = service.addItem('Pasta', 1, 10);
      service.lock();

      assert.throws(() => service.removeItem(item.id), /Cannot modify/);
    });

    it('allows read operations when locked', () => {
      const service = new OrderItemService();
      service.addItem('Pasta', 1, 10);
      service.lock();

      assert.doesNotThrow(() => service.getItems());
      assert.doesNotThrow(() => service.getItemCount());
      assert.doesNotThrow(() => service.getSubtotal());
      assert.doesNotThrow(() => service.getTotal());
      assert.equal(service.isLocked(), true);
    });
  });

  describe('clear', () => {
    it('resets all items and lock state', () => {
      const service = new OrderItemService();
      service.addItem('Pasta', 1, 10);
      service.lock();

      service.clear();

      assert.equal(service.getItemCount(), 0);
      assert.equal(service.isLocked(), false);
    });
  });
});

/**
 * Order items domain model with CRUD operations and validation.
 * Provides the data structure for restaurant order items.
 */

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export class OrderItemService {
  private items: OrderItem[] = [];
  private nextId = 1;
  private locked = false;

  /**
   * Locks editing (after "pick-up-order" step).
   */
  lock(): void {
    this.locked = true;
  }

  /**
   * Returns whether editing is locked.
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Adds a new item to the order.
   * @throws Error if locked or validation fails.
   */
  addItem(name: string, quantity: number, unitPrice: number): OrderItem {
    if (this.locked) {
      throw new Error('Cannot modify order after pick-up');
    }

    this.validateName(name);
    this.validateQuantity(quantity);
    this.validateUnitPrice(unitPrice);

    const item: OrderItem = {
      id: `item-${this.nextId++}`,
      name: name.trim(),
      quantity,
      unitPrice,
    };

    this.items.push(item);
    return item;
  }

  /**
   * Updates an existing item.
   * @throws Error if locked, item not found, or validation fails.
   */
  updateItem(id: string, name: string, quantity: number, unitPrice: number): OrderItem {
    if (this.locked) {
      throw new Error('Cannot modify order after pick-up');
    }

    const item = this.items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Item not found: ${id}`);
    }

    this.validateName(name);
    this.validateQuantity(quantity);
    this.validateUnitPrice(unitPrice);

    item.name = name.trim();
    item.quantity = quantity;
    item.unitPrice = unitPrice;

    return item;
  }

  /**
   * Removes an item from the order.
   * @throws Error if locked or item not found.
   */
  removeItem(id: string): void {
    if (this.locked) {
      throw new Error('Cannot modify order after pick-up');
    }

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Item not found: ${id}`);
    }

    this.items.splice(index, 1);
  }

  /**
   * Returns a copy of all items.
   */
  getItems(): OrderItem[] {
    return [...this.items];
  }

  /**
   * Returns the number of items.
   */
  getItemCount(): number {
    return this.items.length;
  }

  /**
   * Calculates subtotal (sum of quantity * unitPrice for all items).
   */
  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  /**
   * Calculates total with 16% tax.
   */
  getTotal(): number {
    const subtotal = this.getSubtotal();
    return subtotal * 1.16;
  }

  /**
   * Clears all items (for reset).
   */
  clear(): void {
    this.items = [];
    this.locked = false;
    this.nextId = 1;
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Item name cannot be empty');
    }
    if (name.trim().length > 100) {
      throw new Error('Item name too long (max 100 characters)');
    }
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive integer');
    }
    if (quantity > 999) {
      throw new Error('Quantity cannot exceed 999');
    }
  }

  private validateUnitPrice(unitPrice: number): void {
    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      throw new Error('Unit price must be a non-negative number');
    }
    if (unitPrice > 10000) {
      throw new Error('Unit price cannot exceed 10,000');
    }
  }
}

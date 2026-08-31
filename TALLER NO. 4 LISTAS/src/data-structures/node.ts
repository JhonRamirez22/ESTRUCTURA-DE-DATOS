/**
 * Generic node for singly linked list.
 * Each node holds a value and a reference to the next node.
 */
export class Node<T> {
  value: T;
  next: Node<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
  }
}

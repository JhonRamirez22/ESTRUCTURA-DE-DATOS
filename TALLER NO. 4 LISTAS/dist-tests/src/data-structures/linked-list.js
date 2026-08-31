import { Node } from './node.js';
/**
 * Generic singly linked list.
 * General-purpose data structure with no business logic.
 *
 * Trade-off vs Array:
 * - Insert/remove in middle: O(n) traversal, but no element shifting.
 * - Index access: O(n) — not used in this project (find by predicate instead).
 * - Memory: no overcapacity, each node is an independent allocation.
 * - Iteration: [Symbol.iterator] enables native for...of.
 */
export class LinkedList {
    constructor() {
        this.head = null;
        this._size = 0;
    }
    get size() {
        return this._size;
    }
    /** Appends an element to the end of the list. */
    append(value) {
        const node = new Node(value);
        if (!this.head) {
            this.head = node;
        }
        else {
            let current = this.head;
            while (current.next) {
                current = current.next;
            }
            current.next = node;
        }
        this._size++;
    }
    /**
     * Inserts an element at the specified index.
     * @throws RangeError if index is negative or greater than size.
     */
    insertAt(index, value) {
        if (index < 0 || index > this._size) {
            throw new RangeError(`Index ${index} out of range. Valid range: [0, ${this._size}]`);
        }
        const node = new Node(value);
        if (index === 0) {
            node.next = this.head;
            this.head = node;
        }
        else {
            let current = this.head;
            for (let i = 0; i < index - 1; i++) {
                current = current.next;
            }
            node.next = current.next;
            current.next = node;
        }
        this._size++;
    }
    /**
     * Removes and returns the element at the specified index.
     * @returns The removed value, or null if the list is empty.
     * @throws RangeError if index is negative or greater than size - 1.
     */
    removeAt(index) {
        if (index < 0 || index >= this._size) {
            throw new RangeError(`Index ${index} out of range. Valid range: [0, ${this._size - 1}]`);
        }
        let removed;
        if (index === 0) {
            removed = this.head;
            this.head = this.head.next;
        }
        else {
            let current = this.head;
            for (let i = 0; i < index - 1; i++) {
                current = current.next;
            }
            removed = current.next;
            current.next = removed.next;
        }
        this._size--;
        return removed.value;
    }
    /**
     * Finds the first element that satisfies the predicate.
     * @returns The found value, or null if none matches.
     */
    find(predicate) {
        let current = this.head;
        while (current) {
            if (predicate(current.value)) {
                return current.value;
            }
            current = current.next;
        }
        return null;
    }
    /**
     * Converts the list to an array.
     * Empty list returns [] without throwing errors.
     */
    toArray() {
        const result = [];
        let current = this.head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
    /**
     * Iterator that enables for...of over the list.
     * Empty list does not throw, simply does not iterate.
     */
    [Symbol.iterator]() {
        let current = this.head;
        return {
            next() {
                if (current) {
                    const value = current.value;
                    current = current.next;
                    return { value, done: false };
                }
                return { value: undefined, done: true };
            },
        };
    }
}

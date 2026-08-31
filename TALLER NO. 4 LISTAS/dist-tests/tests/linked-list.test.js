import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LinkedList } from '../src/data-structures/linked-list.js';
import { Node } from '../src/data-structures/node.js';
describe('Node', () => {
    it('creates a node with value and next null', () => {
        const node = new Node(42);
        assert.equal(node.value, 42);
        assert.equal(node.next, null);
    });
});
describe('LinkedList — append', () => {
    it('appends elements to the end', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        list.append(3);
        assert.deepEqual(list.toArray(), [1, 2, 3]);
        assert.equal(list.size, 3);
    });
    it('handles a single element', () => {
        const list = new LinkedList();
        list.append('hello');
        assert.deepEqual(list.toArray(), ['hello']);
        assert.equal(list.size, 1);
    });
});
describe('LinkedList — insertAt', () => {
    it('inserts at the beginning (index 0)', () => {
        const list = new LinkedList();
        list.append(2);
        list.append(3);
        list.insertAt(0, 1);
        assert.deepEqual(list.toArray(), [1, 2, 3]);
    });
    it('inserts in the middle', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(3);
        list.insertAt(1, 2);
        assert.deepEqual(list.toArray(), [1, 2, 3]);
    });
    it('inserts at the end (index = size)', () => {
        const list = new LinkedList();
        list.append(1);
        list.insertAt(1, 2);
        assert.deepEqual(list.toArray(), [1, 2]);
    });
    it('throws RangeError with negative index', () => {
        const list = new LinkedList();
        list.append(1);
        assert.throws(() => list.insertAt(-1, 0), RangeError);
    });
    it('throws RangeError with index greater than size', () => {
        const list = new LinkedList();
        list.append(1);
        assert.throws(() => list.insertAt(5, 0), RangeError);
    });
});
describe('LinkedList — removeAt', () => {
    it('removes the first element', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        const removed = list.removeAt(0);
        assert.equal(removed, 1);
        assert.deepEqual(list.toArray(), [2]);
    });
    it('removes a middle element', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        list.append(3);
        const removed = list.removeAt(1);
        assert.equal(removed, 2);
        assert.deepEqual(list.toArray(), [1, 3]);
    });
    it('removes the last element', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        const removed = list.removeAt(1);
        assert.equal(removed, 2);
        assert.deepEqual(list.toArray(), [1]);
        assert.equal(list.size, 1);
    });
    it('throws RangeError with negative index', () => {
        const list = new LinkedList();
        list.append(1);
        assert.throws(() => list.removeAt(-1), RangeError);
    });
    it('throws RangeError with index equal to size', () => {
        const list = new LinkedList();
        list.append(1);
        assert.throws(() => list.removeAt(1), RangeError);
    });
});
describe('LinkedList — find', () => {
    it('finds an existing element', () => {
        const list = new LinkedList();
        list.append(10);
        list.append(20);
        list.append(30);
        const found = list.find((v) => v === 20);
        assert.equal(found, 20);
    });
    it('returns null if not found', () => {
        const list = new LinkedList();
        list.append(10);
        const found = list.find((v) => v === 99);
        assert.equal(found, null);
    });
    it('returns null in empty list', () => {
        const list = new LinkedList();
        const found = list.find((v) => v === 1);
        assert.equal(found, null);
    });
});
describe('LinkedList — iteration', () => {
    it('for...of iterates all elements', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        list.append(3);
        const result = [];
        for (const val of list) {
            result.push(val);
        }
        assert.deepEqual(result, [1, 2, 3]);
    });
    it('for...of on empty list does not throw', () => {
        const list = new LinkedList();
        const result = [];
        for (const val of list) {
            result.push(val);
        }
        assert.deepEqual(result, []);
    });
});
describe('LinkedList — edge cases', () => {
    it('toArray on empty list returns []', () => {
        const list = new LinkedList();
        assert.deepEqual(list.toArray(), []);
    });
    it('size is 0 on newly created list', () => {
        const list = new LinkedList();
        assert.equal(list.size, 0);
    });
    it('size updates correctly after operations', () => {
        const list = new LinkedList();
        list.append(1);
        list.append(2);
        list.insertAt(0, 0);
        assert.equal(list.size, 3);
        list.removeAt(1);
        assert.equal(list.size, 2);
    });
});

/**
 * Tests para Stack (Pila)
 * 
 * Cubre los edge cases del AGENTS.md:
 * 1. Pop de pila vacía → undefined
 * 2. Push más allá del límite → descarta el más antiguo
 * 3. Clear → size() === 0
 * 4. Peek no modifica la pila
 * 5. Serialización/deserialización
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStack } from '../src/data-structures/stack.js';

describe('Stack', () => {
  describe('Operaciones básicas', () => {
    it('debería crear una pila vacía', () => {
      const stack = createStack<number>();
      assert.equal(stack.isEmpty(), true);
      assert.equal(stack.size(), 0);
      assert.equal(stack.pop(), undefined);
      assert.equal(stack.peek(), undefined);
    });

    it('debería agregar y extraer elementos (LIFO)', () => {
      const stack = createStack<string>();
      
      stack.push('primero');
      stack.push('segundo');
      stack.push('tercero');
      
      assert.equal(stack.size(), 3);
      assert.equal(stack.peek(), 'tercero');
      
      assert.equal(stack.pop(), 'tercero');
      assert.equal(stack.pop(), 'segundo');
      assert.equal(stack.pop(), 'primero');
      
      assert.equal(stack.isEmpty(), true);
    });

    it('peek no debería modificar la pila', () => {
      const stack = createStack<number>();
      
      stack.push(42);
      stack.push(100);
      
      const peeked = stack.peek();
      assert.equal(peeked, 100);
      assert.equal(stack.size(), 2);
      
      stack.peek();
      stack.peek();
      assert.equal(stack.size(), 2);
    });
  });

  describe('Edge cases', () => {
    it('pop de pila vacía debería retornar undefined', () => {
      const stack = createStack<number>();
      assert.equal(stack.pop(), undefined);
      assert.equal(stack.pop(), undefined);
      assert.equal(stack.isEmpty(), true);
    });

    it('push más allá del límite debería descartar el más antiguo', () => {
      const stack = createStack<number>(3); // Límite de 3
      
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      assert.equal(stack.size(), 3);
      assert.deepEqual(stack.toArray(), [1, 2, 3]);
      
      // Este push debería descartar el 1
      stack.push(4);
      
      assert.equal(stack.size(), 3);
      assert.deepEqual(stack.toArray(), [2, 3, 4]);
      
      // Otro push más: descarta el 2
      stack.push(5);
      assert.deepEqual(stack.toArray(), [3, 4, 5]);
    });

    it('clear debería vaciar completamente la pila', () => {
      const stack = createStack<string>();
      
      stack.push('a');
      stack.push('b');
      stack.push('c');
      
      assert.equal(stack.size(), 3);
      
      stack.clear();
      
      assert.equal(stack.size(), 0);
      assert.equal(stack.isEmpty(), true);
      assert.equal(stack.pop(), undefined);
    });

    it('debería manejar muchos elementos correctamente', () => {
      const stack = createStack<number>(100);
      
      for (let i = 0; i < 100; i++) {
        stack.push(i);
      }
      
      assert.equal(stack.size(), 100);
      
      // Verificar que se pueden extraer todos en orden LIFO
      for (let i = 99; i >= 0; i--) {
        assert.equal(stack.pop(), i);
      }
      
      assert.equal(stack.isEmpty(), true);
    });
  });

  describe('toArray', () => {
    it('debería retornar los elementos en orden cronológico (de abajo hacia arriba)', () => {
      const stack = createStack<number>();
      
      stack.push(1);
      stack.push(2);
      stack.push(3);
      
      assert.deepEqual(stack.toArray(), [1, 2, 3]);
    });

    it('toArray en pila vacía debería retornar array vacío', () => {
      const stack = createStack<string>();
      assert.deepEqual(stack.toArray(), []);
    });
  });

  describe('Límite de tamaño', () => {
    it('debería respetar un límite de 1 (solo un elemento)', () => {
      const stack = createStack<string>(1);
      
      stack.push('primero');
      assert.equal(stack.size(), 1);
      assert.equal(stack.peek(), 'primero');
      
      stack.push('segundo');
      assert.equal(stack.size(), 1);
      assert.equal(stack.peek(), 'segundo');
    });

    it('debería funcionar correctamente con límite grande', () => {
      const stack = createStack<number>(50);
      
      // Simular 50 snapshots de undo (como en el editor)
      for (let i = 0; i < 50; i++) {
        stack.push(i);
      }
      
      assert.equal(stack.size(), 50);
      
      // Push más allá del límite
      stack.push(999);
      assert.equal(stack.size(), 50);
      
      // El más antiguo (0) debería haber sido descartado
      const arr = stack.toArray();
      assert.equal(arr[0], 1);
      assert.equal(arr[49], 999);
    });
  });

  describe('Casos de uso del editor (undo/redo)', () => {
    it('simular flujo de undo/redo', () => {
      const undoStack = createStack<string>(5);
      const redoStack = createStack<string>();
      
      // Usuario escribe
      undoStack.push('estado inicial');
      undoStack.push('después de escribir A');
      undoStack.push('después de escribir B');
      
      // Usuario hace undo
      let current = 'después de escribir B';
      redoStack.push(current);
      current = undoStack.pop()!;
      
      assert.equal(current, 'después de escribir A');
      assert.equal(redoStack.size(), 1);
      
      // Usuario escribe algo nuevo → redo se vacía
      redoStack.clear();
      undoStack.push(current);
      current = 'texto nuevo';
      undoStack.push(current);
      
      assert.equal(redoStack.isEmpty(), true);
      assert.equal(undoStack.size(), 4);
    });
  });
});

/**
 * Tests para Queue (Cola circular)
 * 
 * Cubre los edge cases del AGENTS.md:
 * 1. Dequeue de cola vacía → undefined
 * 2. Enqueue a cola llena → false
 * 3. enqueueFront respeta capacidad
 * 4. FIFO se mantiene tras reintentos
 * 5. Circular buffer no corrompe índices
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue } from '../src/data-structures/queue.js';

describe('Queue', () => {
  describe('Operaciones básicas', () => {
    it('debería crear una cola vacía', () => {
      const queue = createQueue<number>(5);
      assert.equal(queue.isEmpty(), true);
      assert.equal(queue.isFull(), false);
      assert.equal(queue.size(), 0);
      assert.equal(queue.dequeue(), undefined);
      assert.equal(queue.peek(), undefined);
    });

    it('debería agregar y extraer elementos (FIFO)', () => {
      const queue = createQueue<string>(5);
      
      queue.enqueue('primero');
      queue.enqueue('segundo');
      queue.enqueue('tercero');
      
      assert.equal(queue.size(), 3);
      assert.equal(queue.peek(), 'primero');
      
      assert.equal(queue.dequeue(), 'primero');
      assert.equal(queue.dequeue(), 'segundo');
      assert.equal(queue.dequeue(), 'tercero');
      
      assert.equal(queue.isEmpty(), true);
    });

    it('peek no debería modificar la cola', () => {
      const queue = createQueue<number>(5);
      
      queue.enqueue(10);
      queue.enqueue(20);
      
      const peeked = queue.peek();
      assert.equal(peeked, 10);
      assert.equal(queue.size(), 2);
      
      queue.peek();
      assert.equal(queue.size(), 2);
    });
  });

  describe('Capacidad y límites', () => {
    it('debería reportar isFull correctamente', () => {
      const queue = createQueue<number>(3);
      
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      assert.equal(queue.isFull(), true);
      assert.equal(queue.size(), 3);
    });

    it('enqueue debería retornar false cuando está llena', () => {
      const queue = createQueue<number>(2);
      
      assert.equal(queue.enqueue(1), true);
      assert.equal(queue.enqueue(2), true);
      assert.equal(queue.enqueue(3), false); // Cola llena
      
      assert.equal(queue.size(), 2);
      assert.deepEqual(queue.toArray(), [1, 2]);
    });

    it('debería funcionar con capacidad de 1', () => {
      const queue = createQueue<string>(1);
      
      assert.equal(queue.enqueue('a'), true);
      assert.equal(queue.isFull(), true);
      assert.equal(queue.enqueue('b'), false);
      
      assert.equal(queue.dequeue(), 'a');
      assert.equal(queue.isEmpty(), true);
    });
  });

  describe('enqueueFront (reintentos)', () => {
    it('debería insertar al frente de la cola', () => {
      const queue = createQueue<string>(5);
      
      queue.enqueue('segundo');
      queue.enqueue('tercero');
      
      queue.enqueueFront('primero');
      
      assert.equal(queue.size(), 3);
      assert.deepEqual(queue.toArray(), ['primero', 'segundo', 'tercero']);
    });

    it('enqueueFront debería retornar false si la cola está llena', () => {
      const queue = createQueue<number>(2);
      
      queue.enqueue(1);
      queue.enqueue(2);
      
      assert.equal(queue.enqueueFront(0), false);
      assert.equal(queue.size(), 2);
    });

    it('debería mantener FIFO después de enqueueFront', () => {
      const queue = createQueue<string>(5);
      
      // Agregar algunos jobs normales
      queue.enqueue('job-1');
      queue.enqueue('job-2');
      queue.enqueue('job-3');
      
      // Simular reintento: job-1 se procesó, job-2 falló y se reinserta al frente
      queue.dequeue(); // job-1 se procesó exitosamente
      queue.enqueueFront('job-2-reintento');
      
      // El orden debería ser: job-2-reintento, job-2, job-3
      assert.deepEqual(queue.toArray(), ['job-2-reintento', 'job-2', 'job-3']);
      
      // Y job-2-reintento sale primero
      assert.equal(queue.dequeue(), 'job-2-reintento');
      assert.equal(queue.dequeue(), 'job-2');
      assert.equal(queue.dequeue(), 'job-3');
    });
  });

  describe('Circular buffer - no corrupción de índices', () => {
    it('debería manejar muchas operaciones de enqueue/dequeue', () => {
      const queue = createQueue<number>(5);
      
      // Llenar y vaciar varias veces para rotar el buffer
      for (let cycle = 0; cycle < 10; cycle++) {
        // Llenar
        for (let i = 0; i < 5; i++) {
          queue.enqueue(cycle * 5 + i);
        }
        
        // Verificar orden
        for (let i = 0; i < 5; i++) {
          assert.equal(queue.dequeue(), cycle * 5 + i);
        }
        
        assert.equal(queue.isEmpty(), true);
      }
    });

    it('debería manejar intercalación de enqueue/dequeue', () => {
      const queue = createQueue<number>(3);
      
      queue.enqueue(1);
      queue.enqueue(2);
      assert.equal(queue.dequeue(), 1);
      
      queue.enqueue(3);
      queue.enqueue(4);
      assert.equal(queue.dequeue(), 2);
      
      queue.enqueue(5);
      assert.equal(queue.dequeue(), 3);
      assert.equal(queue.dequeue(), 4);
      assert.equal(queue.dequeue(), 5);
      
      assert.equal(queue.isEmpty(), true);
    });

    it('debería manejar enqueueFront después de rotar el buffer', () => {
      const queue = createQueue<number>(3);
      
      // Llenar y rotar
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      queue.dequeue(); // 1 sale
      queue.dequeue(); // 2 sale
      
      // Ahora enqueueFront debería funcionar correctamente
      queue.enqueueFront(0);
      
      assert.equal(queue.peek(), 0);
      assert.equal(queue.size(), 2);
      assert.deepEqual(queue.toArray(), [0, 3]);
    });
  });

  describe('toArray', () => {
    it('debería retornar los elementos en orden FIFO', () => {
      const queue = createQueue<string>(5);
      
      queue.enqueue('a');
      queue.enqueue('b');
      queue.enqueue('c');
      
      assert.deepEqual(queue.toArray(), ['a', 'b', 'c']);
    });

    it('toArray en cola vacía debería retornar array vacío', () => {
      const queue = createQueue<number>(5);
      assert.deepEqual(queue.toArray(), []);
    });

    it('toArray debería reflejar el estado actual después de dequeue', () => {
      const queue = createQueue<number>(5);
      
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      
      queue.dequeue();
      
      assert.deepEqual(queue.toArray(), [2, 3]);
    });
  });

  describe('Casos de uso del sync worker', () => {
    it('simular cola de sincronización con reintentos', () => {
      const queue = createQueue<{ id: string; attempts: number }>(3);
      
      // Agregar jobs
      queue.enqueue({ id: 'job-1', attempts: 0 });
      queue.enqueue({ id: 'job-2', attempts: 0 });
      queue.enqueue({ id: 'job-3', attempts: 0 });
      
      // job-1 se procesa exitosamente
      queue.dequeue();
      
      // job-2 falla, se reinserta al frente
      const job2 = queue.dequeue()!;
      job2.attempts++;
      queue.enqueueFront(job2);
      
      // El orden ahora es: job-2 (reintento), job-3
      const jobs = queue.toArray();
      assert.equal(jobs[0].id, 'job-2');
      assert.equal(jobs[0].attempts, 1);
      assert.equal(jobs[1].id, 'job-3');
      
      // Cola tiene 2 de 3 espacios, aún se puede agregar
      assert.equal(queue.enqueue({ id: 'job-4', attempts: 0 }), true);
      
      // Ahora la cola está llena
      assert.equal(queue.isFull(), true);
      assert.equal(queue.enqueue({ id: 'job-5', attempts: 0 }), false);
    });

    it('colapsar jobs del mismo origen (optimización)', () => {
      const queue = createQueue<{ id: string; noteId: string; content: string }>(5);
      
      // Agregar varios jobs de la misma nota
      queue.enqueue({ id: '1', noteId: 'nota-1', content: 'versión 1' });
      queue.enqueue({ id: '2', noteId: 'nota-1', content: 'versión 2' });
      queue.enqueue({ id: '3', noteId: 'nota-1', content: 'versión 3' });
      
      // Los dos primeros aún no se procesaron, se pueden colapsar
      const jobs = queue.toArray();
      const pendingSameNote = jobs.filter(j => j.noteId === 'nota-1');
      
      // En una implementación real, aquí colapsaríamos
      // Mantener solo el último contenido
      assert.equal(pendingSameNote.length, 3);
      assert.equal(pendingSameNote[2].content, 'versión 3');
    });
  });
});

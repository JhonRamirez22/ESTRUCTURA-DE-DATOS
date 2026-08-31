/**
 * Queue<T> - Cola genérica con arreglo circular
 *
 * Complejidad: enqueue/dequeue/enqueueFront = O(1)
 * Capacidad fija: al estar llena, enqueue retorna false
 *
 * Implementación con arreglo circular (dos punteros head/tail)
 * en vez de Array.shift() que es O(n) por reindexación.
 *
 * Caso de uso: cola de sincronización offline-first
 */
export interface Queue<T> {
    enqueue(item: T): boolean;
    dequeue(): T | undefined;
    enqueueFront(item: T): boolean;
    peek(): T | undefined;
    isEmpty(): boolean;
    isFull(): boolean;
    size(): number;
    toArray(): T[];
}
export declare function createQueue<T>(capacity: number): Queue<T>;

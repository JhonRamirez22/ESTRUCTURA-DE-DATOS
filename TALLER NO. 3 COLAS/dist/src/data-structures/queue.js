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
export function createQueue(capacity) {
    // Arreglo circular con capacidad fija
    const items = new Array(capacity);
    let head = 0; // Índice del elemento del frente
    let tail = 0; // Índice del siguiente espacio vacío
    let count = 0; // Número actual de elementos
    return {
        /**
         * Agrega un elemento al final de la cola (tail)
         * Retorna false si la cola está llena
         */
        enqueue(item) {
            if (count === capacity)
                return false;
            items[tail] = item;
            tail = (tail + 1) % capacity;
            count++;
            return true;
        },
        /**
         * Extrae y retorna el elemento del frente (head)
         * Retorna undefined si la cola está vacía
         */
        dequeue() {
            if (count === 0)
                return undefined;
            const item = items[head];
            items[head] = undefined; // Limpiar referencia
            head = (head + 1) % capacity;
            count--;
            return item;
        },
        /**
         * Inserta un elemento al frente de la cola
         * Útil para reintentos: el job fallido se reinserta antes que los nuevos
         * Retorna false si la cola está llena
         */
        enqueueFront(item) {
            if (count === capacity)
                return false;
            // Retroceder head circularmente
            head = (head - 1 + capacity) % capacity;
            items[head] = item;
            count++;
            return true;
        },
        /**
         * Retorna el elemento del frente sin extraerlo
         */
        peek() {
            if (count === 0)
                return undefined;
            return items[head];
        },
        /**
         * Retorna true si la cola no tiene elementos
         */
        isEmpty() {
            return count === 0;
        },
        /**
         * Retorna true si la cola ha alcanzado su capacidad máxima
         */
        isFull() {
            return count === capacity;
        },
        /**
         * Retorna el número actual de elementos en la cola
         */
        size() {
            return count;
        },
        /**
         * Retorna todos los elementos en orden FIFO (del frente al final)
         * Útil para serialización y debugging
         */
        toArray() {
            const result = [];
            let current = head;
            for (let i = 0; i < count; i++) {
                result.push(items[current]);
                current = (current + 1) % capacity;
            }
            return result;
        }
    };
}
//# sourceMappingURL=queue.js.map
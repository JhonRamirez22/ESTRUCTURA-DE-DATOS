/**
 * Stack<T> - Pila genérica implementada con arreglo nativo
 *
 * Complejidad: push/pop/peek = O(1) amortizado
 * Límite configurable: al superar MAX_SIZE, se descarta el elemento más antiguo
 *
 * Caso de uso: pila de deshacer/rehacer en editor de texto
 */
export function createStack(maxSize = Infinity) {
    const items = [];
    return {
        push(item) {
            // Si superamos el límite, descartar el elemento más antiguo (índice 0)
            if (items.length === maxSize) {
                items.shift(); // O(n) pero solo ocurre una vez cada maxSize pushes
            }
            items.push(item);
        },
        pop() {
            return items.pop();
        },
        peek() {
            if (items.length === 0)
                return undefined;
            return items[items.length - 1];
        },
        isEmpty() {
            return items.length === 0;
        },
        size() {
            return items.length;
        },
        clear() {
            items.length = 0;
        },
        toArray() {
            // Retornar copia en orden cronológico (de abajo hacia arriba)
            return [...items];
        }
    };
}
//# sourceMappingURL=stack.js.map
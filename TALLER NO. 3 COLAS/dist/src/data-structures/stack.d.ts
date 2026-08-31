/**
 * Stack<T> - Pila genérica implementada con arreglo nativo
 *
 * Complejidad: push/pop/peek = O(1) amortizado
 * Límite configurable: al superar MAX_SIZE, se descarta el elemento más antiguo
 *
 * Caso de uso: pila de deshacer/rehacer en editor de texto
 */
export interface Stack<T> {
    push(item: T): void;
    pop(): T | undefined;
    peek(): T | undefined;
    isEmpty(): boolean;
    size(): number;
    clear(): void;
    toArray(): T[];
}
export declare function createStack<T>(maxSize?: number): Stack<T>;

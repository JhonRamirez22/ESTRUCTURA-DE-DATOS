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

export function createStack<T>(maxSize: number = Infinity): Stack<T> {
  const items: T[] = [];

  return {
    push(item: T): void {
      // Si superamos el límite, descartar el elemento más antiguo (índice 0)
      if (items.length === maxSize) {
        items.shift(); // O(n) pero solo ocurre una vez cada maxSize pushes
      }
      items.push(item);
    },

    pop(): T | undefined {
      return items.pop();
    },

    peek(): T | undefined {
      if (items.length === 0) return undefined;
      return items[items.length - 1];
    },

    isEmpty(): boolean {
      return items.length === 0;
    },

    size(): number {
      return items.length;
    },

    clear(): void {
      items.length = 0;
    },

    toArray(): T[] {
      // Retornar copia en orden cronológico (de abajo hacia arriba)
      return [...items];
    }
  };
}

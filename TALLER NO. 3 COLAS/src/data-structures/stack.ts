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
  let topIndex = -1;

  return {
    push(item: T): void {
      topIndex++;
      
      // Si superamos el límite, descartar el elemento más antiguo (índice 0)
      if (topIndex === maxSize) {
        items.shift(); // O(n) pero solo ocurre una vez cada maxSize pushes
        topIndex = 0;  // Reiniciar: el nuevo elemento va al inicio
      }
      
      items[topIndex] = item;
    },

    pop(): T | undefined {
      if (topIndex < 0) return undefined;
      
      const item = items[topIndex];
      topIndex--;
      return item;
    },

    peek(): T | undefined {
      if (topIndex < 0) return undefined;
      return items[topIndex];
    },

    isEmpty(): boolean {
      return topIndex < 0;
    },

    size(): number {
      return topIndex + 1;
    },

    clear(): void {
      items.length = 0;
      topIndex = -1;
    },

    toArray(): T[] {
      // Retornar de abajo hacia arriba (orden cronológico)
      return items.slice(0, topIndex + 1);
    }
  };
}

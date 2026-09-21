/**
 * Lista enlazada simple para el estado de tareas en el cliente.
 * No se usa Array para almacenar tareas: inserción, búsqueda y borrado
 * se resuelven recorriendo el puntero `next` de cada nodo.
 */

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

export class TaskNode {
  id: number;
  title: string;
  completed: boolean;
  next: TaskNode | null = null;

  constructor(task: Task) {
    this.id = task.id;
    this.title = task.title;
    this.completed = task.completed;
  }
}

export class TaskLinkedList {
  private head: TaskNode | null = null;
  private tail: TaskNode | null = null;
  private size = 0;

  append(task: Task): TaskNode {
    const node = new TaskNode(task);
    if (this.tail === null) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.size += 1;
    return node;
  }

  find(id: number): TaskNode | null {
    let node = this.head;
    while (node !== null) {
      if (node.id === id) return node;
      node = node.next;
    }
    return null;
  }

  remove(id: number): boolean {
    let prev: TaskNode | null = null;
    let node = this.head;
    while (node !== null) {
      if (node.id === id) {
        if (prev === null) {
          this.head = node.next;
        } else {
          prev.next = node.next;
        }
        if (node === this.tail) {
          this.tail = prev;
        }
        this.size -= 1;
        return true;
      }
      prev = node;
      node = node.next;
    }
    return false;
  }

  clear(): void {
    this.head = this.tail = null;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  [Symbol.iterator](): Iterator<TaskNode> {
    let node = this.head;
    return {
      next(): IteratorResult<TaskNode> {
        if (node === null) return { done: true, value: undefined as unknown as TaskNode };
        const value = node;
        node = node.next;
        return { done: false, value };
      },
    };
  }
}

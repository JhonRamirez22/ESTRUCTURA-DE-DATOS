"""Lista enlazada simple (singly linked list) para gestionar tareas pendientes.

Cada tarea es un nodo con un puntero `next` al siguiente nodo. No se usa
`list`/`array` de Python para almacenar las tareas: el orden y el acceso
se resuelven exclusivamente recorriendo punteros.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterator, Optional


@dataclass
class TaskNode:
    """Un nodo de la lista: una tarea + puntero al siguiente nodo."""

    id: int
    title: str
    completed: bool = False
    next: Optional["TaskNode"] = field(default=None, repr=False)

    def to_dict(self) -> dict:
        return {"id": self.id, "title": self.title, "completed": self.completed}


class TaskLinkedList:
    """Lista enlazada simple con puntero a cola para `add` en O(1)."""

    MAX_TITLE_LENGTH = 200

    def __init__(self) -> None:
        self.head: Optional[TaskNode] = None
        self.tail: Optional[TaskNode] = None
        self._size = 0
        self._next_id = 1  # autoincremental; evita colisiones tras remove()

    def __len__(self) -> int:
        return self._size

    def __iter__(self) -> Iterator[TaskNode]:
        node = self.head
        while node is not None:
            yield node
            node = node.next

    def add(self, title: str) -> TaskNode:
        """Agrega una tarea al final de la lista. O(1) gracias al puntero tail."""
        title = title.strip()
        if not title:
            raise ValueError("title cannot be empty")
        if len(title) > self.MAX_TITLE_LENGTH:
            raise ValueError(f"title cannot exceed {self.MAX_TITLE_LENGTH} characters")

        node = TaskNode(id=self._next_id, title=title)
        self._next_id += 1

        if self.tail is None:  # lista vacía
            self.head = self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self._size += 1
        return node

    def find(self, task_id: int) -> Optional[TaskNode]:
        for node in self:
            if node.id == task_id:
                return node
        return None

    def toggle_completed(self, task_id: int) -> bool:
        node = self.find(task_id)
        if node is None:
            return False
        node.completed = not node.completed
        return True

    def remove(self, task_id: int) -> bool:
        """Elimina un nodo reencadenando el `next` del anterior. Cubre
        explícitamente los casos: lista vacía, head, tail y medio."""
        prev: Optional[TaskNode] = None
        node = self.head
        while node is not None:
            if node.id == task_id:
                if prev is None:
                    self.head = node.next
                else:
                    prev.next = node.next
                if node is self.tail:
                    self.tail = prev
                self._size -= 1
                return True
            prev, node = node, node.next
        return False

    def clear_completed(self) -> int:
        """Elimina todos los nodos completados en un solo recorrido. Retorna
        cuántos se eliminaron."""
        removed = 0
        prev: Optional[TaskNode] = None
        node = self.head
        while node is not None:
            nxt = node.next
            if node.completed:
                if prev is None:
                    self.head = nxt
                else:
                    prev.next = nxt
                if node is self.tail:
                    self.tail = prev
                self._size -= 1
                removed += 1
            else:
                prev = node
            node = nxt
        return removed

    def to_list(self) -> list[dict]:
        """Única concesión a `list`: serializar para la respuesta JSON."""
        return [node.to_dict() for node in self]

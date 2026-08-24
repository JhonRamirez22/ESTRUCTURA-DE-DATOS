"""
Clase Stack (Pila) - Estructura de datos LIFO
Last In, First Out - El último en entrar es el primero en salir
"""


class Stack:
    """Pila genérica implementada con una lista interna."""

    def __init__(self):
        self._elements = []

    def push(self, value):
        """Agrega un elemento al tope de la pila."""
        self._elements.append(value)

    def pop(self):
        """Extrae y retorna el elemento del tope de la pila.
        Retorna None si la pila está vacía."""
        if self.is_empty():
            return None
        return self._elements.pop()

    def peek(self):
        """Retorna el elemento del tope sin extraerlo.
        Retorna None si la pila está vacía."""
        if self.is_empty():
            return None
        return self._elements[-1]

    def is_empty(self):
        """Retorna True si la pila está vacía."""
        return len(self._elements) == 0

    def size(self):
        """Retorna la cantidad de elementos en la pila."""
        return len(self._elements)

    def clear(self):
        """Vacía todos los elementos de la pila."""
        self._elements.clear()

    def get_elements(self):
        """Retorna una copia de los elementos (de abajo hacia arriba)."""
        return self._elements.copy()

    def __str__(self):
        """Representación en cadena de la pila."""
        return f"Stack({self._elements})"

    def __len__(self):
        """Permite usar len() en la pila."""
        return len(self._elements)

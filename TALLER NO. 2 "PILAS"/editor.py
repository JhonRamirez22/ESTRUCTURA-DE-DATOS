"""
Clase TextEditor - Lógica del editor con deshacer/rehacer usando Pilas
"""
from pila import Stack


class TextEditor:
    """Editor de texto que utiliza dos pilas para manejar deshacer y rehacer."""

    def __init__(self):
        self._text = ""
        self._undo_stack = Stack()  # Guarda acciones para deshacer
        self._redo_stack = Stack()  # Guarda acciones para rehacer

    def write(self, text):
        """
        Agrega texto al editor.
        Cada vez que se escribe, se guarda en la pila de deshacer
        y se limpia la pila de rehacer (ya no se puede rehacer lo anterior).
        """
        self._undo_stack.push(self._text)  # Guardar estado anterior
        self._text += text
        self._redo_stack.clear()  # Limpiar rehacer (nueva acción)

    def replace(self, text):
        """
        Reemplaza todo el texto del editor.
        Guarda el estado anterior en la pila de deshacer.
        """
        self._undo_stack.push(self._text)
        self._text = text
        self._redo_stack.clear()

    def undo(self):
        """
        Deshace la última acción.
        Saca el estado anterior de la pila de deshacer
        y guarda el estado actual en la pila de rehacer.
        Retorna el nuevo texto o None si no hay nada que deshacer.
        """
        if self._undo_stack.is_empty():
            return None

        # Guardar estado actual en rehacer
        self._redo_stack.push(self._text)
        # Recuperar estado anterior
        self._text = self._undo_stack.pop()
        return self._text

    def redo(self):
        """
        Rehace la última acción deshecha.
        Saca el estado de la pila de rehacer
        y guarda el estado actual en la pila de deshacer.
        Retorna el nuevo texto o None si no hay nada que rehacer.
        """
        if self._redo_stack.is_empty():
            return None

        # Guardar estado actual en deshacer
        self._undo_stack.push(self._text)
        # Recuperar estado de rehacer
        self._text = self._redo_stack.pop()
        return self._text

    def get_text(self):
        """Retorna el texto actual del editor."""
        return self._text

    def can_undo(self):
        """Retorna True si hay acciones para deshacer."""
        return not self._undo_stack.is_empty()

    def can_redo(self):
        """Retorna True si hay acciones para rehacer."""
        return not self._redo_stack.is_empty()

    def undo_count(self):
        """Retorna cuántas acciones se pueden deshacer."""
        return self._undo_stack.size()

    def redo_count(self):
        """Retorna cuántas acciones se pueden rehacer."""
        return self._redo_stack.size()

    def clear(self):
        """Vacía el editor y todas las pilas."""
        self._text = ""
        self._undo_stack.clear()
        self._redo_stack.clear()

    def __str__(self):
        return f"TextEditor(\"{self._text}\")"

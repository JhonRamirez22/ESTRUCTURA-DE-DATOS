"""
Interfaz gráfica del Editor de Texto con Deshacer/Rehacer
Usa tkinter para la interfaz local
"""
import tkinter as tk
from tkinter import messagebox
from editor import TextEditor


class EditorApp:
    """Aplicación gráfica del editor de texto."""

    def __init__(self):
        self.editor = TextEditor()

        # Ventana principal
        self.window = tk.Tk()
        self.window.title("Editor de Texto - Taller Pilas")
        self.window.geometry("600x500")
        self.window.configure(bg="#2b2b2b")

        self._create_ui()

    def _create_ui(self):
        """Crea todos los elementos de la interfaz."""

        # === TITULO ===
        title = tk.Label(
            self.window,
            text="Editor de Texto con Deshacer / Rehacer",
            font=("Arial", 14, "bold"),
            bg="#2b2b2b",
            fg="white"
        )
        title.pack(pady=(10, 5))

        subtitle = tk.Label(
            self.window,
            text="Demuestra el uso de PILAS (LIFO) en un caso real",
            font=("Arial", 10),
            bg="#2b2b2b",
            fg="#888888"
        )
        subtitle.pack(pady=(0, 10))

        # === CAMPO DE ENTRADA DE TEXTO ===
        input_frame = tk.Frame(self.window, bg="#2b2b2b")
        input_frame.pack(fill=tk.X, padx=20)

        tk.Label(
            input_frame,
            text="Escribe tu texto:",
            font=("Arial", 10),
            bg="#2b2b2b",
            fg="white",
            anchor="w"
        ).pack(fill=tk.X)

        self.text_input = tk.Entry(
            input_frame,
            font=("Arial", 12),
            bg="#3c3c3c",
            fg="white",
            insertbackground="white",
            relief=tk.FLAT
        )
        self.text_input.pack(fill=tk.X, ipady=8, pady=(5, 0))
        self.text_input.bind("<Return>", lambda e: self._on_write())

        # === BOTONES DE ACCION ===
        buttons_frame = tk.Frame(self.window, bg="#2b2b2b")
        buttons_frame.pack(fill=tk.X, padx=20, pady=10)

        # Boton Escribir
        self.btn_write = tk.Button(
            buttons_frame,
            text="Escribir",
            font=("Arial", 10, "bold"),
            bg="#4CAF50",
            fg="white",
            activebackground="#45a049",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            command=self._on_write
        )
        self.btn_write.pack(side=tk.LEFT, padx=(0, 5), ipadx=15, ipady=5)

        # Boton Deshacer
        self.btn_undo = tk.Button(
            buttons_frame,
            text="Deshacer (Ctrl+Z)",
            font=("Arial", 10),
            bg="#ff9800",
            fg="white",
            activebackground="#e68a00",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            state=tk.DISABLED,
            command=self._on_undo
        )
        self.btn_undo.pack(side=tk.LEFT, padx=5, ipadx=15, ipady=5)

        # Boton Rehacer
        self.btn_redo = tk.Button(
            buttons_frame,
            text="Rehacer (Ctrl+Y)",
            font=("Arial", 10),
            bg="#2196F3",
            fg="white",
            activebackground="#1976D2",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            state=tk.DISABLED,
            command=self._on_redo
        )
        self.btn_redo.pack(side=tk.LEFT, padx=5, ipadx=15, ipady=5)

        # Boton Limpiar
        btn_clear = tk.Button(
            buttons_frame,
            text="Limpiar",
            font=("Arial", 10),
            bg="#f44336",
            fg="white",
            activebackground="#d32f2f",
            activeforeground="white",
            relief=tk.FLAT,
            cursor="hand2",
            command=self._on_clear
        )
        btn_clear.pack(side=tk.LEFT, padx=5, ipadx=15, ipady=5)

        # === TEXTO ACTUAL ===
        text_frame = tk.Frame(self.window, bg="#2b2b2b")
        text_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(5, 10))

        tk.Label(
            text_frame,
            text="Texto actual en el editor:",
            font=("Arial", 10, "bold"),
            bg="#2b2b2b",
            fg="white",
            anchor="w"
        ).pack(fill=tk.X)

        self.text_display = tk.Text(
            text_frame,
            font=("Consolas", 13),
            bg="#1e1e1e",
            fg="#d4d4d4",
            insertbackground="white",
            relief=tk.FLAT,
            height=8,
            state=tk.DISABLED
        )
        self.text_display.pack(fill=tk.BOTH, expand=True, pady=(5, 0))

        # === BARRA DE ESTADO ===
        status_frame = tk.Frame(self.window, bg="#333333")
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)

        self.status_label = tk.Label(
            status_frame,
            text="Deshacer: 0 | Rehacer: 0",
            font=("Arial", 9),
            bg="#333333",
            fg="#aaaaaa",
            anchor="w"
        )
        self.status_label.pack(fill=tk.X, padx=10, pady=5)

        # === ATAJOS DE TECLADO ===
        self.window.bind("<Control-z>", lambda e: self._on_undo())
        self.window.bind("<Control-y>", lambda e: self._on_redo())

        self._update_status()

    def _on_write(self):
        """Maneja el evento de escribir texto."""
        text = self.text_input.get().strip()
        if not text:
            messagebox.showwarning("Aviso", "Escribe algo antes de agregar.")
            return

        self.editor.write(text + " ")
        self.text_input.delete(0, tk.END)
        self._update_status()

    def _on_undo(self):
        """Maneja el evento de deshacer."""
        result = self.editor.undo()
        if result is None:
            messagebox.showinfo("Info", "No hay acciones para deshacer.")
        self._update_status()

    def _on_redo(self):
        """Maneja el evento de rehacer."""
        result = self.editor.redo()
        if result is None:
            messagebox.showinfo("Info", "No hay acciones para rehacer.")
        self._update_status()

    def _on_clear(self):
        """Limpia el editor y todas las pilas."""
        self.editor.clear()
        self._update_status()

    def _update_status(self):
        """Actualiza la vista del texto y la barra de estado."""
        # Actualizar texto mostrado
        self.text_display.config(state=tk.NORMAL)
        self.text_display.delete("1.0", tk.END)
        self.text_display.insert("1.0", self.editor.get_text())
        self.text_display.config(state=tk.DISABLED)

        # Actualizar estado de pilas
        d = self.editor.undo_count()
        r = self.editor.redo_count()
        self.status_label.config(
            text=f"Deshacer: {d} accion(es) | Rehacer: {r} accion(es)"
        )

        # Habilitar/deshabilitar botones
        if self.editor.can_undo():
            self.btn_undo.config(state=tk.NORMAL)
        else:
            self.btn_undo.config(state=tk.DISABLED)

        if self.editor.can_redo():
            self.btn_redo.config(state=tk.NORMAL)
        else:
            self.btn_redo.config(state=tk.DISABLED)

    def run(self):
        """Inicia la aplicación."""
        self.window.mainloop()

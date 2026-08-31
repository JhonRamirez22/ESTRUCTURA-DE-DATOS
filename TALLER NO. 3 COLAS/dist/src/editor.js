/**
 * Editor - Lógica del textarea con deshacer/rehacer usando Pilas
 *
 * Implementa:
 * - Debounce de 500ms para no apilar cada tecla
 * - Dos pilas: undoStack (historial) y redoStack (rehacer)
 * - Límite de 50 snapshots en el historial
 * - Regla crítica: nueva edición vacía el redo
 */
import { createStack } from './data-structures/stack.js';
const MAX_UNDO_STACK = 50;
const DEBOUNCE_MS = 500;
export function createEditor(textarea) {
    // Pilas para deshacer y rehacer
    const undoStack = createStack(MAX_UNDO_STACK);
    const redoStack = createStack();
    // Estado interno
    let debounceTimer = null;
    let currentContent = textarea.value;
    let inputCallback = null;
    let snapshotCallback = null;
    /**
     * Guarda el estado actual en la pila de undo
     * y limpia la pila de redo (nueva edición = redo se pierde)
     */
    function saveSnapshot() {
        const snapshot = {
            content: currentContent,
            timestamp: Date.now()
        };
        undoStack.push(snapshot);
        redoStack.clear(); // Regla crítica: nueva edición = redo se vacía
        if (snapshotCallback) {
            snapshotCallback(snapshot);
        }
    }
    /**
     * Maneja el evento input del textarea
     * Implementa debounce para no apilar cada tecla
     */
    function handleInput() {
        const newContent = textarea.value;
        // Solo guardar si el contenido realmente cambió
        if (newContent === currentContent)
            return;
        currentContent = newContent;
        // Cancelar debounce anterior
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        // Nuevo debounce: guardar snapshot después de 500ms sin escribir
        debounceTimer = setTimeout(() => {
            saveSnapshot();
            debounceTimer = null;
        }, DEBOUNCE_MS);
    }
    /**
     * Deshace la última acción (Ctrl+Z)
     * Saca de undo, pushea a redo, retorna el contenido anterior
     */
    function undo() {
        if (undoStack.isEmpty())
            return null;
        const snapshot = undoStack.pop();
        if (!snapshot)
            return null;
        // Guardar estado actual en redo
        redoStack.push({
            content: currentContent,
            timestamp: Date.now()
        });
        // Aplicar estado anterior
        currentContent = snapshot.content;
        textarea.value = currentContent;
        return currentContent;
    }
    /**
     * Rehace la última acción deshecha (Ctrl+Y)
     * Saca de redo, pushea a undo, retorna el contenido reecho
     */
    function redo() {
        if (redoStack.isEmpty())
            return null;
        const snapshot = redoStack.pop();
        if (!snapshot)
            return null;
        // Guardar estado actual en undo
        undoStack.push({
            content: currentContent,
            timestamp: Date.now()
        });
        // Aplicar estado reecho
        currentContent = snapshot.content;
        textarea.value = currentContent;
        return currentContent;
    }
    /**
     * Retorna el contenido actual del editor
     */
    function getContent() {
        return currentContent;
    }
    /**
     * Establece el contenido del editor
     */
    function setContent(content) {
        currentContent = content;
        textarea.value = content;
    }
    /**
     * Registra callback para eventos de input
     */
    function onInput(callback) {
        inputCallback = callback;
    }
    /**
     * Registra callback para cuando se guarda un snapshot
     */
    function onSnapshot(callback) {
        snapshotCallback = callback;
    }
    /**
     * Limpia recursos
     */
    function destroy() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        textarea.removeEventListener('input', handleInput);
    }
    // Configurar event listener
    textarea.addEventListener('input', handleInput);
    return {
        getContent,
        setContent,
        saveSnapshot,
        undo,
        redo,
        canUndo: () => !undoStack.isEmpty(),
        canRedo: () => !redoStack.isEmpty(),
        getUndoCount: () => undoStack.size(),
        getRedoCount: () => redoStack.size(),
        onInput,
        onSnapshot,
        destroy
    };
}
//# sourceMappingURL=editor.js.map
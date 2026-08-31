/**
 * Editor - Lógica del textarea con deshacer/rehacer usando Pilas
 *
 * Implementa:
 * - Debounce de 500ms para no apilar cada tecla
 * - Dos pilas: undoStack (historial) y redoStack (rehacer)
 * - Límite de 50 snapshots en el historial
 * - Regla crítica: nueva edición vacía el redo
 */
export interface Snapshot {
    content: string;
    timestamp: number;
}
export interface Editor {
    getContent(): string;
    setContent(content: string): void;
    saveSnapshot(): void;
    undo(): string | null;
    redo(): string | null;
    canUndo(): boolean;
    canRedo(): boolean;
    getUndoCount(): number;
    getRedoCount(): number;
    onInput(callback: (content: string) => void): void;
    onSnapshot(callback: (snapshot: Snapshot) => void): void;
    destroy(): void;
}
export declare function createEditor(textarea: HTMLTextAreaElement): Editor;

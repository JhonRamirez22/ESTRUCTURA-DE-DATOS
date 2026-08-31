/**
 * Editor - Lógica del textarea con deshacer/rehacer usando Pilas
 * 
 * Implementa:
 * - Debounce de 500ms para no apilar cada tecla
 * - Dos pilas: undoStack (historial) y redoStack (rehacer)
 * - Límite de 50 snapshots en el historial
 * - Regla crítica: nueva edición vacía el redo
 */

import { createStack, type Stack } from './data-structures/stack.js';

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

const MAX_UNDO_STACK = 50;
const DEBOUNCE_MS = 500;

export function createEditor(textarea: HTMLTextAreaElement): Editor {
  // Pilas para deshacer y rehacer
  const undoStack: Stack<Snapshot> = createStack<Snapshot>(MAX_UNDO_STACK);
  const redoStack: Stack<Snapshot> = createStack<Snapshot>();
  
  // Estado interno
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentContent = textarea.value;
  let inputCallback: ((content: string) => void) | null = null;
  let snapshotCallback: ((snapshot: Snapshot) => void) | null = null;

  /**
   * Guarda el estado actual en la pila de undo
   * y limpia la pila de redo (nueva edición = redo se pierde)
   */
  function saveSnapshot(): void {
    const snapshot: Snapshot = {
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
  function handleInput(): void {
    const newContent = textarea.value;
    
    // Solo guardar si el contenido realmente cambió
    if (newContent === currentContent) return;
    
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
  function undo(): string | null {
    if (undoStack.isEmpty()) return null;
    
    const snapshot = undoStack.pop();
    if (!snapshot) return null;
    
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
  function redo(): string | null {
    if (redoStack.isEmpty()) return null;
    
    const snapshot = redoStack.pop();
    if (!snapshot) return null;
    
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
  function getContent(): string {
    return currentContent;
  }

  /**
   * Establece el contenido del editor
   */
  function setContent(content: string): void {
    currentContent = content;
    textarea.value = content;
  }

  /**
   * Registra callback para eventos de input
   */
  function onInput(callback: (content: string) => void): void {
    inputCallback = callback;
  }

  /**
   * Registra callback para cuando se guarda un snapshot
   */
  function onSnapshot(callback: (snapshot: Snapshot) => void): void {
    snapshotCallback = callback;
  }

  /**
   * Limpia recursos
   */
  function destroy(): void {
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

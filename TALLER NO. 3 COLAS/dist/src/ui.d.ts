/**
 * UI - Actualización del DOM
 *
 * Responsabilidades:
 * - Actualizar estado de botones undo/redo
 * - Renderizar tarjetas de jobs en la cola
 * - Mostrar toasts de notificación
 * - Actualizar badges y contadores
 */
import type { SyncJob } from './sync-worker.js';
export interface UI {
    updateUndoRedoButtons(canUndo: boolean, canRedo: boolean, undoCount: number, redoCount: number): void;
    updateSaveStatus(status: 'saving' | 'saved' | 'offline'): void;
    updateCharCount(count: number): void;
    renderQueue(jobs: SyncJob[]): void;
    updateQueueBadge(count: number, max?: number): void;
    showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
}
export declare function createUI(): UI;

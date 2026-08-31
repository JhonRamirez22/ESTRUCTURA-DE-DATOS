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

const MAX_QUEUE = 20;

export function createUI(): UI {
  // Elementos del DOM
  const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
  const redoBtn = document.getElementById('redo-btn') as HTMLButtonElement;
  const undoCount = document.getElementById('undo-count') as HTMLSpanElement;
  const redoCount = document.getElementById('redo-count') as HTMLSpanElement;
  const saveStatus = document.getElementById('save-status') as HTMLSpanElement;
  const charCount = document.getElementById('char-count') as HTMLSpanElement;
  const queueList = document.getElementById('queue-list') as HTMLDivElement;
  const emptyQueue = document.getElementById('empty-queue') as HTMLDivElement;
  const queueBadge = document.getElementById('queue-badge') as HTMLSpanElement;
  const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

  /**
   * Actualiza el estado visual de los botones undo/redo
   */
  function updateUndoRedoButtons(
    canUndo: boolean, 
    canRedo: boolean, 
    undoCountValue: number, 
    redoCountValue: number
  ): void {
    undoBtn.disabled = !canUndo;
    redoBtn.disabled = !canRedo;
    
    undoCount.textContent = String(undoCountValue);
    redoCount.textContent = String(redoCountValue);
    
    // Ocultar badges si el conteo es 0
    undoCount.style.display = undoCountValue > 0 ? 'flex' : 'none';
    redoCount.style.display = redoCountValue > 0 ? 'flex' : 'none';
  }

  /**
   * Actualiza el indicador de estado de guardado
   */
  function updateSaveStatus(status: 'saving' | 'saved' | 'offline'): void {
    saveStatus.className = status;
    
    switch (status) {
      case 'saving':
        saveStatus.textContent = 'Guardando...';
        break;
      case 'saved':
        saveStatus.textContent = 'Guardado';
        break;
      case 'offline':
        saveStatus.textContent = 'Sin conexión';
        break;
    }
  }

  /**
   * Actualiza el contador de caracteres
   */
  function updateCharCount(count: number): void {
    charCount.textContent = `${count} caracteres`;
  }

  /**
   * Renderiza la lista de jobs en la cola
   */
  function renderQueue(jobs: SyncJob[]): void {
    // Limpiar lista actual
    queueList.innerHTML = '';
    
    // Mostrar/ocultar mensaje de cola vacía
    if (jobs.length === 0) {
      emptyQueue.style.display = 'flex';
      queueList.style.display = 'none';
      return;
    }
    
    emptyQueue.style.display = 'none';
    queueList.style.display = 'flex';
    
    // Renderizar cada job como tarjeta
    jobs.forEach((job, index) => {
      const card = createJobCard(job, index === 0);
      queueList.appendChild(card);
    });
  }

  /**
   * Crea la tarjeta HTML para un job
   */
  function createJobCard(job: SyncJob, isFront: boolean): HTMLDivElement {
    const card = document.createElement('div');
    card.className = `job-card ${job.attempts > 0 ? 'failed' : ''} ${isFront ? 'processing' : ''}`;
    
    const timeAgo = formatTimeAgo(job.createdAt);
    const contentPreview = job.content.substring(0, 100) || '(vacío)';
    
    card.innerHTML = `
      <div class="job-card-header">
        <div class="job-status">
          <span class="dot"></span>
          ${isFront ? 'Procesando' : 'Pendiente'}
        </div>
        <span class="job-time">${timeAgo}</span>
      </div>
      <div class="job-content">${escapeHtml(contentPreview)}</div>
      <div class="job-footer">
        <span class="job-attempts">Intentos: ${job.attempts} / 3</span>
        <span class="job-id">${job.id.substring(0, 12)}...</span>
      </div>
    `;
    
    return card;
  }

  /**
   * Formatea un timestamp como "hace X s/m"
   */
  function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    return `hace ${minutes}m`;
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Actualiza el badge del contador de la cola
   */
  function updateQueueBadge(count: number, max: number = MAX_QUEUE): void {
    queueBadge.textContent = `${count} / ${max}`;
    
    // Remover clases anteriores
    queueBadge.classList.remove('warning', 'full');
    
    if (count >= max) {
      queueBadge.classList.add('full');
    } else if (count >= max * 0.8) {
      queueBadge.classList.add('warning');
    }
  }

  /**
   * Muestra un toast de notificación
   */
  function showToast(
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
      toast.classList.add('fadeOut');
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  return {
    updateUndoRedoButtons,
    updateSaveStatus,
    updateCharCount,
    renderQueue,
    updateQueueBadge,
    showToast
  };
}

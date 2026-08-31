/**
 * Main - Punto de entrada y wiring de todos los módulos
 * 
 * Conecta:
 * - Editor (pilas de undo/redo)
 * - SyncWorker (cola de sincronización)
 * - UI (actualización del DOM)
 */

import { createEditor } from './editor.js';
import { createSyncWorker, type SyncJob } from './sync-worker.js';
import { createUI } from './ui.js';

// Constantes
const SAVE_DEBOUNCE_MS = 1500;
const CONTENT_STORAGE_KEY = 'editor-content';

// Elementos del DOM
const textarea = document.getElementById('editor') as HTMLTextAreaElement;
const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
const redoBtn = document.getElementById('redo-btn') as HTMLButtonElement;
const onlineToggle = document.getElementById('online-toggle') as HTMLInputElement;
const forceFailBtn = document.getElementById('force-fail-btn') as HTMLButtonElement;

// Crear instancias
const editor = createEditor(textarea);
const syncWorker = createSyncWorker();
const ui = createUI();

// Timer para debounce de guardado
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Restaura el contenido desde localStorage
 */
function restoreContent(): void {
  try {
    const saved = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (saved) {
      editor.setContent(saved);
      ui.updateCharCount(saved.length);
    }
  } catch (e) {
    console.error('Error restaurando contenido:', e);
  }
}

/**
 * Guarda el contenido en localStorage
 */
function persistContent(content: string): void {
  try {
    localStorage.setItem(CONTENT_STORAGE_KEY, content);
  } catch (e) {
    console.error('Error guardando contenido:', e);
  }
}

/**
 * Programa el guardado del contenido en la cola de sync
 */
function scheduleSave(content: string): void {
  // Cancelar guardado anterior
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  ui.updateSaveStatus('saving');
  
  // Debounce de 1.5s: solo guardar después de 1.5s sin escribir
  saveTimer = setTimeout(() => {
    // Guardar en localStorage inmediatamente
    persistContent(content);
    
    // Agregar a la cola de sincronización
    const enqueued = syncWorker.enqueue(content);
    
    if (enqueued) {
      ui.updateSaveStatus('saved');
    } else {
      ui.updateSaveStatus('offline');
    }
    
    saveTimer = null;
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Actualiza la UI de la cola de sincronización
 */
function updateQueueUI(): void {
  const jobs = syncWorker.getJobs();
  const size = syncWorker.getQueueSize();
  
  ui.renderQueue(jobs);
  ui.updateQueueBadge(size);
}

// ========================================
// Event Listeners del Editor
// ========================================

// Cuando el editor detecta input, programar guardado
editor.onInput((content) => {
  ui.updateCharCount(content.length);
  scheduleSave(content);
});

// Cuando se guarda un snapshot, actualizar botones undo/redo
editor.onSnapshot(() => {
  ui.updateUndoRedoButtons(
    editor.canUndo(),
    editor.canRedo(),
    editor.getUndoCount(),
    editor.getRedoCount()
  );
});

// Botones undo/redo
undoBtn.addEventListener('click', () => {
  editor.undo();
  ui.updateUndoRedoButtons(
    editor.canUndo(),
    editor.canRedo(),
    editor.getUndoCount(),
    editor.getRedoCount()
  );
});

redoBtn.addEventListener('click', () => {
  editor.redo();
  ui.updateUndoRedoButtons(
    editor.canUndo(),
    editor.canRedo(),
    editor.getUndoCount(),
    editor.getRedoCount()
  );
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  // Ctrl+Z / Cmd+Z = Deshacer
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    editor.undo();
    ui.updateUndoRedoButtons(
      editor.canUndo(),
      editor.canRedo(),
      editor.getUndoCount(),
      editor.getRedoCount()
    );
  }
  
  // Ctrl+Y / Cmd+Y / Ctrl+Shift+Z = Rehacer
  if (
    ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')
  ) {
    e.preventDefault();
    editor.redo();
    ui.updateUndoRedoButtons(
      editor.canUndo(),
      editor.canRedo(),
      editor.getUndoCount(),
      editor.getRedoCount()
    );
  }
});

// ========================================
// Event Listeners del SyncWorker
// ========================================

// Toggle online/offline
onlineToggle.addEventListener('change', () => {
  const isOnline = onlineToggle.checked;
  syncWorker.setOnline(isOnline);
  
  if (isOnline) {
    ui.showToast('Conectado - sincronizando cambios pendientes', 'success');
  } else {
    ui.showToast('Desconectado - los cambios se encolarán', 'warning');
  }
  
  ui.updateSaveStatus(isOnline ? 'saved' : 'offline');
});

// Forzar fallo del próximo envío
forceFailBtn.addEventListener('click', () => {
  syncWorker.forceFailNext();
  ui.showToast('Próximo envío fallará forzadamente', 'warning');
});

// Callbacks del SyncWorker
syncWorker.onJobProcessed((job: SyncJob) => {
  updateQueueUI();
  ui.showToast('Cambio sincronizado', 'success');
});

syncWorker.onJobFailed((job: SyncJob) => {
  updateQueueUI();
  ui.showToast(`Envío fallido (intento ${job.attempts}/3)`, 'warning');
});

syncWorker.onJobLost((job: SyncJob) => {
  updateQueueUI();
  ui.showToast('Cambio perdido tras 3 intentos fallidos', 'error');
});

syncWorker.onQueueFull(() => {
  ui.showToast('Cola llena - cambios sin guardar, revisa tu conexión', 'error');
});

// ========================================
// Inicialización
// ========================================

function init(): void {
  // Restaurar contenido guardado
  restoreContent();
  
  // Actualizar UI inicial
  ui.updateCharCount(textarea.value.length);
  ui.updateUndoRedoButtons(
    editor.canUndo(),
    editor.canRedo(),
    editor.getUndoCount(),
    editor.getRedoCount()
  );
  
  // Actualizar estado de conexión inicial
  ui.updateSaveStatus(navigator.onLine ? 'saved' : 'offline');
  
  // Renderizar cola inicial
  updateQueueUI();
  
  // Iniciar worker de sincronización
  syncWorker.start();
  
  // Escuchar cambios de conexión del navegador
  window.addEventListener('online', () => {
    syncWorker.setOnline(true);
    onlineToggle.checked = true;
    ui.updateSaveStatus('saved');
    ui.showToast('Conexión restaurada', 'success');
  });
  
  window.addEventListener('offline', () => {
    syncWorker.setOnline(false);
    onlineToggle.checked = false;
    ui.updateSaveStatus('offline');
    ui.showToast('Conexión perdida', 'warning');
  });
  
  console.log('Editor de notas offline-first inicializado');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

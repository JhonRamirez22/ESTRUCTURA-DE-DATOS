/**
 * SyncWorker - Cola de sincronización offline-first
 * 
 * Implementa:
 * - Cola FIFO con capacidad máxima de 20 jobs
 * - Worker que procesa cada 2 segundos si hay conexión
 * - Reintento al frente si falla (< 3 intentos)
 * - Descarte y notificación si falla 3 veces
 * - Persistencia en localStorage
 */

import { createQueue, type Queue } from './data-structures/queue.js';

export interface SyncJob {
  id: string;
  content: string;
  attempts: number;
  createdAt: number;
}

export interface SyncWorker {
  enqueue(content: string): boolean;
  processNext(): Promise<boolean>;
  start(): void;
  stop(): void;
  isOnline(): boolean;
  setOnline(online: boolean): void;
  forceFailNext(): void;
  getQueueSize(): number;
  getJobs(): SyncJob[];
  onJobProcessed(callback: (job: SyncJob) => void): void;
  onJobFailed(callback: (job: SyncJob) => void): void;
  onJobLost(callback: (job: SyncJob) => void): void;
  onQueueFull(callback: () => void): void;
  destroy(): void;
}

const MAX_QUEUE_SIZE = 20;
const WORKER_INTERVAL_MS = 2000;
const FAIL_PROBABILITY = 0.2; // 20% de probabilidad de fallo
const MAX_ATTEMPTS = 3;
const STORAGE_KEY = 'sync-queue';

export function createSyncWorker(): SyncWorker {
  const queue: Queue<SyncJob> = createQueue<SyncJob>(MAX_QUEUE_SIZE);
  
  let online = true;
  let workerInterval: ReturnType<typeof setInterval> | null = null;
  let forceFail = false;
  
  // Callbacks
  let jobProcessedCallback: ((job: SyncJob) => void) | null = null;
  let jobFailedCallback: ((job: SyncJob) => void) | null = null;
  let jobLostCallback: ((job: SyncJob) => void) | null = null;
  let queueFullCallback: (() => void) | null = null;

  /**
   * Genera un ID único para cada job
   */
  function generateId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simula el envío al servidor
   * Retorna true si éxito, false si falla
   */
  async function simulateSend(job: SyncJob): Promise<boolean> {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
    
    // Si se forzó fallo, fallar
    if (forceFail) {
      forceFail = false;
      return false;
    }
    
    // Probabilidad aleatoria de fallo
    return Math.random() > FAIL_PROBABILITY;
  }

  /**
   * Guarda la cola en localStorage
   */
  function persistQueue(): void {
    try {
      const jobs = queue.toArray();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.error('Error guardando cola en localStorage:', e);
    }
  }

  /**
   * Restaura la cola desde localStorage
   */
  function restoreQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const jobs: SyncJob[] = JSON.parse(stored);
      
      // Restaurar jobs uno por uno (respeta capacidad máxima)
      for (const job of jobs) {
        queue.enqueue(job);
      }
    } catch (e) {
      console.error('Error restaurando cola desde localStorage:', e);
    }
  }

  /**
   * Agrega un nuevo job a la cola
   * Retorna false si la cola está llena
   */
  function enqueue(content: string): boolean {
    if (queue.isFull()) {
      if (queueFullCallback) queueFullCallback();
      return false;
    }
    
    const job: SyncJob = {
      id: generateId(),
      content,
      attempts: 0,
      createdAt: Date.now()
    };
    
    const success = queue.enqueue(job);
    if (success) {
      persistQueue();
    }
    
    return success;
  }

  /**
   * Procesa el siguiente job de la cola
   * Retorna true si procesó uno, false si la cola estaba vacía
   */
  async function processNext(): Promise<boolean> {
    if (queue.isEmpty() || !online) return false;
    
    const job = queue.peek();
    if (!job) return false;
    
    const success = await simulateSend(job);
    
    if (success) {
      // Éxito: remover de la cola
      queue.dequeue();
      persistQueue();
      
      if (jobProcessedCallback) {
        jobProcessedCallback(job);
      }
      
      return true;
    } else {
      // Fallo: incrementar intentos
      job.attempts++;
      
      if (job.attempts >= MAX_ATTEMPTS) {
        // Demasiados intentos: descartar job
        queue.dequeue();
        persistQueue();
        
        if (jobLostCallback) {
          jobLostCallback(job);
        }
      } else {
        // Reintentar: sacar y reinsertar al frente
        queue.dequeue();
        queue.enqueueFront(job);
        persistQueue();
        
        if (jobFailedCallback) {
          jobFailedCallback(job);
        }
      }
      
      return false;
    }
  }

  /**
   * Inicia el worker que procesa la cola periódicamente
   */
  function start(): void {
    if (workerInterval) return;
    
    workerInterval = setInterval(async () => {
      // Procesar todos los jobs pendientes mientras haya conexión
      while (!queue.isEmpty() && online) {
        const processed = await processNext();
        if (!processed) break;
      }
    }, WORKER_INTERVAL_MS);
  }

  /**
   * Detiene el worker
   */
  function stop(): void {
    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
    }
  }

  /**
   * Retorna si hay conexión simulada
   */
  function isOnline(): boolean {
    return online;
  }

  /**
   * Establece el estado de conexión
   */
  function setOnline(value: boolean): void {
    online = value;
  }

  /**
   * Fuerza que el próximo envío falle
   */
  function forceFailNext(): void {
    forceFail = true;
  }

  /**
   * Retorna el tamaño actual de la cola
   */
  function getQueueSize(): number {
    return queue.size();
  }

  /**
   * Retorna todos los jobs en la cola (para UI)
   */
  function getJobs(): SyncJob[] {
    return queue.toArray();
  }

  /**
   * Registra callback para job procesado exitosamente
   */
  function onJobProcessed(callback: (job: SyncJob) => void): void {
    jobProcessedCallback = callback;
  }

  /**
   * Registro callback para job que falló pero se reintentará
   */
  function onJobFailed(callback: (job: SyncJob) => void): void {
    jobFailedCallback = callback;
  }

  /**
   * Registra callback para job perdido (3 intentos fallidos)
   */
  function onJobLost(callback: (job: SyncJob) => void): void {
    jobLostCallback = callback;
  }

  /**
   * Registra callback para cuando la cola está llena
   */
  function onQueueFull(callback: () => void): void {
    queueFullCallback = callback;
  }

  /**
   * Limpia recursos
   */
  function destroy(): void {
    stop();
  }

  // Restaurar cola al iniciar
  restoreQueue();

  return {
    enqueue,
    processNext,
    start,
    stop,
    isOnline,
    setOnline,
    forceFailNext,
    getQueueSize,
    getJobs,
    onJobProcessed,
    onJobFailed,
    onJobLost,
    onQueueFull,
    destroy
  };
}

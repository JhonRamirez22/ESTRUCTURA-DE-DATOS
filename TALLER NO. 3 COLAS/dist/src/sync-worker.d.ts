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
export declare function createSyncWorker(): SyncWorker;

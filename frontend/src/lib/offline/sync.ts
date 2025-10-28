import { api } from '../api';
import {
  savePendingOperation,
  getPendingOperations,
  markOperationSynced,
  markOperationFailed,
  updateSyncMetadata,
  getLastSyncTimestamp,
} from './db';

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  operation: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface SyncResponse {
  applied: string[];
  conflicts: unknown[];
  serverTimestamp: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  private constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Registra una operación para ser sincronizada
   */
  async registerOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    operation: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    await savePendingOperation(operationId, type, entity, operation, data);

    if (this.isOnline && !this.syncInProgress) {
      await this.syncPendingOperations();
    }

    return operationId;
  }

  /**
   * Sincroniza operaciones pendientes con el servidor
   */
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingOps = await getPendingOperations();

      if (pendingOps.length === 0) {
        this.syncInProgress = false;
        return;
      }

      const operations: SyncOperation[] = pendingOps.map((op) => ({
        id: op.id,
        type: op.type,
        entity: op.entity,
        operation: op.operation,
        data: op.data,
        timestamp: op.timestamp,
      }));

      const response = await api.post<SyncResponse>('/sync/push', { operations });
      const result = response.data;

      // Marcar operaciones aplicadas
      for (const opId of result.applied) {
        await markOperationSynced(opId);
      }

      // Manejar conflictos
      if (result.conflicts.length > 0) {
        console.warn('Conflictos detectados:', result.conflicts);
        // TODO: Implementar resolución de conflictos
      }

      // Actualizar timestamp de sincronización
      await updateSyncMetadata('lastSync', result.serverTimestamp);
    } catch (error) {
      console.error('Error en sincronización:', error);
      // Marcar operaciones como fallidas para reintentar después
      const pendingOps = await getPendingOperations();
      for (const op of pendingOps) {
        await markOperationFailed(op.id, error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obtiene cambios desde el servidor
   */
  async pullChanges(entities: string[]): Promise<Record<string, unknown[]>> {
    const lastSyncTimestamp = await getLastSyncTimestamp('lastSync');

    const response = await api.post('/sync/pull', {
      lastSyncTimestamp,
      entities,
    });

    return (response.data as { changes: Record<string, unknown[]> }).changes;
  }

  /**
   * Obtiene operaciones pendientes
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    const ops = await getPendingOperations();
    return ops.map((op) => ({
      id: op.id,
      type: op.type,
      entity: op.entity,
      operation: op.operation,
      data: op.data,
      timestamp: op.timestamp,
    }));
  }

  /**
   * Verifica el estado de sincronización
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTimestamp: number;
  }> {
    const pendingOps = await getPendingOperations();
    const lastSyncTimestamp = await getLastSyncTimestamp('lastSync');

    return {
      pendingCount: pendingOps.length,
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      lastSyncTimestamp,
    };
  }

  /**
   * Limpia operaciones antiguas ya sincronizadas
   */
  async cleanupOldSyncs(_olderThan: number = 7 * 24 * 60 * 60 * 1000) {
    // TODO: Implementar limpieza de operaciones antiguas
  }
}

export const syncManager = SyncManager.getInstance();



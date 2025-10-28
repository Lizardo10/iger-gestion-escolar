import { useState, useEffect } from 'react';
import { syncManager, type SyncOperation } from '../lib/offline/sync';

export interface SyncStatus {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTimestamp: 0,
  });

  useEffect(() => {
    const updateStatus = async () => {
      const syncStatus = await syncManager.getSyncStatus();
      setStatus(syncStatus);
    };

    updateStatus();

    const interval = setInterval(updateStatus, 5000); // Actualizar cada 5 segundos

    const handleOnline = () => {
      syncManager.syncPendingOperations();
      updateStatus();
    };

    const handleOffline = () => {
      updateStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = async () => {
    await syncManager.syncPendingOperations();
    const newStatus = await syncManager.getSyncStatus();
    setStatus(newStatus);
  };

  const registerOperation = async (
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: string,
    operation: string,
    data: Record<string, unknown>
  ): Promise<string> => {
    const operationId = await syncManager.registerOperation(type, entity, operation, data);
    const newStatus = await syncManager.getSyncStatus();
    setStatus(newStatus);
    return operationId;
  };

  const getPendingOperations = async (): Promise<SyncOperation[]> => {
    return await syncManager.getPendingOperations();
  };

  const getSyncIcon = () => {
    if (status.isSyncing) return '🔄';
    if (!status.isOnline) return '📴';
    if (status.pendingCount > 0) return '⏳';
    return '✅';
  };

  return {
    status,
    sync,
    registerOperation,
    getPendingOperations,
    getSyncIcon,
  };
}




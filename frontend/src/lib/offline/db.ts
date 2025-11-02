// Type definitions para idb (el paquete no incluye tipos)
interface DBSchema {
  [storeName: string]: {
    key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    indexes?: { [indexName: string]: string };
  };
}

interface IDBPDatabase {
  readonly name: string;
  readonly version: number;
  close(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<V = any>(storeName: string, key: string): Promise<V | undefined>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<V = any>(storeName: string, value: V, key?: string): Promise<unknown>;
  delete(storeName: string, key: string): Promise<void>;
  clear(storeName: string): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction(stores: string[]): any;
}

declare function openDB(
  name: string,
  version?: number,
  options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upgrade?: (db: any) => void | Promise<void>;
  }
): Promise<IDBPDatabase>;

interface IgerDB extends DBSchema {
  cachedData: {
    key: string;
    value: {
      key: string;
      entity: string;
      data: unknown;
      timestamp: number;
    };
    indexes: { 'by-entity': string };
  };
  pendingOperations: {
    key: string;
    value: {
      id: string;
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      entity: string;
      operation: string;
      data: Record<string, unknown>;
      timestamp: number;
      status: 'pending' | 'synced' | 'failed';
      retries?: number;
      lastError?: string;
    };
    indexes: { 'by-status': string };
  };
  syncMetadata: {
    key: string;
    value: {
      key: string;
      lastSyncTimestamp: number;
      conflictResolution?: string;
    };
  };
}

let dbInstance: IDBPDatabase | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (!dbInstance) {
    dbInstance = await openDB<IgerDB>('IgerOffline', 1, {
      upgrade(db) {
        // Create cachedData store
        const cachedDataStore = db.createObjectStore('cachedData', {
          keyPath: 'key',
        });
        cachedDataStore.createIndex('by-entity', 'entity');

        // Create pendingOperations store
        const pendingOperationsStore = db.createObjectStore('pendingOperations', {
          keyPath: 'id',
        });
        pendingOperationsStore.createIndex('by-status', 'status');

        // Create syncMetadata store
        db.createObjectStore('syncMetadata', {
          keyPath: 'key',
        });
      },
    });
  }
  return dbInstance;
}

export async function saveToCache(entity: string, key: string, data: unknown) {
  const db = await getDB();
  await db.put('cachedData', {
    key,
    entity,
    data,
    timestamp: Date.now(),
  });
}

export async function getFromCache(_entity: string, key: string): Promise<unknown | undefined> {
  const db = await getDB();
  const result = await db.get('cachedData', key);
  return result?.data;
}

export async function getAllFromCache(entity: string): Promise<unknown[]> {
  const db = await getDB();
  const transaction = db.transaction(['cachedData']);
  const index = transaction.store.index('by-entity');
  const results = await index.getAll(entity);
  return results.map((item: { data: unknown }) => item.data);
}

export async function savePendingOperation(
  id: string,
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  operation: string,
  data: Record<string, unknown>
) {
  const db = await getDB();
  await db.put('pendingOperations', {
    id,
    type,
    entity,
    operation,
    data,
    timestamp: Date.now(),
    status: 'pending',
  });
}

export async function getPendingOperations(): Promise<
  IgerDB['pendingOperations']['value'][]
> {
  const db = await getDB();
  const transaction = db.transaction(['pendingOperations']);
  const index = transaction.store.index('by-status');
  return await index.getAll('pending');
}

export async function markOperationSynced(id: string) {
  const db = await getDB();
  const op = await db.get('pendingOperations', id);
  if (op) {
    await db.put('pendingOperations', {
      ...op,
      status: 'synced',
    });
  }
}

export async function markOperationFailed(id: string, error: string) {
  const db = await getDB();
  const op = await db.get('pendingOperations', id);
  if (op) {
    await db.put('pendingOperations', {
      ...op,
      status: 'failed',
      retries: (op.retries || 0) + 1,
      lastError: error,
    });
  }
}

export async function updateSyncMetadata(key: string, lastSyncTimestamp: number) {
  const db = await getDB();
  await db.put('syncMetadata', {
    key,
    lastSyncTimestamp,
  });
}

export async function getLastSyncTimestamp(key: string): Promise<number> {
  const db = await getDB();
  const result = await db.get('syncMetadata', key);
  return result?.lastSyncTimestamp || 0;
}

export async function clearCache() {
  const db = await getDB();
  await db.clear('cachedData');
}

export async function clearPendingOperations() {
  const db = await getDB();
  await db.clear('pendingOperations');
}


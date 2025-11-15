import { useSync } from '../../hooks/useSync';
import { ThreeDButton } from '../ui/ThreeDButton';

export function SyncStatus() {
  const { status, getSyncIcon, sync } = useSync();

  if (status.pendingCount === 0 && status.isOnline && !status.isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getSyncIcon()}</span>
          <span className="text-sm font-semibold">Estado de Sincronización</span>
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div>{status.isOnline ? '🟢 En línea' : '🔴 Sin conexión'}</div>
        {status.pendingCount > 0 && (
          <div>
            {status.pendingCount} operación{status.pendingCount !== 1 ? 'es' : ''} pendiente
            {status.pendingCount !== 1 ? 's' : ''}
          </div>
        )}
        {!status.isOnline && status.pendingCount > 0 && (
          <div className="text-amber-600">
            Se sincronizará al reconectar
          </div>
        )}
      </div>

      {status.pendingCount > 0 && status.isOnline && (
        <ThreeDButton
          onClick={sync}
          disabled={status.isSyncing}
          loading={status.isSyncing}
          showOrb
          size="sm"
          className="mt-3 w-full justify-center"
        >
          {status.isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </ThreeDButton>
      )}
    </div>
  );
}




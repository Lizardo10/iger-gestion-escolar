import { useEffect, useState } from 'react';
import { AuthService } from '../../lib/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que inicializa el estado de autenticación una sola vez
 * al inicio de la aplicación
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // FORZAR LIMPIEZA INICIAL - Asegurar estado limpio
    console.log('🔐 AuthProvider: Inicializando autenticación...');
    
    // CRÍTICO: Limpiar localStorage SIEMPRE al iniciar para prevenir acceso no autorizado
    // Solo se restaurará si hay datos válidos verificados
    console.log('🧹 Limpiando localStorage al iniciar para seguridad...');
    AuthService.clearAll();
    
    // Limpiar cualquier caché problemático si se solicita explícitamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearCache') === 'true') {
      console.log('🧹 Clearing auth cache from URL parameter');
      AuthService.clearAll();
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Inicializar AuthService una sola vez al montar
    // Como limpiamos todo, esto siempre empezará sin autenticación
    AuthService.init()
      .then(() => {
        // Verificar que la autenticación se validó correctamente
        const isAuth = AuthService.isAuthenticated();
        console.log('✅ Auth initialized, isAuthenticated:', isAuth);
        
        // Como limpiamos al inicio, isAuth debería ser false
        // Solo se autenticará después de un login explícito
        if (!isAuth) {
          console.log('ℹ️ Usuario no autenticado (esperado después de limpiar)');
        }
        
        setIsReady(true);
      })
      .catch((error) => {
        console.error('❌ Error initializing auth:', error);
        AuthService.clearAll();
        setIsReady(true);
      });
  }, []);

  // Mostrar loading mientras se inicializa
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return <>{children}</>;
}


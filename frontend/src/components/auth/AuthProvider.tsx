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
    
    // Limpiar cualquier caché problemático al iniciar
    // Verificar si hay un parámetro de limpieza en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearCache') === 'true') {
      console.log('🧹 Clearing auth cache from URL parameter');
      AuthService.clearAll();
      // Remover el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // CRÍTICO: Asegurar que NO está autenticado al inicio
    // Esto previene acceso no autorizado mientras se valida
    const initialState = AuthService.isAuthenticated();
    console.log('🔍 Estado inicial de autenticación:', initialState);
    
    if (initialState) {
      // Si está autenticado ANTES de init(), podría ser un problema
      console.warn('⚠️ Advertencia: Estado autenticado antes de init(), forzando validación');
    }

    // Inicializar AuthService una sola vez al montar
    // Esto validará el token y marcará como autenticado solo si es válido
    AuthService.init()
      .then(() => {
        // Verificar que la autenticación se validó correctamente
        const isAuth = AuthService.isAuthenticated();
        console.log('✅ Auth initialized, isAuthenticated:', isAuth);
        
        // Si está autenticado, verificar que realmente tiene datos válidos
        if (isAuth) {
          const token = AuthService.getToken();
          const user = AuthService.getUser();
          if (!token || !user || !user.email || !user.role) {
            console.error('❌ Datos de autenticación inválidos, limpiando...');
            AuthService.clearAll();
            setIsReady(true);
            return;
          }
          console.log('✅ Autenticación válida:', { email: user.email, role: user.role });
        } else {
          console.log('ℹ️ Usuario no autenticado');
        }
        
        setIsReady(true);
      })
      .catch((error) => {
        console.error('❌ Error initializing auth:', error);
        // Asegurar que no esté autenticado si hay error
        AuthService.clearAll();
        setIsReady(true); // Continuar incluso si hay error
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


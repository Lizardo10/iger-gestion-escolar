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
    console.log('🔐 AuthProvider: Inicializando autenticación...');
    
    // Limpiar caché solo si se solicita explícitamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearCache') === 'true') {
      console.log('🧹 Clearing auth cache from URL parameter');
      AuthService.clearAll();
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Inicializar AuthService una sola vez al montar
    // Esto restaurará la sesión si hay datos válidos en localStorage
    AuthService.init()
      .then(() => {
        const isAuth = AuthService.isAuthenticated();
        console.log('✅ Auth initialized, isAuthenticated:', isAuth);
        
        if (isAuth) {
          const token = AuthService.getToken();
          const user = AuthService.getUser();
          if (token && user && user.email && user.role) {
            console.log('✅ Sesión restaurada correctamente:', { email: user.email, role: user.role });
          } else {
            console.error('❌ Datos de autenticación inválidos después de restaurar, limpiando...');
            AuthService.clearAll();
          }
        } else {
          console.log('ℹ️ Usuario no autenticado');
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


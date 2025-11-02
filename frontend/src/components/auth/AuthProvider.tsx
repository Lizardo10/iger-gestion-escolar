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
    
    // CRÍTICO: Validar y limpiar datos mock ANTES de inicializar
    // Esto previene acceso no autorizado con datos de desarrollo
    try {
      const stored = localStorage.getItem('iger_auth_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasMockData = (
          parsed.token?.includes('mock') ||
          parsed.user?.id?.includes('mock') ||
          parsed.user?.email?.includes('mock') ||
          !parsed.user?.email?.includes('@') ||
          (parsed.token && parsed.token.length < 20)
        );
        
        if (hasMockData) {
          console.error('🚫 DATOS MOCK DETECTADOS EN INICIO - Limpiando todo');
          AuthService.clearAll();
        }
      }
    } catch (error) {
      console.error('Error validando datos al inicio:', error);
      AuthService.clearAll();
    }
    
    // Limpiar caché si se solicita explícitamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearCache') === 'true') {
      console.log('🧹 Clearing auth cache from URL parameter');
      AuthService.clearAll();
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Inicializar AuthService una sola vez al montar
    // Esto validará y limpiará datos inválidos automáticamente
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


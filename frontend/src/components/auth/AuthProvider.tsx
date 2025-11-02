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
    // Limpiar cualquier caché problemático al iniciar
    // Verificar si hay un parámetro de limpieza en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clearCache') === 'true') {
      console.log('Clearing auth cache from URL parameter');
      AuthService.clearAll();
      // Remover el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Inicializar AuthService una sola vez al montar
    AuthService.init()
      .then(() => {
        setIsReady(true);
      })
      .catch((error) => {
        console.error('Error initializing auth:', error);
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


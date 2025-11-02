import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../lib/auth';
import type { AuthResult } from '../lib/cognito';

export interface UseAuthReturn {
  user: AuthResult['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  // CRÍTICO: Empezar con estado seguro - NO autenticado y loading
  const [user, setUser] = useState<AuthResult['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Empieza como loading
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Empieza como NO autenticado

  useEffect(() => {
    // Función para actualizar el estado desde AuthService
    const updateState = () => {
      // Solo actualizar si AuthService está inicializado
      if (AuthService.isAuthenticated() || !AuthService.isLoading()) {
        const currentUser = AuthService.getUser();
        const currentLoading = AuthService.isLoading();
        const currentAuth = AuthService.isAuthenticated();
        
        setUser(currentUser);
        setIsLoading(currentLoading);
        setIsAuthenticated(currentAuth);
        
        console.log('🔄 useAuth actualizado:', { 
          isLoading: currentLoading, 
          isAuthenticated: currentAuth,
          hasUser: !!currentUser 
        });
      } else {
        // Si aún está cargando, mantener loading
        setIsLoading(true);
        setIsAuthenticated(false);
      }
    };

    // Suscribirse a cambios
    const unsubscribe = AuthService.subscribe(updateState);

    // Esperar un momento y luego actualizar estado
    // Esto asegura que AuthProvider haya terminado de inicializar
    const timer = setTimeout(() => {
      updateState();
    }, 100);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await AuthService.login({ email, password });
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, role: string) => {
      await AuthService.signUp({ email, password, firstName, lastName, role });
    },
    []
  );

  const logout = useCallback(async () => {
    await AuthService.logout();
  }, []);

  const hasRole = useCallback((role: string) => AuthService.hasRole(role), []);

  const hasAnyRole = useCallback((...roles: string[]) => AuthService.hasAnyRole(...roles), []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signUp,
    logout,
    hasRole,
    hasAnyRole,
  };
}




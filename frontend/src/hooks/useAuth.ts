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
  const [user, setUser] = useState(AuthService.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.subscribe(() => {
      setUser(AuthService.getUser());
      setIsLoading(AuthService.isLoading());
      setIsAuthenticated(AuthService.isAuthenticated());
    });

    // Inicializar auth
    AuthService.init().finally(() => {
      setIsLoading(false);
    });

    return unsubscribe;
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




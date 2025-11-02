// TODO: Configurar cuando se tenga Cognito real
// import { CognitoUser, CognitoUserPool, CognitoUserAttribute, AuthenticationDetails } from 'amazon-cognito-identity-js';

// TODO: Configurar pool cuando tengamos Cognito
// const poolData = {
//   UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
//   ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
// };

// const userPool = new CognitoUserPool(poolData);

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'superadmin' | 'admin' | 'teacher' | 'student';
    orgId?: string;
  };
}

import { api } from './api';

export class CognitoService {
  /**
   * Registra un nuevo usuario
   */
  static async signUp({ email, password, firstName, lastName, role }: SignUpParams): Promise<unknown> {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      role,
    });
    return response.data;
  }

  /**
   * Inicia sesión usando el backend API
   */
  static async login({ email, password }: LoginParams): Promise<AuthResult> {
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        idToken: string;
        user: {
          id: string;
          email: string;
          firstName?: string;
          lastName?: string;
          role?: string;
          orgId?: string;
        };
      }>('/auth/login', {
        email,
        password,
      });

      const data = response.data;
      
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        idToken: data.idToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role as 'superadmin' | 'admin' | 'teacher' | 'student',
          orgId: data.user.orgId,
        },
      };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          'Error al iniciar sesión';
      throw new Error(errorMessage);
    }
  }

  /**
   * Cierra sesión
   */
  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('iger_auth_state');
      if (token) {
        const authState = JSON.parse(token);
        if (authState.token) {
          await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${authState.token}` },
          });
        }
      }
    } catch (error) {
      console.error('Error en logout:', error);
      // Continuar con el logout local aunque falle el logout del backend
    }
  }

  /**
   * Obtiene el usuario actual desde localStorage
   * Nota: Esta función usa la misma clave que AuthService
   */
  static async getCurrentUser(): Promise<AuthResult | null> {
    try {
      const stored = localStorage.getItem('iger_auth_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        const { token, user } = parsed;
        if (token && user) {
          return {
            accessToken: token,
            refreshToken: parsed.refreshToken || '',
            idToken: parsed.idToken || '',
            user,
          };
        }
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return null;
  }

  /**
   * Refresca el token de acceso
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; idToken: string }> {
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        idToken: string;
      }>('/auth/refresh', {
        refreshToken,
      });
      return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        idToken: response.data.idToken,
      };
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          'Error al refrescar token';
      throw new Error(errorMessage);
    }
  }
}



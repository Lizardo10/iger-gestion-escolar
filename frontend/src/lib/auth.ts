import { CognitoService, LoginParams, SignUpParams, AuthResult } from './cognito';

interface AuthState {
  user: AuthResult['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'iger_auth_state';

export class AuthService {
  private static state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };

  private static listeners: Set<() => void> = new Set();
  private static initialized = false;

  /**
   * Inicializa el estado de forma síncrona (para lectura inicial)
   */
  private static initSync(): void {
    if (this.initialized) return;
    
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const { token, refreshToken, idToken, user } = parsed;
          
          if (token && user) {
            this.state.token = token;
            this.state.user = user;
            this.state.isAuthenticated = true;
            this.initialized = true;
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error initializing auth sync:', error);
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  /**
   * Restaura el estado de autenticación desde localStorage
   */
  static async init(): Promise<void> {
    // Si ya está inicializado, no hacer nada
    if (this.initialized && this.state.isAuthenticated) {
      return;
    }

    this.state.isLoading = true;
    this.notifyListeners();

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const { token, refreshToken, idToken, user } = parsed;
          
          if (token && user) {
            this.state.token = token;
            this.state.user = user;
            this.state.isAuthenticated = true;
            this.initialized = true;
            
            // Si tenemos refreshToken pero falta en el estado guardado, restaurarlo
            if (refreshToken && !parsed.refreshToken) {
              this.saveStateWithTokens({
                accessToken: token,
                refreshToken: refreshToken || '',
                idToken: idToken || '',
                user,
              });
            }
            
            // No validamos el token aquí para evitar logout innecesario
            // El interceptor de API manejará los 401 y refrescará automáticamente
          } else {
            // Si no hay token o user, limpiar
            localStorage.removeItem(AUTH_STORAGE_KEY);
            this.state.isAuthenticated = false;
            this.initialized = true;
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          // Si hay error parseando, limpiar y dejar sin autenticar
          localStorage.removeItem(AUTH_STORAGE_KEY);
          this.state.isAuthenticated = false;
          this.initialized = true;
        }
      } else {
        this.state.isAuthenticated = false;
        this.initialized = true;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // No hacer logout automático, solo limpiar el estado
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
      this.initialized = true;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      this.state.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Inicia sesión
   */
  static async login(params: LoginParams): Promise<AuthResult> {
    this.state.isLoading = true;
    this.notifyListeners();

    try {
      const result = await CognitoService.login(params);
      this.state.token = result.accessToken;
      this.state.user = result.user;
      this.state.isAuthenticated = true;
      this.initialized = true; // Marcar como inicializado

      // Guardar tokens completos
      this.saveStateWithTokens(result);
      this.notifyListeners();

      return result;
    } catch (error) {
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notifyListeners();
    }
  }

  /**
   * Registra un nuevo usuario
   */
  static async signUp(params: SignUpParams): Promise<unknown> {
    return CognitoService.signUp(params);
  }

  /**
   * Cierra sesión
   */
  static async logout(): Promise<void> {
    await CognitoService.logout();
    this.state.user = null;
    this.state.token = null;
    this.state.isAuthenticated = false;
    this.initialized = true; // Marcar como inicializado para evitar re-inicialización
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Obtiene el usuario actual
   */
  static getUser(): AuthState['user'] {
    // Inicializar sincrónamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return this.state.user;
  }

  /**
   * Obtiene el token de acceso
   */
  static getToken(): string | null {
    // Inicializar sincrónamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return this.state.token;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    // Inicializar sincrónamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return this.state.isAuthenticated;
  }

  /**
   * Verifica el estado de carga
   */
  static isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Intenta refrescar el token usando el refresh token guardado
   */
  static async refreshToken(): Promise<{ accessToken: string; refreshToken: string; idToken: string } | null> {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const { refreshToken: storedRefreshToken } = JSON.parse(stored);
      if (!storedRefreshToken) {
        return null;
      }

      // Llamar al backend para refrescar
      const result = await CognitoService.refreshToken(storedRefreshToken);
      
      if (!result || !result.accessToken) {
        throw new Error('No se pudo refrescar el token');
      }
      
      // Actualizar el estado
      this.state.token = result.accessToken;
      
      // Guardar los nuevos tokens (usar refreshToken del resultado o mantener el anterior si no viene)
      this.saveStateWithTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || storedRefreshToken,
        idToken: result.idToken || '',
        user: this.state.user!,
      });

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || storedRefreshToken,
        idToken: result.idToken || '',
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Obtiene el estado completo
   */
  static getState(): AuthState {
    // Inicializar sincrónamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return { ...this.state };
  }

  /**
   * Suscribe un listener para cambios en el estado
   */
  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Guarda el estado en localStorage
   */
  private static saveState(): void {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: this.state.token,
        user: this.state.user,
      })
    );
  }

  /**
   * Guarda el estado con todos los tokens (para login)
   */
  private static saveStateWithTokens(result: AuthResult): void {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
        user: result.user,
      })
    );
  }

  /**
   * Notifica a todos los listeners
   */
  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  static hasRole(role: string): boolean {
    return this.state.user?.role === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  static hasAnyRole(...roles: string[]): boolean {
    return roles.includes(this.state.user?.role || '');
  }
}




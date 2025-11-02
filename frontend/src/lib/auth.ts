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

  /**
   * Restaura el estado de autenticación desde localStorage
   */
  static async init(): Promise<void> {
    this.state.isLoading = true;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const { token, user } = JSON.parse(stored);
          if (token && user) {
            this.state.token = token;
            this.state.user = user;
            this.state.isAuthenticated = true;
            // No validamos el token aquí para evitar logout innecesario
            // El interceptor de API manejará los 401
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          // Si hay error parseando, limpiar y dejar sin autenticar
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // No hacer logout automático, solo limpiar el estado
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
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
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Obtiene el usuario actual
   */
  static getUser(): AuthState['user'] {
    return this.state.user;
  }

  /**
   * Obtiene el token de acceso
   */
  static getToken(): string | null {
    return this.state.token;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Verifica el estado de carga
   */
  static isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Obtiene el estado completo
   */
  static getState(): AuthState {
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




import { CognitoService, LoginParams, SignUpParams, AuthResult } from './cognito';

interface AuthState {
  user: AuthResult['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'iger_auth_state';
const AUTH_VERSION_KEY = 'iger_auth_version';
const CURRENT_AUTH_VERSION = '2.0.0'; // Incrementar si cambia el formato

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
   * Limpia todo el estado de autenticación y caché
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_VERSION_KEY);
      this.state.user = null;
      this.state.token = null;
      this.state.isAuthenticated = false;
      this.initialized = false;
      this.notifyListeners();
      console.log('Auth state cleared successfully');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  }

  /**
   * Valida y limpia datos corruptos o de versión antigua
   */
  private static validateAndCleanStorage(): void {
    try {
      const storedVersion = localStorage.getItem(AUTH_VERSION_KEY);
      
      // Si la versión no coincide, limpiar todo
      if (storedVersion !== CURRENT_AUTH_VERSION) {
        console.warn('Auth version mismatch, clearing old data');
        this.clearAll();
        localStorage.setItem(AUTH_VERSION_KEY, CURRENT_AUTH_VERSION);
        return;
      }

      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        
        // Validar estructura básica
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid stored data structure');
        }

        // Si tiene token pero no user, limpiar (datos incompletos)
        if (parsed.token && !parsed.user) {
          console.warn('Incomplete auth data found, clearing');
          this.clearAll();
          return;
        }

        // Si tiene user pero no token, limpiar (datos incompletos)
        if (parsed.user && !parsed.token) {
          console.warn('Incomplete auth data found, clearing');
          this.clearAll();
          return;
        }

      } catch (parseError) {
        console.error('Corrupted auth data found, clearing:', parseError);
        this.clearAll();
      }
    } catch (error) {
      console.error('Error validating storage:', error);
      this.clearAll();
    }
  }

  /**
   * Inicializa el estado de forma síncrona (para lectura inicial)
   * IMPORTANTE: NO marca como autenticado hasta que se valide el token
   */
  private static initSync(): void {
    if (this.initialized) return;
    
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const { token, refreshToken, idToken, user } = parsed;
          
          // Validar que todos los datos necesarios estén presentes
          if (token && user && user.email && user.role) {
            // Guardar temporalmente pero NO marcar como autenticado todavía
            // El método init() asíncrono validará el token antes de marcar como autenticado
            this.state.token = token;
            this.state.user = user;
            // CRÍTICO: NO marcar como autenticado aquí - esperar validación
            this.state.isAuthenticated = false;
          } else {
            // Datos incompletos, limpiar
            console.warn('Auth data incomplete, clearing');
            localStorage.removeItem(AUTH_STORAGE_KEY);
            this.state.user = null;
            this.state.token = null;
            this.state.isAuthenticated = false;
          }
        } catch (parseError) {
          console.error('Error parsing stored auth state:', parseError);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          this.state.user = null;
          this.state.token = null;
          this.state.isAuthenticated = false;
        }
      } else {
        // No hay datos, asegurar que está deslogueado
        this.state.user = null;
        this.state.token = null;
        this.state.isAuthenticated = false;
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

    // Validar y limpiar datos corruptos antes de inicializar
    this.validateAndCleanStorage();

    this.state.isLoading = true;
    this.notifyListeners();

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const { token, refreshToken, idToken, user } = parsed;
          
          // Validar que el token y user sean válidos
          if (token && user && user.email && user.role && typeof token === 'string' && token.length > 10) {
            // Token parece válido, marcar como autenticado
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
      
      // Verificar que el resultado sea válido
      if (!result || !result.accessToken || !result.user) {
        throw new Error('Respuesta de login inválida');
      }

      // Actualizar estado interno ANTES de guardar
      this.state.token = result.accessToken;
      this.state.user = result.user;
      this.state.isAuthenticated = true;
      this.initialized = true;

      // Guardar tokens completos en localStorage
      this.saveStateWithTokens(result);
      
      // Guardar versión
      localStorage.setItem(AUTH_VERSION_KEY, CURRENT_AUTH_VERSION);
      
      // Verificar que se guardó correctamente
      const verifyStored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!verifyStored) {
        console.error('ERROR: No se pudo guardar el estado de autenticación');
        throw new Error('Error al guardar la sesión');
      }

      // Notificar listeners para actualizar UI
      this.notifyListeners();

      // Esperar un momento para asegurar que el estado se propagó
      await new Promise(resolve => setTimeout(resolve, 50));

      return result;
    } catch (error) {
      // Si falla, limpiar estado
      this.state.token = null;
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.notifyListeners();
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
    // Inicializar sincrónicamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return this.state.user;
  }

  /**
   * Obtiene el token de acceso
   */
  static getToken(): string | null {
    // Inicializar sincrónicamente si no está inicializado
    if (!this.initialized) {
      this.initSync();
    }
    return this.state.token;
  }

  /**
   * Verifica si el usuario está autenticado
   * IMPORTANTE: Solo retorna true si el estado está inicializado Y autenticado
   */
  static isAuthenticated(): boolean {
    // Si no está inicializado, NO marcar como autenticado
    // initSync() leerá los datos pero NO los marcará como autenticados
    if (!this.initialized) {
      this.initSync();
      // CRÍTICO: Después de initSync, aún NO está autenticado hasta que init() valide
      return false;
    }
    // Solo retornar true si está inicializado Y marcado como autenticado
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
      this.state.isAuthenticated = true; // Asegurar que sigue autenticado
      
      // Guardar los nuevos tokens (usar refreshToken del resultado o mantener el anterior si no viene)
      this.saveStateWithTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken || storedRefreshToken,
        idToken: result.idToken || '',
        user: this.state.user!,
      });
      // Guardar versión
      localStorage.setItem(AUTH_VERSION_KEY, CURRENT_AUTH_VERSION);

      // Notificar a los listeners que el estado cambió
      this.notifyListeners();

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
    // Inicializar sincrónicamente si no está inicializado
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
   * Guarda el estado con todos los tokens (para login)
   */
  private static saveStateWithTokens(result: AuthResult): void {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          idToken: result.idToken,
          user: result.user,
        })
      );
      localStorage.setItem(AUTH_VERSION_KEY, CURRENT_AUTH_VERSION);
    } catch (error) {
      console.error('Error saving auth state:', error);
      // Si hay error guardando, podría ser que localStorage está lleno
      // Intentar limpiar y guardar de nuevo
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            token: result.accessToken,
            refreshToken: result.refreshToken,
            idToken: result.idToken,
            user: result.user,
          })
        );
        localStorage.setItem(AUTH_VERSION_KEY, CURRENT_AUTH_VERSION);
      } catch (retryError) {
        console.error('Error retrying save auth state:', retryError);
      }
    }
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

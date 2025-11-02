import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthService } from './auth';

const API_URL = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token a las requests
    this.client.interceptors.request.use(
      (config) => {
        const token = AuthService.getToken();
        const isAuthEndpoint = config.url?.includes('/auth/login') || 
                              config.url?.includes('/auth/register') ||
                              config.url?.includes('/auth/forgot-password') ||
                              config.url?.includes('/auth/confirm-forgot-password');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!isAuthEndpoint) {
          // Si no hay token y no es un endpoint de auth, esperar un momento
          // por si el token se está cargando desde localStorage
          console.warn('No token available for request:', config.url, '- Will retry after 100ms');
          return new Promise((resolve) => {
            setTimeout(() => {
              const retryToken = AuthService.getToken();
              if (retryToken) {
                config.headers.Authorization = `Bearer ${retryToken}`;
                resolve(config);
              } else {
                console.error('Still no token available after retry:', config.url);
                resolve(config); // Dejar que se envíe y el 401 lo maneje
              }
            }, 100);
          });
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejar errores y 401 (no autorizado)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Normalizar mensaje de error desde backend
        const backendMsg = error.response?.data?.error || error.response?.data?.message;
        if (backendMsg && typeof backendMsg === 'string') {
          error.message = backendMsg;
        }

        const originalRequest = error.config;

        // Si es 401 y no es una petición de refresh o login, intentar refresh token
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                               originalRequest.url?.includes('/auth/register') ||
                               originalRequest.url?.includes('/auth/refresh') ||
                               originalRequest.url?.includes('/auth/logout');
        
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            // Intentar refrescar el token
            const refreshed = await AuthService.refreshToken();
            if (refreshed && refreshed.accessToken) {
              // El refreshToken ya actualizó el estado interno de AuthService
              // Actualizar el token en la request original
              originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
              // Reintentar la request original
              return this.client(originalRequest);
            } else {
              // Si el refresh no retornó token, verificar si hay token válido
              const currentToken = AuthService.getToken();
              if (currentToken) {
                // Si hay un token actual, intentar usarlo
                originalRequest.headers.Authorization = `Bearer ${currentToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            // Si el refresh falla, verificar si realmente es un error crítico
            const errorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
            console.error('Error refreshing token:', refreshError);
            
            // Solo hacer logout si es un error crítico (token expirado, inválido)
            // No hacer logout si es un error de red o temporal
            if (errorMessage.includes('expired') || 
                errorMessage.includes('invalid') || 
                errorMessage.includes('No se pudo refrescar')) {
              await AuthService.logout();
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }

          // Solo hacer logout si realmente no hay token válido
          const currentToken = AuthService.getToken();
          if (!currentToken) {
            console.error('No valid token available, logging out');
            await AuthService.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();

// Tipos de API
export interface ApiError {
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}



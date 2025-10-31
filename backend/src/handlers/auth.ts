import { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';
import { signUp, signIn, refreshToken, signOut } from '../lib/cognito';

/**
 * Registra un nuevo usuario
 * POST /auth/register
 */
export async function register(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      orgId?: string;
    };

    // Validación básica
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return errorResponse('Email, password, firstName y lastName son requeridos', 400);
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse('Email inválido', 400);
    }

    // Validar contraseña
    if (body.password.length < 8) {
      return errorResponse('La contraseña debe tener al menos 8 caracteres', 400);
    }

    const result = await signUp({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      orgId: body.orgId,
    });

    return successResponse(
      {
        message: 'Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.',
        userId: result.userId,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error en registro: ' + message, 400);
  }
}

/**
 * Inicia sesión
 * POST /auth/login
 */
export async function login(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as { email: string; password: string };

    // Validación básica
    if (!body.email || !body.password) {
      return errorResponse('Email y password son requeridos', 400);
    }

    const authResult = await signIn({
      email: body.email,
      password: body.password,
    });

    return successResponse(authResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('incorrectos') || message.includes('confirmado') ? 401 : 400;
    return errorResponse('Error en login: ' + message, statusCode);
  }
}

/**
 * Refresca el token de acceso
 * POST /auth/refresh
 */
export async function refresh(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as { refreshToken: string };

    if (!body.refreshToken) {
      return errorResponse('refreshToken es requerido', 400);
    }

    const authResult = await refreshToken(body.refreshToken);

    return successResponse(authResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('inválido') || message.includes('expirado') ? 401 : 400;
    return errorResponse('Error al refrescar token: ' + message, statusCode);
  }
}

/**
 * Cierra sesión
 * POST /auth/logout
 */
export async function logout(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Extraer token del header Authorization
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader) {
      return errorResponse('Authorization header es requerido', 401);
    }

    // Formato: "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    await signOut(token);

    return successResponse({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('inválido') ? 401 : 400;
    return errorResponse('Error al cerrar sesión: ' + message, statusCode);
  }
}




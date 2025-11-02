import { LambdaEvent } from '../types';
import { errorResponse } from './utils';
import { GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { UserRole, hasPermission, canCreateUsers, canViewInvoices } from './roles';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  orgId?: string;
}

/**
 * Extrae el token del header Authorization
 */
export function extractToken(event: LambdaEvent): string | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Formato: "Bearer <token>"
  return authHeader.replace(/^Bearer\s+/i, '');
}

/**
 * Obtiene la información del usuario desde el token de Cognito
 */
export async function getAuthenticatedUser(accessToken: string): Promise<AuthenticatedUser | null> {
  try {
    console.log('Validando token, longitud:', accessToken?.length || 0);
    const command = new GetUserCommand({ AccessToken: accessToken });
    const response = await cognitoClient.send(command);

    if (!response.Username) {
      console.warn('No se encontró Username en la respuesta de Cognito');
      return null;
    }

    const userAttributes = response.UserAttributes || [];
    const emailAttr = userAttributes.find((attr) => attr.Name === 'email');
    const firstNameAttr = userAttributes.find((attr) => attr.Name === 'given_name');
    const lastNameAttr = userAttributes.find((attr) => attr.Name === 'family_name');
    const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');
    const orgIdAttr = userAttributes.find((attr) => attr.Name === 'custom:orgId');

    const role = (roleAttr?.Value as UserRole) || 'student';
    console.log('Usuario autenticado:', { email: emailAttr?.Value, role });

    return {
      id: response.Username,
      email: emailAttr?.Value || '',
      role: role,
      firstName: firstNameAttr?.Value,
      lastName: lastNameAttr?.Value,
      orgId: orgIdAttr?.Value,
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.name === 'NotAuthorizedException') {
      console.error('Token inválido o expirado. Asegúrate de usar el accessToken, no refreshToken ni idToken.');
    }
    return null;
  }
}

/**
 * Middleware para requerir autenticación
 */
export async function requireAuth(event: LambdaEvent): Promise<AuthenticatedUser | null> {
  const token = extractToken(event);
  
  if (!token) {
    return null;
  }

  return await getAuthenticatedUser(token);
}

/**
 * Middleware para requerir un rol específico
 */
export async function requireRole(event: LambdaEvent, allowedRoles: UserRole[]): Promise<AuthenticatedUser | null> {
  const user = await requireAuth(event);
  
  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}

/**
 * Middleware para requerir permiso en un recurso
 */
export async function requirePermission(
  event: LambdaEvent,
  resource: string,
  action: string
): Promise<AuthenticatedUser | null> {
  const user = await requireAuth(event);
  
  if (!user) {
    return null;
  }

  if (!hasPermission(user.role, resource, action)) {
    return null;
  }

  return user;
}

/**
 * Helper para retornar error 401 (No autorizado)
 */
export function unauthorizedResponse(message = 'No autorizado'): { statusCode: number; headers: Record<string, string>; body: string } {
  return errorResponse(message, 401);
}

/**
 * Helper para retornar error 403 (Prohibido)
 */
export function forbiddenResponse(message = 'No tienes permisos para realizar esta acción'): { statusCode: number; headers: Record<string, string>; body: string } {
  return errorResponse(message, 403);
}



import { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';
import {
  signUp,
  signIn,
  refreshToken,
  signOut,
  adminCreateUser,
  changePassword,
  confirmEmail,
  forgotPassword,
  confirmForgotPassword,
  associateSoftwareToken,
  verifySoftwareToken,
  setMFAPreference,
  respondToMFAChallenge,
  respondToNewPasswordChallenge,
} from '../lib/cognito';
import { requireRole, extractToken, forbiddenResponse } from '../lib/authorization';
import { canCreateUsers } from '../lib/roles';

/**
 * Maneja requests OPTIONS para CORS
 */
export async function options(event: LambdaEvent): Promise<LambdaResponse> {
  return successResponse({}, 200);
}

/**
 * Registra un nuevo usuario (público - para auto-registro)
 * POST /auth/register
 * NOTA: Este endpoint puede estar restringido según el caso de uso
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

    // Por defecto, los usuarios auto-registrados son 'student'
    const result = await signUp({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: 'student',
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
    // Manejar OPTIONS request para CORS
    if (event.httpMethod === 'OPTIONS') {
      return successResponse({}, 200);
    }

    const body = parseJsonBody(event.body) as {
      email: string;
      password: string;
    };

    console.log('🔐 Login handler llamado:', { email: body.email, hasPassword: !!body.password });

    // Validación básica
    if (!body.email || !body.password) {
      console.error('❌ Login: Email o contraseña faltantes');
      return errorResponse('Email y contraseña son requeridos', 400);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      console.error('❌ Login: Email inválido:', body.email);
      return errorResponse('Email inválido. Por favor ingresa un correo electrónico válido', 400);
    }

    // Validar que la contraseña no esté vacía
    if (!body.password.trim()) {
      console.error('❌ Login: Contraseña vacía');
      return errorResponse('La contraseña es requerida', 400);
    }

    console.log('🔐 Intentando signIn con Cognito...');
    const authResult = await signIn({
      email: body.email.trim(),
      password: body.password,
    });

    console.log('✅ SignIn exitoso:', { 
      hasAccessToken: !!authResult.accessToken,
      hasUser: !!authResult.user,
      challengeName: authResult.challengeName 
    });

    // Si hay un desafío NEW_PASSWORD_REQUIRED, devolver la información del desafío
    if (authResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log('⚠️ Login requiere cambio de contraseña');
      return successResponse({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: authResult.session,
        message: 'Se requiere cambiar la contraseña temporal',
      });
    }

    // Validar que el resultado tenga los datos necesarios
    if (!authResult.accessToken) {
      console.error('❌ Login: No hay accessToken en el resultado');
      return errorResponse('Error: El servidor no devolvió un token de acceso', 500);
    }

    if (!authResult.user || !authResult.user.id || !authResult.user.email) {
      console.error('❌ Login: Datos de usuario incompletos', authResult.user);
      return errorResponse('Error: Datos de usuario incompletos', 500);
    }

    console.log('✅ Login completado exitosamente:', { 
      userId: authResult.user.id,
      email: authResult.user.email,
      role: authResult.user.role 
    });

    return successResponse(authResult);
  } catch (error) {
    console.error('❌ Error en login handler:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('incorrectos') || 
                      message.includes('confirmado') || 
                      message.includes('NotAuthorizedException') ||
                      message.includes('UserNotConfirmedException') ? 401 : 400;
    
    // Mensajes más claros
    let errorMsg = message;
    if (message.includes('NotAuthorizedException')) {
      errorMsg = 'Email o contraseña incorrectos';
    } else if (message.includes('UserNotConfirmedException')) {
      errorMsg = 'Por favor confirma tu email antes de iniciar sesión';
    }
    
    console.error(`❌ Error en login (${statusCode}):`, errorMsg);
    return errorResponse('Error en login: ' + errorMsg, statusCode);
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

/**
 * Crea un usuario con contraseña genérica (solo admin/superadmin)
 * POST /auth/admin/create-user
 */
export async function createUser(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar que el usuario tenga permisos de admin
    const token = extractToken(event);
    if (!token) {
      return errorResponse('Authorization header es requerido', 401);
    }

    console.log('Token recibido, longitud:', token.length, 'tipo (guessing):', token.startsWith('eyJ') ? 'JWT' : 'unknown');

    const user = await requireRole(event, ['superadmin', 'admin']);
    
    if (!user) {
      console.error('Usuario no autorizado. Token válido pero sin rol admin/superadmin');
      return forbiddenResponse('Solo administradores pueden crear usuarios');
    }

    console.log('Usuario autorizado para crear usuarios:', { email: user.email, role: user.role });

    if (!canCreateUsers(user.role)) {
      return forbiddenResponse('No tienes permisos para crear usuarios');
    }

    const body = parseJsonBody(event.body) as {
      email: string;
      firstName: string;
      lastName: string;
      role: 'superadmin' | 'admin' | 'teacher' | 'student';
      orgId?: string;
      temporaryPassword?: string;
    };

    // Validación básica
    if (!body.email || !body.firstName || !body.lastName || !body.role) {
      return errorResponse('Email, firstName, lastName y role son requeridos', 400);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse('Email inválido', 400);
    }

    // Validar rol
    const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('Rol inválido. Debe ser: superadmin, admin, teacher o student', 400);
    }

    // Crear usuario con contraseña genérica
    const result = await adminCreateUser({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      orgId: body.orgId || user.orgId,
      temporaryPassword: body.temporaryPassword,
    });

    return successResponse(
      {
        message: 'Usuario creado exitosamente. Comparte la contraseña temporal con el usuario.',
        userId: result.userId,
        email: body.email,
        temporaryPassword: result.temporaryPassword,
        role: body.role,
        note: 'El usuario deberá cambiar su contraseña después del primer login.',
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al crear usuario: ' + message, 400);
  }
}

/**
 * Cambia la contraseña del usuario autenticado
 * POST /auth/change-password
 */
export async function changePasswordHandler(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar autenticación
    const token = extractToken(event);
    if (!token) {
      return errorResponse('Authorization header es requerido', 401);
    }

    const body = parseJsonBody(event.body) as {
      oldPassword: string;
      newPassword: string;
    };

    // Validación básica
    if (!body.oldPassword || !body.newPassword) {
      return errorResponse('oldPassword y newPassword son requeridos', 400);
    }

    // Validar nueva contraseña
    if (body.newPassword.length < 8) {
      return errorResponse('La nueva contraseña debe tener al menos 8 caracteres', 400);
    }

    // Cambiar contraseña
    await changePassword(token, body.oldPassword, body.newPassword);

    return successResponse({
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('incorrecta') ? 401 : 400;
    return errorResponse('Error al cambiar contraseña: ' + message, statusCode);
  }
}

/**
 * Confirma el correo electrónico con código
 * POST /auth/confirm-email
 */
export async function confirmEmailHandler(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      email: string;
      confirmationCode: string;
    };

    if (!body.email || !body.confirmationCode) {
      return errorResponse('Email y confirmationCode son requeridos', 400);
    }

    await confirmEmail(body.email, body.confirmationCode);

    return successResponse({
      message: 'Correo electrónico confirmado exitosamente',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al confirmar email: ' + message, 400);
  }
}

/**
 * Solicita recuperación de contraseña
 * POST /auth/forgot-password
 */
export async function forgotPasswordHandler(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as { email: string };

    if (!body.email) {
      return errorResponse('Email es requerido', 400);
    }

    await forgotPassword(body.email);

    return successResponse({
      message: 'Se ha enviado un código de recuperación a tu correo electrónico',
    });
  } catch (error) {
    // No revelar si el usuario existe o no por seguridad
    return successResponse({
      message: 'Si el email existe, se ha enviado un código de recuperación',
    });
  }
}

/**
 * Confirma recuperación de contraseña con código
 * POST /auth/confirm-forgot-password
 */
export async function confirmForgotPasswordHandler(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      email: string;
      confirmationCode: string;
      newPassword: string;
    };

    if (!body.email || !body.confirmationCode || !body.newPassword) {
      return errorResponse('Email, confirmationCode y newPassword son requeridos', 400);
    }

    if (body.newPassword.length < 8) {
      return errorResponse('La nueva contraseña debe tener al menos 8 caracteres', 400);
    }

    await confirmForgotPassword(body.email, body.confirmationCode, body.newPassword);

    return successResponse({
      message: 'Contraseña restablecida exitosamente',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al restablecer contraseña: ' + message, 400);
  }
}

/**
 * Inicia la configuración de MFA (asocia dispositivo TOTP)
 * POST /auth/mfa/setup
 */
export async function setupMFA(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const token = extractToken(event);
    if (!token) {
      return errorResponse('Authorization header es requerido', 401);
    }

    const result = await associateSoftwareToken(token);

    return successResponse({
      secretCode: result.secretCode,
      session: result.session,
      message: 'Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)',
      instructions: 'Usa el código de 6 dígitos de tu app para verificar y completar la configuración',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al configurar MFA: ' + message, 400);
  }
}

/**
 * Verifica y completa la configuración de MFA
 * POST /auth/mfa/verify
 */
export async function verifyMFA(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const token = extractToken(event);
    if (!token) {
      return errorResponse('Authorization header es requerido', 401);
    }

    const body = parseJsonBody(event.body) as {
      userCode: string;
      friendlyDeviceName?: string;
    };

    if (!body.userCode) {
      return errorResponse('userCode es requerido (código de 6 dígitos de tu app)', 400);
    }

    await verifySoftwareToken(token, body.userCode, body.friendlyDeviceName);

    return successResponse({
      message: 'MFA configurado exitosamente',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al verificar MFA: ' + message, 400);
  }
}

/**
 * Habilita o deshabilita MFA para el usuario
 * POST /auth/mfa/enable
 * POST /auth/mfa/disable
 */
export async function toggleMFA(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const token = extractToken(event);
    if (!token) {
      return errorResponse('Authorization header es requerido', 401);
    }

    const path = event.path || '';
    const enabled = path.includes('/enable');

    await setMFAPreference(token, enabled);

    return successResponse({
      message: enabled ? 'MFA habilitado exitosamente' : 'MFA deshabilitado exitosamente',
      mfaEnabled: enabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al cambiar estado de MFA: ' + message, 400);
  }
}

/**
 * Responde al desafío MFA durante el login
 * POST /auth/mfa/respond
 */
export async function respondMFA(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      session: string;
      userCode: string;
    };

    if (!body.session || !body.userCode) {
      return errorResponse('session y userCode son requeridos', 400);
    }

    const authResult = await respondToMFAChallenge(body.session, body.userCode);

    return successResponse(authResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('inválido') ? 401 : 400;
    return errorResponse('Error al responder MFA: ' + message, statusCode);
  }
}

/**
 * Responde al desafío NEW_PASSWORD_REQUIRED durante el login
 * POST /auth/respond-new-password
 */
export async function respondNewPassword(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      email: string;
      session: string;
      newPassword: string;
    };

    if (!body.email || !body.session || !body.newPassword) {
      return errorResponse('Email, session y newPassword son requeridos', 400);
    }

    if (body.newPassword.length < 8) {
      return errorResponse('La nueva contraseña debe tener al menos 8 caracteres', 400);
    }

    const authResult = await respondToNewPasswordChallenge(
      body.email,
      body.session,
      body.newPassword
    );

    return successResponse(authResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Error al cambiar contraseña temporal: ' + message, 400);
  }
}




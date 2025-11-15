import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  InitiateAuthCommandInput,
  AuthFlowType,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ChangePasswordCommand,
  AdminUpdateUserAttributesCommand,
  ForgotPasswordCommand,
  AdminInitiateAuthCommand,
  ConfirmForgotPasswordCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminResetUserPasswordCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  RespondToAuthChallengeCommand,
  SetUserMFAPreferenceCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

if (!USER_POOL_ID) {
  console.warn('COGNITO_USER_POOL_ID no configurado');
}

if (!CLIENT_ID) {
  console.warn('COGNITO_CLIENT_ID no configurado. Los auth flows no funcionarán sin él.');
}

export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student';

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  orgId?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    orgId?: string;
  };
  challengeName?: string;
  session?: string;
  message?: string;
}

/**
 * Registra un nuevo usuario en Cognito
 */
export async function signUp(params: RegisterParams): Promise<{ userId: string }> {
  const { email, password, firstName, lastName } = params;

  // Validación básica
  if (!email || !password) {
    throw new Error('Email y password son requeridos');
  }

  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado. Ver CONFIGURACION_COGNITO.md');
  }

  try {
    const attributes: Array<{ Name: string; Value: string }> = [
      { Name: 'email', Value: email },
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
    ];

    // Agregar atributos personalizados si existen
    if (params.role) {
      attributes.push({ Name: 'custom:role', Value: params.role });
    }
    if (params.orgId) {
      attributes.push({ Name: 'custom:orgId', Value: params.orgId });
    }

    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: attributes,
    });

    const response = await client.send(command);

    if (!response.UserSub) {
      throw new Error('No se pudo crear el usuario');
    }

    return { userId: response.UserSub };
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Manejar errores comunes de Cognito
      if (error.name === 'UsernameExistsException') {
        throw new Error('El email ya está registrado');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new Error('La contraseña no cumple los requisitos');
      }
      throw error;
    }
    throw new Error('Error desconocido al registrar usuario');
  }
}

/**
 * Inicia sesión con Cognito
 */
export async function signIn(params: LoginParams): Promise<AuthResult> {
  const { email, password } = params;

  if (!email || !password) {
    throw new Error('Email y password son requeridos');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado. Ver CONFIGURACION_COGNITO.md');
  }

  try {
    // Primero intentar con InitiateAuthCommand (cliente)
    const authParams: InitiateAuthCommandInput = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const command = new InitiateAuthCommand(authParams);
    let response = await client.send(command);

    // Si hay desafío MFA_SETUP y el User Pool tiene MFA obligatorio,
    // usar AdminInitiateAuth para saltar el setup (solo funciona si el usuario tiene permisos)
    if (response.ChallengeName === 'MFA_SETUP' && USER_POOL_ID) {
      console.log('MFA_SETUP detectado, intentando AdminInitiateAuth para saltar setup');
      try {
        const adminCommand = new AdminInitiateAuthCommand({
          UserPoolId: USER_POOL_ID,
          ClientId: CLIENT_ID,
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        });
        response = await client.send(adminCommand);
      } catch (adminError) {
        console.warn('AdminInitiateAuth falló, continuando con respuesta original:', adminError);
        // Continuar con la respuesta original que tiene el desafío MFA_SETUP
      }
    }

    console.log('Login response:', {
      hasAuthenticationResult: !!response.AuthenticationResult,
      hasChallenge: !!response.ChallengeName,
      challengeName: response.ChallengeName,
      session: response.Session ? 'present' : 'missing',
    });

    // Si hay un desafío (MFA, cambio de contraseña, etc.), manejar según el tipo
    if (response.ChallengeName) {
      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        // Devolver la sesión para que el frontend pueda responder al desafío
        return {
          challengeName: 'NEW_PASSWORD_REQUIRED',
          session: response.Session || '',
          message: 'Se requiere cambiar la contraseña temporal',
        };
      }
      if (response.ChallengeName === 'MFA_SETUP') {
        // Si MFA está configurado como obligatorio, necesitamos responder al desafío
        // Opción 1: Responder con SMS_MFA_CODE (si SMS está configurado) - no aplica aquí
        // Opción 2: Si MFA es opcional, podemos saltar el setup usando AdminInitiateAuth
        // Por ahora, devolvemos error informativo con instrucciones
        throw new Error(`MFA_SETUP requerido. El User Pool tiene MFA configurado como obligatorio. Opciones: 1) Cambiar MFA a "OPTIONAL" en Cognito, o 2) Configurar MFA primero usando /auth/mfa/setup con la sesión proporcionada.`);
      }
      if (response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
        throw new Error('MFA requerido. Usa el endpoint /auth/mfa/respond con el código de tu app.');
      }
      throw new Error(`Desafío requerido: ${response.ChallengeName}. Sesión: ${response.Session || 'no disponible'}`);
    }

    if (!response.AuthenticationResult) {
      console.error('Login failed - no AuthenticationResult:', JSON.stringify(response, null, 2));
      throw new Error('No se recibió token de autenticación. Revisa la configuración del App Client o que el usuario esté confirmado.');
    }

    const { AccessToken, RefreshToken, IdToken, ExpiresIn } = response.AuthenticationResult;

    if (!AccessToken || !IdToken) {
      throw new Error('Tokens incompletos');
    }

    // Obtener información del usuario
    const userCommand = new GetUserCommand({ AccessToken });
    const userResponse = await client.send(userCommand);

    const userAttributes = userResponse.UserAttributes || [];
    const emailAttr = userAttributes.find((attr) => attr.Name === 'email');
    const firstNameAttr = userAttributes.find((attr) => attr.Name === 'given_name');
    const lastNameAttr = userAttributes.find((attr) => attr.Name === 'family_name');
    const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');
    const orgIdAttr = userAttributes.find((attr) => attr.Name === 'custom:orgId');

    return {
      accessToken: AccessToken,
      refreshToken: RefreshToken || '',
      idToken: IdToken,
      expiresIn: ExpiresIn || 3600,
      user: {
        id: userResponse.Username || email,
        email: emailAttr?.Value || email,
        firstName: firstNameAttr?.Value,
        lastName: lastNameAttr?.Value,
        role: (roleAttr?.Value as UserRole) || 'student',
        orgId: orgIdAttr?.Value,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Email o contraseña incorrectos');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new Error('El usuario no ha sido confirmado. Revisa tu email.');
      }
      throw error;
    }
    throw new Error('Error desconocido al iniciar sesión');
  }
}

/**
 * Refresca el token de acceso usando el refresh token
 */
export async function refreshToken(refreshTokenParam: string): Promise<AuthResult> {
  if (!refreshTokenParam) {
    throw new Error('Refresh token es requerido');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado. Ver CONFIGURACION_COGNITO.md');
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshTokenParam,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error('No se recibió token de autenticación');
    }

    const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;

    if (!AccessToken || !IdToken) {
      throw new Error('Tokens incompletos');
    }

    // Obtener información del usuario
    const userCommand = new GetUserCommand({ AccessToken });
    const userResponse = await client.send(userCommand);

    const userAttributes = userResponse.UserAttributes || [];
    const emailAttr = userAttributes.find((attr) => attr.Name === 'email');
    const firstNameAttr = userAttributes.find((attr) => attr.Name === 'given_name');
    const lastNameAttr = userAttributes.find((attr) => attr.Name === 'family_name');
    const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');
    const orgIdAttr = userAttributes.find((attr) => attr.Name === 'custom:orgId');

    return {
      accessToken: AccessToken,
      refreshToken: refreshTokenParam, // Se mantiene el mismo refresh token
      idToken: IdToken,
      expiresIn: ExpiresIn || 3600,
      user: {
        id: userResponse.Username || '',
        email: emailAttr?.Value || '',
        firstName: firstNameAttr?.Value,
        lastName: lastNameAttr?.Value,
        role: (roleAttr?.Value as UserRole) || 'student',
        orgId: orgIdAttr?.Value,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Refresh token inválido o expirado');
      }
      throw error;
    }
    throw new Error('Error desconocido al refrescar token');
  }
}

/**
 * Cierra sesión globalmente (invalida todos los tokens)
 */
export async function signOut(accessToken: string): Promise<void> {
  if (!accessToken) {
    throw new Error('Access token es requerido');
  }

  try {
    const command = new GlobalSignOutCommand({ AccessToken: accessToken });
    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Token inválido');
      }
      throw error;
    }
    throw new Error('Error desconocido al cerrar sesión');
  }
}

/**
 * Confirma el registro de un usuario (usado después de recibir código por email)
 */
export async function confirmSignUp(email: string, confirmationCode: string): Promise<void> {
  if (!email || !confirmationCode) {
    throw new Error('Email y código de confirmación son requeridos');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado. Ver CONFIGURACION_COGNITO.md');
  }

  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        throw new Error('Código de confirmación inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new Error('Código de confirmación expirado');
      }
      throw error;
    }
    throw new Error('Error desconocido al confirmar registro');
  }
}

/**
 * Crea un usuario con contraseña genérica (solo para admin/superadmin)
 * El usuario recibirá un email temporal y deberá cambiar su contraseña
 */
export async function adminCreateUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  orgId?: string;
  temporaryPassword?: string;
}): Promise<{ userId: string; temporaryPassword: string }> {
  const { email, firstName, lastName, role, orgId, temporaryPassword } = params;

  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID no está configurado');
  }

  // Generar contraseña temporal única (máximo 3 intentos)
  let tempPassword = temporaryPassword;
  let attempts = 0;
  const maxAttempts = 3;

  try {
    const attributes: Array<{ Name: string; Value: string }> = [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'custom:role', Value: role },
    ];

    if (orgId) {
      attributes.push({ Name: 'custom:orgId', Value: orgId });
    }

    // Intentar crear usuario con diferentes contraseñas si falla
    while (attempts < maxAttempts) {
      if (!tempPassword) {
        tempPassword = generateTemporaryPassword();
      }

      try {
        const createCommand = new AdminCreateUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          UserAttributes: attributes,
          TemporaryPassword: tempPassword,
          MessageAction: 'SUPPRESS', // No enviar email automático, se manejará manualmente
        });

        const createResponse = await client.send(createCommand);

        if (!createResponse.User?.Username) {
          throw new Error('No se pudo crear el usuario');
        }

        // Establecer la contraseña como permanente (no requiere cambio en primer login)
        // Pero marcamos que debe cambiarla después del primer login
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          Password: tempPassword,
          Permanent: false, // Requiere cambio en primer login
        });

        await client.send(setPasswordCommand);

        return {
          userId: createResponse.User.Username,
          temporaryPassword: tempPassword,
        };
      } catch (createError: unknown) {
        if (createError instanceof Error) {
          // Si el error es de contraseña duplicada, generar una nueva e intentar de nuevo
          if (createError.name === 'InvalidPasswordException' && createError.message.includes('previously been used')) {
            attempts++;
            tempPassword = undefined; // Forzar nueva generación
            console.log(`Intento ${attempts}: Contraseña duplicada, generando nueva...`);
            if (attempts >= maxAttempts) {
              throw new Error('No se pudo generar una contraseña única después de varios intentos');
            }
            continue; // Reintentar
          }
          
          if (createError.name === 'UsernameExistsException') {
            throw new Error('El email ya está registrado');
          }
        }
        throw createError;
      }
    }

    throw new Error('No se pudo crear el usuario después de varios intentos');
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al crear usuario');
  }
}

export async function adminDisableUser(username: string): Promise<void> {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID no está configurado');
  }

  try {
    const command = new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });
    await client.send(command);
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      console.warn(`Intento de desactivar usuario inexistente: ${username}`);
      return;
    }
    throw error;
  }
}

export async function adminEnableUser(username: string): Promise<void> {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID no está configurado');
  }

  try {
    const command = new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });
    await client.send(command);
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      console.warn(`Intento de activar usuario inexistente: ${username}`);
      return;
    }
    throw error;
  }
}

export async function adminResetUserPassword(username: string): Promise<string> {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID no está configurado');
  }

  if (!username) {
    throw new Error('Username es requerido');
  }

  const temporaryPassword = generateTemporaryPassword();

  try {
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: temporaryPassword,
      Permanent: false,
    });

    await client.send(setPasswordCommand);
    return temporaryPassword;
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      throw new Error('Usuario de Cognito no encontrado');
    }

    // Fallback: intentar reset nativo (envía email)
    try {
      const resetCommand = new AdminResetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      await client.send(resetCommand);
      return temporaryPassword;
    } catch (resetError) {
      throw resetError;
    }
  }
}

/**
 * Cambia la contraseña del usuario autenticado
 */
export async function changePassword(
  accessToken: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  if (!oldPassword || !newPassword) {
    throw new Error('La contraseña actual y la nueva contraseña son requeridas');
  }

  if (newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
  }

  try {
    const command = new ChangePasswordCommand({
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('La contraseña actual es incorrecta');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new Error('La nueva contraseña no cumple los requisitos');
      }
      if (error.name === 'LimitExceededException') {
        throw new Error('Has excedido el límite de intentos. Intenta más tarde');
      }
      throw error;
    }
    throw new Error('Error desconocido al cambiar contraseña');
  }
}

/**
 * Actualiza atributos del usuario (ej: rol)
 */
export async function updateUserAttributes(
  username: string,
  attributes: Array<{ Name: string; Value: string }>
): Promise<void> {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID no está configurado');
  }

  try {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: attributes,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al actualizar atributos');
  }
}

/**
 * Genera una contraseña temporal segura y única
 */
function generateTemporaryPassword(): string {
  const length = 16; // Aumentar longitud para más variabilidad
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Agregar timestamp y random para unicidad
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  password += timestamp.substring(timestamp.length - 4);
  password += random.substring(0, 4);
  
  // Completar el resto si es necesario
  while (password.length < length) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('').substring(0, length);
}

/**
 * Confirma el correo electrónico con código de verificación
 */
export async function confirmEmail(email: string, confirmationCode: string): Promise<void> {
  if (!email || !confirmationCode) {
    throw new Error('Email y código de confirmación son requeridos');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado');
  }

  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        throw new Error('Código de confirmación inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new Error('Código de confirmación expirado');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new Error('El usuario ya está confirmado o el código no es válido');
      }
      throw error;
    }
    throw new Error('Error desconocido al confirmar email');
  }
}

/**
 * Solicita recuperación de contraseña (envía código por email)
 */
export async function forgotPassword(email: string): Promise<void> {
  if (!email) {
    throw new Error('Email es requerido');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado');
  }

  try {
    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        throw new Error('Usuario no encontrado');
      }
      if (error.name === 'InvalidParameterException') {
        throw new Error('Email inválido');
      }
      if (error.name === 'LimitExceededException') {
        throw new Error('Has excedido el límite de intentos. Intenta más tarde');
      }
      throw error;
    }
    throw new Error('Error desconocido al solicitar recuperación de contraseña');
  }
}

/**
 * Confirma la recuperación de contraseña con código
 */
export async function confirmForgotPassword(
  email: string,
  confirmationCode: string,
  newPassword: string
): Promise<void> {
  if (!email || !confirmationCode || !newPassword) {
    throw new Error('Email, código de confirmación y nueva contraseña son requeridos');
  }

  if (newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado');
  }

  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        throw new Error('Código de confirmación inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new Error('Código de confirmación expirado');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new Error('La nueva contraseña no cumple los requisitos');
      }
      throw error;
    }
    throw new Error('Error desconocido al confirmar recuperación de contraseña');
  }
}

/**
 * Asocia un dispositivo TOTP para MFA (Time-based One-Time Password)
 */
export async function associateSoftwareToken(accessToken: string): Promise<{ secretCode: string; session: string }> {
  if (!accessToken) {
    throw new Error('Access token es requerido');
  }

  try {
    const command = new AssociateSoftwareTokenCommand({
      AccessToken: accessToken,
    });

    const response = await client.send(command);

    if (!response.SecretCode || !response.Session) {
      throw new Error('No se pudo generar el código secreto');
    }

    return {
      secretCode: response.SecretCode,
      session: response.Session,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Token inválido');
      }
      throw error;
    }
    throw new Error('Error desconocido al asociar token de software');
  }
}

/**
 * Verifica el código TOTP para completar la configuración de MFA
 */
export async function verifySoftwareToken(
  accessToken: string,
  userCode: string,
  friendlyDeviceName?: string
): Promise<void> {
  if (!accessToken || !userCode) {
    throw new Error('Access token y código de usuario son requeridos');
  }

  try {
    const command = new VerifySoftwareTokenCommand({
      AccessToken: accessToken,
      UserCode: userCode,
      FriendlyDeviceName: friendlyDeviceName || 'My Device',
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'EnableSoftwareTokenMFAException') {
        throw new Error('Código TOTP inválido');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Token inválido');
      }
      throw error;
    }
    throw new Error('Error desconocido al verificar token de software');
  }
}

/**
 * Establece la preferencia de MFA del usuario
 */
export async function setMFAPreference(
  accessToken: string,
  enabled: boolean
): Promise<void> {
  if (!accessToken) {
    throw new Error('Access token es requerido');
  }

  try {
    const command = new SetUserMFAPreferenceCommand({
      AccessToken: accessToken,
      SoftwareTokenMfaSettings: {
        Enabled: enabled,
        PreferredMfa: enabled,
      },
    });

    await client.send(command);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Token inválido');
      }
      throw error;
    }
    throw new Error('Error desconocido al establecer preferencia de MFA');
  }
}

/**
 * Responde al desafío NEW_PASSWORD_REQUIRED cambiando la contraseña temporal
 */
export async function respondToNewPasswordChallenge(
  email: string,
  session: string,
  newPassword: string
): Promise<AuthResult> {
  if (!email || !session || !newPassword) {
    throw new Error('Email, session y newPassword son requeridos');
  }

  if (newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado');
  }

  try {
    const command = new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPassword,
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error('No se recibió token de autenticación después del cambio de contraseña');
    }

    const { AccessToken, RefreshToken, IdToken, ExpiresIn } = response.AuthenticationResult;

    if (!AccessToken || !IdToken) {
      throw new Error('Tokens incompletos');
    }

    // Obtener información del usuario
    const userCommand = new GetUserCommand({ AccessToken });
    const userResponse = await client.send(userCommand);

    const userAttributes = userResponse.UserAttributes || [];
    const emailAttr = userAttributes.find((attr) => attr.Name === 'email');
    const firstNameAttr = userAttributes.find((attr) => attr.Name === 'given_name');
    const lastNameAttr = userAttributes.find((attr) => attr.Name === 'family_name');
    const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');
    const orgIdAttr = userAttributes.find((attr) => attr.Name === 'custom:orgId');

    return {
      accessToken: AccessToken,
      refreshToken: RefreshToken || '',
      idToken: IdToken,
      expiresIn: ExpiresIn || 3600,
      user: {
        id: userResponse.Username || email,
        email: emailAttr?.Value || email,
        firstName: firstNameAttr?.Value,
        lastName: lastNameAttr?.Value,
        role: (roleAttr?.Value as UserRole) || 'student',
        orgId: orgIdAttr?.Value,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'InvalidPasswordException') {
        throw new Error('La nueva contraseña no cumple los requisitos');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Sesión inválida o expirada');
      }
      throw error;
    }
    throw new Error('Error desconocido al cambiar contraseña temporal');
  }
}

/**
 * Responde al desafío MFA durante el login
 */
export async function respondToMFAChallenge(
  session: string,
  userCode: string
): Promise<AuthResult> {
  if (!session || !userCode) {
    throw new Error('Session y código de usuario son requeridos');
  }

  if (!CLIENT_ID) {
    throw new Error('COGNITO_CLIENT_ID no está configurado');
  }

  try {
    const command = new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      Session: session,
      ChallengeResponses: {
        SOFTWARE_TOKEN_MFA_CODE: userCode,
        USERNAME: '', // Se obtiene del session
      },
    });

    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error('No se recibió token de autenticación');
    }

    const { AccessToken, RefreshToken, IdToken, ExpiresIn } = response.AuthenticationResult;

    if (!AccessToken || !IdToken) {
      throw new Error('Tokens incompletos');
    }

    // Obtener información del usuario
    const userCommand = new GetUserCommand({ AccessToken });
    const userResponse = await client.send(userCommand);

    const userAttributes = userResponse.UserAttributes || [];
    const emailAttr = userAttributes.find((attr) => attr.Name === 'email');
    const firstNameAttr = userAttributes.find((attr) => attr.Name === 'given_name');
    const lastNameAttr = userAttributes.find((attr) => attr.Name === 'family_name');
    const roleAttr = userAttributes.find((attr) => attr.Name === 'custom:role');
    const orgIdAttr = userAttributes.find((attr) => attr.Name === 'custom:orgId');

    return {
      accessToken: AccessToken,
      refreshToken: RefreshToken || '',
      idToken: IdToken,
      expiresIn: ExpiresIn || 3600,
      user: {
        id: userResponse.Username || '',
        email: emailAttr?.Value || '',
        firstName: firstNameAttr?.Value,
        lastName: lastNameAttr?.Value,
        role: (roleAttr?.Value as UserRole) || 'student',
        orgId: orgIdAttr?.Value,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'CodeMismatchException') {
        throw new Error('Código MFA inválido');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Sesión o código inválido');
      }
      throw error;
    }
    throw new Error('Error desconocido al responder al desafío MFA');
  }
}


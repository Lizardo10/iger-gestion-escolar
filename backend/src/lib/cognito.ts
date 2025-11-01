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
  ConfirmForgotPasswordCommand,
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
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    orgId?: string;
  };
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
    const authParams: InitiateAuthCommandInput = {
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const command = new InitiateAuthCommand(authParams);
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

  // Generar contraseña temporal si no se proporciona
  const tempPassword = temporaryPassword || generateTemporaryPassword();

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
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
    throw new Error('Error desconocido al crear usuario');
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
 * Genera una contraseña temporal segura
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Completar el resto
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
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


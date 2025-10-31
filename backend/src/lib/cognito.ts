import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  InitiateAuthCommandInput,
  AuthFlowType,
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

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ],
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


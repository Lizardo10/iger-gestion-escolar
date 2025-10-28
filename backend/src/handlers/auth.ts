import { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';

export async function login(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as { email: string; password: string };
    
    // TODO: Implementar autenticación con Cognito
    console.log('Login attempt:', body.email);
    
    return successResponse({
      message: 'Login endpoint - en desarrollo',
      email: body.email,
    });
  } catch (error) {
    return errorResponse('Error en login: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function register(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as {
      email: string;
      password: string;
      role: string;
      firstName: string;
      lastName: string;
    };
    
    // TODO: Implementar registro con Cognito
    console.log('Register attempt:', body.email, body.role);
    
    return successResponse({
      message: 'Register endpoint - en desarrollo',
    });
  } catch (error) {
    return errorResponse('Error en register: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}




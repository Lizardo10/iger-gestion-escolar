import { LambdaResponse } from '../types';

export function successResponse(data: unknown, statusCode = 200): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(data),
  };
}

export function errorResponse(message: string, statusCode = 500): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
    }),
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function getCurrentTimestamp(): number {
  return Date.now();
}

export function parseJsonBody(body: string | null): unknown {
  if (!body) {
    return {};
  }
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Campo requerido: ${field}`;
    }
  }
  return null;
}




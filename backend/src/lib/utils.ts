import { LambdaResponse } from '../types';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function commonSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    // CSP básica; ajustar si se requiere más permisiva
    'Content-Security-Policy': "default-src 'self' * data: blob:; frame-ancestors 'none'",
  } as Record<string, string>;
}

export function successResponse(data: unknown, statusCode = 200): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      ...commonSecurityHeaders(),
    },
    body: JSON.stringify(data),
  };
}

export function errorResponse(message: string, statusCode = 500): LambdaResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      ...commonSecurityHeaders(),
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

export function validateString(value: unknown, field: string, min = 1, max = 200): string | null {
  if (typeof value !== 'string') return `Campo inválido: ${field}`;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return `Largo inválido para ${field}`;
  return null;
}

export function validateISODate(value: unknown, field: string): string | null {
  if (typeof value !== 'string') return `Campo inválido: ${field}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return `Fecha inválida en ${field}`;
  return null;
}




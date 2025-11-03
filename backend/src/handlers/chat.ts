import type { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';
import { requireAuth, unauthorizedResponse } from '../lib/authorization';
import { generateRAGResponse } from '../lib/rag';

/**
 * Chat con RAG usando contexto del sistema
 * POST /chat
 */
export async function chat(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar autenticación
    const user = await requireAuth(event);
    if (!user) {
      return unauthorizedResponse('No autenticado');
    }

    const body = parseJsonBody(event.body) as {
      message: string;
      conversationId?: string;
    };

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return errorResponse('El mensaje es requerido', 400);
    }

    // Validar longitud del mensaje
    if (body.message.length > 1000) {
      return errorResponse('El mensaje es demasiado largo (máximo 1000 caracteres)', 400);
    }

    try {
      // Generar respuesta con RAG
      const response = await generateRAGResponse(
        body.message.trim(),
        user.id,
        user.role
      );

      return successResponse({
        response,
        conversationId: body.conversationId || 'new',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error en chat RAG:', error);
      return errorResponse(
        'Error al procesar el mensaje: ' + (error instanceof Error ? error.message : 'Unknown error'),
        500
      );
    }
  } catch (error) {
    console.error('Error en endpoint de chat:', error);
    return errorResponse(
      'Error en chat: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}



import OpenAI from 'openai';
import { DynamoDBService } from './dynamodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface RAGContext {
  students?: string;
  tasks?: string;
  events?: string;
  invoices?: string;
}

/**
 * Obtiene contexto relevante del sistema para el RAG
 */
async function getSystemContext(query: string): Promise<RAGContext> {
  const context: RAGContext = {};

  try {
    // Buscar en estudiantes
    if (query.toLowerCase().includes('estudiante') || query.toLowerCase().includes('alumno') || query.toLowerCase().includes('student')) {
      const students = await DynamoDBService.scan(
        'Type = :type',
        { ':type': 'Student' }
      );
      context.students = students
        .slice(0, 10) // Limitar a 10 estudiantes
        .map(item => {
          const data = item.Data as { name?: string; email?: string; grade?: string };
          return `Estudiante: ${data.name || 'Sin nombre'}, Email: ${data.email || 'N/A'}, Grado: ${data.grade || 'N/A'}`;
        })
        .join('\n');
    }

    // Buscar en tareas
    if (query.toLowerCase().includes('tarea') || query.toLowerCase().includes('task') || query.toLowerCase().includes('trabajo')) {
      const tasks = await DynamoDBService.scan(
        'Type = :type',
        { ':type': 'Task' }
      );
      context.tasks = tasks
        .slice(0, 10)
        .map(item => {
          const data = item.Data as { title?: string; description?: string; dueDate?: string };
          return `Tarea: ${data.title || 'Sin título'}, Descripción: ${data.description || 'N/A'}, Fecha límite: ${data.dueDate || 'N/A'}`;
        })
        .join('\n');
    }

    // Buscar en eventos
    if (query.toLowerCase().includes('evento') || query.toLowerCase().includes('event') || query.toLowerCase().includes('calendario')) {
      const events = await DynamoDBService.scan(
        'Type = :type',
        { ':type': 'Event' }
      );
      context.events = events
        .slice(0, 10)
        .map(item => {
          const data = item.Data as { title?: string; description?: string; startDate?: string; endDate?: string };
          return `Evento: ${data.title || 'Sin título'}, Descripción: ${data.description || 'N/A'}, Fecha: ${data.startDate || 'N/A'}`;
        })
        .join('\n');
    }

    // Buscar en facturas
    if (query.toLowerCase().includes('factura') || query.toLowerCase().includes('invoice') || query.toLowerCase().includes('pago') || query.toLowerCase().includes('payment')) {
      const invoices = await DynamoDBService.scan(
        'Type = :type',
        { ':type': 'Invoice' }
      );
      context.invoices = invoices
        .slice(0, 10)
        .map(item => {
          const data = item.Data as { id?: string; amount?: number; status?: string; dueDate?: string };
          return `Factura #${data.id || 'N/A'}, Monto: $${data.amount || 0}, Estado: ${data.status || 'N/A'}, Vencimiento: ${data.dueDate || 'N/A'}`;
        })
        .join('\n');
    }
  } catch (error) {
    console.error('Error obteniendo contexto del sistema:', error);
  }

  return context;
}

/**
 * Genera respuesta usando RAG con contexto del sistema
 */
export async function generateRAGResponse(userQuery: string, _userId?: string, userRole?: string): Promise<string> {
  try {
    // Obtener contexto relevante
    const context = await getSystemContext(userQuery);

    // Construir prompt con contexto
    let systemPrompt = `Eres un asistente inteligente para el sistema de gestión escolar IGER.
Proporcionas ayuda sobre estudiantes, tareas, eventos, facturas y pagos.
Responde de manera clara, concisa y útil en español.

Información del usuario:
${userRole ? `- Rol: ${userRole}` : ''}

Contexto del sistema:`;

    if (context.students) {
      systemPrompt += `\n\nEstudiantes registrados:\n${context.students}`;
    }
    if (context.tasks) {
      systemPrompt += `\n\nTareas:\n${context.tasks}`;
    }
    if (context.events) {
      systemPrompt += `\n\nEventos:\n${context.events}`;
    }
    if (context.invoices) {
      systemPrompt += `\n\nFacturas:\n${context.invoices}`;
    }

    systemPrompt += `\n\nIMPORTANTE:
- Si el usuario pregunta sobre algo que no está en el contexto, indica que necesitas más información.
- Para operaciones específicas (crear, editar, eliminar), dirige al usuario a la sección correspondiente del sistema.
- Sé profesional y amigable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
  } catch (error) {
    console.error('Error generando respuesta RAG:', error);
    throw new Error('Error al generar respuesta: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}


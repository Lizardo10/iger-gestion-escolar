import type { LambdaEvent, LambdaResponse, Task } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp, validateString, validateISODate, encodeNextToken, decodeNextToken } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, orgId } = event.queryStringParameters || {};
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20', 10), 100);
    const nextToken = event.queryStringParameters?.nextToken || null;

    if (!classId) {
      return errorResponse('classId es requerido', 400);
    }

    // Query tasks by classId (paginado)
    const { items, lastEvaluatedKey } = await DynamoDBService.queryPaginated(
      undefined,
      'PK = :pk',
      {
        ':pk': `CLASS#${classId}`,
      },
      limit,
      decodeNextToken(nextToken)
    );

    const tasks = items
      .filter((item) => item.Type === 'Task')
      .map((item) => ({
        ...item.Data,
        id: item.SK.split('#')[1],
      }));

    return successResponse({
      tasks,
      nextToken: encodeNextToken(lastEvaluatedKey),
      limit,
    });
  } catch (error) {
    console.error('Error al listar tareas:', error);
    return errorResponse(
      'Error al listar tareas: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function get(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, taskId } = event.pathParameters || {};

    if (!classId || !taskId) {
      return errorResponse('classId y taskId son requeridos', 400);
    }

    const item = await DynamoDBService.getItem(`CLASS#${classId}`, `TASK#${taskId}`);

    if (!item || item.Type !== 'Task') {
      return errorResponse('Tarea no encontrada', 404);
    }

    return successResponse({
      task: {
        ...item.Data,
        id: taskId,
      },
    });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    return errorResponse(
      'Error al obtener tarea: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function create(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as Partial<Task> & {
      classId: string;
    };

    const { classId, title, description, dueDate, attachments, maxScore } = body;

    if (!classId || !title || !description || !dueDate) {
      return errorResponse('Campos requeridos: classId, title, description, dueDate', 400);
    }

    // Validaciones básicas
    const tErr = validateString(title, 'title', 1, 120);
    if (tErr) return errorResponse(tErr, 400);
    const dErr = validateString(description, 'description', 1, 2000);
    if (dErr) return errorResponse(dErr, 400);
    const dateErr = validateISODate(dueDate, 'dueDate');
    if (dateErr) return errorResponse(dateErr, 400);

    const taskId = generateId();
    const timestamp = getCurrentTimestamp();

    const taskData: Task = {
      id: taskId,
      classId,
      title,
      description,
      dueDate,
      attachments: attachments || [],
      maxScore: maxScore || 100,
    };

    await DynamoDBService.putItem({
      PK: `CLASS#${classId}`,
      SK: `TASK#${taskId}`,
      GSI1PK: `DUEDATE#${dueDate}`,
      GSI1SK: `TASK#${taskId}`,
      Type: 'Task',
      Data: taskData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse(
      {
        ...taskData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return errorResponse(
      'Error al crear tarea: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function update(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, taskId } = event.pathParameters || {};
    const body = parseJsonBody(event.body) as Partial<Task>;

    if (!classId || !taskId) {
      return errorResponse('classId y taskId son requeridos', 400);
    }

    const existingItem = await DynamoDBService.getItem(`CLASS#${classId}`, `TASK#${taskId}`);

    if (!existingItem || existingItem.Type !== 'Task') {
      return errorResponse('Tarea no encontrada', 404);
    }

    const timestamp = getCurrentTimestamp();

    // Fusionar datos existentes con los nuevos en Data
    const currentData = existingItem.Data as Task;
    const updatedData: Task = {
      ...currentData,
      ...body,
      id: taskId,
      classId: classId,
    } as Task;

    await DynamoDBService.putItem({
      PK: `CLASS#${classId}`,
      SK: `TASK#${taskId}`,
      GSI1PK: `DUEDATE#${updatedData.dueDate || currentData.dueDate}`,
      GSI1SK: `TASK#${taskId}`,
      Type: 'Task',
      Data: updatedData,
      CreatedAt: existingItem.CreatedAt,
      UpdatedAt: timestamp,
    });

    return successResponse({ message: 'Tarea actualizada correctamente', task: updatedData });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return errorResponse(
      'Error al actualizar tarea: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function remove(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { classId, taskId } = event.pathParameters || {};

    if (!classId || !taskId) {
      return errorResponse('classId y taskId son requeridos', 400);
    }

    await DynamoDBService.deleteItem(`CLASS#${classId}`, `TASK#${taskId}`);

    return successResponse({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return errorResponse(
      'Error al eliminar tarea: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function createSubmission(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { taskId } = event.pathParameters || {};
    const body = parseJsonBody(event.body) as {
      studentId: string;
      content: string;
      attachments: string[];
    };

    if (!taskId || !body.studentId || !body.content) {
      return errorResponse('Campos requeridos: studentId, content', 400);
    }

    const submissionId = generateId();
    const timestamp = getCurrentTimestamp();

    await DynamoDBService.putItem({
      PK: `TASK#${taskId}`,
      SK: `SUBMISSION#${body.studentId}`,
      GSI1PK: `STUDENT#${body.studentId}`,
      GSI1SK: `SUBMISSION#${taskId}#${timestamp}`,
      Type: 'Submission',
      Data: {
        id: submissionId,
        taskId,
        studentId: body.studentId,
        content: body.content,
        attachments: body.attachments || [],
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      },
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse({ submissionId, status: 'submitted' }, 201);
  } catch (error) {
    console.error('Error al crear entrega:', error);
    return errorResponse(
      'Error al crear entrega: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function getSubmissions(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      return errorResponse('taskId es requerido', 400);
    }

    const items = await DynamoDBService.query(
      undefined,
      'PK = :pk',
      {
        ':pk': `TASK#${taskId}`,
      }
    );

    const submissions = items
      .filter((item) => item.Type === 'Submission')
      .map((item) => ({
        ...item.Data,
      }));

    return successResponse({ submissions });
  } catch (error) {
    console.error('Error al listar entregas:', error);
    return errorResponse(
      'Error al listar entregas: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}


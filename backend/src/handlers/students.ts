import type { LambdaEvent, LambdaResponse, Student } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp, validateString, validateISODate, encodeNextToken, decodeNextToken } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse } from '../lib/authorization';

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: cualquier usuario autenticado puede ver estudiantes
    const user = await requirePermission(event, 'students', 'read');
    if (!user) {
      return unauthorizedResponse();
    }

    const { orgId } = event.queryStringParameters || {};
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20', 10), 100);
    const nextToken = event.queryStringParameters?.nextToken || null;

    if (!orgId) {
      return errorResponse('orgId es requerido', 400);
    }

    // Estudiantes solo pueden ver su propia información (futuro)
    // Por ahora, todos los roles autenticados pueden ver la lista

    // Query students by orgId (paginado)
    const { items, lastEvaluatedKey } = await DynamoDBService.queryPaginated(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `ORG#${orgId}`,
        ':skPrefix': 'STUDENT#',
      },
      limit,
      decodeNextToken(nextToken)
    );

    const students = items
      .filter((item) => item.Type === 'Student')
      .map((item) => ({
        ...item.Data,
        id: item.SK.split('#')[1],
      }));

    return successResponse({
      students,
      nextToken: encodeNextToken(lastEvaluatedKey),
      limit,
    });
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
    return errorResponse(
      'Error al listar estudiantes: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function get(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { studentId, orgId } = event.pathParameters || {};

    if (!orgId || !studentId) {
      return errorResponse('orgId y studentId son requeridos', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${studentId}`);

    if (!item || item.Type !== 'Student') {
      return errorResponse('Estudiante no encontrado', 404);
    }

    return successResponse({
      student: {
        ...item.Data,
        id: studentId,
      },
    });
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    return errorResponse(
      'Error al obtener estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function create(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Solo admin/superadmin pueden crear estudiantes
    const user = await requirePermission(event, 'students', 'create');
    if (!user) {
      return unauthorizedResponse('Solo administradores pueden crear estudiantes');
    }

    const body = parseJsonBody(event.body) as Partial<Student> & {
      orgId: string;
    };

    const { orgId, firstName, lastName, birthDate, grade, parentIds } = body;

    if (!orgId || !firstName || !lastName || !birthDate || !grade) {
      return errorResponse('Campos requeridos: orgId, firstName, lastName, birthDate, grade', 400);
    }

    // Validaciones básicas
    const n1 = validateString(firstName, 'firstName', 1, 80);
    if (n1) return errorResponse(n1, 400);
    const n2 = validateString(lastName, 'lastName', 1, 120);
    if (n2) return errorResponse(n2, 400);
    const dErr = validateISODate(birthDate, 'birthDate');
    if (dErr) return errorResponse(dErr, 400);

    const studentId = generateId();
    const timestamp = getCurrentTimestamp();

    const studentData: Student = {
      id: studentId,
      firstName,
      lastName,
      birthDate,
      grade,
      parentIds: parentIds || [],
      orgId,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `STUDENT#${studentId}`,
      GSI1PK: `ORG#${orgId}`,
      GSI1SK: `STUDENT#${studentId}`,
      Type: 'Student',
      Data: studentData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse(
      {
        ...studentData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    return errorResponse(
      'Error al crear estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function update(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Solo admin/superadmin pueden actualizar estudiantes
    const user = await requirePermission(event, 'students', 'update');
    if (!user) {
      return unauthorizedResponse('Solo administradores pueden actualizar estudiantes');
    }

    const { studentId } = event.pathParameters || {};
    const orgId = event.queryStringParameters?.orgId;
    const body = parseJsonBody(event.body) as Partial<Student>;

    // Log para debug
    console.log('Update student request:', {
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters,
      body: body,
      rawBody: event.body,
    });

    if (!orgId || !studentId) {
      return errorResponse('orgId y studentId son requeridos', 400);
    }

    const existingItem = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${studentId}`);

    if (!existingItem || existingItem.Type !== 'Student') {
      return errorResponse('Estudiante no encontrado', 404);
    }

    // Update the Data object with new values
    const updatedData = {
      ...existingItem.Data,
      ...body,
    };

    const timestamp = getCurrentTimestamp();

    // Use putItem to replace the entire item with updated Data
    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `STUDENT#${studentId}`,
      GSI1PK: existingItem.GSI1PK,
      GSI1SK: existingItem.GSI1SK,
      Type: existingItem.Type,
      Data: updatedData,
      CreatedAt: existingItem.CreatedAt,
      UpdatedAt: timestamp,
    });

    return successResponse({ message: 'Estudiante actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    return errorResponse(
      'Error al actualizar estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function remove(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Solo admin/superadmin pueden eliminar estudiantes
    const user = await requirePermission(event, 'students', 'delete');
    if (!user) {
      return unauthorizedResponse('Solo administradores pueden eliminar estudiantes');
    }

    const { studentId } = event.pathParameters || {};
    const orgId = event.queryStringParameters?.orgId;

    if (!orgId || !studentId) {
      return errorResponse('orgId y studentId son requeridos', 400);
    }

    await DynamoDBService.deleteItem(`ORG#${orgId}`, `STUDENT#${studentId}`);

    return successResponse({ message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    return errorResponse(
      'Error al eliminar estudiante: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

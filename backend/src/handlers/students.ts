import type { LambdaEvent, LambdaResponse, Student } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { orgId } = event.queryStringParameters || {};
    const page = parseInt(event.queryStringParameters?.page || '1', 10);
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);

    if (!orgId) {
      return errorResponse('orgId es requerido', 400);
    }

    // Query students by orgId
    const items = await DynamoDBService.query(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `ORG#${orgId}`,
        ':skPrefix': 'STUDENT#',
      }
    );

    const students = items
      .filter((item) => item.Type === 'Student')
      .map((item) => ({
        ...item.Data,
        id: item.SK.split('#')[1],
      }));

    const total = students.length;
    const offset = (page - 1) * limit;
    const paginatedStudents = students.slice(offset, offset + limit);

    return successResponse({
      students: paginatedStudents,
      total,
      page,
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
    const body = parseJsonBody(event.body) as Partial<Student> & {
      orgId: string;
    };

    const { orgId, firstName, lastName, birthDate, grade, parentIds } = body;

    if (!orgId || !firstName || !lastName || !birthDate || !grade) {
      return errorResponse('Campos requeridos: orgId, firstName, lastName, birthDate, grade', 400);
    }

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
    const { studentId, orgId } = event.pathParameters || {};
    const body = parseJsonBody(event.body) as Partial<Student>;

    if (!orgId || !studentId) {
      return errorResponse('orgId y studentId son requeridos', 400);
    }

    const existingItem = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${studentId}`);

    if (!existingItem || existingItem.Type !== 'Student') {
      return errorResponse('Estudiante no encontrado', 404);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    Object.entries(body).forEach(([key, value]) => {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;

      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    if (updateExpressions.length > 0) {
      updateExpressions.push('#UpdatedAt = :updatedAt');
      expressionAttributeNames['#UpdatedAt'] = 'UpdatedAt';
      expressionAttributeValues[':updatedAt'] = getCurrentTimestamp();

      await DynamoDBService.updateItem({
        Key: {
          PK: `ORG#${orgId}`,
          SK: `STUDENT#${studentId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });
    }

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
    const { studentId, orgId } = event.pathParameters || {};

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

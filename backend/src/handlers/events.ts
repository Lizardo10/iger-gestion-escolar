import type { LambdaEvent, LambdaResponse, Event } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { orgId, from, to, type } = event.queryStringParameters || {};

    if (!orgId) {
      return errorResponse('orgId es requerido', 400);
    }

    const items = await DynamoDBService.query(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `ORG#${orgId}`,
        ':skPrefix': 'EVENT#',
      }
    );

    let events = items.filter((item) => item.Type === 'Event').map((item) => ({
      ...item.Data,
      id: item.SK.split('#')[1],
    }));

    // Filtrar por tipo si se especifica
    if (type) {
      events = events.filter((ev) => ev.type === type);
    }

    // Filtrar por rango de fechas si se especifica
    if (from && to) {
      events = events.filter((ev) => {
        const startDate = new Date(ev.startDate);
        return startDate >= new Date(from) && startDate <= new Date(to);
      });
    }

    return successResponse({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error('Error al listar eventos:', error);
    return errorResponse(
      'Error al listar eventos: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function get(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { eventId, orgId } = event.pathParameters || {};

    if (!orgId || !eventId) {
      return errorResponse('orgId y eventId son requeridos', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `EVENT#${eventId}`);

    if (!item || item.Type !== 'Event') {
      return errorResponse('Evento no encontrado', 404);
    }

    return successResponse({
      event: {
        ...item.Data,
        id: eventId,
      },
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return errorResponse(
      'Error al obtener evento: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function create(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const body = parseJsonBody(event.body) as Partial<Event> & {
      orgId: string;
    };

    const { orgId, title, description, startDate, endDate, type, attendees, location } = body;

    if (!orgId || !title || !startDate || !endDate || !type) {
      return errorResponse('Campos requeridos: orgId, title, startDate, endDate, type', 400);
    }

    const eventId = generateId();
    const timestamp = getCurrentTimestamp();

    const eventData: Event = {
      id: eventId,
      title,
      description: description || '',
      startDate,
      endDate,
      type: type as Event['type'],
      attendees: attendees || [],
      location: location || undefined,
      orgId,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `EVENT#${eventId}`,
      GSI1PK: `DATE#${startDate}`,
      GSI1SK: `EVENT#${eventId}`,
      Type: 'Event',
      Data: eventData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse(
      {
        ...eventData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear evento:', error);
    return errorResponse(
      'Error al crear evento: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function update(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { eventId, orgId } = event.pathParameters || {};
    const body = parseJsonBody(event.body) as Partial<Event>;

    if (!orgId || !eventId) {
      return errorResponse('orgId y eventId son requeridos', 400);
    }

    const existingItem = await DynamoDBService.getItem(`ORG#${orgId}`, `EVENT#${eventId}`);

    if (!existingItem || existingItem.Type !== 'Event') {
      return errorResponse('Evento no encontrado', 404);
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
          SK: `EVENT#${eventId}`,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });
    }

    return successResponse({ message: 'Evento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return errorResponse(
      'Error al actualizar evento: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function remove(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { eventId, orgId } = event.pathParameters || {};

    if (!orgId || !eventId) {
      return errorResponse('orgId y eventId son requeridos', 400);
    }

    await DynamoDBService.deleteItem(`ORG#${orgId}`, `EVENT#${eventId}`);

    return successResponse({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return errorResponse(
      'Error al eliminar evento: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}


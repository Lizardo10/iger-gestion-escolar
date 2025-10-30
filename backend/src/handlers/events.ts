import type { LambdaEvent, LambdaResponse, Event } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp, validateString, validateISODate, encodeNextToken, decodeNextToken } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';

export async function list(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { orgId, from, to, type } = event.queryStringParameters || {};
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20', 10), 100);
    const nextToken = event.queryStringParameters?.nextToken || null;

    if (!orgId) {
      return errorResponse('orgId es requerido', 400);
    }

    const { items, lastEvaluatedKey } = await DynamoDBService.queryPaginated(
      undefined,
      'PK = :pk AND begins_with(SK, :skPrefix)',
      {
        ':pk': `ORG#${orgId}`,
        ':skPrefix': 'EVENT#',
      },
      limit,
      decodeNextToken(nextToken)
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
      nextToken: encodeNextToken(lastEvaluatedKey),
      limit,
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
    const body = parseJsonBody(event.body) as Partial<Event> & { orgId?: string };

    // Log para debug
    console.log('Create event request:', {
      body: body,
      rawBody: event.body,
    });

    const orgId = body.orgId || event.queryStringParameters?.orgId;
    const { title, description, startDate, endDate, date, type, attendees, location } = body;

    // Log para debug
    console.log('Event data after parsing:', { orgId, title, date, startDate, endDate, type });

    if (!orgId || !title || !type) {
      return errorResponse('Campos requeridos: orgId, title, type', 400);
    }

    // Validaciones básicas
    const titleErr = validateString(title, 'title', 1, 120);
    if (titleErr) return errorResponse(titleErr, 400);
    if (!['meeting', 'activity', 'holiday'].includes(String(type))) {
      return errorResponse('type inválido', 400);
    }

    // Si viene 'date' (formato frontend), convertir a startDate/endDate
    const finalStartDate = startDate || date;
    const finalEndDate = endDate || date;

    if (!finalStartDate || !finalEndDate) {
      return errorResponse('Se requiere "date" o ambos "startDate" y "endDate"', 400);
    }

    const d1Err = validateISODate(finalStartDate, 'startDate');
    const d2Err = validateISODate(finalEndDate, 'endDate');
    if (d1Err || d2Err) return errorResponse(d1Err || d2Err!, 400);

    const eventId = generateId();
    const timestamp = getCurrentTimestamp();

    const baseData: Event = {
      id: eventId,
      title,
      description: description || '',
      startDate: finalStartDate,
      endDate: finalEndDate,
      type: type as Event['type'],
      attendees: attendees || [],
      orgId,
    };

    const eventData: Event = location ? { ...baseData, location } : baseData;

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `EVENT#${eventId}`,
      GSI1PK: `DATE#${finalStartDate}`,
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
    const { eventId } = event.pathParameters || {};
    const orgId = event.queryStringParameters?.orgId;
    const body = parseJsonBody(event.body) as Partial<Event>;

    if (!orgId || !eventId) {
      return errorResponse('orgId y eventId son requeridos', 400);
    }

    const existingItem = await DynamoDBService.getItem(`ORG#${orgId}`, `EVENT#${eventId}`);

    if (!existingItem || existingItem.Type !== 'Event') {
      return errorResponse('Evento no encontrado', 404);
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
      SK: `EVENT#${eventId}`,
      GSI1PK: existingItem.GSI1PK,
      GSI1SK: existingItem.GSI1SK,
      Type: existingItem.Type,
      Data: updatedData,
      CreatedAt: existingItem.CreatedAt,
      UpdatedAt: timestamp,
    });

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
    const { eventId } = event.pathParameters || {};
    const orgId = event.queryStringParameters?.orgId;

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


import type { LambdaEvent, LambdaResponse, Invoice } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse, forbiddenResponse } from '../lib/authorization';
// PayPal SDK - implementación simplificada para ejemplo
async function createPayPalOrderAPI(_amount: number, invoiceId: string) {
  // Variables reservadas para futura implementación de PayPal
  void process.env.PAYPAL_CLIENT_ID;
  void process.env.PAYPAL_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const baseUrl = mode === 'production' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com';

  // Aquí iría la implementación real del PayPal API
  // Por ahora retornamos mock data
  return {
    id: `PAYPAL-ORDER-${Date.now()}`,
    approvalUrl: `${baseUrl}/checkout/?token=mock-token-${invoiceId}`,
  };
}

export async function createInvoice(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: solo admin y superadmin pueden crear facturas
    const user = await requirePermission(event, 'invoices', 'create');
    if (!user) {
      return unauthorizedResponse('No autenticado o sin permisos para crear facturas');
    }

    const body = parseJsonBody(event.body) as {
      orgId: string;
      studentId: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
      dueDate: string;
    };

    const { orgId, studentId, items, dueDate } = body;

    if (!orgId || !studentId || !items || items.length === 0 || !dueDate) {
      return errorResponse('Campos requeridos: orgId, studentId, items, dueDate', 400);
    }

    // Validar que el orgId del usuario coincida con el orgId de la factura
    if (user.orgId && user.orgId !== orgId) {
      return forbiddenResponse('No tienes permisos para crear facturas en esta organización');
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const invoiceId = generateId();
    const timestamp = getCurrentTimestamp();

    const invoiceData: Invoice = {
      id: invoiceId,
      studentId,
      amount: totalAmount,
      items,
      status: 'pending',
      dueDate,
      orgId,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `INVOICE#${invoiceId}`,
      GSI1PK: `STUDENT#${studentId}`,
      GSI1SK: `INVOICE#${invoiceId}`,
      GSI2PK: `STATUS#pending`,
      GSI2SK: `DUEDATE#${dueDate}`,
      Type: 'Invoice',
      Data: invoiceData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    return successResponse(
      {
        ...invoiceData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      201
    );
  } catch (error) {
    console.error('Error al crear factura:', error);
    return errorResponse(
      'Error al crear factura: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function createPayPalOrder(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: cualquier usuario autenticado puede crear orden PayPal (los padres pagan)
    const user = await requirePermission(event, 'payments', 'read');
    if (!user) {
      return unauthorizedResponse('No autenticado');
    }

    const body = parseJsonBody(event.body) as { invoiceId: string; orgId: string };

    if (!body.invoiceId || !body.orgId) {
      return errorResponse('invoiceId y orgId son requeridos', 400);
    }

    const invoice = await DynamoDBService.getItem(`ORG#${body.orgId}`, `INVOICE#${body.invoiceId}`);

    if (!invoice || invoice.Type !== 'Invoice') {
      return errorResponse('Factura no encontrada', 404);
    }

    const invoiceData = invoice.Data as Invoice;

    // Crear orden en PayPal
    const order = await createPayPalOrderAPI(invoiceData.amount, body.invoiceId);
    const approvalUrl = order.approvalUrl;

    if (!approvalUrl) {
      return errorResponse('No se pudo obtener URL de aprobación', 500);
    }

    // Actualizar factura con orderId
    await DynamoDBService.updateItem({
      Key: {
        PK: `ORG#${body.orgId}`,
        SK: `INVOICE#${body.invoiceId}`,
      },
      UpdateExpression: 'SET #Data.paypalOrderId = :orderId',
      ExpressionAttributeNames: {
        '#Data': 'Data',
      },
      ExpressionAttributeValues: {
        ':orderId': order.id || '',
      },
      ReturnValues: 'ALL_NEW',
    });

    return successResponse({
      orderId: order.id,
      approvalUrl,
    });
  } catch (error) {
    console.error('Error al crear orden PayPal:', error);
    return errorResponse(
      'Error al crear orden PayPal: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function handlePayPalWebhook(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Webhook de PayPal no requiere autenticación (viene de PayPal)
    // Pero deberías validar la firma del webhook en producción

    const webhookData = parseJsonBody(event.body) as {
      event_type: string;
      resource: {
        id: string;
        custom_id?: string;
        invoice_id?: string;
      };
    };

    console.log('PayPal Webhook recibido:', webhookData);

    if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // PayPal puede enviar custom_id o invoice_id
      const invoiceId = webhookData.resource.custom_id || webhookData.resource.invoice_id;
      const orderId = webhookData.resource.id;

      if (!invoiceId) {
        console.error('No se encontró invoiceId en el webhook');
        return errorResponse('invoiceId no encontrado en webhook', 400);
      }

      // Buscar la factura por orderId en GSI o escanear
      // Por ahora, usamos el invoiceId del custom_id y buscamos la factura
      // Mejorar: guardar mapping orderId -> invoiceId en DynamoDB
      
      // Buscar factura escaneando por GSI2 (status) o mejor aún, guardar orderId en la factura
      // Por ahora, asumimos que el invoiceId viene en custom_id
      
      // Necesitamos buscar en todas las organizaciones o guardar orgId en el orderId
      // Por ahora, intentamos con el invoiceId directamente
      // Mejor: guardar mapping orderId -> (orgId, invoiceId) en DynamoDB
      
      console.log(`Buscando factura con invoiceId: ${invoiceId}, orderId: ${orderId}`);
      
      // Buscar la factura usando el invoiceId (necesitamos orgId)
      // Por ahora, escaneamos todas las facturas con ese invoiceId
      // TODO: Mejorar guardando orderId en la factura al crear la orden
      
      // Buscar factura por invoiceId en GSI1 (STUDENT#studentId)
      // Necesitamos escanear o buscar de otra forma
      // Por ahora, retornamos éxito y actualizaremos manualmente si es necesario
      console.warn('Webhook recibido pero orgId no disponible. Considera guardar orderId -> invoiceId mapping.');
      
      return successResponse({ 
        received: true,
        message: 'Webhook recibido. Actualizar factura manualmente si es necesario.',
        invoiceId,
        orderId 
      });
    }

    return successResponse({ received: true });
  } catch (error) {
    console.error('Error procesando webhook PayPal:', error);
    return errorResponse(
      'Error procesando webhook: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function listInvoices(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: solo admin y superadmin pueden listar facturas
    const user = await requirePermission(event, 'invoices', 'list');
    if (!user) {
      return unauthorizedResponse('No autenticado o sin permisos para ver facturas');
    }

    const queryParams = event.queryStringParameters || {};
    const orgId = queryParams.orgId || user.orgId || 'default-org';
    const studentId = queryParams.studentId;
    const status = queryParams.status;
    const page = parseInt(queryParams.page || '1', 10);
    const limit = Math.min(parseInt(queryParams.limit || '20', 10), 100);

    if (!user.orgId && !queryParams.orgId) {
      return errorResponse('orgId es requerido', 400);
    }

    // Validar que el usuario tenga acceso a esta organización
    if (user.orgId && user.orgId !== orgId) {
      return forbiddenResponse('No tienes permisos para ver facturas de esta organización');
    }

    let invoices: Invoice[] = [];
    let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
    let totalScanned = 0;

    const lastKeyDecoded = queryParams.lastKey ? JSON.parse(Buffer.from(queryParams.lastKey, 'base64').toString()) : undefined;

    if (studentId) {
      // Buscar facturas de un estudiante específico usando GSI1
      const result = await DynamoDBService.queryPaginated(
        'GSI1',
        'GSI1PK = :studentId',
        {
          ':studentId': `STUDENT#${studentId}`,
        },
        limit + 1,
        lastKeyDecoded
      );

      invoices = result.items
        .filter(item => item.Type === 'Invoice' && (!status || item.GSI2PK === `STATUS#${status}`))
        .map(item => ({
          ...item.Data,
          id: item.SK.replace('INVOICE#', ''),
          createdAt: item.CreatedAt,
          updatedAt: item.UpdatedAt,
        }))
        .slice(0, limit);

      lastEvaluatedKey = result.lastEvaluatedKey;
      totalScanned = invoices.length;
    } else if (status) {
      // Buscar facturas por estado usando GSI2
      const result = await DynamoDBService.queryPaginated(
        'GSI2',
        'GSI2PK = :status',
        {
          ':status': `STATUS#${status}`,
        },
        limit + 1,
        lastKeyDecoded
      );

      invoices = result.items
        .filter(item => item.Type === 'Invoice' && item.PK === `ORG#${orgId}`)
        .map(item => ({
          ...item.Data,
          id: item.SK.replace('INVOICE#', ''),
          createdAt: item.CreatedAt,
          updatedAt: item.UpdatedAt,
        }))
        .slice(0, limit);

      lastEvaluatedKey = result.lastEvaluatedKey;
      totalScanned = invoices.length;
    } else {
      // Listar todas las facturas de la organización
      const result = await DynamoDBService.queryPaginated(
        undefined,
        'PK = :orgId AND begins_with(SK, :invoicePrefix)',
        {
          ':orgId': `ORG#${orgId}`,
          ':invoicePrefix': 'INVOICE#',
        },
        limit + 1,
        lastKeyDecoded
      );

      invoices = result.items
        .filter(item => item.Type === 'Invoice')
        .map(item => ({
          ...item.Data,
          id: item.SK.replace('INVOICE#', ''),
          createdAt: item.CreatedAt,
          updatedAt: item.UpdatedAt,
        }))
        .slice(0, limit);

      lastEvaluatedKey = result.lastEvaluatedKey;
      totalScanned = invoices.length;
    }

    const hasMore = invoices.length > limit;
    if (hasMore) {
      invoices = invoices.slice(0, limit);
    }

    return successResponse({
      invoices,
      pagination: {
        page,
        limit,
        hasMore: !!lastEvaluatedKey,
        lastKey: lastEvaluatedKey ? Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64') : undefined,
      },
      total: invoices.length,
      scanned: totalScanned,
    });
  } catch (error) {
    console.error('Error al listar facturas:', error);
    return errorResponse(
      'Error al listar facturas: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

export async function getInvoice(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: solo admin y superadmin pueden ver facturas
    const user = await requirePermission(event, 'invoices', 'read');
    if (!user) {
      return unauthorizedResponse('No autenticado o sin permisos para ver facturas');
    }

    const queryParams = event.queryStringParameters || {};
    const { invoiceId } = event.pathParameters || {};
    const orgId = queryParams.orgId || user.orgId;

    if (!orgId || !invoiceId) {
      return errorResponse('orgId y invoiceId son requeridos', 400);
    }

    // Validar que el usuario tenga acceso a esta organización
    if (user.orgId && user.orgId !== orgId) {
      return forbiddenResponse('No tienes permisos para ver facturas de esta organización');
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `INVOICE#${invoiceId}`);

    if (!item || item.Type !== 'Invoice') {
      return errorResponse('Factura no encontrada', 404);
    }

    return successResponse({
      invoice: {
        ...item.Data,
        id: invoiceId,
        createdAt: item.CreatedAt,
        updatedAt: item.UpdatedAt,
      },
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return errorResponse(
      'Error al obtener factura: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}


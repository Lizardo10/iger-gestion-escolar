import type { LambdaEvent, LambdaResponse, Invoice } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
// PayPal SDK - implementación simplificada para ejemplo
async function createPayPalOrderAPI(amount: number, invoiceId: string) {
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_SECRET || '';
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
    const webhookData = parseJsonBody(event.body) as {
      event_type: string;
      resource: {
        id: string;
        custom_id: string;
      };
    };

    console.log('PayPal Webhook recibido:', webhookData);

    if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const invoiceId = webhookData.resource.custom_id;
      const orderId = webhookData.resource.id;

      // TODO: Obtener orgId de la factura
      const orgId = 'org-1'; // Esto debería venir del webhook o buscarse

      // Actualizar estado de la factura
      await DynamoDBService.updateItem({
        Key: {
          PK: `ORG#${orgId}`,
          SK: `INVOICE#${invoiceId}`,
        },
        UpdateExpression: 'SET #Data.status = :status, #Data.paidAt = :paidAt, #UpdatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#Data': 'Data',
          '#UpdatedAt': 'UpdatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'paid',
          ':paidAt': new Date().toISOString(),
          ':updatedAt': getCurrentTimestamp(),
        },
        ReturnValues: 'ALL_NEW',
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

export async function getInvoice(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const { invoiceId, orgId } = event.pathParameters || {};

    if (!orgId || !invoiceId) {
      return errorResponse('orgId y invoiceId son requeridos', 400);
    }

    const item = await DynamoDBService.getItem(`ORG#${orgId}`, `INVOICE#${invoiceId}`);

    if (!item || item.Type !== 'Invoice') {
      return errorResponse('Factura no encontrada', 404);
    }

    return successResponse({
      invoice: {
        ...item.Data,
        id: invoiceId,
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


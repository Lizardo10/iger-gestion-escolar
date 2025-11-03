import type { LambdaEvent, LambdaResponse, Invoice } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse, forbiddenResponse } from '../lib/authorization';
import { createOrder, getOrder, captureOrder, validateWebhookSignature } from '../lib/paypal';

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

    // Crear orden en PayPal (Siempre en modo sandbox)
    const order = await createOrder({
      amount: invoiceData.amount,
      currency: 'USD',
      invoiceId: body.invoiceId,
      description: `Pago de factura #${body.invoiceId}`,
      returnUrl: `${process.env.FRONTEND_URL || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com'}/payments/success?invoiceId=${body.invoiceId}`,
      cancelUrl: `${process.env.FRONTEND_URL || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com'}/payments/cancel`,
    });

    // Buscar link de aprobación
    const approvalLink = order.links.find(link => link.rel === 'approve');
    const approvalUrl = approvalLink?.href;

    if (!approvalUrl) {
      return errorResponse('No se pudo obtener URL de aprobación', 500);
    }

    // Actualizar factura con orderId
    await DynamoDBService.updateItem({
      Key: {
        PK: `ORG#${body.orgId}`,
        SK: `INVOICE#${body.invoiceId}`,
      },
      UpdateExpression: 'SET #Data.paypalOrderId = :orderId, #Data.paymentUrl = :paymentUrl',
      ExpressionAttributeNames: {
        '#Data': 'Data',
      },
      ExpressionAttributeValues: {
        ':orderId': order.id,
        ':paymentUrl': approvalUrl,
      },
      ReturnValues: 'ALL_NEW',
    });

    return successResponse({
      orderId: order.id,
      approvalUrl,
      status: order.status,
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
    // Validar firma del webhook (en sandbox se acepta sin validación)
    const headers = event.headers || {};
    const body = event.body || '';
    
    // Validar firma (en sandbox retorna true siempre)
    const isValid = validateWebhookSignature(headers, body);
    if (!isValid) {
      return errorResponse('Firma de webhook inválida', 401);
    }

    const webhookData = parseJsonBody(body) as {
      event_type: string;
      resource: {
        id: string;
        status?: string;
        custom_id?: string;
        invoice_id?: string;
        purchase_units?: Array<{
          custom_id?: string;
          invoice_id?: string;
        }>;
      };
    };

    console.log('🔔 PayPal Webhook recibido:', JSON.stringify(webhookData, null, 2));

    // Manejar diferentes tipos de eventos
    if (webhookData.event_type === 'CHECKOUT.ORDER.APPROVED') {
      // Cuando el usuario aprueba el pago, capturarlo automáticamente
      const orderId = webhookData.resource.id;
      console.log(`💰 Orden ${orderId} aprobada, capturando pago...`);

      try {
        // Capturar el pago
        const capturedOrder = await captureOrder(orderId);
        console.log(`✅ Pago capturado exitosamente: ${capturedOrder.id}, status: ${capturedOrder.status}`);

        // Procesar como si fuera PAYMENT.CAPTURE.COMPLETED
        return await processPaymentCapture(orderId);
      } catch (error) {
        console.error('❌ Error capturando pago:', error);
        return errorResponse('Error capturando pago: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
      }
    } else if (webhookData.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Pago capturado exitosamente
      const orderId = webhookData.resource.id || webhookData.resource.purchase_units?.[0]?.custom_id;
      if (!orderId) {
        console.error('❌ No se pudo obtener orderId del webhook');
        return errorResponse('OrderId no encontrado en webhook', 400);
      }
      console.log(`✅ Pago completado para orden: ${orderId}`);
      return await processPaymentCapture(orderId);
    }

    console.log(`ℹ️ Evento de webhook no procesado: ${webhookData.event_type}`);
    return successResponse({ received: true, event: webhookData.event_type });
  } catch (error) {
    console.error('❌ Error procesando webhook PayPal:', error);
    return errorResponse(
      'Error procesando webhook: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

async function processPaymentCapture(orderId: string): Promise<LambdaResponse> {
  try {
    // Obtener detalles de la orden para obtener información adicional
    let orderDetails;
    try {
      orderDetails = await getOrder(orderId);
      console.log(`📋 Detalles de orden obtenidos:`, orderDetails);
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener detalles de la orden, continuando con búsqueda...');
    }

    // Buscar factura por orderId (lo guardamos en paypalOrderId)
    console.log(`🔍 Buscando factura con orderId: ${orderId}`);
    // Hacer scan de todas las facturas y filtrar en código (no ideal pero funcional)
    // TODO: Crear índice GSI para orderId -> invoiceId para mejor rendimiento
    const allInvoices = await DynamoDBService.scan('Type = :type', {
      ':type': 'Invoice',
    });
    
    // Filtrar por orderId en código
    const invoices = allInvoices.filter((item: any) => {
      if (item.Type !== 'Invoice' || !item.Data) return false;
      const invoiceData = item.Data as Invoice & { paypalOrderId?: string };
      return invoiceData.paypalOrderId === orderId;
    });

    if (invoices.length === 0) {
      console.warn(`⚠️ No se encontró factura con orderId: ${orderId}`);
      return successResponse({ 
        received: true,
        message: 'Webhook recibido pero factura no encontrada',
        orderId 
      });
    }

    const invoice = invoices[0];
    const invoiceData = invoice.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string };

    console.log(`📄 Factura encontrada: ${invoiceData.id}, EnrollmentId: ${invoiceData.enrollmentId}`);

    // Actualizar factura a pagada
    await DynamoDBService.updateItem({
      Key: {
        PK: invoice.PK,
        SK: invoice.SK,
      },
      UpdateExpression: 'SET #Data.#status = :paid, #Data.paypalOrderId = :orderId, UpdatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#Data': 'Data',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':paid': 'paid',
        ':orderId': orderId,
        ':updatedAt': getCurrentTimestamp(),
      },
      ReturnValues: 'ALL_NEW',
    });

    // Actualizar GSI2PK para reflejar el nuevo status
    await DynamoDBService.updateItem({
      Key: {
        PK: invoice.PK,
        SK: invoice.SK,
      },
      UpdateExpression: 'SET GSI2PK = :status',
      ExpressionAttributeValues: {
        ':status': 'STATUS#paid',
      },
    });

    console.log(`✅ Factura ${invoiceData.id} marcada como pagada`);

    // Si hay un enrollmentId, actualizar enrollment y activar estudiante
    if (invoiceData.enrollmentId) {
      const orgId = invoice.PK.replace('ORG#', '');
      
      // Actualizar enrollment a active
      try {
        const enrollment = await DynamoDBService.getItem(`ORG#${orgId}`, `ENROLLMENT#${invoiceData.enrollmentId}`);
        if (enrollment && enrollment.Type === 'Enrollment') {
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${orgId}`,
              SK: `ENROLLMENT#${invoiceData.enrollmentId}`,
            },
            UpdateExpression: 'SET #Data.#status = :active, UpdatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#Data': 'Data',
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':active': 'active',
              ':updatedAt': getCurrentTimestamp(),
            },
          });

          // Actualizar GSI2PK del enrollment
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${orgId}`,
              SK: `ENROLLMENT#${invoiceData.enrollmentId}`,
            },
            UpdateExpression: 'SET GSI2PK = :status',
            ExpressionAttributeValues: {
              ':status': 'STATUS#active',
            },
          });

          console.log(`✅ Enrollment ${invoiceData.enrollmentId} marcado como activo`);
        }
      } catch (error) {
        console.error('❌ Error actualizando enrollment:', error);
      }

      // Activar estudiante
      try {
        const studentId = invoiceData.studentId;
        const student = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${studentId}`);
        if (student && student.Type === 'Student') {
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${orgId}`,
              SK: `STUDENT#${studentId}`,
            },
            UpdateExpression: 'SET #Data.#status = :active, UpdatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#Data': 'Data',
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':active': 'active',
              ':updatedAt': getCurrentTimestamp(),
            },
          });

          // Actualizar GSI2PK del estudiante
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${orgId}`,
              SK: `STUDENT#${studentId}`,
            },
            UpdateExpression: 'SET GSI2PK = :status',
            ExpressionAttributeValues: {
              ':status': 'STATUS#active',
            },
          });

          console.log(`✅ Estudiante ${studentId} activado`);
        }
      } catch (error) {
        console.error('❌ Error activando estudiante:', error);
      }
    }

    // Enviar email con PDF después de pago exitoso
    try {
      const { sendInvoiceEmail } = await import('../lib/email');
      const { generateInvoicePDF } = await import('../lib/pdf-generator');
      
      // Obtener nombre del estudiante
      let studentName: string | undefined;
      try {
        const orgId = invoice.PK.replace('ORG#', '');
        const student = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${invoiceData.studentId}`);
        if (student && student.Type === 'Student' && student.Data) {
          const studentData = student.Data as { name?: string; firstName?: string; lastName?: string };
          studentName = studentData.name || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener información del estudiante:', error);
      }

      // Generar PDF
      const pdfBuffer = await generateInvoicePDF(invoiceData as Invoice, studentName);

      // Obtener email del estudiante o padre
      let emailToSend = '';
      try {
        const orgId = invoice.PK.replace('ORG#', '');
        const student = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${invoiceData.studentId}`);
        if (student && student.Type === 'Student' && student.Data) {
          const studentData = student.Data as { email?: string; studentEmail?: string };
          emailToSend = studentData.email || studentData.studentEmail || '';
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener email del estudiante:', error);
      }

      if (emailToSend) {
        console.log(`📧 Intentando enviar factura por email a ${emailToSend}...`);
        await sendInvoiceEmail(emailToSend, invoiceData as Invoice, pdfBuffer, studentName);
        console.log(`✅ Email con factura enviado a ${emailToSend}`);
      } else {
        console.warn('⚠️ No se pudo obtener email para enviar factura');
        console.warn('⚠️ Datos del estudiante:', { studentId: invoiceData.studentId, PK: invoice.PK });
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error('❌ Error enviando email con factura:', errorDetails);
      // No fallar el webhook si el email falla
      console.warn('⚠️ El pago se registró correctamente, pero el email no pudo enviarse');
    }

    return successResponse({ 
      received: true,
      invoiceId: invoiceData.id,
      enrollmentId: invoiceData.enrollmentId,
      orderId,
      status: 'updated',
      message: 'Pago procesado, factura actualizada, estudiante activado'
    });
  } catch (error) {
    console.error('❌ Error procesando captura de pago:', error);
    return errorResponse('Error procesando captura: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
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


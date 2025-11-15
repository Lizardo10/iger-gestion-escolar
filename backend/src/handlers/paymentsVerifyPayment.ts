import type { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission } from '../lib/authorization';
import { getOrder, captureOrder } from '../lib/paypal';
import type { Invoice } from '../types';
import { getCurrentTimestamp } from '../lib/utils';

/**
 * Verifica y procesa un pago después de que el usuario regresa de PayPal
 * Este endpoint se llama cuando el usuario regresa de PayPal a /payments/success
 * 
 * POST /payments/verify
 * Body: { orderId: string, token?: string, PayerID?: string }
 */
export async function verifyPayment(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar permisos: cualquier usuario autenticado puede verificar su pago
    const user = await requirePermission(event, 'payments', 'read');
    if (!user) {
      return errorResponse('No autenticado', 401);
    }

    const body = parseJsonBody(event.body) as {
      orderId?: string;
      token?: string;
      PayerID?: string;
      enrollmentId?: string;
      invoiceId?: string;
    };

    const { orderId, enrollmentId, invoiceId } = body;

    // Si no hay orderId, intentar obtenerlo del token o de la factura/enrollment
    let finalOrderId = orderId;

    if (!finalOrderId && invoiceId) {
      // Buscar la factura para obtener el orderId
      const orgId = user.orgId || 'default-org';
      const invoice = await DynamoDBService.getItem(`ORG#${orgId}`, `INVOICE#${invoiceId}`);
      if (invoice && invoice.Type === 'Invoice') {
        const invoiceData = invoice.Data as Invoice & { paypalOrderId?: string };
        finalOrderId = invoiceData.paypalOrderId;
      }
    }

    if (!finalOrderId && enrollmentId) {
      // Buscar el enrollment para obtener el orderId
      const orgId = user.orgId || 'default-org';
      try {
        const enrollment = await DynamoDBService.getItem(`ORG#${orgId}`, `ENROLLMENT#${enrollmentId}`);
        if (enrollment && enrollment.Type === 'Enrollment') {
          const enrollmentData = enrollment.Data as { paypalOrderId?: string };
          if (enrollmentData.paypalOrderId) {
            finalOrderId = enrollmentData.paypalOrderId;
            console.log(`✅ OrderId obtenido del enrollment: ${finalOrderId}`);
          } else {
            console.warn(`⚠️ Enrollment ${enrollmentId} no tiene paypalOrderId guardado`);
          }
        } else {
          console.warn(`⚠️ Enrollment ${enrollmentId} no encontrado`);
        }
      } catch (error) {
        console.error(`❌ Error obteniendo enrollment ${enrollmentId}:`, error);
        // Continuar sin orderId del enrollment
      }
    }

    if (!finalOrderId) {
      return errorResponse('orderId es requerido', 400);
    }

    console.log(`🔍 Verificando pago para orden: ${finalOrderId}`);

    // Obtener detalles de la orden en PayPal
    let orderDetails;
    try {
      orderDetails = await getOrder(finalOrderId);
      console.log(`📋 Estado de la orden: ${orderDetails.status}`);
    } catch (error) {
      console.error('❌ Error obteniendo detalles de la orden:', error);
      return errorResponse('No se pudo obtener información de la orden de PayPal', 500);
    }

    // Si la orden está aprobada pero no capturada, capturarla
    if (orderDetails.status === 'APPROVED') {
      console.log(`💰 Orden aprobada, capturando pago...`);
      try {
        const capturedOrder = await captureOrder(finalOrderId);
        console.log(`✅ Pago capturado exitosamente: ${capturedOrder.id}, status: ${capturedOrder.status}`);
        orderDetails = capturedOrder;
      } catch (error) {
        console.error('❌ Error capturando pago:', error);
        return errorResponse('Error al capturar el pago: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
      }
    }

    // Si el pago ya está completado o fue capturado, procesarlo
    if (orderDetails.status === 'COMPLETED' || orderDetails.status === 'CAPTURED') {
      console.log(`✅ Pago completado, procesando actualizaciones...`);
      
      // Obtener orgId para optimizar la búsqueda
      const orgId = user.orgId || 'default-org';
      
      // Procesar el pago con información adicional
      return await processPaymentCapture(finalOrderId, orgId, enrollmentId, invoiceId);
    } else {
      return successResponse({
        orderId: finalOrderId,
        status: orderDetails.status,
        message: 'El pago aún no está completado. Estado: ' + orderDetails.status,
        needsAction: orderDetails.status !== 'COMPLETED',
      });
    }
  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    return errorResponse(
      'Error verificando pago: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

async function processPaymentCapture(
  orderId: string,
  orgId?: string,
  enrollmentId?: string,
  invoiceId?: string
): Promise<LambdaResponse> {
  try {
    let invoice: any = null;
    let invoiceData: Invoice & { paypalOrderId?: string; enrollmentId?: string; studentId?: string } | null = null;

    // Estrategia 1: Si tenemos invoiceId, buscar directamente
    if (invoiceId && orgId) {
      console.log(`🔍 Buscando factura directamente por ID: ${invoiceId}`);
      try {
        invoice = await DynamoDBService.getItem(`ORG#${orgId}`, `INVOICE#${invoiceId}`);
        if (invoice && invoice.Type === 'Invoice') {
          invoiceData = invoice.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string; studentId?: string };
          // Verificar que el orderId coincida
          if (invoiceData.paypalOrderId === orderId) {
            console.log(`✅ Factura encontrada directamente por ID`);
          } else {
            console.warn(`⚠️ Factura encontrada pero orderId no coincide. Esperado: ${orderId}, Actual: ${invoiceData.paypalOrderId}`);
            invoice = null;
            invoiceData = null;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error buscando factura por ID:`, error);
      }
    }

    // Estrategia 2: Si tenemos enrollmentId, buscar factura por enrollmentId
    if (!invoice && enrollmentId && orgId) {
      console.log(`🔍 Buscando factura por enrollmentId: ${enrollmentId}`);
      try {
        // Buscar todas las facturas de este orgId que tengan este enrollmentId
        const invoices = await DynamoDBService.query(
          undefined,
          'PK = :orgId AND begins_with(SK, :prefix)',
          {
            ':orgId': `ORG#${orgId}`,
            ':prefix': 'INVOICE#',
          }
        );

        // Filtrar por enrollmentId y orderId
        const matchingInvoices = invoices.filter((item: any) => {
          if (item.Type !== 'Invoice' || !item.Data) return false;
          const data = item.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string };
          return data.enrollmentId === enrollmentId && data.paypalOrderId === orderId;
        });

        if (matchingInvoices.length > 0) {
          invoice = matchingInvoices[0];
          invoiceData = invoice.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string; studentId?: string };
          console.log(`✅ Factura encontrada por enrollmentId`);
        }
      } catch (error) {
        console.warn(`⚠️ Error buscando factura por enrollmentId:`, error);
      }
    }

    // Estrategia 3: Si no encontramos la factura, hacer scan limitado por orgId
    if (!invoice && orgId) {
      console.log(`🔍 Buscando factura con orderId en orgId: ${orgId} (scan limitado)`);
      try {
        // Buscar todas las facturas de este orgId
        const invoices = await DynamoDBService.query(
          undefined,
          'PK = :orgId AND begins_with(SK, :prefix)',
          {
            ':orgId': `ORG#${orgId}`,
            ':prefix': 'INVOICE#',
          }
        );

        // Filtrar por orderId en código
        const matchingInvoices = invoices.filter((item: any) => {
          if (item.Type !== 'Invoice' || !item.Data) return false;
          const data = item.Data as Invoice & { paypalOrderId?: string };
          return data.paypalOrderId === orderId;
        });

        if (matchingInvoices.length > 0) {
          invoice = matchingInvoices[0];
          invoiceData = invoice.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string; studentId?: string };
          console.log(`✅ Factura encontrada por orderId en orgId`);
        }
      } catch (error) {
        console.error(`❌ Error buscando factura por orgId:`, error);
      }
    }

    // Estrategia 4: Último recurso - scan completo (solo si no tenemos orgId)
    if (!invoice && !orgId) {
      console.log(`⚠️ Buscando factura con scan completo (último recurso)`);
      try {
        const allInvoices = await DynamoDBService.scan('Type = :type', {
          ':type': 'Invoice',
        });
        
        const matchingInvoices = allInvoices.filter((item: any) => {
          if (item.Type !== 'Invoice' || !item.Data) return false;
          const data = item.Data as Invoice & { paypalOrderId?: string };
          return data.paypalOrderId === orderId;
        });

        if (matchingInvoices.length > 0) {
          invoice = matchingInvoices[0];
          invoiceData = invoice.Data as Invoice & { paypalOrderId?: string; enrollmentId?: string; studentId?: string };
          console.log(`✅ Factura encontrada con scan completo`);
        }
      } catch (error) {
        console.error(`❌ Error en scan completo:`, error);
      }
    }

    if (!invoice || !invoiceData) {
      console.warn(`⚠️ No se encontró factura con orderId: ${orderId}, orgId: ${orgId}, enrollmentId: ${enrollmentId}, invoiceId: ${invoiceId}`);
      return errorResponse('No se encontró factura asociada a esta orden. Verifica que el pago haya sido creado correctamente.', 404);
    }

    // Validar que invoiceData tenga los campos necesarios
    if (!invoiceData.id || !invoiceData.studentId) {
      console.error(`❌ Factura encontrada pero falta información:`, { id: invoiceData.id, studentId: invoiceData.studentId });
      return errorResponse('La factura encontrada no tiene la información necesaria', 500);
    }

    // Verificar si ya está pagada
    if (invoiceData.status === 'paid') {
      console.log(`ℹ️ La factura ${invoiceData.id} ya está marcada como pagada`);
      return successResponse({
        invoiceId: invoiceData.id,
        enrollmentId: invoiceData.enrollmentId,
        orderId,
        status: 'already_processed',
        message: 'Este pago ya fue procesado anteriormente',
      });
    }

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
      // Obtener orgId del invoice o del parámetro pasado
      const orgIdFromInvoice = invoice.PK.replace('ORG#', '');
      const finalOrgId = orgId || orgIdFromInvoice;
      
      if (!finalOrgId) {
        console.error('❌ No se pudo determinar orgId para actualizar enrollment');
        return errorResponse('Error interno: no se pudo determinar la organización', 500);
      }
      
      // Actualizar enrollment a active
      try {
        const enrollment = await DynamoDBService.getItem(`ORG#${finalOrgId}`, `ENROLLMENT#${invoiceData.enrollmentId}`);
        if (enrollment && enrollment.Type === 'Enrollment') {
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${finalOrgId}`,
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
              PK: `ORG#${finalOrgId}`,
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
        const student = await DynamoDBService.getItem(`ORG#${finalOrgId}`, `STUDENT#${studentId}`);
        if (student && student.Type === 'Student') {
          await DynamoDBService.updateItem({
            Key: {
              PK: `ORG#${finalOrgId}`,
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
              PK: `ORG#${finalOrgId}`,
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
        const orgIdForEmail = orgId || invoice.PK.replace('ORG#', '');
        const student = await DynamoDBService.getItem(`ORG#${orgIdForEmail}`, `STUDENT#${invoiceData.studentId}`);
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
        const orgIdForEmail = orgId || invoice.PK.replace('ORG#', '');
        const student = await DynamoDBService.getItem(`ORG#${orgIdForEmail}`, `STUDENT#${invoiceData.studentId}`);
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
      }
    } catch (error) {
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error('❌ Error enviando email con factura:', errorDetails);
      // No fallar si el email falla
      console.warn('⚠️ El pago se registró correctamente, pero el email no pudo enviarse');
    }

    return successResponse({ 
      invoiceId: invoiceData.id,
      enrollmentId: invoiceData.enrollmentId,
      orderId,
      status: 'processed',
      message: 'Pago procesado exitosamente, factura actualizada, estudiante activado'
    });
  } catch (error) {
    console.error('❌ Error procesando captura de pago:', error);
    return errorResponse('Error procesando captura: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
  }
}


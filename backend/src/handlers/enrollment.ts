import type { LambdaEvent, LambdaResponse } from '../types';
import { successResponse, errorResponse, parseJsonBody, generateId, getCurrentTimestamp } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requireRole, unauthorizedResponse, forbiddenResponse } from '../lib/authorization';
import { createOrder } from '../lib/paypal';

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  grade: string;
  section?: string;
  enrolledBy: string;
  enrolledByRole: string;
  amount: number;
  status: 'pending' | 'active' | 'cancelled';
  paymentUrl?: string;
  paypalOrderId?: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inscribe un nuevo alumno
 * POST /enrollment
 * Roles permitidos: superadmin, admin, teacher
 */
export async function enrollStudent(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar rol: superadmin, admin, teacher
    const user = await requireRole(event, ['superadmin', 'admin', 'teacher']);
    if (!user) {
      return unauthorizedResponse('No autenticado o sin permisos para inscribir alumnos');
    }

    const body = parseJsonBody(event.body) as {
      studentName: string;
      studentEmail: string;
      grade: string;
      section?: string;
      amount: number;
      orgId?: string;
    };

    const { studentName, studentEmail, grade, section, amount, orgId: bodyOrgId } = body;

    if (!studentName || !studentEmail || !grade || !amount) {
      return errorResponse('Campos requeridos: studentName, studentEmail, grade, amount', 400);
    }

    // CRÍTICO: Si el usuario tiene orgId en Cognito, siempre usar ese (no el del body)
    // Esto evita problemas cuando el frontend tiene datos antiguos en localStorage
    const orgId = user.orgId || bodyOrgId || 'default-org';

    // Validar que el usuario tenga acceso a esta organización
    // Superadmin puede trabajar con cualquier orgId
    // Admin y Teacher solo pueden trabajar con su orgId (si lo tienen)
    if (user.role !== 'superadmin') {
      // Si el usuario tiene orgId asignado y se está intentando usar uno diferente, rechazar
      if (user.orgId && bodyOrgId && user.orgId !== bodyOrgId) {
        return forbiddenResponse('No tienes permisos para inscribir alumnos en esta organización');
      }
      // Si el usuario no tiene orgId, permitir usar el que se envía (o default-org)
      // Esto permite que admins sin orgId asignado puedan trabajar
    }

    const enrollmentId = generateId();
    const timestamp = getCurrentTimestamp();
    const studentId = generateId();

    // Crear registro de estudiante
    const studentData = {
      id: studentId,
      name: studentName,
      email: studentEmail,
      grade,
      section: section || '',
      status: 'pending', // Inactivo hasta que se pague
      orgId,
      enrollmentId,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `STUDENT#${studentId}`,
      GSI1PK: `GRADE#${grade}`,
      GSI1SK: `STUDENT#${studentId}`,
      GSI2PK: `STATUS#pending`,
      GSI2SK: `STUDENT#${studentId}`,
      Type: 'Student',
      Data: studentData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    // Crear registro de inscripción
    const enrollmentData: Enrollment = {
      id: enrollmentId,
      studentId,
      studentName,
      studentEmail,
      grade,
      section,
      enrolledBy: user.id,
      enrolledByRole: user.role,
      amount,
      status: 'pending',
      orgId,
      createdAt: new Date(timestamp * 1000).toISOString(),
      updatedAt: new Date(timestamp * 1000).toISOString(),
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `ENROLLMENT#${enrollmentId}`,
      GSI1PK: `STUDENT#${studentId}`,
      GSI1SK: `ENROLLMENT#${enrollmentId}`,
      GSI2PK: `STATUS#pending`,
      GSI2SK: `ENROLLMENT#${enrollmentId}`,
      Type: 'Enrollment',
      Data: enrollmentData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    // Crear factura automáticamente
    const invoiceId = generateId();
    const invoiceData = {
      id: invoiceId,
      studentId,
      amount,
      items: [
        {
          description: `Inscripción ${grade}${section ? ` - Sección ${section}` : ''}`,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      status: 'pending' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      orgId,
      enrollmentId,
    };

    await DynamoDBService.putItem({
      PK: `ORG#${orgId}`,
      SK: `INVOICE#${invoiceId}`,
      GSI1PK: `STUDENT#${studentId}`,
      GSI1SK: `INVOICE#${invoiceId}`,
      GSI2PK: `STATUS#pending`,
      GSI2SK: `DUEDATE#${invoiceData.dueDate}`,
      Type: 'Invoice',
      Data: invoiceData,
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
    });

    // Crear orden de PayPal para el pago
    try {
      const order = await createOrder({
        amount,
        currency: 'USD',
        invoiceId: invoiceId,
        description: `Inscripción ${grade}${section ? ` - Sección ${section}` : ''} - ${studentName}`,
        returnUrl: `${process.env.FRONTEND_URL || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com'}/payments/success?enrollmentId=${enrollmentId}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'https://dev.d2umdnu9x2m9qg.amplifyapp.com'}/payments/cancel?enrollmentId=${enrollmentId}`,
      });

      const approvalLink = order.links.find(link => link.rel === 'approve');
      const paymentUrl = approvalLink?.href;

      if (paymentUrl) {
        // Actualizar inscripción con paymentUrl
        await DynamoDBService.updateItem({
          Key: {
            PK: `ORG#${orgId}`,
            SK: `ENROLLMENT#${enrollmentId}`,
          },
          UpdateExpression: 'SET #Data.paymentUrl = :paymentUrl, #Data.paypalOrderId = :orderId',
          ExpressionAttributeNames: {
            '#Data': 'Data',
          },
          ExpressionAttributeValues: {
            ':paymentUrl': paymentUrl,
            ':orderId': order.id,
          },
        });

        // Actualizar factura con paymentUrl y orderId
        await DynamoDBService.updateItem({
          Key: {
            PK: `ORG#${orgId}`,
            SK: `INVOICE#${invoiceId}`,
          },
          UpdateExpression: 'SET #Data.paymentUrl = :paymentUrl, #Data.paypalOrderId = :orderId',
          ExpressionAttributeNames: {
            '#Data': 'Data',
          },
          ExpressionAttributeValues: {
            ':paymentUrl': paymentUrl,
            ':orderId': order.id,
          },
        });

        enrollmentData.paymentUrl = paymentUrl;
        enrollmentData.paypalOrderId = order.id;
      }
    } catch (error) {
      console.error('Error creando orden PayPal:', error);
      // No fallar la inscripción si PayPal falla, pero registrar el error
    }

    return successResponse({
      enrollment: enrollmentData,
      invoice: invoiceData,
      paymentUrl: enrollmentData.paymentUrl,
    }, 201);
  } catch (error) {
    console.error('Error al inscribir alumno:', error);
    return errorResponse(
      'Error al inscribir alumno: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}

/**
 * Lista inscripciones
 * GET /enrollment
 * Roles permitidos: superadmin, admin, teacher
 */
export async function listEnrollments(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const user = await requireRole(event, ['superadmin', 'admin', 'teacher']);
    if (!user) {
      return unauthorizedResponse('No autenticado o sin permisos');
    }

    const queryParams = event.queryStringParameters || {};
    const requestedOrgId = queryParams.orgId;
    
    // CRÍTICO: Si el usuario tiene orgId en Cognito, siempre usar ese (ignorar el solicitado)
    // Esto evita problemas cuando el frontend tiene datos antiguos en localStorage
    const orgId = user.orgId || requestedOrgId || 'default-org';

    // Validar que el usuario tenga acceso a esta organización
    // Superadmin puede ver cualquier orgId
    // Admin y Teacher solo pueden ver su orgId (si lo tienen)
    if (user.role !== 'superadmin') {
      // Si el usuario tiene orgId asignado, DEBE usar ese (ya lo asignamos arriba)
      // Si no tiene orgId, puede usar el solicitado o default-org
      // NO rechazar si el usuario tiene orgId - simplemente usar el del usuario
      // La validación solo aplica si el usuario NO tiene orgId y se está intentando acceder a uno no permitido
      if (!user.orgId && requestedOrgId && requestedOrgId !== 'default-org') {
        // Si el usuario no tiene orgId y se está solicitando uno específico diferente a default-org
        // Esto podría ser un intento de acceso no autorizado (futuro: validar lista de orgs permitidos)
        // Por ahora, permitir solo si es default-org o si el usuario tiene orgId
      }
    }

    const status = queryParams.status;

    let enrollments: Enrollment[] = [];

    if (status) {
      const items = await DynamoDBService.query(
        'GSI2',
        'GSI2PK = :status AND begins_with(GSI2SK, :prefix)',
        {
          ':status': `STATUS#${status}`,
          ':prefix': 'ENROLLMENT#',
        }
      );

      enrollments = items
        .filter(item => item.Type === 'Enrollment' && item.PK === `ORG#${orgId}`)
        .map(item => item.Data as Enrollment);
    } else {
      const items = await DynamoDBService.query(
        undefined,
        'PK = :orgId AND begins_with(SK, :prefix)',
        {
          ':orgId': `ORG#${orgId}`,
          ':prefix': 'ENROLLMENT#',
        }
      );

      enrollments = items
        .filter(item => item.Type === 'Enrollment')
        .map(item => item.Data as Enrollment);
    }

    return successResponse({ enrollments, total: enrollments.length });
  } catch (error) {
    console.error('Error al listar inscripciones:', error);
    return errorResponse(
      'Error al listar inscripciones: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}


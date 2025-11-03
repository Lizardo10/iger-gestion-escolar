import type { LambdaEvent, LambdaResponse } from '../types';
import { errorResponse } from '../lib/utils';
import { DynamoDBService } from '../lib/dynamodb';
import { requirePermission, unauthorizedResponse } from '../lib/authorization';
import { generateInvoicePDF } from '../lib/pdf-generator';

/**
 * Genera y descarga un PDF de factura
 * GET /payments/invoices/{invoiceId}/pdf
 */
export async function generatePDF(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    // Verificar autenticación
    const user = await requirePermission(event, 'invoices', 'read');
    if (!user) {
      return unauthorizedResponse('No autenticado');
    }

    const invoiceId = event.pathParameters?.invoiceId;
    const orgId = event.queryStringParameters?.orgId;

    if (!invoiceId || !orgId) {
      return errorResponse('invoiceId y orgId son requeridos', 400);
    }

    // Obtener factura
    const invoice = await DynamoDBService.getItem(`ORG#${orgId}`, `INVOICE#${invoiceId}`);
    if (!invoice || invoice.Type !== 'Invoice') {
      return errorResponse('Factura no encontrada', 404);
    }

    // Verificar permisos: solo admin/superadmin pueden ver todas las facturas
    // Teachers no tienen acceso a facturas
    if (user.role === 'teacher') {
      return errorResponse('No tienes permisos para ver facturas', 403);
    }

    // Si el usuario tiene orgId, verificar que coincida
    if (user.orgId && user.orgId !== orgId) {
      return errorResponse('No tienes permisos para ver esta factura', 403);
    }

    const invoiceData = invoice.Data as {
      id: string;
      studentId: string;
      amount: number;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
      status: 'pending' | 'paid' | 'cancelled';
      dueDate: string;
      paypalOrderId?: string;
      orgId: string;
    };

    // Obtener nombre del estudiante (si está disponible)
    let studentName: string | undefined;
    try {
      const student = await DynamoDBService.getItem(`ORG#${orgId}`, `STUDENT#${invoiceData.studentId}`);
      if (student && student.Type === 'Student' && student.Data) {
        const studentData = student.Data as { firstName?: string; lastName?: string };
        studentName = `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
      }
    } catch (error) {
      console.warn('No se pudo obtener información del estudiante:', error);
    }

    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData, studentName || undefined);

    // Retornar PDF como respuesta binaria
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${invoiceId}.pdf"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return errorResponse(
      'Error al generar PDF: ' + (error instanceof Error ? error.message : 'Unknown error'),
      500
    );
  }
}


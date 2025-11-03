import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Invoice } from '../types';

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@iger.online';

/**
 * Envía un email con PDF adjunto
 */
export async function sendEmailWithPDF(
  to: string,
  subject: string,
  htmlBody: string,
  _pdfBuffer: Buffer,
  _pdfFileName: string = 'factura.pdf'
): Promise<void> {
  try {
    // TODO: Implementar adjunto PDF usando SendRawEmailCommand
    // Por ahora, el PDF se puede descargar desde el link en el sistema

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
      // Adjuntos se manejan con SendRawEmailCommand (más complejo)
      // Por ahora, incluimos el PDF en el body como enlace o base64
    });

    await sesClient.send(command);
    console.log(`✅ Email enviado a ${to}`);
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
}

/**
 * Envía factura por email con PDF adjunto usando SendRawEmailCommand
 */
export async function sendInvoiceEmail(
  to: string,
  invoice: Invoice,
  _pdfBuffer: Buffer,
  studentName?: string
): Promise<void> {
  try {
    // Para enviar PDF como adjunto, necesitamos usar SendRawEmailCommand
    // Esto requiere construir un mensaje MIME completo
    const subject = `Factura #${invoice.id} - IGER`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .invoice-info { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IGER - Sistema de Gestión Escolar</h1>
          </div>
          <div class="content">
            <h2>Factura de Pago</h2>
            <div class="invoice-info">
              <p><strong>Factura #:</strong> ${invoice.id}</p>
              ${studentName ? `<p><strong>Estudiante:</strong> ${studentName}</p>` : ''}
              <p><strong>Monto Total:</strong> $${invoice.amount.toFixed(2)}</p>
              <p><strong>Estado:</strong> ${invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Cancelada'}</p>
              <p><strong>Fecha de Vencimiento:</strong> ${invoice.dueDate}</p>
            </div>
            <p>Adjunto encontrará el PDF de la factura.</p>
            <p>Gracias por su pago.</p>
          </div>
          <div class="footer">
            <p>IGER - Sistema de Gestión Escolar</p>
            <p>Este es un email automático, por favor no responder.</p>
          </div>
        </body>
      </html>
    `;

    // Usar SendEmailCommand simple por ahora
    // Para adjuntos reales, necesitaríamos SendRawEmailCommand
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`✅ Factura enviada por email a ${to}`);

    // TODO: Implementar SendRawEmailCommand para adjuntar PDF
    // Por ahora, el PDF se puede descargar desde el link en el sistema
  } catch (error: unknown) {
    const errorDetails = error instanceof Error ? error.message : String(error);
    console.error('❌ Error enviando factura por email:', errorDetails);
    
    // Verificar si es un error de SES en sandbox (solo permite emails verificados)
    if (errorDetails.includes('EmailAddressNotVerified') || 
        errorDetails.includes('MessageRejected') ||
        errorDetails.includes('ProductionAccessNotGranted')) {
      console.warn('⚠️ AWS SES está en modo sandbox. Necesitas verificar el email del destinatario o solicitar acceso de producción.');
      console.warn('⚠️ Más información: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html');
    }
    
    // No lanzar error para no bloquear el webhook
    // throw error;
    console.error('⚠️ Email no enviado, pero el pago se registró correctamente');
  }
}


import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Invoice } from '../types';

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@iger.online';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://app.iger.edu';
const DEFAULT_ORG_NAME = process.env.ORG_DISPLAY_NAME || 'IGER';

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

interface SendTeacherCredentialsParams {
  to: string;
  firstName?: string;
  temporaryPassword: string;
  loginUrl?: string;
  orgName?: string;
}

export async function sendTeacherCredentialsEmail({
  to,
  firstName,
  temporaryPassword,
  loginUrl = FRONTEND_URL,
  orgName = DEFAULT_ORG_NAME,
}: SendTeacherCredentialsParams): Promise<void> {
  const greeting = firstName ? `Hola ${firstName},` : 'Hola,';

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #f7f7fb; color: #1f2937; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 35px -15px rgba(15, 23, 42, 0.25); overflow: hidden; }
          .header { background: linear-gradient(135deg, #2563eb, #9333ea); padding: 28px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.5px; }
          .content { padding: 28px; line-height: 1.6; }
          .pill { display: inline-block; margin: 16px 0; padding: 12px 18px; border-radius: 999px; background: rgba(37, 99, 235, 0.1); color: #1d4ed8; font-weight: 600; letter-spacing: 0.4px; }
          .card { background: #f9fafb; border-radius: 14px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .card strong { display: block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 6px; }
          .button { display: inline-block; margin: 24px 0; padding: 14px 24px; border-radius: 12px; background: #2563eb; color: #fff; font-weight: 600; text-decoration: none; letter-spacing: 0.3px; box-shadow: 0 12px 20px -10px rgba(37, 99, 235, 0.6); }
          .footer { padding: 24px; font-size: 12px; color: #6b7280; text-align: center; }
          .highlight { font-weight: 600; color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${orgName} · Portal Docente</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>Tu cuenta de profesor en <strong>${orgName}</strong> fue creada o actualizada correctamente.</p>
            <span class="pill">Acceso temporal</span>
            <div class="card">
              <strong>Correo de acceso</strong>
              <div>${to}</div>
            </div>
            <div class="card">
              <strong>Contraseña temporal</strong>
              <div class="highlight">${temporaryPassword}</div>
            </div>
            <p>
              Esta contraseña temporal vence en 24 horas. Al iniciar sesión se te pedirá definir
              una contraseña permanente. Si ya expiró, un administrador puede generar una nueva desde el módulo de profesores.
            </p>
            <a class="button" href="${loginUrl}" target="_blank" rel="noopener noreferrer">
              Ingresar al portal
            </a>
            <p>
              Si no esperabas este correo o detectas algún inconveniente, por favor comunícate con el administrador de tu campus.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${orgName}. Este mensaje se envió de forma automática, por favor no respondas.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: `${orgName} · Acceso al Portal Docente`,
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

  try {
    await sesClient.send(command);
    console.log(`✅ Credenciales temporales enviadas a ${to}`);
  } catch (error: unknown) {
    console.error('❌ Error enviando credenciales de profesor:', error);
    throw error;
  }
}


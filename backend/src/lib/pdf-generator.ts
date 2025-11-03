import PDFDocument from 'pdfkit';
import { Invoice } from '../types';

/**
 * Genera un PDF de factura con el logo de Iger
 */
export async function generateInvoicePDF(invoice: Invoice, studentName?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header con logo y título
      doc
        .fontSize(28)
        .fillColor('#2563eb')
        .font('Helvetica-Bold')
        .text('IGER', 50, 50, { align: 'left' })
        .fontSize(10)
        .fillColor('#6b7280')
        .font('Helvetica')
        .text('Sistema de Gestión Escolar', 50, 82);
      
      // Nota: Para incluir el logo SVG real, necesitarías convertir SVG a imagen
      // o usar una librería como svg2pdf. Por ahora usamos texto estilizado.

      // Título
      doc
        .fontSize(20)
        .fillColor('#000000')
        .text('FACTURA', 50, 120, { align: 'right' })
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`#${invoice.id}`, 50, 145, { align: 'right' });

      // Información de la factura
      const startY = 170;
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Información de Facturación', 50, startY)
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Estudiante: ${studentName || invoice.studentId}`, 50, startY + 20)
        .text(`Fecha de Vencimiento: ${invoice.dueDate}`, 50, startY + 35)
        .text(`Estado: ${invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Cancelada'}`, 50, startY + 50);

      // Items de la factura
      const itemsY = startY + 80;
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Detalle de Items', 50, itemsY);

      // Encabezados de tabla
      const tableY = itemsY + 25;
      doc
        .fontSize(10)
        .fillColor('#374151')
        .text('Descripción', 50, tableY, { width: 250 })
        .text('Cantidad', 300, tableY)
        .text('Precio Unit.', 370, tableY)
        .text('Total', 450, tableY, { align: 'right' });

      // Línea separadora
      doc
        .moveTo(50, tableY + 15)
        .lineTo(550, tableY + 15)
        .stroke('#e5e7eb');

      // Items
      let currentY = tableY + 25;
      invoice.items.forEach((item, index) => {
        doc
          .fontSize(9)
          .fillColor('#6b7280')
          .text(item.description || 'Item sin descripción', 50, currentY, { width: 250 })
          .text(item.quantity.toString(), 300, currentY)
          .text(`$${item.unitPrice.toFixed(2)}`, 370, currentY)
          .fillColor('#000000')
          .text(`$${item.total.toFixed(2)}`, 450, currentY, { align: 'right' });

        currentY += 20;

        // Línea separadora entre items
        if (index < invoice.items.length - 1) {
          doc
            .moveTo(50, currentY - 5)
            .lineTo(550, currentY - 5)
            .stroke('#f3f4f6');
          currentY += 5;
        }
      });

      // Total
      const totalY = currentY + 20;
      doc
        .moveTo(50, totalY - 10)
        .lineTo(550, totalY - 10)
        .stroke('#d1d5db');

      doc
        .fontSize(14)
        .fillColor('#000000')
        .text('TOTAL:', 370, totalY)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`$${invoice.amount.toFixed(2)}`, 450, totalY, { align: 'right' });

      // Footer
      const footerY = 750;
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text('IGER - Sistema de Gestión Escolar', 50, footerY, { align: 'center', width: 500 })
        .text(`Factura generada el ${new Date().toLocaleDateString('es-ES')}`, 50, footerY + 15, { align: 'center', width: 500 });

      // PayPal info si está pagada
      if (invoice.status === 'paid' && invoice.paypalOrderId) {
        doc
          .fontSize(8)
          .fillColor('#10b981')
          .text(`Pagada vía PayPal - Orden: ${invoice.paypalOrderId}`, 50, footerY + 30, { align: 'center', width: 500 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}


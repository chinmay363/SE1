const PDFDocument = require('pdfkit');

/**
 * Generate a PDF receipt
 * @param {Object} receiptData - Receipt information
 * @returns {Buffer} - PDF buffer
 */
const generateReceipt = (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('PARKING RECEIPT', { align: 'center' });
      doc.moveDown();

      // Receipt Details
      doc.fontSize(12);
      doc.text(`Receipt Number: ${receiptData.receiptNumber}`);
      doc.text(`Date: ${new Date(receiptData.transactionDate).toLocaleString()}`);
      doc.moveDown();

      // Vehicle Information
      doc.fontSize(14).text('Vehicle Information', { underline: true });
      doc.fontSize(12);
      doc.text(`License Plate: ${receiptData.licensePlate}`);
      doc.moveDown();

      // Parking Information
      doc.fontSize(14).text('Parking Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Space Number: ${receiptData.spaceNumber}`);
      doc.text(`Entry Time: ${new Date(receiptData.entryTime).toLocaleString()}`);
      doc.text(`Exit Time: ${new Date(receiptData.exitTime).toLocaleString()}`);
      doc.text(`Duration: ${receiptData.durationMinutes} minutes (${Math.ceil(receiptData.durationMinutes / 60)} hours)`);
      doc.moveDown();

      // Payment Information
      doc.fontSize(14).text('Payment Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Amount: $${receiptData.amount}`);
      doc.text(`Payment Method: ${receiptData.paymentMethod}`);
      doc.text(`Status: ${receiptData.status}`);
      doc.moveDown();

      // Footer
      doc.fontSize(10).text('Thank you for using our parking service!', { align: 'center' });
      doc.text('Automated Parking Management System', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceipt
};

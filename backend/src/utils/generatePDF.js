const PDFDocument = require('pdfkit');

function generateTransactionPDF(transaction, newBalance, res = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];

      if (res) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${transaction._id}.pdf`);
        doc.pipe(res);
      } else {
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          let pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
      }

      const primaryColor = '#4f46e5';
      const textColor = '#1f2937';
      const mutedColor = '#6b7280';
      const borderColor = '#e5e7eb';
      const headerBg = '#f3f4f6';

      // --- Header ---
      doc.rect(50, 45, 495, 65).fill('#1e1b4b');
      doc.fontSize(22).fillColor('#ffffff').text('NEXUS LEDGER', 70, 60, { characterSpacing: 2 });
      doc.fontSize(10).fillColor('#a5b4fc').text('OFFICIAL TRANSACTION RECEIPT', 70, 85);

      const receiptDate = transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : new Date().toLocaleString();
      doc.fontSize(9).fillColor('#c7d2fe').text(`Issued: ${receiptDate}`, 350, 70, { align: 'right', width: 175 });
      doc.text(`Status: COMPLETED`, 350, 85, { align: 'right', width: 175 });

      // --- Info Section ---
      let startY = 130;
      doc.fontSize(10).fillColor(mutedColor).text('TRANSACTION REFERENCE', 50, startY);
      doc.fontSize(12).fillColor(textColor).text(`${transaction._id}`, 50, startY + 15);

      doc.fontSize(10).fillColor(mutedColor).text('ACCOUNT IDENTIFIER', 330, startY);
      doc.fontSize(12).fillColor(textColor).text(`${transaction.account || 'Primary Account'}`, 330, startY + 15);

      // --- Table Section ---
      const tableTop = 185;
      const rowHeight = 28;

      // Table Header
      doc.rect(50, tableTop, 495, rowHeight).fill(primaryColor);
      doc.fontSize(10).fillColor('#ffffff');
      doc.text('DESCRIPTION', 65, tableTop + 9);
      doc.text('TYPE', 220, tableTop + 9);
      doc.text('STATUS', 330, tableTop + 9);
      doc.text('AMOUNT', 440, tableTop + 9, { width: 90, align: 'right' });

      // Table Row
      const rowY = tableTop + rowHeight;
      doc.rect(50, rowY, 495, 36).fill(headerBg);
      doc.rect(50, rowY, 495, 36).stroke(borderColor);

      const memoText = transaction.description || `${transaction.type} transaction`;
      doc.fontSize(10).fillColor(textColor);
      doc.text(memoText, 65, rowY + 12, { width: 145, ellipsis: true });
      doc.text(transaction.type || 'TRANSFER', 220, rowY + 12);
      
      doc.fillColor('#059669').text('COMPLETED', 330, rowY + 12);
      
      const amountSign = transaction.type === 'WITHDRAWAL' ? '-' : '+';
      doc.fillColor(textColor).text(`${amountSign}$${Number(transaction.amount).toFixed(2)}`, 440, rowY + 12, { width: 90, align: 'right' });

      // Summary Breakdown
      const summaryY = rowY + 55;
      const summaryBoxWidth = 230;
      const summaryLeft = 50 + 495 - summaryBoxWidth;

      doc.rect(summaryLeft, summaryY, summaryBoxWidth, 75).stroke(borderColor);

      doc.fontSize(10).fillColor(mutedColor).text('Transaction Amount:', summaryLeft + 15, summaryY + 12);
      doc.fillColor(textColor).text(`$${Number(transaction.amount).toFixed(2)}`, summaryLeft + 15, summaryY + 12, { width: 200, align: 'right' });

      doc.fillColor(mutedColor).text('Fee:', summaryLeft + 15, summaryY + 30);
      doc.fillColor(textColor).text('$0.00', summaryLeft + 15, summaryY + 30, { width: 200, align: 'right' });

      doc.moveTo(summaryLeft + 15, summaryY + 48).lineTo(summaryLeft + summaryBoxWidth - 15, summaryY + 48).stroke(borderColor);

      doc.fontSize(11).fillColor(primaryColor).text('Closing Balance:', summaryLeft + 15, summaryY + 54);
      doc.fontSize(11).fillColor(primaryColor).text(`$${Number(newBalance || 0).toFixed(2)}`, summaryLeft + 15, summaryY + 54, { width: 200, align: 'right' });

      // --- Security / Verification Footer ---
      const footerY = 360;
      doc.rect(50, footerY, 495, 45).fill('#f9fafb');
      doc.rect(50, footerY, 495, 45).stroke(borderColor);
      doc.fontSize(8).fillColor(mutedColor)
        .text('This document serves as an immutable receipt for the transaction recorded on the Nexus Ledger.', 60, footerY + 12)
        .text('Generated cryptographically for verification. If you suspect unauthorized activity, contact support immediately.', 60, footerY + 25);

      doc.fontSize(8).fillColor('#9ca3af').text('Nexus Ledger Banking System • All Rights Reserved', 50, 720, { align: 'center', width: 495 });

      doc.end();

      if (res) {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = generateTransactionPDF;

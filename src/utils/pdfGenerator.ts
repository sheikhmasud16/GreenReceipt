import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Receipt, UserProfile, PaperSize } from '../types';

export function generateReceiptPDF(
  receipt: Receipt,
  profile: UserProfile,
  paperSize: PaperSize = 'a4'
): jsPDF {
  let doc: jsPDF;

  if (paperSize === 'a4') {
    doc = new jsPDF({ format: 'a4', unit: 'mm' });
  } else if (paperSize === 'a5') {
    doc = new jsPDF({ format: 'a5', unit: 'mm' });
  } else if (paperSize === 'thermal80') {
    // Dynamic height estimate for 80mm roll: header (~50mm) + items (~10mm each) + summary (~60mm)
    const height = Math.max(140, 90 + receipt.items.length * 10);
    doc = new jsPDF({
      unit: 'mm',
      format: [80, height],
    });
  } else {
    // 58mm thermal
    const height = Math.max(130, 85 + receipt.items.length * 9);
    doc = new jsPDF({
      unit: 'mm',
      format: [58, height],
    });
  }

  const isThermal = paperSize === 'thermal80' || paperSize === 'thermal58';
  const pageWidth = doc.internal.pageSize.getWidth();

  if (isThermal) {
    // Thermal receipt formatting
    let y = 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(paperSize === 'thermal58' ? 11 : 13);
    doc.text(profile.businessName || 'Smart Business', pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (profile.address) {
      doc.text(profile.address, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }
    if (profile.mobile) {
      doc.text(`Mobile: ${profile.mobile}`, pageWidth / 2, y, { align: 'center' });
      y += 4;
    }

    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, y, pageWidth - 4, y);
    doc.setLineDashPattern([], 0);
    y += 5;

    doc.setFontSize(8);
    doc.text(`Receipt: ${receipt.receiptNumber}`, 4, y);
    doc.text(`Date: ${receipt.date}`, pageWidth - 4, y, { align: 'right' });
    y += 4;
    doc.text(`Customer: ${receipt.customerName || 'Cash Customer'}`, 4, y);
    if (receipt.customerMobile) {
      doc.text(`Mobile: ${receipt.customerMobile}`, pageWidth - 4, y, { align: 'right' });
    }
    y += 5;

    // Items Table for Thermal
    const thermalRows = receipt.items.map((item) => [
      item.productName,
      `${item.quantity} ${item.unit}`,
      `${item.sellingPrice}`,
      `${item.lineTotal}`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 4, right: 4 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 131, 74], textColor: 255, fontStyle: 'bold' },
      head: [['Item', 'Qty', 'Rate', 'Total']],
      body: thermalRows,
      theme: 'plain',
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    y = finalY;

    doc.setFontSize(8);
    doc.text(`Subtotal:`, pageWidth - 32, y);
    doc.text(`BDT ${receipt.subtotal}`, pageWidth - 4, y, { align: 'right' });
    y += 4;

    if (receipt.overallDiscount > 0 || receipt.itemDiscount > 0) {
      const totalDisc = receipt.overallDiscount + receipt.itemDiscount;
      doc.text(`Discount:`, pageWidth - 32, y);
      doc.text(`- BDT ${totalDisc}`, pageWidth - 4, y, { align: 'right' });
      y += 4;
    }

    if (receipt.additionalCharges > 0) {
      doc.text(`Charges:`, pageWidth - 32, y);
      doc.text(`+ BDT ${receipt.additionalCharges}`, pageWidth - 4, y, { align: 'right' });
      y += 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, pageWidth - 32, y);
    doc.text(`BDT ${receipt.grandTotal}`, pageWidth - 4, y, { align: 'right' });
    y += 4;

    doc.text(`Paid:`, pageWidth - 32, y);
    doc.text(`BDT ${receipt.paidAmount}`, pageWidth - 4, y, { align: 'right' });
    y += 4;

    if (receipt.dueAmount > 0) {
      doc.setTextColor(180, 0, 0);
      doc.text(`Due:`, pageWidth - 32, y);
      doc.text(`BDT ${receipt.dueAmount}`, pageWidth - 4, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 4;
    }

    doc.setFont('helvetica', 'normal');
    y += 3;
    doc.text(`Method: ${receipt.paymentMethod.toUpperCase()} | Status: ${receipt.paymentStatus.toUpperCase()}`, pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(7);
    doc.text(profile.receiptFooter || 'Thank you for shopping with us!', pageWidth / 2, y, { align: 'center' });

    return doc;
  }

  // Standard A4 / A5 Layout
  const primaryColor: [number, number, number] = [22, 131, 74]; // #16834A
  const darkGreen: [number, number, number] = [16, 92, 53];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Business Name in White
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(profile.businessName || 'Smart Business Manager', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const headerInfo = [
    profile.address,
    profile.mobile ? `Tel: ${profile.mobile}` : '',
    profile.email ? `Email: ${profile.email}` : '',
  ].filter(Boolean).join(' | ');
  doc.text(headerInfo, 14, 21);

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SALES INVOICE', pageWidth - 14, 15, { align: 'right' });

  // Reset text color to dark
  doc.setTextColor(32, 43, 37);

  // Metadata Grid
  let currentY = 38;

  // Bill To (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(receipt.customerName || 'Walk-in Customer', 14, currentY + 5);
  if (receipt.customerMobile) {
    doc.text(`Mobile: ${receipt.customerMobile}`, 14, currentY + 10);
  }
  if (receipt.customerAddress) {
    doc.text(`Address: ${receipt.customerAddress}`, 14, currentY + 15);
  }

  // Invoice Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS:', pageWidth - 70, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No:`, pageWidth - 70, currentY + 5);
  doc.text(`${receipt.receiptNumber}`, pageWidth - 14, currentY + 5, { align: 'right' });
  doc.text(`Date & Time:`, pageWidth - 70, currentY + 10);
  doc.text(`${receipt.date} ${receipt.time || ''}`, pageWidth - 14, currentY + 10, { align: 'right' });
  doc.text(`Payment Method:`, pageWidth - 70, currentY + 15);
  doc.text(`${receipt.paymentMethod.toUpperCase()}`, pageWidth - 14, currentY + 15, { align: 'right' });
  doc.text(`Payment Status:`, pageWidth - 70, currentY + 20);
  doc.text(`${receipt.paymentStatus.toUpperCase()}`, pageWidth - 14, currentY + 20, { align: 'right' });

  currentY += 28;

  // Items Table
  const tableRows = receipt.items.map((item, index) => [
    (index + 1).toString(),
    item.productName,
    `${item.quantity} ${item.unit}`,
    `BDT ${item.sellingPrice.toFixed(2)}`,
    item.discount > 0 ? `BDT ${item.discount.toFixed(2)}` : '-',
    `BDT ${item.lineTotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Disc.', 'Total']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: darkGreen,
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [32, 43, 37],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
  });

  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  currentY = finalTableY;

  // Totals Box (Right aligned)
  const totalsLeft = pageWidth - 80;
  doc.setFontSize(9);
  doc.text('Subtotal:', totalsLeft, currentY);
  doc.text(`BDT ${receipt.subtotal.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 5;

  if (receipt.overallDiscount > 0 || receipt.itemDiscount > 0) {
    const totalDiscount = receipt.overallDiscount + receipt.itemDiscount;
    doc.text('Total Discount:', totalsLeft, currentY);
    doc.text(`- BDT ${totalDiscount.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 5;
  }

  if (receipt.additionalCharges > 0) {
    doc.text('Delivery / Charges:', totalsLeft, currentY);
    doc.text(`+ BDT ${receipt.additionalCharges.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 5;
  }

  // Grand Total Highlight
  doc.setFillColor(234, 247, 239); // Light green #EAF7EF
  doc.rect(totalsLeft - 4, currentY - 3, 70, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGreen);
  doc.text('Grand Total:', totalsLeft, currentY + 3);
  doc.text(`BDT ${receipt.grandTotal.toFixed(2)}`, pageWidth - 14, currentY + 3, { align: 'right' });
  currentY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(32, 43, 37);
  doc.text('Paid Amount:', totalsLeft, currentY);
  doc.text(`BDT ${receipt.paidAmount.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 5;

  if (receipt.dueAmount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 24);
    doc.text('Due Amount:', totalsLeft, currentY);
    doc.text(`BDT ${receipt.dueAmount.toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 8;
  } else {
    currentY += 5;
  }

  // Footer & Signatures
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 25;

  // Signatures
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.line(14, footerY, 65, footerY);
  doc.text("Customer's Signature", 14, footerY + 5);

  doc.line(pageWidth - 65, footerY, pageWidth - 14, footerY);
  doc.text('Authorized Signature', pageWidth - 14, footerY + 5, { align: 'right' });

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const footerNote = profile.receiptFooter || 'Thank you for your business! Please visit us again.';
  doc.text(footerNote, pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
}

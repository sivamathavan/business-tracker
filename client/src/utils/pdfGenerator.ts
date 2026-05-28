import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR, formatDateStr } from './formatters';

export interface ReceiptData {
  businessName: string;
  businessAddress: string;
  receiptNumber: string;
  date: string;
  studentName: string;
  studentId: string;
  courseOrStandard: string;
  paymentMode: string;
  amount: number;
  status: string;
}

export const generateFeeReceipt = (data: ReceiptData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175); // Indigo blue
  doc.text(data.businessName, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(data.businessAddress, 105, 28, { align: 'center' });
  
  // Divider
  doc.setDrawColor(200);
  doc.line(20, 35, 190, 35);
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text('FEE RECEIPT', 105, 45, { align: 'center' });
  
  // Receipt Info
  doc.setFontSize(11);
  doc.text(`Receipt No: ${data.receiptNumber}`, 20, 60);
  doc.text(`Date: ${formatDateStr(data.date)}`, 140, 60);
  
  // Student Info Box
  doc.setDrawColor(220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 68, 170, 35, 3, 3, 'FD');
  
  doc.setTextColor(50);
  doc.text(`Student Name: ${data.studentName}`, 25, 76);
  doc.text(`Student ID: ${data.studentId}`, 120, 76);
  doc.text(`Course/Standard: ${data.courseOrStandard}`, 25, 86);
  doc.text(`Payment Mode: ${data.paymentMode}`, 120, 86);
  
  // Payment Details Table
  autoTable(doc, {
    startY: 115,
    head: [['Description', 'Amount']],
    body: [
      ['Fee Installment', formatINR(data.amount)],
      [{ content: 'Total Paid', styles: { fontStyle: 'bold' } }, { content: formatINR(data.amount), styles: { fontStyle: 'bold' } }]
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 20, right: 20 },
  });
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('This is a computer-generated receipt and requires no signature.', 105, finalY + 30, { align: 'center' });
  
  // Save PDF
  doc.save(`${data.businessName.replace(/\s+/g, '_')}_Receipt_${data.receiptNumber}.pdf`);
};

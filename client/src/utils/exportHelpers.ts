import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Declare a type helper for jsPDF with autoTable
interface JSPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

/**
 * Exports JSON data to a CSV file and triggers a browser download
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports structured table columns and rows into a beautifully formatted PDF document
 */
export const exportToPDF = (
  title: string,
  headers: string[],
  rows: any[][],
  filename: string,
  accentColor: [number, number, number] = [108, 99, 255] // Default: Purple Tech accent
) => {
  const doc = new jsPDF() as JSPDFWithAutoTable;

  // Add Branding Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(22, 22, 31);
  doc.text('⚡ Rturox Command Center', 14, 18);

  // Add Document Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 110);
  doc.text(title, 14, 25);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 31);

  // Add horizontal line divider
  doc.setDrawColor(220, 220, 230);
  doc.line(14, 35, 196, 35);

  // Generate Table
  doc.autoTable({
    startY: 40,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 60],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    margin: { left: 14, right: 14 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 4,
    },
  });

  // Save the document
  doc.save(`${filename}.pdf`);
};

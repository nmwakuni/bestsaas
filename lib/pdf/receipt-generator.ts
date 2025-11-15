import jsPDF from "jspdf";
import { formatCurrency } from "@/lib/utils";

interface ReceiptData {
  school: {
    name: string;
    phone: string;
    email: string;
    address: string;
    logo?: string;
  };
  payment: {
    receiptNumber: string;
    date: Date;
    amount: number;
    paymentMethod: string;
    mpesaReceiptNumber?: string;
  };
  student: {
    firstName: string;
    middleName?: string;
    lastName: string;
    admissionNumber: string;
    class: string;
  };
  feeRecord?: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
  };
  parent?: {
    firstName: string;
    lastName: string;
  };
}

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF();

  // School Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.school.name, 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.school.address, 105, 28, { align: "center" });
  doc.text(
    `Tel: ${data.school.phone} | Email: ${data.school.email}`,
    105,
    34,
    { align: "center" }
  );

  // Receipt Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FEE PAYMENT RECEIPT", 105, 50, { align: "center" });

  // Receipt Number and Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt No: ${data.payment.receiptNumber}`, 20, 65);
  doc.text(
    `Date: ${new Date(data.payment.date).toLocaleDateString()}`,
    150,
    65
  );

  // Line
  doc.setLineWidth(0.5);
  doc.line(20, 70, 190, 70);

  // Student Details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 20, 80);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 90;

  doc.text("Name:", 20, y);
  doc.text(
    `${data.student.firstName} ${data.student.middleName || ""} ${
      data.student.lastName
    }`,
    60,
    y
  );

  y += 8;
  doc.text("Admission No:", 20, y);
  doc.text(data.student.admissionNumber, 60, y);

  y += 8;
  doc.text("Class:", 20, y);
  doc.text(data.student.class, 60, y);

  if (data.parent) {
    y += 8;
    doc.text("Parent/Guardian:", 20, y);
    doc.text(`${data.parent.firstName} ${data.parent.lastName}`, 60, y);
  }

  // Payment Details
  y += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text("Amount Paid:", 20, y);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(data.payment.amount), 60, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Payment Method:", 20, y);
  doc.text(data.payment.paymentMethod, 60, y);

  if (data.payment.mpesaReceiptNumber) {
    y += 8;
    doc.text("M-Pesa Receipt:", 20, y);
    doc.text(data.payment.mpesaReceiptNumber, 60, y);
  }

  // Fee Balance (if available)
  if (data.feeRecord) {
    y += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Fee Summary", 20, y);

    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text("Total Fee:", 20, y);
    doc.text(formatCurrency(data.feeRecord.totalAmount), 150, y);

    y += 8;
    doc.text("Total Paid:", 20, y);
    doc.text(formatCurrency(data.feeRecord.paidAmount), 150, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Balance:", 20, y);
    doc.text(formatCurrency(data.feeRecord.balance), 150, y);
  }

  // Footer
  y = 250;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Thank you for your payment. This is a computer-generated receipt.",
    105,
    y,
    { align: "center" }
  );

  y += 6;
  doc.text(
    "For any queries, please contact the school administration.",
    105,
    y,
    { align: "center" }
  );

  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(200, 200, 200);
  doc.text("PAID", 105, 150, { align: "center", angle: 45 });

  return doc;
}

export function downloadReceipt(data: ReceiptData, filename?: string): void {
  const doc = generateReceipt(data);
  const name =
    filename ||
    `Receipt_${data.payment.receiptNumber}_${data.student.admissionNumber}.pdf`;
  doc.save(name);
}

export function getReceiptBlob(data: ReceiptData): Blob {
  const doc = generateReceipt(data);
  return doc.output("blob");
}

export function getReceiptBase64(data: ReceiptData): string {
  const doc = generateReceipt(data);
  return doc.output("dataurlstring");
}

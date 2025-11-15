import jsPDF from "jspdf";
import { formatCurrency } from "@/lib/utils";

interface Payment {
  date: Date;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
}

interface StatementData {
  school: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  student: {
    firstName: string;
    middleName?: string;
    lastName: string;
    admissionNumber: string;
    class: string;
  };
  parent: {
    firstName: string;
    lastName: string;
  };
  period: {
    from: Date;
    to: Date;
  };
  feeRecord: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
  };
  payments: Payment[];
}

export function generateStatement(data: StatementData): jsPDF {
  const doc = new jsPDF();

  // School Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.school.name, 105, 15, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.school.address, 105, 22, { align: "center" });
  doc.text(
    `Tel: ${data.school.phone} | Email: ${data.school.email}`,
    105,
    27,
    { align: "center" }
  );

  // Statement Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FEE STATEMENT OF ACCOUNT", 105, 38, { align: "center" });

  // Period
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${new Date(data.period.from).toLocaleDateString()} - ${new Date(
      data.period.to
    ).toLocaleDateString()}`,
    105,
    44,
    { align: "center" }
  );

  // Line
  doc.setLineWidth(0.5);
  doc.line(15, 48, 195, 48);

  // Student Details
  let y = 55;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Student:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.student.firstName} ${data.student.middleName || ""} ${
      data.student.lastName
    }`,
    60,
    y
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Admission No:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.student.admissionNumber, 60, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Class:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.student.class, 60, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Parent/Guardian:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.parent.firstName} ${data.parent.lastName}`, 60, y);

  // Summary
  y += 12;
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);

  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT SUMMARY", 15, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Total Fee:", 15, y);
  doc.text(formatCurrency(data.feeRecord.totalAmount), 150, y, {
    align: "right",
  });

  y += 6;
  doc.text("Total Paid:", 15, y);
  doc.setTextColor(0, 128, 0);
  doc.text(formatCurrency(data.feeRecord.paidAmount), 150, y, {
    align: "right",
  });

  y += 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Balance Due:", 15, y);
  doc.setTextColor(data.feeRecord.balance > 0 ? 200 : 0, 0, 0);
  doc.text(formatCurrency(data.feeRecord.balance), 150, y, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // Payment History
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PAYMENT HISTORY", 15, y);

  y += 8;
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);

  // Table Headers
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date", 15, y);
  doc.text("Receipt No.", 50, y);
  doc.text("Method", 100, y);
  doc.text("Amount", 150, y, { align: "right" });

  y += 4;
  doc.line(15, y, 195, y);

  // Payment Rows
  y += 6;
  doc.setFont("helvetica", "normal");

  if (data.payments.length === 0) {
    doc.text("No payments recorded", 15, y);
  } else {
    data.payments.forEach((payment) => {
      if (y > 260) {
        // New page if needed
        doc.addPage();
        y = 20;
      }

      doc.text(new Date(payment.date).toLocaleDateString(), 15, y);
      doc.text(payment.receiptNumber, 50, y);
      doc.text(payment.paymentMethod, 100, y);
      doc.text(formatCurrency(payment.amount), 150, y, { align: "right" });

      y += 6;
    });
  }

  // Footer
  const footerY = 275;
  doc.setLineWidth(0.5);
  doc.line(15, footerY, 195, footerY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated statement. For queries, contact school administration.",
    105,
    footerY + 5,
    { align: "center" }
  );

  doc.text(
    `Generated on: ${new Date().toLocaleDateString()}`,
    105,
    footerY + 10,
    { align: "center" }
  );

  return doc;
}

export function downloadStatement(data: StatementData, filename?: string): void {
  const doc = generateStatement(data);
  const name =
    filename ||
    `Statement_${data.student.admissionNumber}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
  doc.save(name);
}

export function getStatementBlob(data: StatementData): Blob {
  const doc = generateStatement(data);
  return doc.output("blob");
}

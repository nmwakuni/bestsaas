import { Hono } from "hono";
import { db } from "@/lib/db";

const app = new Hono();

// Generate receipt PDF
app.get("/receipt/:paymentId", async (c) => {
  try {
    const paymentId = c.req.param("paymentId");

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            class: true,
            parents: true,
          },
        },
        school: true,
        feeRecord: true,
      },
    });

    if (!payment) {
      return c.json({ error: "Payment not found" }, 404);
    }

    // Import dynamically to avoid issues
    const { generateReceipt } = await import("@/lib/pdf/receipt-generator");

    const receiptData = {
      school: {
        name: payment.school.name,
        phone: payment.school.phone,
        email: payment.school.email,
        address: payment.school.address,
      },
      payment: {
        receiptNumber: payment.receiptNumber,
        date: payment.createdAt,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        mpesaReceiptNumber: payment.mpesaReceiptNumber || undefined,
      },
      student: {
        firstName: payment.student.firstName,
        middleName: payment.student.middleName || undefined,
        lastName: payment.student.lastName,
        admissionNumber: payment.student.admissionNumber,
        class: payment.student.class?.name || "Not assigned",
      },
      parent: payment.student.parents[0]
        ? {
            firstName: payment.student.parents[0].firstName,
            lastName: payment.student.parents[0].lastName,
          }
        : undefined,
      feeRecord: payment.feeRecord
        ? {
            totalAmount: Number(payment.feeRecord.totalAmount),
            paidAmount: Number(payment.feeRecord.paidAmount),
            balance: Number(payment.feeRecord.balance),
          }
        : undefined,
    };

    const pdf = generateReceipt(receiptData);
    const pdfBuffer = pdf.output("arraybuffer");

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Receipt_${payment.receiptNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate statement PDF
app.get("/statement/:studentId", async (c) => {
  try {
    const studentId = c.req.param("studentId");
    const from = c.req.query("from");
    const to = c.req.query("to");

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        parents: true,
        school: true,
        feeRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          where: {
            status: "COMPLETED",
            ...(from &&
              to && {
                createdAt: {
                  gte: new Date(from),
                  lte: new Date(to),
                },
              }),
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return c.json({ error: "Student not found" }, 404);
    }

    const { generateStatement } = await import("@/lib/pdf/statement-generator");

    const statementData = {
      school: {
        name: student.school.name,
        phone: student.school.phone,
        email: student.school.email,
        address: student.school.address,
      },
      student: {
        firstName: student.firstName,
        middleName: student.middleName || undefined,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        class: student.class?.name || "Not assigned",
      },
      parent: student.parents[0]
        ? {
            firstName: student.parents[0].firstName,
            lastName: student.parents[0].lastName,
          }
        : {
            firstName: "Unknown",
            lastName: "Parent",
          },
      period: {
        from: from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1),
        to: to ? new Date(to) : new Date(),
      },
      feeRecord: student.feeRecords[0]
        ? {
            totalAmount: Number(student.feeRecords[0].totalAmount),
            paidAmount: Number(student.feeRecords[0].paidAmount),
            balance: Number(student.feeRecords[0].balance),
          }
        : {
            totalAmount: 0,
            paidAmount: 0,
            balance: 0,
          },
      payments: student.payments.map((p: any) => ({
        date: p.createdAt,
        receiptNumber: p.receiptNumber,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
      })),
    };

    const pdf = generateStatement(statementData);
    const pdfBuffer = pdf.output("arraybuffer");

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Statement_${student.admissionNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating statement:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;

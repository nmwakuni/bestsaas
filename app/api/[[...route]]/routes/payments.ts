import { Hono } from "hono";
import { db } from "@/lib/db";
import { generateReceiptNumber } from "@/lib/utils";

const app = new Hono();

// Record manual payment (cash/bank)
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, feeRecordId, amount, paymentMethod, paidBy, notes, schoolId } = body;

    // Start transaction
    const payment = await db.$transaction(async (tx: any) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          schoolId,
          studentId,
          feeRecordId,
          amount,
          paymentMethod,
          paidBy,
          notes,
          receiptNumber: generateReceiptNumber(),
          status: "COMPLETED",
        },
      });

      // Update fee record
      if (feeRecordId) {
        const feeRecord = await tx.feeRecord.findUnique({
          where: { id: feeRecordId },
        });

        if (feeRecord) {
          const newPaidAmount = Number(feeRecord.paidAmount) + Number(amount);
          const newBalance = Number(feeRecord.totalAmount) - newPaidAmount;

          await tx.feeRecord.update({
            where: { id: feeRecordId },
            data: {
              paidAmount: newPaidAmount,
              balance: newBalance,
              status: newBalance <= 0 ? "PAID" : "PARTIAL",
            },
          });
        }
      }

      return payment;
    });

    return c.json(payment, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get payments
app.get("/", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");
    const studentId = c.req.query("studentId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    const payments = await db.payment.findMany({
      where: {
        schoolId,
        ...(studentId && { studentId }),
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        feeRecord: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(payments);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get payment statistics
app.get("/stats", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const [totalCollected, todayCollected, weekCollected, monthCollected] = await Promise.all([
      // Total collected
      db.payment.aggregate({
        where: { schoolId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      // Today
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
      }),
      // This week
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        _sum: { amount: true },
      }),
      // This month
      db.payment.aggregate({
        where: {
          schoolId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return c.json({
      totalCollected: totalCollected._sum.amount || 0,
      todayCollected: todayCollected._sum.amount || 0,
      weekCollected: weekCollected._sum.amount || 0,
      monthCollected: monthCollected._sum.amount || 0,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

import { Hono } from "hono";
import { db } from "@/lib/db";
import { getDarajaAPI } from "@/lib/mpesa/daraja";
import { parseSTKCallback, getMpesaResultMessage } from "@/lib/mpesa/types";
import { formatPhoneNumber, generateReceiptNumber } from "@/lib/utils";
import { getAfricasTalkingService } from "@/lib/messaging/africas-talking";
import type { STKCallback } from "@/lib/mpesa/types";

const app = new Hono();

// Initiate STK Push
app.post("/stk-push", async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, amount, phoneNumber } = body;

    // Get student details
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
      },
    });

    if (!student) {
      return c.json({ error: "Student not found" }, 404);
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Initiate STK Push
    const daraja = getDarajaAPI();
    const response = await daraja.stkPush({
      phoneNumber: formattedPhone,
      amount: Number(amount),
      accountReference: student.admissionNumber,
      transactionDesc: `School fees - ${student.firstName} ${student.lastName}`,
    });

    // Create pending payment record
    await db.payment.create({
      data: {
        schoolId: student.schoolId,
        studentId: student.id,
        amount: Number(amount),
        paymentMethod: "MPESA",
        mpesaPhone: formattedPhone,
        mpesaRequestId: response.CheckoutRequestID,
        receiptNumber: generateReceiptNumber(),
        status: "PENDING",
      },
    });

    return c.json({
      success: true,
      message: response.CustomerMessage,
      checkoutRequestId: response.CheckoutRequestID,
    });
  } catch (error: any) {
    console.error("STK Push error:", error);
    return c.json(
      {
        error: error.message || "Failed to initiate payment",
      },
      500
    );
  }
});

// M-Pesa callback (STK Push result)
app.post("/callback", async (c) => {
  try {
    const body: STKCallback = await c.req.json();

    console.log("M-Pesa Callback received:", JSON.stringify(body, null, 2));

    const parsed = parseSTKCallback(body);

    // Find pending payment
    const payment = await db.payment.findFirst({
      where: {
        mpesaRequestId: parsed.checkoutRequestId,
        status: "PENDING",
      },
      include: {
        student: true,
        feeRecord: true,
      },
    });

    if (!payment) {
      console.error("Payment not found for checkout request:", parsed.checkoutRequestId);
      return c.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (parsed.resultCode === 0) {
      // Payment successful
      await db.$transaction(async (tx: any) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            mpesaReceiptNumber: parsed.mpesaReceiptNumber,
            mpesaTransactionDate: parsed.transactionDate
              ? new Date(
                  // Parse YYYYMMDDHHMMSS format
                  parsed.transactionDate.replace(
                    /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                    "$1-$2-$3T$4:$5:$6"
                  )
                )
              : new Date(),
          },
        });

        // Update fee record if linked
        if (payment.feeRecordId) {
          const feeRecord = await tx.feeRecord.findUnique({
            where: { id: payment.feeRecordId },
          });

          if (feeRecord) {
            const newPaidAmount = Number(feeRecord.paidAmount) + Number(payment.amount);
            const newBalance = Number(feeRecord.totalAmount) - newPaidAmount;

            await tx.feeRecord.update({
              where: { id: payment.feeRecordId },
              data: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newBalance <= 0 ? "PAID" : "PARTIAL",
              },
            });
          }
        }
      });

      // Send SMS receipt to parent
      try {
        const student = await db.student.findUnique({
          where: { id: payment.studentId },
          include: {
            parents: true,
            feeRecords: {
              where: { id: payment.feeRecordId || undefined },
            },
          },
        });

        if (student && student.parents.length > 0) {
          const parent = student.parents[0];
          const feeRecord = student.feeRecords[0];
          const at = getAfricasTalkingService();

          await at.sendPaymentConfirmation(
            parent.phone,
            `${student.firstName} ${student.lastName}`,
            Number(payment.amount),
            payment.receiptNumber,
            Number(feeRecord?.balance || 0)
          );

          console.log("Payment SMS sent to:", parent.phone);
        }
      } catch (smsError: any) {
        console.error("Failed to send payment SMS:", smsError.message);
        // Don't fail the whole callback if SMS fails
      }

      console.log("Payment successful:", parsed.mpesaReceiptNumber);
    } else {
      // Payment failed
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });

      console.log("Payment failed:", getMpesaResultMessage(parsed.resultCode));
    }

    return c.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error: any) {
    console.error("Callback error:", error);
    return c.json(
      {
        ResultCode: 1,
        ResultDesc: "Failed",
      },
      500
    );
  }
});

// C2B Validation (when parent pays via Paybill)
app.post("/c2b/validation", async (c) => {
  try {
    const body = await c.req.json();
    console.log("C2B Validation:", body);

    // Always accept for now
    // You can add validation logic here
    return c.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error: any) {
    return c.json(
      {
        ResultCode: 1,
        ResultDesc: "Rejected",
      },
      500
    );
  }
});

// C2B Confirmation (payment confirmed)
app.post("/c2b/confirmation", async (c) => {
  try {
    const body = await c.req.json();
    console.log("C2B Confirmation:", body);

    const { TransID, TransAmount, BillRefNumber, MSISDN, TransTime, FirstName } = body;

    // BillRefNumber should be the student admission number
    const student = await db.student.findFirst({
      where: {
        admissionNumber: BillRefNumber,
      },
      include: {
        school: true,
      },
    });

    if (!student) {
      console.error("Student not found for admission number:", BillRefNumber);
      return c.json({
        ResultCode: 0,
        ResultDesc: "Accepted",
      });
    }

    // Create payment record
    await db.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          schoolId: student.schoolId,
          studentId: student.id,
          amount: Number(TransAmount),
          paymentMethod: "MPESA",
          mpesaReceiptNumber: TransID,
          mpesaPhone: MSISDN,
          mpesaTransactionDate: new Date(TransTime),
          paidBy: FirstName || "Unknown",
          receiptNumber: generateReceiptNumber(),
          status: "COMPLETED",
        },
      });

      // Find and update latest pending fee record
      const feeRecord = await tx.feeRecord.findFirst({
        where: {
          studentId: student.id,
          balance: {
            gt: 0,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (feeRecord) {
        const newPaidAmount = Number(feeRecord.paidAmount) + Number(TransAmount);
        const newBalance = Number(feeRecord.totalAmount) - newPaidAmount;

        await tx.feeRecord.update({
          where: { id: feeRecord.id },
          data: {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newBalance <= 0 ? "PAID" : "PARTIAL",
          },
        });

        // Link payment to fee record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            feeRecordId: feeRecord.id,
          },
        });
      }
    });

    // TODO: Send SMS receipt to parent

    return c.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error: any) {
    console.error("C2B Confirmation error:", error);
    return c.json(
      {
        ResultCode: 0,
        ResultDesc: "Accepted",
      },
      500
    );
  }
});

// Query STK Push status
app.get("/stk-status/:checkoutRequestId", async (c) => {
  try {
    const checkoutRequestId = c.req.param("checkoutRequestId");

    const daraja = getDarajaAPI();
    const result = await daraja.stkPushQuery(checkoutRequestId);

    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

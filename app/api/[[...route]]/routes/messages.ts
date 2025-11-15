import { Hono } from "hono";
import { db } from "@/lib/db";
import { getAfricasTalkingService } from "@/lib/messaging/africas-talking";

const app = new Hono();

// Send bulk SMS/WhatsApp
app.post("/send", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, recipients, message, channel, sentBy } = body;

    const at = getAfricasTalkingService();
    const phoneNumbers = recipients.map((r: any) => r.phone);

    // Send via Africa's Talking
    let response;
    if (channel === "SMS") {
      response = await at.sendBulkSMS(phoneNumbers, message);
    } else if (channel === "WHATSAPP") {
      response = await at.sendWhatsApp({
        to: phoneNumbers,
        message,
      });
    }

    // Create message records in database
    const messages = await Promise.all(
      recipients.map((recipient: any, index: number) => {
        const atRecipient = response?.SMSMessageData?.Recipients?.[index];

        return db.message.create({
          data: {
            schoolId,
            recipient: recipient.phone,
            recipientType: recipient.type,
            recipientId: recipient.id,
            message,
            channel,
            status: atRecipient?.statusCode === 101 ? "SENT" : "FAILED",
            externalId: atRecipient?.messageId,
            errorMessage: atRecipient?.status,
            sentBy,
          },
        });
      })
    );

    return c.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    console.error("Error sending messages:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Send fee reminder to defaulters
app.post("/fee-reminders", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, sentBy } = body;

    // Get all fee defaulters
    const defaulters = await db.feeRecord.findMany({
      where: {
        student: {
          schoolId,
          status: "ACTIVE",
        },
        balance: {
          gt: 0,
        },
      },
      include: {
        student: {
          include: {
            parents: true,
          },
        },
      },
    });

    const at = getAfricasTalkingService();
    const messages = [];
    const phoneNumbers: string[] = [];
    const messageMap = new Map<string, any>();

    // Collect all recipients
    for (const record of defaulters) {
      const student = record.student;
      const parent = student.parents[0];

      if (!parent) continue;

      phoneNumbers.push(parent.phone);
      messageMap.set(parent.phone, {
        student,
        parent,
        record,
      });
    }

    // Send SMS via Africa's Talking in bulk
    if (phoneNumbers.length > 0) {
      try {
        for (const [phone, data] of messageMap.entries()) {
          const { student, parent, record } = data;

          // Send individual SMS for personalized messages
          const response = await at.sendFeeReminder(
            parent.phone,
            `${student.firstName} ${student.lastName}`,
            student.admissionNumber,
            Number(record.balance)
          );

          const atRecipient = response?.SMSMessageData?.Recipients?.[0];

          // Create message record
          const message = await db.message.create({
            data: {
              schoolId,
              recipient: parent.phone,
              recipientType: "PARENT",
              recipientId: parent.id,
              message: `Dear Parent, ${student.firstName} ${student.lastName} (${student.admissionNumber}) has a pending fee balance of KES ${record.balance}. Please clear to avoid inconvenience. Thank you.`,
              channel: "SMS",
              status: atRecipient?.statusCode === 101 ? "SENT" : "FAILED",
              externalId: atRecipient?.messageId,
              errorMessage: atRecipient?.status,
              sentBy,
            },
          });

          messages.push(message);
        }
      } catch (error: any) {
        console.error("Error sending fee reminders:", error);
      }
    }

    return c.json({
      success: true,
      count: messages.length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get message history
app.get("/", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    const messages = await db.message.findMany({
      where: { schoolId: schoolId || undefined },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return c.json(messages);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

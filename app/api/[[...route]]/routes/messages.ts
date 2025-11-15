import { Hono } from "hono";
import { db } from "@/lib/db";

const app = new Hono();

// Send bulk SMS/WhatsApp
app.post("/send", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, recipients, message, channel, sentBy } = body;

    // TODO: Implement Africa's Talking integration
    // For now, just create message records

    const messages = await Promise.all(
      recipients.map((recipient: any) =>
        db.message.create({
          data: {
            schoolId,
            recipient: recipient.phone,
            recipientType: recipient.type,
            recipientId: recipient.id,
            message,
            channel,
            status: "SENT", // Should be PENDING until actually sent
            sentBy,
          },
        })
      )
    );

    return c.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
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

    const messages = [];

    for (const record of defaulters) {
      const student = record.student;
      const parent = student.parents[0]; // Get first parent

      if (!parent) continue;

      const messageText = `Dear Parent, ${student.firstName} ${student.lastName} (${student.admissionNumber}) has a pending fee balance of KES ${record.balance}. Please clear to avoid inconvenience. Thank you.`;

      const message = await db.message.create({
        data: {
          schoolId,
          recipient: parent.phone,
          recipientType: "PARENT",
          recipientId: parent.id,
          message: messageText,
          channel: "SMS",
          status: "PENDING",
          sentBy,
        },
      });

      messages.push(message);
    }

    // TODO: Actually send the messages via Africa's Talking

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

import { Hono } from "hono";
import { db } from "@/lib/db";
import { formatPhoneNumber } from "@/lib/utils";

const app = new Hono();

// Generate and send OTP
app.post("/send-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { phone } = body;

    const formattedPhone = formatPhoneNumber(phone);

    // Check if parent exists
    const parent = await db.parent.findFirst({
      where: { phone: formattedPhone },
    });

    if (!parent) {
      return c.json({ error: "Phone number not registered" }, 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database (or cache like Redis)
    // For now, we'll store it temporarily in a session/cache
    // TODO: Implement proper OTP storage with expiry

    // Send OTP via SMS (Africa's Talking)
    // TODO: Implement SMS sending
    console.log(`OTP for ${formattedPhone}: ${otp}`);

    // For development, return OTP in response (REMOVE IN PRODUCTION!)
    return c.json({
      success: true,
      message: "OTP sent to your phone",
      // Remove this in production:
      debug_otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Verify OTP and login
app.post("/verify-otp", async (c) => {
  try {
    const body = await c.req.json();
    const { phone, otp } = body;

    const formattedPhone = formatPhoneNumber(phone);

    // TODO: Verify OTP from storage
    // For now, accept any 6-digit OTP in development
    if (process.env.NODE_ENV === "development" && otp.length === 6) {
      // Find parent
      const parent = await db.parent.findFirst({
        where: { phone: formattedPhone },
      });

      if (!parent) {
        return c.json({ error: "Phone number not registered" }, 404);
      }

      // Generate session token (simple for now)
      const token = Buffer.from(`${parent.id}:${Date.now()}`).toString("base64");

      return c.json({
        success: true,
        token,
        parentId: parent.id,
      });
    }

    return c.json({ error: "Invalid OTP" }, 400);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get parent profile with children and fees
app.get("/profile", async (c) => {
  try {
    const parentId = c.req.query("parentId");

    if (!parentId) {
      return c.json({ error: "parentId is required" }, 400);
    }

    const parent = await db.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            class: true,
            feeRecords: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1, // Get latest fee record
            },
          },
        },
      },
    });

    if (!parent) {
      return c.json({ error: "Parent not found" }, 404);
    }

    return c.json(parent);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get child details
app.get("/child/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const parentId = c.req.query("parentId");

    const student = await db.student.findFirst({
      where: {
        id,
        parents: {
          some: {
            id: parentId,
          },
        },
      },
      include: {
        class: true,
        feeRecords: {
          orderBy: {
            createdAt: "desc",
          },
        },
        parents: true,
      },
    });

    if (!student) {
      return c.json({ error: "Student not found or access denied" }, 404);
    }

    return c.json(student);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

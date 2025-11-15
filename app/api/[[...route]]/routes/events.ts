import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.enum([
    "Academic",
    "Sports",
    "Meeting",
    "Holiday",
    "Extracurricular",
    "Exam",
    "Trip",
    "Other",
  ]),
  startDate: z.string(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  schoolId: z.string(),
  organizer: z.string().optional(),
  targetAudience: z.array(z.string()).optional(), // ["Students", "Teachers", "Parents"]
  isAllDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(), // "daily", "weekly", "monthly"
  color: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(), // Specific classes this event applies to
});

const updateEventSchema = createEventSchema.partial();

// POST /api/events - Create new event
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createEventSchema.parse(body);

    const event = await db.event.create({
      data: {
        ...validated,
        startDate: new Date(validated.startDate),
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create event" }, 500);
  }
});

// GET /api/events - Get all events with filters
app.get("/", async (c) => {
  try {
    const {
      schoolId,
      eventType,
      startDate,
      endDate,
      classId,
      month,
      year,
    } = c.req.query();

    if (!schoolId) {
      return c.json({ success: false, error: "School ID is required" }, 400);
    }

    const where: any = { schoolId };

    if (eventType) {
      where.eventType = eventType;
    }

    // Date range filtering
    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Month/Year filtering
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const firstDay = new Date(yearNum, monthNum - 1, 1);
      const lastDay = new Date(yearNum, monthNum, 0);

      where.startDate = {
        gte: firstDay,
        lte: lastDay,
      };
    }

    // Filter by class
    if (classId) {
      where.classIds = {
        has: classId,
      };
    }

    const events = await db.event.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return c.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return c.json({ success: false, error: "Failed to fetch events" }, 500);
  }
});

// GET /api/events/:id - Get single event
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const event = await db.event.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!event) {
      return c.json({ success: false, error: "Event not found" }, 404);
    }

    return c.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return c.json({ success: false, error: "Failed to fetch event" }, 500);
  }
});

// PUT /api/events/:id - Update event
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const validated = updateEventSchema.parse(body);

    const updateData: any = { ...validated };

    // Convert date strings to Date objects if present
    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
      updateData.endDate = new Date(validated.endDate);
    }

    const event = await db.event.update({
      where: { id },
      data: updateData,
      include: {
        school: true,
      },
    });

    return c.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to update event" }, 500);
  }
});

// DELETE /api/events/:id - Delete event
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.event.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return c.json({ success: false, error: "Failed to delete event" }, 500);
  }
});

// GET /api/events/upcoming/:schoolId - Get upcoming events
app.get("/upcoming/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();
    const { limit } = c.req.query();

    const events = await db.event.findMany({
      where: {
        schoolId,
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: { startDate: "asc" },
      take: limit ? parseInt(limit) : 10,
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return c.json({ success: false, error: "Failed to fetch upcoming events" }, 500);
  }
});

// GET /api/events/calendar/:schoolId/:year/:month - Get calendar view for specific month
app.get("/calendar/:schoolId/:year/:month", async (c) => {
  try {
    const { schoolId, year, month } = c.req.param();

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Get first and last day of the month
    const firstDay = new Date(yearNum, monthNum - 1, 1);
    const lastDay = new Date(yearNum, monthNum, 0);

    const events = await db.event.findMany({
      where: {
        schoolId,
        startDate: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Group events by date
    const eventsByDate = events.reduce((acc: any, event: any) => {
      const dateKey = event.startDate.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});

    return c.json({
      success: true,
      year: yearNum,
      month: monthNum,
      events,
      eventsByDate,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return c.json({ success: false, error: "Failed to fetch calendar events" }, 500);
  }
});

// GET /api/events/types/:schoolId - Get event type statistics
app.get("/types/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const events = await db.event.findMany({
      where: { schoolId },
      select: {
        eventType: true,
      },
    });

    // Count by type
    const typeStats = events.reduce((acc: any, event: any) => {
      const type = event.eventType;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    return c.json({
      success: true,
      statistics: typeStats,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching event type statistics:", error);
    return c.json({ success: false, error: "Failed to fetch event type statistics" }, 500);
  }
});

// POST /api/events/bulk - Bulk create events (e.g., term dates)
app.post("/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return c.json({ success: false, error: "Events must be an array" }, 400);
    }

    const results = [];
    const errors = [];

    for (const eventData of events) {
      try {
        const validated = createEventSchema.parse(eventData);
        const event = await db.event.create({
          data: {
            ...validated,
            startDate: new Date(validated.startDate),
            endDate: validated.endDate ? new Date(validated.endDate) : undefined,
          },
        });
        results.push(event);
      } catch (error) {
        errors.push({
          data: eventData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return c.json({
      success: true,
      created: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    });
  } catch (error) {
    console.error("Error bulk creating events:", error);
    return c.json({ success: false, error: "Failed to bulk create events" }, 500);
  }
});

// GET /api/events/class/:classId - Get events for specific class
app.get("/class/:classId", async (c) => {
  try {
    const { classId } = c.req.param();
    const { startDate, endDate } = c.req.query();

    const where: any = {
      OR: [
        { classIds: { has: classId } },
        { classIds: { isEmpty: true } }, // Events for all classes
      ],
    };

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const events = await db.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching class events:", error);
    return c.json({ success: false, error: "Failed to fetch class events" }, 500);
  }
});

export default app;

import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const createSlotSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
  dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime: z.string(), // Format: "08:00"
  endTime: z.string(), // Format: "09:00"
  room: z.string().optional(),
  academicYear: z.string(),
  term: z.number().min(1).max(3),
});

const bulkSlotsSchema = z.object({
  slots: z.array(createSlotSchema),
});

// Helper function to check time conflicts
function hasTimeConflict(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return (s1 < e2 && e1 > s2);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// POST /api/timetable/slots - Create timetable slot with conflict detection
app.post("/slots", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createSlotSchema.parse(body);

    // Check for conflicts
    const conflicts = await checkConflicts(validated);

    if (conflicts.length > 0) {
      return c.json(
        {
          success: false,
          error: "Scheduling conflicts detected",
          conflicts,
        },
        400
      );
    }

    const slot = await db.timetableSlot.create({
      data: validated,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error("Error creating timetable slot:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create timetable slot" }, 500);
  }
});

// Helper function to check for conflicts
async function checkConflicts(slotData: z.infer<typeof createSlotSchema>) {
  const conflicts = [];

  // Get all slots for the same day, term, and year
  const existingSlots = await db.timetableSlot.findMany({
    where: {
      dayOfWeek: slotData.dayOfWeek,
      academicYear: slotData.academicYear,
      term: slotData.term,
    },
    include: {
      class: true,
      teacher: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      subject: true,
    },
  });

  for (const existing of existingSlots) {
    const hasConflict = hasTimeConflict(
      slotData.startTime,
      slotData.endTime,
      existing.startTime,
      existing.endTime
    );

    if (!hasConflict) continue;

    // Teacher conflict: same teacher scheduled at same time
    if (existing.teacherId === slotData.teacherId) {
      conflicts.push({
        type: "teacher",
        message: `Teacher ${existing.teacher.firstName} ${existing.teacher.lastName} is already scheduled for ${existing.class.name} (${existing.subject.name}) at this time`,
        slot: existing,
      });
    }

    // Class conflict: same class scheduled at same time
    if (existing.classId === slotData.classId) {
      conflicts.push({
        type: "class",
        message: `Class ${existing.class.name} already has ${existing.subject.name} scheduled at this time`,
        slot: existing,
      });
    }

    // Room conflict: same room booked at same time
    if (slotData.room && existing.room === slotData.room) {
      conflicts.push({
        type: "room",
        message: `Room ${existing.room} is already booked for ${existing.class.name} at this time`,
        slot: existing,
      });
    }
  }

  return conflicts;
}

// POST /api/timetable/slots/bulk - Bulk create slots
app.post("/slots/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const validated = bulkSlotsSchema.parse(body);

    const results = [];
    const errors = [];

    for (const slotData of validated.slots) {
      try {
        // Check for conflicts
        const conflicts = await checkConflicts(slotData);

        if (conflicts.length > 0) {
          errors.push({
            data: slotData,
            error: "Scheduling conflicts detected",
            conflicts,
          });
          continue;
        }

        const slot = await db.timetableSlot.create({
          data: slotData,
        });
        results.push(slot);
      } catch (error) {
        errors.push({
          data: slotData,
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
    console.error("Error bulk creating slots:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to bulk create slots" }, 500);
  }
});

// GET /api/timetable/slots - Get slots with filters
app.get("/slots", async (c) => {
  try {
    const { classId, teacherId, academicYear, term, dayOfWeek } = c.req.query();

    const where: {
      classId?: string;
      teacherId?: string;
      academicYear?: string;
      term?: number;
      dayOfWeek?: string;
    } = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    const slots = await db.timetableSlot.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    return c.json({
      success: true,
      slots,
      total: slots.length,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return c.json({ success: false, error: "Failed to fetch slots" }, 500);
  }
});

// GET /api/timetable/slots/:id - Get single slot
app.get("/slots/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const slot = await db.timetableSlot.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    if (!slot) {
      return c.json({ success: false, error: "Slot not found" }, 404);
    }

    return c.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error("Error fetching slot:", error);
    return c.json({ success: false, error: "Failed to fetch slot" }, 500);
  }
});

// PUT /api/timetable/slots/:id - Update slot with conflict detection
app.put("/slots/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    // Get existing slot
    const existing = await db.timetableSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json({ success: false, error: "Slot not found" }, 404);
    }

    // Merge with existing data
    const updateData = {
      ...existing,
      ...body,
    };

    // Check for conflicts (excluding current slot)
    const conflicts = await checkConflicts(updateData);
    const filteredConflicts = conflicts.filter((c: { type: string; message: string; slot: { id: string } }) => c.slot.id !== id);

    if (filteredConflicts.length > 0) {
      return c.json(
        {
          success: false,
          error: "Scheduling conflicts detected",
          conflicts: filteredConflicts,
        },
        400
      );
    }

    const slot = await db.timetableSlot.update({
      where: { id },
      data: {
        classId: body.classId,
        subjectId: body.subjectId,
        teacherId: body.teacherId,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        room: body.room,
      },
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      slot,
    });
  } catch (error) {
    console.error("Error updating slot:", error);
    return c.json({ success: false, error: "Failed to update slot" }, 500);
  }
});

// DELETE /api/timetable/slots/:id - Delete slot
app.delete("/slots/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.timetableSlot.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Slot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return c.json({ success: false, error: "Failed to delete slot" }, 500);
  }
});

// GET /api/timetable/class/:classId - Get full timetable for a class
app.get("/class/:classId", async (c) => {
  try {
    const { classId } = c.req.param();
    const { academicYear, term } = c.req.query();

    const where: {
      classId: string;
      academicYear?: string;
      term?: number;
    } = { classId };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const slots = await db.timetableSlot.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    // Group by day
    type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    const timetableByDay: Record<DayOfWeek, typeof slots> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    slots.forEach((slot: any) => {
      timetableByDay[slot.dayOfWeek as DayOfWeek].push(slot);
    });

    return c.json({
      success: true,
      slots,
      timetableByDay,
      total: slots.length,
    });
  } catch (error) {
    console.error("Error fetching class timetable:", error);
    return c.json({ success: false, error: "Failed to fetch class timetable" }, 500);
  }
});

// GET /api/timetable/teacher/:teacherId - Get teacher's timetable
app.get("/teacher/:teacherId", async (c) => {
  try {
    const { teacherId } = c.req.param();
    const { academicYear, term } = c.req.query();

    const where: {
      teacherId: string;
      academicYear?: string;
      term?: number;
    } = { teacherId };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const slots = await db.timetableSlot.findMany({
      where,
      include: {
        class: true,
        subject: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" },
      ],
    });

    // Group by day
    type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    const timetableByDay: Record<DayOfWeek, typeof slots> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    slots.forEach((slot: any) => {
      timetableByDay[slot.dayOfWeek as DayOfWeek].push(slot);
    });

    return c.json({
      success: true,
      slots,
      timetableByDay,
      total: slots.length,
    });
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    return c.json({ success: false, error: "Failed to fetch teacher timetable" }, 500);
  }
});

// POST /api/timetable/check-conflicts - Check for conflicts without creating
app.post("/check-conflicts", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createSlotSchema.parse(body);

    const conflicts = await checkConflicts(validated);

    return c.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to check conflicts" }, 500);
  }
});

// DELETE /api/timetable/class/:classId - Delete all slots for a class
app.delete("/class/:classId", async (c) => {
  try {
    const { classId } = c.req.param();
    const { academicYear, term } = c.req.query();

    const where: {
      classId: string;
      academicYear?: string;
      term?: number;
    } = { classId };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const result = await db.timetableSlot.deleteMany({
      where,
    });

    return c.json({
      success: true,
      message: `Deleted ${result.count} slots`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error deleting class timetable:", error);
    return c.json({ success: false, error: "Failed to delete class timetable" }, 500);
  }
});

// GET /api/timetable/statistics/:schoolId - Get timetable statistics
app.get("/statistics/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();
    const { academicYear, term } = c.req.query();

    // Get all classes for this school
    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true },
    });

    const classIds = classes.map((c: any) => c.id);

    const where: {
      classId: { in: string[] };
      academicYear?: string;
      term?: number;
    } = {
      classId: { in: classIds },
    };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const slots = await db.timetableSlot.findMany({
      where,
      include: {
        class: true,
        teacher: true,
      },
    });

    // Calculate statistics
    const totalSlots = slots.length;
    const uniqueTeachers = new Set(slots.map((s: any) => s.teacherId)).size;
    const uniqueClasses = new Set(slots.map((s: any) => s.classId)).size;
    const slotsByDay = slots.reduce((acc: Record<string, number>, slot: any) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = 0;
      acc[slot.dayOfWeek]++;
      return acc;
    }, {} as Record<string, number>);

    return c.json({
      success: true,
      statistics: {
        totalSlots,
        uniqueTeachers,
        uniqueClasses,
        slotsByDay,
      },
    });
  } catch (error) {
    console.error("Error fetching timetable statistics:", error);
    return c.json({ success: false, error: "Failed to fetch timetable statistics" }, 500);
  }
});

export default app;

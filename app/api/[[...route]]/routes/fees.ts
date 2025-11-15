import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrentAcademicYear, getCurrentTerm } from "@/lib/utils";

const app = new Hono();

// Create fee structure
app.post("/structures", async (c) => {
  try {
    const body = await c.req.json();

    const feeStructure = await db.feeStructure.create({
      data: {
        schoolId: body.schoolId,
        name: body.name,
        grade: body.grade,
        academicYear: body.academicYear,
        feeItems: {
          create: body.feeItems,
        },
      },
      include: {
        feeItems: true,
      },
    });

    return c.json(feeStructure, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get fee structures
app.get("/structures", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const feeStructures = await db.feeStructure.findMany({
      where: { schoolId },
      include: {
        feeItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(feeStructures);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Generate fee records for all students
app.post("/generate-records", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, academicYear, term, grade } = body;

    // Get fee structure for this grade and year
    const feeStructure = await db.feeStructure.findFirst({
      where: {
        schoolId,
        grade,
        academicYear,
        isActive: true,
      },
      include: {
        feeItems: {
          where: {
            OR: [{ term: term }, { term: 0 }], // Include term-specific and annual fees
          },
        },
      },
    });

    if (!feeStructure) {
      return c.json({ error: "Fee structure not found" }, 404);
    }

    // Calculate total amount
    const totalAmount = feeStructure.feeItems.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0
    );

    // Get all students in this grade
    const students = await db.student.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
        class: {
          grade: grade,
        },
      },
    });

    // Create fee records for all students
    const feeRecords = await Promise.all(
      students.map((student: any) =>
        db.feeRecord.create({
          data: {
            studentId: student.id,
            academicYear,
            term,
            totalAmount,
            paidAmount: 0,
            balance: totalAmount,
            status: "PENDING",
          },
        })
      )
    );

    return c.json({
      message: `Fee records created for ${feeRecords.length} students`,
      count: feeRecords.length,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get fee records
app.get("/records", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");
    const studentId = c.req.query("studentId");
    const status = c.req.query("status");

    const feeRecords = await db.feeRecord.findMany({
      where: {
        student: {
          schoolId,
        },
        ...(studentId && { studentId }),
        ...(status && { status }),
      },
      include: {
        student: {
          include: {
            class: true,
            parents: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(feeRecords);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get fee defaulters
app.get("/defaulters", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const defaulters = await db.feeRecord.findMany({
      where: {
        student: {
          schoolId,
          status: "ACTIVE",
        },
        balance: {
          gt: 0,
        },
        status: {
          in: ["PENDING", "PARTIAL", "OVERDUE"],
        },
      },
      include: {
        student: {
          include: {
            class: true,
            parents: true,
          },
        },
      },
      orderBy: {
        balance: "desc",
      },
    });

    return c.json(defaulters);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

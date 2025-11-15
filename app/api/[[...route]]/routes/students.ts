import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateAdmissionNumber } from "@/lib/utils";

const app = new Hono();

// Validation schemas
const createStudentSchema = z.object({
  schoolId: z.string(),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  gender: z.enum(["MALE", "FEMALE"]),
  classId: z.string().optional(),
  upiNumber: z.string().optional(),
  birthCertNumber: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  parents: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      relationship: z.enum(["FATHER", "MOTHER", "GUARDIAN"]),
      phone: z.string().min(10),
      alternatePhone: z.string().optional(),
      email: z.string().email().optional(),
      nationalId: z.string().optional(),
      address: z.string().optional(),
      occupation: z.string().optional(),
    })
  ),
});

// Get all students (with filters)
app.get("/", async (c) => {
  try {
    const schoolId = c.req.query("schoolId");
    const classId = c.req.query("classId");
    const status = c.req.query("status") || "ACTIVE";
    const search = c.req.query("search");

    if (!schoolId) {
      return c.json({ error: "schoolId is required" }, 400);
    }

    const students = await db.student.findMany({
      where: {
        schoolId,
        ...(classId && { classId }),
        status,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { admissionNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        class: true,
        parents: true,
      },
      orderBy: {
        admissionNumber: "asc",
      },
    });

    return c.json(students);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get student by ID
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const student = await db.student.findUnique({
      where: { id },
      include: {
        class: true,
        parents: true,
        feeRecords: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!student) {
      return c.json({ error: "Student not found" }, 404);
    }

    return c.json(student);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create new student
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const data = createStudentSchema.parse(body);

    // Get school to generate admission number
    const school = await db.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      return c.json({ error: "School not found" }, 404);
    }

    const currentYear = new Date().getFullYear();
    const admissionNumber = generateAdmissionNumber(school.code, currentYear);

    // Create student with parents
    const student = await db.student.create({
      data: {
        schoolId: data.schoolId,
        admissionNumber,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        classId: data.classId,
        upiNumber: data.upiNumber,
        birthCertNumber: data.birthCertNumber,
        address: data.address,
        allergies: data.allergies,
        medicalNotes: data.medicalNotes,
        enrollmentDate: new Date(),
        parents: {
          create: data.parents,
        },
      },
      include: {
        parents: true,
        class: true,
      },
    });

    return c.json(student, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors }, 400);
    }
    return c.json({ error: error.message }, 500);
  }
});

// Update student
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const student = await db.student.update({
      where: { id },
      data: body,
      include: {
        parents: true,
        class: true,
      },
    });

    return c.json(student);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete student (soft delete by changing status)
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const student = await db.student.update({
      where: { id },
      data: { status: "TRANSFERRED" },
    });

    return c.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Bulk import students
app.post("/bulk-import", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, students } = body;

    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return c.json({ error: "School not found" }, 404);
    }

    const currentYear = new Date().getFullYear();
    const createdStudents = [];

    for (const studentData of students) {
      const admissionNumber = generateAdmissionNumber(school.code, currentYear);

      const student = await db.student.create({
        data: {
          ...studentData,
          schoolId,
          admissionNumber,
          enrollmentDate: new Date(),
        },
      });

      createdStudents.push(student);
    }

    return c.json({
      message: `${createdStudents.length} students imported successfully`,
      students: createdStudents,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

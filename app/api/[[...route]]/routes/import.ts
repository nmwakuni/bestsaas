import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateAdmissionNumber } from "@/lib/utils";

const app = new Hono();

// Validation schema for student import
const importStudentSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dateOfBirth: z.string(), // Will be converted to Date
  gender: z.enum(["MALE", "FEMALE"]),
  className: z.string().optional(),
  upiNumber: z.string().optional(),
  birthCertNumber: z.string().optional(),
  address: z.string().optional(),
  // Parent information
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentRelationship: z.enum(["FATHER", "MOTHER", "GUARDIAN"]),
  parentPhone: z.string().min(10),
  parentEmail: z.string().email().optional(),
  parentNationalId: z.string().optional(),
});

// Bulk import students from CSV/array
app.post("/students/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { schoolId, students } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return c.json({ error: "Students array is required" }, 400);
    }

    // Get school
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return c.json({ error: "School not found" }, 404);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const studentData of students) {
      try {
        // Validate student data
        const validated = importStudentSchema.parse(studentData);

        // Find or create class
        let classId = undefined;
        if (validated.className) {
          let classRecord = await db.class.findFirst({
            where: {
              schoolId,
              name: validated.className,
            },
          });

          if (!classRecord) {
            // Create class if it doesn't exist
            classRecord = await db.class.create({
              data: {
                schoolId,
                name: validated.className,
                grade: validated.className.split(" ")[0], // Extract grade from name
                capacity: 40,
              },
            });
          }

          classId = classRecord.id;
        }

        // Find or create parent
        let parent = await db.parent.findFirst({
          where: {
            phone: validated.parentPhone,
          },
        });

        if (!parent) {
          parent = await db.parent.create({
            data: {
              firstName: validated.parentFirstName,
              lastName: validated.parentLastName,
              relationship: validated.parentRelationship,
              phone: validated.parentPhone,
              email: validated.parentEmail,
              nationalId: validated.parentNationalId,
            },
          });
        }

        // Generate admission number
        const currentYear = new Date().getFullYear();
        const admissionNumber = generateAdmissionNumber(
          school.code,
          currentYear
        );

        // Create student
        const student = await db.student.create({
          data: {
            schoolId,
            admissionNumber,
            firstName: validated.firstName,
            middleName: validated.middleName,
            lastName: validated.lastName,
            dateOfBirth: new Date(validated.dateOfBirth),
            gender: validated.gender,
            classId,
            upiNumber: validated.upiNumber,
            birthCertNumber: validated.birthCertNumber,
            address: validated.address,
            enrollmentDate: new Date(),
            parents: {
              connect: [{ id: parent.id }],
            },
          },
          include: {
            class: true,
            parents: true,
          },
        });

        results.success.push({
          admissionNumber: student.admissionNumber,
          name: `${student.firstName} ${student.lastName}`,
        });
      } catch (error: any) {
        results.failed.push({
          student: studentData,
          error: error.message,
        });
      }
    }

    return c.json({
      message: `Imported ${results.success.length} students successfully`,
      total: students.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get CSV template
app.get("/students/template", (c) => {
  const template = [
    {
      firstName: "John",
      middleName: "Mwangi",
      lastName: "Kamau",
      dateOfBirth: "2015-01-15",
      gender: "MALE",
      className: "Grade 3A",
      upiNumber: "UPI123456",
      birthCertNumber: "BC123456",
      address: "Nairobi",
      parentFirstName: "Peter",
      parentLastName: "Kamau",
      parentRelationship: "FATHER",
      parentPhone: "254712345678",
      parentEmail: "peter@example.com",
      parentNationalId: "12345678",
    },
  ];

  return c.json({
    template,
    instructions: {
      dateOfBirth: "Format: YYYY-MM-DD",
      gender: "MALE or FEMALE",
      parentRelationship: "FATHER, MOTHER, or GUARDIAN",
      parentPhone: "Format: 254XXXXXXXXX",
    },
  });
});

// Bulk update students
app.patch("/students/bulk-update", async (c) => {
  try {
    const body = await c.req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return c.json({ error: "Updates array is required" }, 400);
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const update of updates) {
      try {
        const { admissionNumber, ...data } = update;

        const student = await db.student.updateMany({
          where: { admissionNumber },
          data,
        });

        if (student.count > 0) {
          results.success.push({ admissionNumber });
        } else {
          results.failed.push({
            admissionNumber,
            error: "Student not found",
          });
        }
      } catch (error: any) {
        results.failed.push({
          admissionNumber: update.admissionNumber,
          error: error.message,
        });
      }
    }

    return c.json({
      message: `Updated ${results.success.length} students successfully`,
      total: updates.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;

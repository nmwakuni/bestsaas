import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  schoolId: z.string(),
});

const assignTeacherSchema = z.object({
  subjectId: z.string(),
  teacherId: z.string(),
  classId: z.string().optional(),
});

const createGradeSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  assessmentType: z.enum(["Assignment", "CAT", "MidTerm", "EndTerm", "Project", "Homework"]),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100).default(100),
  academicYear: z.string(),
  term: z.number().min(1).max(3),
  gradedBy: z.string(),
  comment: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
});

const bulkGradesSchema = z.object({
  grades: z.array(createGradeSchema),
});

// ============ SUBJECTS ============

// POST /api/gradebook/subjects - Create new subject
app.post("/subjects", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createSubjectSchema.parse(body);

    // Check if subject code already exists
    const existing = await db.subject.findFirst({
      where: {
        code: validated.code,
        schoolId: validated.schoolId,
      },
    });

    if (existing) {
      return c.json({ success: false, error: "Subject code already exists" }, 400);
    }

    const subject = await db.subject.create({
      data: validated,
    });

    return c.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error("Error creating subject:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create subject" }, 500);
  }
});

// GET /api/gradebook/subjects - Get all subjects for a school
app.get("/subjects", async (c) => {
  try {
    const { schoolId } = c.req.query();

    if (!schoolId) {
      return c.json({ success: false, error: "School ID is required" }, 400);
    }

    const subjects = await db.subject.findMany({
      where: { schoolId },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
                stream: true,
              },
            },
          },
        },
        _count: {
          select: {
            grades: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return c.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return c.json({ success: false, error: "Failed to fetch subjects" }, 500);
  }
});

// GET /api/gradebook/subjects/:id - Get single subject
app.get("/subjects/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        teachers: {
          include: {
            teacher: true,
            class: true,
          },
        },
      },
    });

    if (!subject) {
      return c.json({ success: false, error: "Subject not found" }, 404);
    }

    return c.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error("Error fetching subject:", error);
    return c.json({ success: false, error: "Failed to fetch subject" }, 500);
  }
});

// PUT /api/gradebook/subjects/:id - Update subject
app.put("/subjects/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const subject = await db.subject.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
      },
    });

    return c.json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    return c.json({ success: false, error: "Failed to update subject" }, 500);
  }
});

// DELETE /api/gradebook/subjects/:id - Delete subject
app.delete("/subjects/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.subject.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return c.json({ success: false, error: "Failed to delete subject" }, 500);
  }
});

// ============ TEACHER ASSIGNMENTS ============

// POST /api/gradebook/assign-teacher - Assign teacher to subject
app.post("/assign-teacher", async (c) => {
  try {
    const body = await c.req.json();
    const validated = assignTeacherSchema.parse(body);

    // Check if assignment already exists
    const existing = await db.subjectTeacher.findFirst({
      where: {
        subjectId: validated.subjectId,
        teacherId: validated.teacherId,
        classId: validated.classId || null,
      },
    });

    if (existing) {
      return c.json({ success: false, error: "Teacher already assigned to this subject" }, 400);
    }

    const assignment = await db.subjectTeacher.create({
      data: validated,
      include: {
        teacher: true,
        subject: true,
        class: true,
      },
    });

    return c.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to assign teacher" }, 500);
  }
});

// DELETE /api/gradebook/assign-teacher/:id - Remove teacher assignment
app.delete("/assign-teacher/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.subjectTeacher.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Teacher assignment removed successfully",
    });
  } catch (error) {
    console.error("Error removing teacher assignment:", error);
    return c.json({ success: false, error: "Failed to remove teacher assignment" }, 500);
  }
});

// GET /api/gradebook/teacher-subjects/:teacherId - Get subjects for a teacher
app.get("/teacher-subjects/:teacherId", async (c) => {
  try {
    const { teacherId } = c.req.param();

    const assignments = await db.subjectTeacher.findMany({
      where: { teacherId },
      include: {
        subject: true,
        class: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return c.json({ success: false, error: "Failed to fetch teacher subjects" }, 500);
  }
});

// ============ GRADES ============

// POST /api/gradebook/grades - Create single grade entry
app.post("/grades", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createGradeSchema.parse(body);

    const grade = await db.grade.create({
      data: validated,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return c.json({
      success: true,
      grade,
    });
  } catch (error) {
    console.error("Error creating grade:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create grade" }, 500);
  }
});

// POST /api/gradebook/grades/bulk - Bulk create grades
app.post("/grades/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const validated = bulkGradesSchema.parse(body);

    const results = [];
    const errors = [];

    for (const gradeData of validated.grades) {
      try {
        const grade = await db.grade.create({
          data: gradeData,
        });
        results.push(grade);
      } catch (error) {
        errors.push({
          data: gradeData,
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
    console.error("Error bulk creating grades:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to bulk create grades" }, 500);
  }
});

// GET /api/gradebook/grades - Get grades with filters
app.get("/grades", async (c) => {
  try {
    const { studentId, subjectId, classId, academicYear, term } = c.req.query();

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    // If classId is provided, get all students in that class
    if (classId) {
      const students = await db.student.findMany({
        where: { classId },
        select: { id: true },
      });
      where.studentId = { in: students.map((s) => s.id) };
    }

    const grades = await db.grade.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        subject: true,
      },
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
        { createdAt: "desc" },
      ],
    });

    return c.json({
      success: true,
      grades,
      total: grades.length,
    });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return c.json({ success: false, error: "Failed to fetch grades" }, 500);
  }
});

// GET /api/gradebook/grades/:id - Get single grade
app.get("/grades/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const grade = await db.grade.findUnique({
      where: { id },
      include: {
        student: true,
        subject: true,
      },
    });

    if (!grade) {
      return c.json({ success: false, error: "Grade not found" }, 404);
    }

    return c.json({
      success: true,
      grade,
    });
  } catch (error) {
    console.error("Error fetching grade:", error);
    return c.json({ success: false, error: "Failed to fetch grade" }, 500);
  }
});

// PUT /api/gradebook/grades/:id - Update grade
app.put("/grades/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const grade = await db.grade.update({
      where: { id },
      data: {
        score: body.score,
        maxScore: body.maxScore,
        comment: body.comment,
        weight: body.weight,
      },
      include: {
        student: true,
        subject: true,
      },
    });

    return c.json({
      success: true,
      grade,
    });
  } catch (error) {
    console.error("Error updating grade:", error);
    return c.json({ success: false, error: "Failed to update grade" }, 500);
  }
});

// DELETE /api/gradebook/grades/:id - Delete grade
app.delete("/grades/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.grade.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return c.json({ success: false, error: "Failed to delete grade" }, 500);
  }
});

// ============ ANALYTICS & REPORTS ============

// GET /api/gradebook/student-report/:studentId - Get comprehensive student grade report
app.get("/student-report/:studentId", async (c) => {
  try {
    const { studentId } = c.req.param();
    const { academicYear, term } = c.req.query();

    const where: any = { studentId };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const grades = await db.grade.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by subject and calculate averages
    const subjectGrades = grades.reduce((acc: any, grade) => {
      const subjectId = grade.subjectId;
      if (!acc[subjectId]) {
        acc[subjectId] = {
          subject: grade.subject,
          grades: [],
          average: 0,
          total: 0,
        };
      }
      acc[subjectId].grades.push(grade);
      return acc;
    }, {});

    // Calculate averages for each subject
    Object.keys(subjectGrades).forEach((subjectId) => {
      const subject = subjectGrades[subjectId];
      const totalScore = subject.grades.reduce((sum: number, g: any) => {
        return sum + (g.score / g.maxScore) * 100;
      }, 0);
      subject.average = totalScore / subject.grades.length;
      subject.total = subject.grades.length;
    });

    // Calculate overall average
    const overallAverage =
      Object.values(subjectGrades).reduce((sum: number, s: any) => sum + s.average, 0) /
      Object.keys(subjectGrades).length;

    return c.json({
      success: true,
      report: {
        studentId,
        academicYear,
        term,
        subjects: Object.values(subjectGrades),
        overallAverage,
        totalGrades: grades.length,
      },
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    return c.json({ success: false, error: "Failed to generate student report" }, 500);
  }
});

// GET /api/gradebook/class-report/:classId - Get class performance report
app.get("/class-report/:classId", async (c) => {
  try {
    const { classId } = c.req.param();
    const { subjectId, academicYear, term } = c.req.query();

    // Get all students in class
    const students = await db.student.findMany({
      where: { classId },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
    });

    const studentIds = students.map((s) => s.id);

    const where: any = {
      studentId: { in: studentIds },
    };
    if (subjectId) where.subjectId = subjectId;
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const grades = await db.grade.findMany({
      where,
      include: {
        student: true,
        subject: true,
      },
    });

    // Calculate class statistics
    const scores = grades.map((g) => (g.score / g.maxScore) * 100);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Group by student
    const studentPerformance = students.map((student) => {
      const studentGrades = grades.filter((g) => g.studentId === student.id);
      const studentScores = studentGrades.map((g) => (g.score / g.maxScore) * 100);
      const studentAverage =
        studentScores.reduce((a, b) => a + b, 0) / studentScores.length || 0;

      return {
        student,
        gradesCount: studentGrades.length,
        average: studentAverage,
      };
    });

    return c.json({
      success: true,
      report: {
        classId,
        totalStudents: students.length,
        totalGrades: grades.length,
        statistics: {
          average,
          highest,
          lowest,
        },
        studentPerformance: studentPerformance.sort((a, b) => b.average - a.average),
      },
    });
  } catch (error) {
    console.error("Error generating class report:", error);
    return c.json({ success: false, error: "Failed to generate class report" }, 500);
  }
});

export default app;

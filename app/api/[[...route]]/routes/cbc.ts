import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateCBCReportCard } from "@/lib/pdf/cbc-report-generator";

const app = new Hono();

// Validation schemas
const createAssessmentSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  academicYear: z.string(),
  term: z.number().min(1).max(3),
  strand: z.string().optional(),
  learningOutcome: z.string().optional(),
  competencyLevel: z.enum(["Exceeds", "Meets", "Approaches", "Below"]),
  teacherComment: z.string().optional(),
});

const generateReportCardSchema = z.object({
  studentId: z.string(),
  academicYear: z.string(),
  term: z.number().min(1).max(3),
  communication: z.string().optional(),
  collaboration: z.string().optional(),
  criticalThinking: z.string().optional(),
  creativity: z.string().optional(),
  citizenship: z.string().optional(),
  learning: z.string().optional(),
  selfEfficacy: z.string().optional(),
  teacherComment: z.string().optional(),
  principalComment: z.string().optional(),
});

// POST /api/cbc/assessments - Create or update assessment
app.post("/assessments", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createAssessmentSchema.parse(body);

    // Check if assessment already exists for this student, subject, term
    const existing = await db.assessment.findFirst({
      where: {
        studentId: validated.studentId,
        subjectId: validated.subjectId,
        academicYear: validated.academicYear,
        term: validated.term,
      },
    });

    let assessment;
    if (existing) {
      // Update existing assessment
      assessment = await db.assessment.update({
        where: { id: existing.id },
        data: validated,
      });
    } else {
      // Create new assessment
      assessment = await db.assessment.create({
        data: validated,
      });
    }

    return c.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("Error creating assessment:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to create assessment" }, 500);
  }
});

// GET /api/cbc/assessments/:studentId - Get all assessments for a student
app.get("/assessments/:studentId", async (c) => {
  try {
    const { studentId } = c.req.param();
    const { academicYear, term } = c.req.query();

    const where: any = { studentId };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);

    const assessments = await db.assessment.findMany({
      where,
      include: {
        subject: true,
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    return c.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return c.json({ success: false, error: "Failed to fetch assessments" }, 500);
  }
});

// POST /api/cbc/report-cards/generate - Generate CBC report card
app.post("/report-cards/generate", async (c) => {
  try {
    const body = await c.req.json();
    const validated = generateReportCardSchema.parse(body);

    // Check if report card already exists
    const existing = await db.reportCard.findFirst({
      where: {
        studentId: validated.studentId,
        academicYear: validated.academicYear,
        term: validated.term,
      },
    });

    let reportCard;
    if (existing) {
      // Update existing report card
      reportCard = await db.reportCard.update({
        where: { id: existing.id },
        data: validated,
      });
    } else {
      // Create new report card
      reportCard = await db.reportCard.create({
        data: validated,
      });
    }

    // Fetch full report card data with student info and assessments
    const fullReportCard = await db.reportCard.findUnique({
      where: { id: reportCard.id },
      include: {
        student: {
          include: {
            class: true,
            school: true,
            parent: true,
          },
        },
      },
    });

    // Also fetch all assessments for this term
    const assessments = await db.assessment.findMany({
      where: {
        studentId: validated.studentId,
        academicYear: validated.academicYear,
        term: validated.term,
      },
      include: {
        subject: true,
      },
    });

    return c.json({
      success: true,
      reportCard: {
        ...fullReportCard,
        assessments,
      },
    });
  } catch (error) {
    console.error("Error generating report card:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to generate report card" }, 500);
  }
});

// GET /api/cbc/report-cards/:id - Get a specific report card
app.get("/report-cards/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const reportCard = await db.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
            school: true,
            parent: true,
          },
        },
      },
    });

    if (!reportCard) {
      return c.json({ success: false, error: "Report card not found" }, 404);
    }

    // Fetch assessments for this report card
    const assessments = await db.assessment.findMany({
      where: {
        studentId: reportCard.studentId,
        academicYear: reportCard.academicYear,
        term: reportCard.term,
      },
      include: {
        subject: true,
      },
    });

    return c.json({
      success: true,
      reportCard: {
        ...reportCard,
        assessments,
      },
    });
  } catch (error) {
    console.error("Error fetching report card:", error);
    return c.json({ success: false, error: "Failed to fetch report card" }, 500);
  }
});

// GET /api/cbc/report-cards/student/:studentId - Get all report cards for a student
app.get("/report-cards/student/:studentId", async (c) => {
  try {
    const { studentId } = c.req.param();

    const reportCards = await db.reportCard.findMany({
      where: { studentId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    return c.json({
      success: true,
      reportCards,
    });
  } catch (error) {
    console.error("Error fetching report cards:", error);
    return c.json({ success: false, error: "Failed to fetch report cards" }, 500);
  }
});

// POST /api/cbc/assessments/bulk - Bulk create/update assessments
app.post("/assessments/bulk", async (c) => {
  try {
    const body = await c.req.json();
    const { assessments } = body;

    if (!Array.isArray(assessments)) {
      return c.json({ success: false, error: "Assessments must be an array" }, 400);
    }

    const results = [];
    const errors = [];

    for (const assessmentData of assessments) {
      try {
        const validated = createAssessmentSchema.parse(assessmentData);

        // Check if assessment exists
        const existing = await db.assessment.findFirst({
          where: {
            studentId: validated.studentId,
            subjectId: validated.subjectId,
            academicYear: validated.academicYear,
            term: validated.term,
          },
        });

        let assessment;
        if (existing) {
          assessment = await db.assessment.update({
            where: { id: existing.id },
            data: validated,
          });
        } else {
          assessment = await db.assessment.create({
            data: validated,
          });
        }

        results.push(assessment);
      } catch (error) {
        errors.push({
          data: assessmentData,
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
    console.error("Error bulk creating assessments:", error);
    return c.json({ success: false, error: "Failed to bulk create assessments" }, 500);
  }
});

// GET /api/cbc/assessments/class/:classId - Get assessments for entire class
app.get("/assessments/class/:classId", async (c) => {
  try {
    const { classId } = c.req.param();
    const { academicYear, term, subjectId } = c.req.query();

    // Get all students in the class
    const students = await db.student.findMany({
      where: { classId },
      select: { id: true },
    });

    const studentIds = students.map((s: any) => s.id);

    const where: any = {
      studentId: { in: studentIds },
    };
    if (academicYear) where.academicYear = academicYear;
    if (term) where.term = parseInt(term);
    if (subjectId) where.subjectId = subjectId;

    const assessments = await db.assessment.findMany({
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
      ],
    });

    return c.json({
      success: true,
      assessments,
      total: assessments.length,
    });
  } catch (error) {
    console.error("Error fetching class assessments:", error);
    return c.json({ success: false, error: "Failed to fetch class assessments" }, 500);
  }
});

// GET /api/cbc/report-cards/:id/pdf - Generate PDF of report card
app.get("/report-cards/:id/pdf", async (c) => {
  try {
    const { id } = c.req.param();

    const reportCard = await db.reportCard.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
            school: true,
            parent: true,
          },
        },
      },
    });

    if (!reportCard) {
      return c.json({ success: false, error: "Report card not found" }, 404);
    }

    // Fetch assessments for this report card
    const assessments = await db.assessment.findMany({
      where: {
        studentId: reportCard.studentId,
        academicYear: reportCard.academicYear,
        term: reportCard.term,
      },
      include: {
        subject: true,
      },
    });

    // Generate PDF
    const pdf = generateCBCReportCard({
      ...reportCard,
      assessments,
    } as any);

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-card-${reportCard.student.admissionNumber}-term${reportCard.term}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return c.json({ success: false, error: "Failed to generate PDF" }, 500);
  }
});

export default app;

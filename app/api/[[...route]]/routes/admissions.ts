import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// Validation schemas
const createAdmissionSchema = z.object({
  schoolId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(["Male", "Female", "Other"]),

  // Parent information
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentEmail: z.string().email(),
  parentPhone: z.string().min(10),

  // Address
  address: z.string().optional(),
  county: z.string().optional(),
  town: z.string().optional(),

  // Previous school
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),

  // Applying for
  applyingForClass: z.string(),
  academicYear: z.string(),

  // Additional info
  medicalConditions: z.string().optional(),
  specialNeeds: z.string().optional(),
  extracurriculars: z.array(z.string()).optional(),

  // Documents (URLs to uploaded files)
  birthCertificate: z.string().optional(),
  previousReportCard: z.string().optional(),
  passportPhoto: z.string().optional(),
  additionalDocuments: z.array(z.string()).optional(),
});

const updateAdmissionSchema = z.object({
  status: z.enum(["Pending", "UnderReview", "Approved", "Rejected", "Waitlisted"]).optional(),
  reviewNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
  interviewDate: z.string().optional(),
  interviewNotes: z.string().optional(),
  admissionFee: z.number().optional(),
  admissionDeadline: z.string().optional(),
});

// POST /api/admissions - Submit new admission application
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = createAdmissionSchema.parse(body);

    // Generate application number
    const year = new Date().getFullYear();
    const count = await db.admission.count({
      where: {
        schoolId: validated.schoolId,
        academicYear: validated.academicYear,
      },
    });
    const applicationNumber = `ADM-${year}-${String(count + 1).padStart(4, "0")}`;

    const admission = await db.admission.create({
      data: {
        ...validated,
        dateOfBirth: new Date(validated.dateOfBirth),
        applicationNumber,
        status: "Pending",
        appliedAt: new Date(),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send confirmation email to parent

    return c.json({
      success: true,
      admission,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error creating admission:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to submit application" }, 500);
  }
});

// GET /api/admissions - Get all admissions with filters
app.get("/", async (c) => {
  try {
    const { schoolId, status, academicYear, applyingForClass } = c.req.query();

    if (!schoolId) {
      return c.json({ success: false, error: "School ID is required" }, 400);
    }

    const where: any = { schoolId };
    if (status) where.status = status;
    if (academicYear) where.academicYear = academicYear;
    if (applyingForClass) where.applyingForClass = applyingForClass;

    const admissions = await db.admission.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return c.json({
      success: true,
      admissions,
      total: admissions.length,
    });
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return c.json({ success: false, error: "Failed to fetch admissions" }, 500);
  }
});

// GET /api/admissions/:id - Get single admission
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const admission = await db.admission.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    if (!admission) {
      return c.json({ success: false, error: "Admission not found" }, 404);
    }

    return c.json({
      success: true,
      admission,
    });
  } catch (error) {
    console.error("Error fetching admission:", error);
    return c.json({ success: false, error: "Failed to fetch admission" }, 500);
  }
});

// GET /api/admissions/number/:applicationNumber - Get admission by application number
app.get("/number/:applicationNumber", async (c) => {
  try {
    const { applicationNumber } = c.req.param();

    const admission = await db.admission.findUnique({
      where: { applicationNumber },
      include: {
        school: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!admission) {
      return c.json({ success: false, error: "Admission not found" }, 404);
    }

    return c.json({
      success: true,
      admission,
    });
  } catch (error) {
    console.error("Error fetching admission:", error);
    return c.json({ success: false, error: "Failed to fetch admission" }, 500);
  }
});

// PUT /api/admissions/:id - Update admission (for review process)
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const validated = updateAdmissionSchema.parse(body);

    const updateData: any = { ...validated };

    if (validated.interviewDate) {
      updateData.interviewDate = new Date(validated.interviewDate);
    }
    if (validated.admissionDeadline) {
      updateData.admissionDeadline = new Date(validated.admissionDeadline);
    }

    // Set review date when status changes
    if (validated.status && ["Approved", "Rejected"].includes(validated.status)) {
      updateData.reviewedAt = new Date();
    }

    const admission = await db.admission.update({
      where: { id },
      data: updateData,
      include: {
        school: true,
      },
    });

    // TODO: Send notification email based on status change

    return c.json({
      success: true,
      admission,
    });
  } catch (error) {
    console.error("Error updating admission:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to update admission" }, 500);
  }
});

// POST /api/admissions/:id/approve - Approve admission and create student record
app.post("/:id/approve", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { classId, admissionFee } = body;

    if (!classId) {
      return c.json({ success: false, error: "Class ID is required" }, 400);
    }

    const admission = await db.admission.findUnique({
      where: { id },
      include: { school: true },
    });

    if (!admission) {
      return c.json({ success: false, error: "Admission not found" }, 404);
    }

    if (admission.status === "Approved") {
      return c.json({ success: false, error: "Admission already approved" }, 400);
    }

    // Start transaction
    // 1. Create/find parent
    let parent = await db.parent.findFirst({
      where: {
        phone: admission.parentPhone,
      },
    });

    if (!parent) {
      parent = await db.parent.create({
        data: {
          firstName: admission.parentFirstName,
          lastName: admission.parentLastName,
          email: admission.parentEmail,
          phone: admission.parentPhone,
        },
      });
    }

    // 2. Generate admission number
    const school = admission.school;
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await db.student.count({
      where: { schoolId: admission.schoolId },
    });
    const admissionNumber = `${school.code || "SCH"}/${year}/${String(count + 1).padStart(4, "0")}`;

    // 3. Create student record
    const student = await db.student.create({
      data: {
        firstName: admission.firstName,
        lastName: admission.lastName,
        dateOfBirth: admission.dateOfBirth,
        gender: admission.gender,
        admissionNumber,
        address: admission.address,
        medicalInfo: admission.medicalConditions,
        schoolId: admission.schoolId,
        classId,
        parentId: parent.id,
        status: "Active",
      },
    });

    // 4. Update admission status
    const updatedAdmission = await db.admission.update({
      where: { id },
      data: {
        status: "Approved",
        reviewedAt: new Date(),
        reviewedBy: body.reviewedBy,
        admissionFee,
      },
    });

    // TODO: Send approval email with admission letter

    return c.json({
      success: true,
      admission: updatedAdmission,
      student,
      message: "Admission approved and student record created",
    });
  } catch (error) {
    console.error("Error approving admission:", error);
    return c.json({ success: false, error: "Failed to approve admission" }, 500);
  }
});

// POST /api/admissions/:id/reject - Reject admission
app.post("/:id/reject", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { reviewNotes, reviewedBy } = body;

    const admission = await db.admission.update({
      where: { id },
      data: {
        status: "Rejected",
        reviewedAt: new Date(),
        reviewNotes,
        reviewedBy,
      },
      include: {
        school: true,
      },
    });

    // TODO: Send rejection email

    return c.json({
      success: true,
      admission,
      message: "Admission rejected",
    });
  } catch (error) {
    console.error("Error rejecting admission:", error);
    return c.json({ success: false, error: "Failed to reject admission" }, 500);
  }
});

// GET /api/admissions/statistics/:schoolId - Get admission statistics
app.get("/statistics/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();
    const { academicYear } = c.req.query();

    const where: any = { schoolId };
    if (academicYear) where.academicYear = academicYear;

    const admissions = await db.admission.findMany({
      where,
      select: {
        status: true,
        applyingForClass: true,
        appliedAt: true,
      },
    });

    // Count by status
    const byStatus = admissions.reduce((acc: any, adm: any) => {
      if (!acc[adm.status]) acc[adm.status] = 0;
      acc[adm.status]++;
      return acc;
    }, {});

    // Count by class
    const byClass = admissions.reduce((acc: any, adm: any) => {
      if (!acc[adm.applyingForClass]) acc[adm.applyingForClass] = 0;
      acc[adm.applyingForClass]++;
      return acc;
    }, {});

    // Applications per month
    const byMonth = admissions.reduce((acc: any, adm: any) => {
      const month = adm.appliedAt.toISOString().slice(0, 7);
      if (!acc[month]) acc[month] = 0;
      acc[month]++;
      return acc;
    }, {});

    return c.json({
      success: true,
      statistics: {
        total: admissions.length,
        byStatus,
        byClass,
        byMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching admission statistics:", error);
    return c.json({ success: false, error: "Failed to fetch statistics" }, 500);
  }
});

// DELETE /api/admissions/:id - Delete admission application
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    await db.admission.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Admission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admission:", error);
    return c.json({ success: false, error: "Failed to delete admission" }, 500);
  }
});

// POST /api/admissions/:id/schedule-interview - Schedule interview
app.post("/:id/schedule-interview", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { interviewDate, interviewTime, location } = body;

    const admission = await db.admission.update({
      where: { id },
      data: {
        status: "UnderReview",
        interviewDate: new Date(interviewDate),
        // Store interview details in reviewNotes for now
        reviewNotes: `Interview scheduled for ${interviewDate} at ${interviewTime}. Location: ${location}`,
      },
    });

    // TODO: Send interview invitation email

    return c.json({
      success: true,
      admission,
      message: "Interview scheduled successfully",
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    return c.json({ success: false, error: "Failed to schedule interview" }, 500);
  }
});

// POST /api/admissions/bulk-status - Bulk update status (e.g., reject all pending from last year)
app.post("/bulk-status", async (c) => {
  try {
    const body = await c.req.json();
    const { admissionIds, status, reviewNotes } = body;

    if (!Array.isArray(admissionIds)) {
      return c.json({ success: false, error: "admissionIds must be an array" }, 400);
    }

    const updateData: any = { status };
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (["Approved", "Rejected"].includes(status)) {
      updateData.reviewedAt = new Date();
    }

    const result = await db.admission.updateMany({
      where: {
        id: { in: admissionIds },
      },
      data: updateData,
    });

    return c.json({
      success: true,
      updated: result.count,
      message: `Updated ${result.count} admissions`,
    });
  } catch (error) {
    console.error("Error bulk updating admissions:", error);
    return c.json({ success: false, error: "Failed to bulk update admissions" }, 500);
  }
});

export default app;

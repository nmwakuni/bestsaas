import { Hono } from "hono";
import { db } from "@/lib/db";
import { z } from "zod";

const app = new Hono();

// NEMIS (National Education Management Information System) - Kenya Government Reporting

// Validation schemas
const generateReportSchema = z.object({
  schoolId: z.string(),
  reportType: z.enum([
    "enrollment",
    "teachers",
    "infrastructure",
    "academic_performance",
    "staffing",
    "attendance",
  ]),
  academicYear: z.string(),
  term: z.number().min(1).max(3).optional(),
});

// GET /api/nemis/enrollment/:schoolId - Generate enrollment report
app.get("/enrollment/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();
    const { academicYear } = c.req.query();

    if (!academicYear) {
      return c.json({ success: false, error: "Academic year is required" }, 400);
    }

    // Get school info
    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return c.json({ success: false, error: "School not found" }, 404);
    }

    // Get all students
    const students = await db.student.findMany({
      where: {
        schoolId,
        status: "Active",
      },
      include: {
        class: true,
      },
    });

    // Group by class and gender
    const enrollmentByClass: Record<string, {
      total: number;
      male: number;
      female: number;
      boarders: number;
      dayScholars: number;
    }> = {};
    const genderStats: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    const ageDistribution: Record<number, number> = {};

    students.forEach((student: any) => {
      const className = student.class.name;

      if (!enrollmentByClass[className]) {
        enrollmentByClass[className] = {
          total: 0,
          male: 0,
          female: 0,
          boarders: 0,
          dayScholars: 0,
        };
      }

      enrollmentByClass[className].total++;
      enrollmentByClass[className][student.gender.toLowerCase() as 'male' | 'female']++;

      if (student.boardingStatus === "Boarder") {
        enrollmentByClass[className].boarders++;
      } else {
        enrollmentByClass[className].dayScholars++;
      }

      // Gender stats
      if (student.gender in genderStats) {
        genderStats[student.gender]++;
      }

      // Age distribution
      const age = new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear();
      if (!ageDistribution[age]) {
        ageDistribution[age] = 0;
      }
      ageDistribution[age]++;
    });

    const report = {
      reportType: "NEMIS Enrollment Report",
      school: {
        name: school.name,
        code: school.code,
        county: school.county,
        subCounty: school.subCounty,
      },
      academicYear,
      generatedAt: new Date(),
      summary: {
        totalEnrollment: students.length,
        byGender: genderStats,
        byClass: enrollmentByClass,
        ageDistribution,
      },
      students: students.map((s: any) => ({
        admissionNumber: s.admissionNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        class: s.class.name,
        boardingStatus: s.boardingStatus,
      })),
    };

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating enrollment report:", error);
    return c.json({ success: false, error: "Failed to generate enrollment report" }, 500);
  }
});

// GET /api/nemis/teachers/:schoolId - Generate teachers report
app.get("/teachers/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return c.json({ success: false, error: "School not found" }, 404);
    }

    // Get all teachers
    const teachers = await db.user.findMany({
      where: {
        schoolId,
        role: "Teacher",
      },
      include: {
        subjectTeachers: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    // Calculate statistics
    const genderStats: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    const qualifications: Record<string, number> = {};
    const subjectCoverage: Record<string, number> = {};

    teachers.forEach((teacher: any) => {
      if (teacher.gender && teacher.gender in genderStats) {
        genderStats[teacher.gender]++;
      }

      // Track subjects taught
      teacher.subjectTeachers.forEach((st: any) => {
        if (!subjectCoverage[st.subject.name]) {
          subjectCoverage[st.subject.name] = 0;
        }
        subjectCoverage[st.subject.name]++;
      });
    });

    const report = {
      reportType: "NEMIS Teachers Report",
      school: {
        name: school.name,
        code: school.code,
        county: school.county,
        subCounty: school.subCounty,
      },
      generatedAt: new Date(),
      summary: {
        totalTeachers: teachers.length,
        byGender: genderStats,
        subjectCoverage,
        studentTeacherRatio: 0, // Can be calculated if needed
      },
      teachers: teachers.map((t: any) => ({
        tscNumber: t.tscNumber || "N/A",
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        gender: t.gender,
        subjects: t.subjectTeachers.map((st: any) => st.subject.name),
      })),
    };

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating teachers report:", error);
    return c.json({ success: false, error: "Failed to generate teachers report" }, 500);
  }
});

// GET /api/nemis/academic-performance/:schoolId - Generate academic performance report
app.get("/academic-performance/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();
    const { academicYear, term } = c.req.query();

    if (!academicYear || !term) {
      return c.json({ success: false, error: "Academic year and term are required" }, 400);
    }

    const school = await db.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return c.json({ success: false, error: "School not found" }, 404);
    }

    // Get all classes for this school
    const classes = await db.class.findMany({
      where: { schoolId },
      include: {
        students: {
          where: { status: "Active" },
        },
      },
    });

    const classIds = classes.map((c: any) => c.id);
    const studentIds = classes.flatMap((c: any) => c.students.map((s: any) => s.id));

    // Get grades for this term
    const grades = await db.grade.findMany({
      where: {
        studentId: { in: studentIds },
        academicYear,
        term: parseInt(term),
      },
      include: {
        subject: true,
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    // Calculate performance by subject
    const subjectPerformance: Record<string, {
      total: number;
      sum: number;
      high: number;
      low: number;
      average?: number;
    }> = {};
    const classPerformance: Record<string, {
      total: number;
      sum: number;
      average?: number;
    }> = {};

    grades.forEach((grade: any) => {
      const subjectName = grade.subject.name;
      const className = grade.student.class.name;
      const percentage = (grade.score / grade.maxScore) * 100;

      // Subject stats
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          total: 0,
          sum: 0,
          high: 0,
          low: 100,
        };
      }
      subjectPerformance[subjectName].total++;
      subjectPerformance[subjectName].sum += percentage;
      subjectPerformance[subjectName].high = Math.max(
        subjectPerformance[subjectName].high,
        percentage
      );
      subjectPerformance[subjectName].low = Math.min(
        subjectPerformance[subjectName].low,
        percentage
      );

      // Class stats
      if (!classPerformance[className]) {
        classPerformance[className] = {
          total: 0,
          sum: 0,
        };
      }
      classPerformance[className].total++;
      classPerformance[className].sum += percentage;
    });

    // Calculate averages
    Object.keys(subjectPerformance).forEach((subject: string) => {
      const stats = subjectPerformance[subject];
      stats.average = stats.sum / stats.total;
    });

    Object.keys(classPerformance).forEach((className: string) => {
      const stats = classPerformance[className];
      stats.average = stats.sum / stats.total;
    });

    const report = {
      reportType: "NEMIS Academic Performance Report",
      school: {
        name: school.name,
        code: school.code,
        county: school.county,
      },
      academicYear,
      term: parseInt(term),
      generatedAt: new Date(),
      summary: {
        totalAssessments: grades.length,
        subjectPerformance,
        classPerformance,
      },
    };

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating academic performance report:", error);
    return c.json(
      { success: false, error: "Failed to generate academic performance report" },
      500
    );
  }
});

// GET /api/nemis/infrastructure/:schoolId - Generate infrastructure report
app.get("/infrastructure/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: {
              where: { status: "Active" },
            },
          },
        },
      },
    });

    if (!school) {
      return c.json({ success: false, error: "School not found" }, 404);
    }

    // Get timetable slots to count rooms
    const timetableSlots = await db.timetableSlot.findMany({
      where: {
        class: {
          schoolId,
        },
      },
      select: {
        room: true,
      },
      distinct: ["room"],
    });

    const rooms = timetableSlots
      .map((slot: any) => slot.room)
      .filter((room: any) => room !== null && room !== undefined);

    const report = {
      reportType: "NEMIS Infrastructure Report",
      school: {
        name: school.name,
        code: school.code,
        county: school.county,
        subCounty: school.subCounty,
      },
      generatedAt: new Date(),
      infrastructure: {
        totalClassrooms: school.classes.length,
        classroomsInUse: rooms.length,
        totalStudents: school.classes.reduce((sum: number, c: any) => sum + c.students.length, 0),
        averageClassSize:
          school.classes.reduce((sum: number, c: any) => sum + c.students.length, 0) / school.classes.length ||
          0,
        rooms: rooms,
        // Additional fields can be added as needed
        hasLibrary: false, // These would come from school metadata
        hasLaboratory: false,
        hasComputerLab: false,
        hasSportsField: false,
        hasElectricity: true,
        hasWater: true,
      },
    };

    return c.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating infrastructure report:", error);
    return c.json({ success: false, error: "Failed to generate infrastructure report" }, 500);
  }
});

// POST /api/nemis/generate - Generate comprehensive NEMIS report
app.post("/generate", async (c) => {
  try {
    const body = await c.req.json();
    const validated = generateReportSchema.parse(body);

    const { schoolId, reportType, academicYear, term } = validated;

    let report;

    switch (reportType) {
      case "enrollment":
        // Call enrollment endpoint logic
        const enrollmentResponse = await fetch(
          `${c.req.url.replace("/generate", "")}/enrollment/${schoolId}?academicYear=${academicYear}`
        );
        report = await enrollmentResponse.json();
        break;

      case "teachers":
        // Call teachers endpoint logic
        const teachersResponse = await fetch(
          `${c.req.url.replace("/generate", "")}/teachers/${schoolId}`
        );
        report = await teachersResponse.json();
        break;

      case "academic_performance":
        if (!term) {
          return c.json({ success: false, error: "Term is required for academic performance report" }, 400);
        }
        const performanceResponse = await fetch(
          `${c.req.url.replace("/generate", "")}/academic-performance/${schoolId}?academicYear=${academicYear}&term=${term}`
        );
        report = await performanceResponse.json();
        break;

      case "infrastructure":
        const infrastructureResponse = await fetch(
          `${c.req.url.replace("/generate", "")}/infrastructure/${schoolId}`
        );
        report = await infrastructureResponse.json();
        break;

      default:
        return c.json({ success: false, error: "Invalid report type" }, 400);
    }

    return c.json(report);
  } catch (error) {
    console.error("Error generating NEMIS report:", error);
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors }, 400);
    }
    return c.json({ success: false, error: "Failed to generate NEMIS report" }, 500);
  }
});

// GET /api/nemis/export/:schoolId/:reportType - Export report as CSV
app.get("/export/:schoolId/:reportType", async (c) => {
  try {
    const { schoolId, reportType } = c.req.param();
    const { academicYear, term } = c.req.query();

    if (!academicYear) {
      return c.json({ success: false, error: "Academic year is required" }, 400);
    }

    let csvData = "";

    if (reportType === "enrollment") {
      const students = await db.student.findMany({
        where: {
          schoolId,
          status: "Active",
        },
        include: {
          class: true,
        },
      });

      // CSV Header
      csvData = "Admission Number,First Name,Last Name,Gender,Date of Birth,Class,Boarding Status\n";

      // CSV Rows
      students.forEach((student: any) => {
        csvData += `${student.admissionNumber},${student.firstName},${student.lastName},${student.gender},${student.dateOfBirth.toISOString().split("T")[0]},${student.class.name},${student.boardingStatus}\n`;
      });

      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="nemis-enrollment-${academicYear}.csv"`,
        },
      });
    }

    if (reportType === "teachers") {
      const teachers = await db.user.findMany({
        where: {
          schoolId,
          role: "Teacher",
        },
        include: {
          subjectTeachers: {
            include: {
              subject: true,
            },
          },
        },
      });

      csvData = "TSC Number,First Name,Last Name,Email,Gender,Subjects\n";

      teachers.forEach((teacher: any) => {
        const subjects = teacher.subjectTeachers.map((st: any) => st.subject.name).join("; ");
        csvData += `${teacher.tscNumber || "N/A"},${teacher.firstName},${teacher.lastName},${teacher.email},${teacher.gender || "N/A"},${subjects}\n`;
      });

      return new Response(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="nemis-teachers-${academicYear}.csv"`,
        },
      });
    }

    return c.json({ success: false, error: "Invalid report type for export" }, 400);
  } catch (error) {
    console.error("Error exporting NEMIS report:", error);
    return c.json({ success: false, error: "Failed to export NEMIS report" }, 500);
  }
});

// GET /api/nemis/compliance/:schoolId - Check NEMIS compliance status
app.get("/compliance/:schoolId", async (c) => {
  try {
    const { schoolId } = c.req.param();

    const school = await db.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: {
            students: {
              where: { status: "Active" },
            },
          },
        },
      },
    });

    if (!school) {
      return c.json({ success: false, error: "School not found" }, 404);
    }

    const teachers = await db.user.count({
      where: {
        schoolId,
        role: "Teacher",
      },
    });

    const students = school.classes.reduce((sum: number, c: any) => sum + c.students.length, 0);

    // Compliance checks
    const compliance = {
      hasSchoolCode: !!school.code,
      hasCountyInfo: !!school.county,
      hasSubCountyInfo: !!school.subCounty,
      hasEnrollmentData: students > 0,
      hasTeacherData: teachers > 0,
      studentTeacherRatio: teachers > 0 ? students / teachers : 0,
      isCompliant: false,
    };

    // Overall compliance
    compliance.isCompliant =
      compliance.hasSchoolCode &&
      compliance.hasCountyInfo &&
      compliance.hasSubCountyInfo &&
      compliance.hasEnrollmentData &&
      compliance.hasTeacherData;

    const issues = [];
    if (!compliance.hasSchoolCode) issues.push("Missing school code");
    if (!compliance.hasCountyInfo) issues.push("Missing county information");
    if (!compliance.hasSubCountyInfo) issues.push("Missing sub-county information");
    if (!compliance.hasEnrollmentData) issues.push("No student enrollment data");
    if (!compliance.hasTeacherData) issues.push("No teacher data");
    if (compliance.studentTeacherRatio > 40) issues.push("Student-teacher ratio exceeds recommended 1:40");

    return c.json({
      success: true,
      compliance,
      issues,
      recommendations: issues.length === 0 ? ["School is NEMIS compliant"] : issues,
    });
  } catch (error) {
    console.error("Error checking NEMIS compliance:", error);
    return c.json({ success: false, error: "Failed to check NEMIS compliance" }, 500);
  }
});

export default app;

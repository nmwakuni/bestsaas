import jsPDF from "jspdf";

interface Assessment {
  subject: {
    name: string;
  };
  strand?: string;
  learningOutcome?: string;
  competencyLevel: string;
  teacherComment?: string;
}

interface ReportCardData {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    dateOfBirth: Date;
    class: {
      name: string;
      stream?: string;
    };
    school: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
  };
  academicYear: string;
  term: number;
  communication?: string;
  collaboration?: string;
  criticalThinking?: string;
  creativity?: string;
  citizenship?: string;
  learning?: string;
  selfEfficacy?: string;
  teacherComment?: string;
  principalComment?: string;
  assessments: Assessment[];
}

export function generateCBCReportCard(data: ReportCardData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // School Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.student.school.name, pageWidth / 2, yPos, { align: "center" });
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (data.student.school.address) {
    doc.text(data.student.school.address, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }
  if (data.student.school.phone || data.student.school.email) {
    const contact = [data.student.school.phone, data.student.school.email]
      .filter(Boolean)
      .join(" | ");
    doc.text(contact, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
  }

  // Report Card Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("COMPETENCY BASED CURRICULUM (CBC) REPORT CARD", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 10;

  // Student Information Box
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, pageWidth - 30, 35, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LEARNER INFORMATION", 20, yPos + 7);

  doc.setFont("helvetica", "normal");
  yPos += 13;

  // Two columns layout
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;

  doc.text(`Name: ${data.student.firstName} ${data.student.lastName}`, col1X, yPos);
  doc.text(`Admission No: ${data.student.admissionNumber}`, col2X, yPos);
  yPos += 6;

  const className = data.student.class.stream
    ? `${data.student.class.name} ${data.student.class.stream}`
    : data.student.class.name;
  doc.text(`Class: ${className}`, col1X, yPos);
  doc.text(`Term: ${data.term}`, col2X, yPos);
  yPos += 6;

  const age = new Date().getFullYear() - new Date(data.student.dateOfBirth).getFullYear();
  doc.text(`Age: ${age} years`, col1X, yPos);
  doc.text(`Academic Year: ${data.academicYear}`, col2X, yPos);
  yPos += 15;

  // Core Competencies Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CORE COMPETENCIES", 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const competencies = [
    { name: "Communication & Collaboration", value: data.communication },
    { name: "Critical Thinking & Problem Solving", value: data.criticalThinking },
    { name: "Creativity & Imagination", value: data.creativity },
    { name: "Citizenship", value: data.citizenship },
    { name: "Learning to Learn", value: data.learning },
    { name: "Self-Efficacy", value: data.selfEfficacy },
    { name: "Digital Literacy", value: data.collaboration },
  ];

  const competencyLevels = ["Exceeds", "Meets", "Approaches", "Below"];
  const cellWidth = 35;
  const cellHeight = 7;
  const headerX = 20;
  const levelsStartX = 90;

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFillColor(220, 220, 220);
  doc.rect(headerX, yPos - 5, 70, cellHeight, "FD");
  doc.text("Competency", headerX + 2, yPos);

  competencyLevels.forEach((level, i) => {
    doc.rect(levelsStartX + i * cellWidth, yPos - 5, cellWidth, cellHeight, "FD");
    doc.text(level, levelsStartX + i * cellWidth + 2, yPos);
  });
  yPos += cellHeight;

  // Competency rows
  doc.setFont("helvetica", "normal");
  competencies.forEach((comp) => {
    doc.rect(headerX, yPos - 5, 70, cellHeight, "D");
    doc.text(comp.name, headerX + 2, yPos, { maxWidth: 68 });

    competencyLevels.forEach((level, i) => {
      const isSelected = comp.value === level;
      if (isSelected) {
        doc.setFillColor(100, 200, 100);
        doc.rect(levelsStartX + i * cellWidth, yPos - 5, cellWidth, cellHeight, "FD");
      } else {
        doc.rect(levelsStartX + i * cellWidth, yPos - 5, cellWidth, cellHeight, "D");
      }
      if (isSelected) {
        doc.setFont("helvetica", "bold");
        doc.text("✓", levelsStartX + i * cellWidth + cellWidth / 2, yPos, {
          align: "center",
        });
        doc.setFont("helvetica", "normal");
      }
    });
    yPos += cellHeight;
  });

  yPos += 10;

  // Learning Areas Assessment
  if (data.assessments.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LEARNING AREAS ASSESSMENT", 20, yPos);
    yPos += 8;

    doc.setFontSize(9);

    // Assessment table header
    doc.setFillColor(220, 220, 220);
    doc.rect(20, yPos - 5, 50, cellHeight, "FD");
    doc.text("Subject", 22, yPos);
    doc.rect(70, yPos - 5, 40, cellHeight, "FD");
    doc.text("Strand", 72, yPos);
    doc.rect(110, yPos - 5, 30, cellHeight, "FD");
    doc.text("Level", 112, yPos);
    doc.rect(140, yPos - 5, 50, cellHeight, "FD");
    doc.text("Remarks", 142, yPos);
    yPos += cellHeight;

    doc.setFont("helvetica", "normal");
    data.assessments.forEach((assessment) => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const rowHeight = 10;

      doc.rect(20, yPos - 5, 50, rowHeight, "D");
      doc.text(assessment.subject.name, 22, yPos, { maxWidth: 48 });

      doc.rect(70, yPos - 5, 40, rowHeight, "D");
      doc.text(assessment.strand || "-", 72, yPos, { maxWidth: 38 });

      doc.rect(110, yPos - 5, 30, rowHeight, "D");
      doc.text(assessment.competencyLevel, 112, yPos);

      doc.rect(140, yPos - 5, 50, rowHeight, "D");
      if (assessment.teacherComment) {
        doc.text(assessment.teacherComment, 142, yPos, { maxWidth: 48 });
      }

      yPos += rowHeight;
    });

    yPos += 10;
  }

  // Key for competency levels
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("KEY:", 20, yPos);
  doc.setFont("helvetica", "normal");
  yPos += 5;
  doc.text("Exceeds (E) - Consistently demonstrates skills beyond grade level", 20, yPos);
  yPos += 5;
  doc.text("Meets (M) - Consistently demonstrates grade-level skills", 20, yPos);
  yPos += 5;
  doc.text("Approaches (A) - Developing towards grade-level skills", 20, yPos);
  yPos += 5;
  doc.text("Below (B) - Requires additional support to meet grade-level skills", 20, yPos);
  yPos += 10;

  // Teacher and Principal Comments
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TEACHER'S COMMENT:", 20, yPos);
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const teacherComment = data.teacherComment || "Good progress this term.";
  const teacherLines = doc.splitTextToSize(teacherComment, pageWidth - 40);
  doc.text(teacherLines, 20, yPos);
  yPos += teacherLines.length * 5 + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PRINCIPAL'S COMMENT:", 20, yPos);
  yPos += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const principalComment = data.principalComment || "Well done. Keep up the good work.";
  const principalLines = doc.splitTextToSize(principalComment, pageWidth - 40);
  doc.text(principalLines, 20, yPos);
  yPos += principalLines.length * 5 + 15;

  // Signatures
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(9);
  doc.line(20, yPos, 70, yPos);
  doc.line(140, yPos, 190, yPos);
  yPos += 5;
  doc.text("Class Teacher Signature", 20, yPos);
  doc.text("Principal Signature", 140, yPos);
  yPos += 10;

  doc.line(20, yPos, 70, yPos);
  doc.line(140, yPos, 190, yPos);
  yPos += 5;
  doc.text("Date", 20, yPos);
  doc.text("School Stamp", 140, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Report Card ID: ${data.id}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  return doc;
}

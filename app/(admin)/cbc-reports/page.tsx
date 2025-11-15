"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: {
    name: string;
    stream?: string;
  };
}

interface Subject {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  subject: {
    name: string;
  };
  strand?: string;
  competencyLevel: string;
  teacherComment?: string;
}

interface ReportCard {
  id: string;
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
}

export default function CBCReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [reportCard, setReportCard] = useState<Partial<ReportCard> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear] = useState("2024");
  const [term, setTerm] = useState(1);
  const [activeTab, setActiveTab] = useState<"assessments" | "competencies">("assessments");

  // Competency form state
  const [competencies, setCompetencies] = useState({
    communication: "Meets",
    collaboration: "Meets",
    criticalThinking: "Meets",
    creativity: "Meets",
    citizenship: "Meets",
    learning: "Meets",
    selfEfficacy: "Meets",
  });

  const [comments, setComments] = useState({
    teacher: "",
    principal: "",
  });

  const competencyLevels = ["Exceeds", "Meets", "Approaches", "Below"];

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchAssessments();
      fetchReportCard();
    }
  }, [selectedStudent, term]);

  const fetchStudents = async () => {
    try {
      // Mock school ID
      const response = await fetch("/api/students?schoolId=school-1");
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/gradebook/subjects?schoolId=school-1");
      const data = await response.json();

      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchAssessments = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(
        `/api/cbc/assessments/${selectedStudent.id}?academicYear=${academicYear}&term=${term}`
      );
      const data = await response.json();

      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    }
  };

  const fetchReportCard = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(
        `/api/cbc/report-cards/student/${selectedStudent.id}`
      );
      const data = await response.json();

      if (data.success && data.reportCards.length > 0) {
        const card = data.reportCards.find(
          (rc: ReportCard) => rc.term === term && rc.academicYear === academicYear
        );
        if (card) {
          setReportCard(card);
          setCompetencies({
            communication: card.communication || "Meets",
            collaboration: card.collaboration || "Meets",
            criticalThinking: card.criticalThinking || "Meets",
            creativity: card.creativity || "Meets",
            citizenship: card.citizenship || "Meets",
            learning: card.learning || "Meets",
            selfEfficacy: card.selfEfficacy || "Meets",
          });
          setComments({
            teacher: card.teacherComment || "",
            principal: card.principalComment || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching report card:", error);
    }
  };

  const handleSaveAssessment = async (subjectId: string, competencyLevel: string, strand: string, teacherComment: string) => {
    if (!selectedStudent) return;

    try {
      const response = await fetch("/api/cbc/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          subjectId,
          academicYear,
          term,
          competencyLevel,
          strand,
          teacherComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAssessments();
        alert("Assessment saved successfully!");
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
      alert("Failed to save assessment");
    }
  };

  const handleGenerateReportCard = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch("/api/cbc/report-cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          academicYear,
          term,
          ...competencies,
          teacherComment: comments.teacher,
          principalComment: comments.principal,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReportCard(data.reportCard);
        alert("Report card generated successfully!");
      }
    } catch (error) {
      console.error("Error generating report card:", error);
      alert("Failed to generate report card");
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportCard?.id) {
      alert("Please generate the report card first");
      return;
    }

    window.open(`/api/cbc/report-cards/${reportCard.id}/pdf`, "_blank");
  };

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.admissionNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getCompetencyColor = (level: string) => {
    switch (level) {
      case "Exceeds":
        return "bg-green-100 text-green-800";
      case "Meets":
        return "bg-blue-100 text-blue-800";
      case "Approaches":
        return "bg-yellow-100 text-yellow-800";
      case "Below":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CBC Report Card Designer</h1>
        <p className="text-gray-600">
          Create Competency-Based Curriculum report cards for students
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Student List */}
        <div className="col-span-4">
          <Card className="h-[calc(100vh-200px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedStudent?.id === student.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <p className="font-semibold">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{student.admissionNumber}</p>
                  <p className="text-xs text-gray-500">
                    {student.class.name}
                    {student.class.stream && ` ${student.class.stream}`}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Report Card Designer */}
        <div className="col-span-8">
          {selectedStudent ? (
            <>
              {/* Header */}
              <Card className="mb-6 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedStudent.admissionNumber}</p>
                    <p className="text-sm text-gray-500">
                      {selectedStudent.class.name}
                      {selectedStudent.class.stream && ` ${selectedStudent.class.stream}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((t) => (
                      <Button
                        key={t}
                        variant={term === t ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setTerm(t)}
                      >
                        Term {t}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeTab === "assessments" ? "primary" : "outline"}
                  onClick={() => setActiveTab("assessments")}
                >
                  Subject Assessments ({assessments.length})
                </Button>
                <Button
                  variant={activeTab === "competencies" ? "primary" : "outline"}
                  onClick={() => setActiveTab("competencies")}
                >
                  Core Competencies
                </Button>
              </div>

              {/* Content */}
              {activeTab === "assessments" ? (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Learning Area Assessments</h3>
                  <div className="space-y-4">
                    {subjects.map((subject) => {
                      const existingAssessment = assessments.find(
                        (a) => a.subject.name === subject.name
                      );

                      return (
                        <AssessmentCard
                          key={subject.id}
                          subject={subject}
                          existingAssessment={existingAssessment}
                          onSave={handleSaveAssessment}
                        />
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Core Competencies</h3>
                  <div className="space-y-4">
                    {Object.entries(competencies).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                        <div className="flex gap-2">
                          {competencyLevels.map((level) => (
                            <button
                              key={level}
                              onClick={() =>
                                setCompetencies({ ...competencies, [key]: level })
                              }
                              className={`px-4 py-2 rounded-md transition-colors ${
                                value === level
                                  ? getCompetencyColor(level)
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block font-medium mb-2">Class Teacher Comment</label>
                      <textarea
                        value={comments.teacher}
                        onChange={(e) =>
                          setComments({ ...comments, teacher: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Overall performance and recommendations..."
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Principal Comment</label>
                      <textarea
                        value={comments.principal}
                        onChange={(e) =>
                          setComments({ ...comments, principal: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Principal's remarks..."
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <Button onClick={handleGenerateReportCard} className="flex-1">
                  Generate Report Card
                </Button>
                {reportCard && (
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    Download PDF
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500">Select a student to create their report card</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Assessment Card Component
function AssessmentCard({
  subject,
  existingAssessment,
  onSave,
}: {
  subject: Subject;
  existingAssessment?: Assessment;
  onSave: (subjectId: string, level: string, strand: string, comment: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [level, setLevel] = useState(existingAssessment?.competencyLevel || "Meets");
  const [strand, setStrand] = useState(existingAssessment?.strand || "");
  const [comment, setComment] = useState(existingAssessment?.teacherComment || "");

  const competencyLevels = ["Exceeds", "Meets", "Approaches", "Below"];

  const getCompetencyColor = (lvl: string) => {
    switch (lvl) {
      case "Exceeds":
        return "bg-green-100 text-green-800";
      case "Meets":
        return "bg-blue-100 text-blue-800";
      case "Approaches":
        return "bg-yellow-100 text-yellow-800";
      case "Below":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSave = () => {
    onSave(subject.id, level, strand, comment);
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold">{subject.name}</h4>
          {existingAssessment && !isEditing && (
            <Badge className={getCompetencyColor(existingAssessment.competencyLevel)}>
              {existingAssessment.competencyLevel}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : existingAssessment ? "Edit" : "Add"}
        </Button>
      </div>

      {isEditing && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Strand (Optional)</label>
            <input
              type="text"
              value={strand}
              onChange={(e) => setStrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., Numbers and Operations"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Competency Level</label>
            <div className="flex gap-2">
              {competencyLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    level === lvl
                      ? getCompetencyColor(lvl)
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teacher Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="Brief comment on student's performance..."
            />
          </div>
          <Button size="sm" onClick={handleSave}>
            Save Assessment
          </Button>
        </div>
      )}

      {!isEditing && existingAssessment && (
        <div className="text-sm text-gray-600">
          {existingAssessment.strand && (
            <p>
              <span className="font-medium">Strand:</span> {existingAssessment.strand}
            </p>
          )}
          {existingAssessment.teacherComment && (
            <p className="mt-1">{existingAssessment.teacherComment}</p>
          )}
        </div>
      )}
    </div>
  );
}

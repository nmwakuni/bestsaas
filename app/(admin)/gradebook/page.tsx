"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Class {
  id: string;
  name: string;
  stream?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
}

interface Grade {
  id: string;
  score: number;
  maxScore: number;
  assessmentType: string;
  comment?: string;
  student: Student;
}

interface TeacherAssignment {
  id: string;
  subject: Subject;
  class: Class;
  _count: {
    students: number;
  };
}

export default function GradebookPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear] = useState("2024");
  const [term, setTerm] = useState(1);

  // Form state for grade entry
  const [gradeForm, setGradeForm] = useState({
    assessmentType: "CAT",
    score: "",
    maxScore: "100",
    comment: "",
  });

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      fetchClassStudents();
      fetchGrades();
    }
  }, [selectedAssignment, term]);

  const fetchTeacherAssignments = async () => {
    try {
      // Mock teacher ID - in real app, get from auth
      const teacherId = "teacher-1";
      const response = await fetch(`/api/gradebook/teacher-subjects/${teacherId}`);
      const data = await response.json();

      if (data.success) {
        setAssignments(data.assignments);
        if (data.assignments.length > 0) {
          setSelectedAssignment(data.assignments[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(
        `/api/students?classId=${selectedAssignment.class.id}`
      );
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchGrades = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(
        `/api/gradebook/grades?classId=${selectedAssignment.class.id}&subjectId=${selectedAssignment.subject.id}&academicYear=${academicYear}&term=${term}`
      );
      const data = await response.json();

      if (data.success) {
        setGrades(data.grades);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const handleAddGrade = async () => {
    if (!selectedStudent || !selectedAssignment) return;

    try {
      const response = await fetch("/api/gradebook/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          subjectId: selectedAssignment.subject.id,
          assessmentType: gradeForm.assessmentType,
          score: parseFloat(gradeForm.score),
          maxScore: parseFloat(gradeForm.maxScore),
          academicYear,
          term,
          gradedBy: "teacher-1", // Mock
          comment: gradeForm.comment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGrades([...grades, data.grade]);
        setIsGradeModalOpen(false);
        setGradeForm({
          assessmentType: "CAT",
          score: "",
          maxScore: "100",
          comment: "",
        });
        alert("Grade added successfully!");
      }
    } catch (error) {
      console.error("Error adding grade:", error);
      alert("Failed to add grade");
    }
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter((g) => g.student.id === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return "-";

    const total = studentGrades.reduce(
      (sum, g) => sum + (g.score / g.maxScore) * 100,
      0
    );
    return (total / studentGrades.length).toFixed(1) + "%";
  };

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.admissionNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gradebook</h1>
        <p className="text-gray-600">Manage grades and assessments for your classes</p>
      </div>

      {/* Subject/Class Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {assignments.map((assignment) => (
          <Card
            key={assignment.id}
            className={`cursor-pointer transition-all ${
              selectedAssignment?.id === assignment.id
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedAssignment(assignment)}
          >
            <div className="p-4">
              <h3 className="font-semibold text-lg">{assignment.subject.name}</h3>
              <p className="text-sm text-gray-600">
                {assignment.class.name}
                {assignment.class.stream && ` ${assignment.class.stream}`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {assignment._count.students} students
              </p>
            </div>
          </Card>
        ))}
      </div>

      {selectedAssignment && (
        <>
          {/* Term Selector */}
          <div className="mb-6 flex items-center gap-4">
            <label className="font-medium">Term:</label>
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
            <div className="ml-auto">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
              />
            </div>
          </div>

          {/* Students Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => {
                    const studentGrades = getStudentGrades(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {studentGrades.length} assessment(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`font-semibold ${
                              parseFloat(calculateAverage(student.id)) >= 75
                                ? "text-green-600"
                                : parseFloat(calculateAverage(student.id)) >= 50
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {calculateAverage(student.id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsGradeModalOpen(true);
                            }}
                          >
                            Add Grade
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Class Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
                <p className="text-2xl font-bold mt-1">{students.length}</p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Graded Students</h3>
                <p className="text-2xl font-bold mt-1">
                  {new Set(grades.map((g) => g.student.id)).size}
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Assessments</h3>
                <p className="text-2xl font-bold mt-1">{grades.length}</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Add Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`Add Grade - ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assessment Type</label>
            <select
              value={gradeForm.assessmentType}
              onChange={(e) =>
                setGradeForm({ ...gradeForm, assessmentType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Assignment">Assignment</option>
              <option value="CAT">CAT</option>
              <option value="MidTerm">Mid Term Exam</option>
              <option value="EndTerm">End Term Exam</option>
              <option value="Project">Project</option>
              <option value="Homework">Homework</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Score</label>
              <Input
                type="number"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                placeholder="75"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Score</label>
              <Input
                type="number"
                value={gradeForm.maxScore}
                onChange={(e) => setGradeForm({ ...gradeForm, maxScore: e.target.value })}
                placeholder="100"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comment (Optional)</label>
            <textarea
              value={gradeForm.comment}
              onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Good performance, keep it up..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGrade} disabled={!gradeForm.score}>
              Add Grade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

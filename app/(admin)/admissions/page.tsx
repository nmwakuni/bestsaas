"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Input } from "@/components/ui/Input";

interface Admission {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  applyingForClass: string;
  academicYear: string;
  status: "Pending" | "UnderReview" | "Approved" | "Rejected" | "Waitlisted";
  appliedAt: Date;
  reviewNotes?: string;
  previousSchool?: string;
  medicalConditions?: string;
  specialNeeds?: string;
}

interface Class {
  id: string;
  name: string;
  stream?: string;
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    classId: "",
    admissionFee: "0",
  });

  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchAdmissions();
    fetchClasses();
  }, []);

  useEffect(() => {
    filterAdmissions();
  }, [admissions, searchTerm, statusFilter]);

  const fetchAdmissions = async () => {
    try {
      const response = await fetch("/api/admissions?schoolId=school-1");
      const data = await response.json();

      if (data.success) {
        setAdmissions(data.admissions);
      }
    } catch (error) {
      console.error("Error fetching admissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/students/classes?schoolId=school-1");
      const data = await response.json();

      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const filterAdmissions = () => {
    let filtered = admissions;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        `${a.firstName} ${a.lastName} ${a.applicationNumber} ${a.parentPhone}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAdmissions(filtered);
  };

  const handleApprove = async () => {
    if (!selectedAdmission || !approvalForm.classId) {
      alert("Please select a class");
      return;
    }

    try {
      const response = await fetch(`/api/admissions/${selectedAdmission.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: approvalForm.classId,
          admissionFee: parseFloat(approvalForm.admissionFee),
          reviewedBy: "admin-1", // Mock
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Admission approved! Student record created successfully.");
        setIsApproveModalOpen(false);
        fetchAdmissions();
      } else {
        alert(data.error || "Failed to approve admission");
      }
    } catch (error) {
      console.error("Error approving admission:", error);
      alert("Failed to approve admission");
    }
  };

  const handleReject = async () => {
    if (!selectedAdmission) return;

    try {
      const response = await fetch(`/api/admissions/${selectedAdmission.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewNotes: rejectReason,
          reviewedBy: "admin-1", // Mock
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Admission rejected");
        setIsRejectModalOpen(false);
        setRejectReason("");
        fetchAdmissions();
      }
    } catch (error) {
      console.error("Error rejecting admission:", error);
      alert("Failed to reject admission");
    }
  };

  const handleStatusChange = async (admissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admissions/${admissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAdmissions();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      UnderReview: "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Waitlisted: "bg-purple-100 text-purple-800",
    };

    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const stats = {
    total: admissions.length,
    pending: admissions.filter((a) => a.status === "Pending").length,
    underReview: admissions.filter((a) => a.status === "UnderReview").length,
    approved: admissions.filter((a) => a.status === "Approved").length,
    rejected: admissions.filter((a) => a.status === "Rejected").length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Admissions Dashboard</h1>
        <p className="text-gray-600">Review and manage online admission applications</p>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setStatusFilter("all")}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setStatusFilter("Pending")}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setStatusFilter("UnderReview")}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Under Review</h3>
            <p className="mt-1 text-2xl font-bold text-blue-600">{stats.underReview}</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setStatusFilter("Approved")}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setStatusFilter("Rejected")}
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, application number, or phone..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="UnderReview">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Waitlisted">Waitlisted</option>
        </select>
      </div>

      {/* Applications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  App. Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Parent Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Applying For
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAdmissions.map((admission) => (
                <tr key={admission.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {admission.applicationNumber}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {admission.firstName} {admission.lastName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    <div>
                      {admission.parentFirstName} {admission.parentLastName}
                    </div>
                    <div className="text-xs text-gray-500">{admission.parentPhone}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {admission.applyingForClass}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(admission.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {getStatusBadge(admission.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAdmission(admission);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        View
                      </Button>
                      {admission.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAdmission(admission);
                              setIsApproveModalOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAdmission(admission);
                              setIsRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Application Details"
      >
        {selectedAdmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500">Application Number</h4>
                <p>{selectedAdmission.applicationNumber}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">Status</h4>
                {getStatusBadge(selectedAdmission.status)}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 font-semibold">Student Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Full Name</h4>
                  <p>
                    {selectedAdmission.firstName} {selectedAdmission.lastName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Date of Birth</h4>
                  <p>{new Date(selectedAdmission.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Gender</h4>
                  <p>{selectedAdmission.gender}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Applying For</h4>
                  <p>{selectedAdmission.applyingForClass}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 font-semibold">Parent Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Parent Name</h4>
                  <p>
                    {selectedAdmission.parentFirstName} {selectedAdmission.parentLastName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                  <p>{selectedAdmission.parentEmail}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Phone</h4>
                  <p>{selectedAdmission.parentPhone}</p>
                </div>
              </div>
            </div>

            {selectedAdmission.previousSchool && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-500">Previous School</h4>
                <p>{selectedAdmission.previousSchool}</p>
              </div>
            )}

            {selectedAdmission.medicalConditions && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-500">Medical Conditions</h4>
                <p>{selectedAdmission.medicalConditions}</p>
              </div>
            )}

            {selectedAdmission.reviewNotes && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-500">Review Notes</h4>
                <p>{selectedAdmission.reviewNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Application"
      >
        <div className="space-y-4">
          <p>
            Approve application for{" "}
            <span className="font-semibold">
              {selectedAdmission?.firstName} {selectedAdmission?.lastName}
            </span>
            ?
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Assign to Class *</label>
            <select
              value={approvalForm.classId}
              onChange={(e) => setApprovalForm({ ...approvalForm, classId: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                  {cls.stream && ` ${cls.stream}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Admission Fee (KES)</label>
            <Input
              type="number"
              value={approvalForm.admissionFee}
              onChange={(e) => setApprovalForm({ ...approvalForm, admissionFee: e.target.value })}
              placeholder="0"
            />
          </div>

          <p className="text-sm text-gray-600">
            This will create a student record and send an approval email to the parent.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={!approvalForm.classId}>
              Approve & Create Student
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Application"
      >
        <div className="space-y-4">
          <p>
            Reject application for{" "}
            <span className="font-semibold">
              {selectedAdmission?.firstName} {selectedAdmission?.lastName}
            </span>
            ?
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Reason for Rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              rows={4}
              placeholder="Please provide a reason..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject}>Reject Application</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

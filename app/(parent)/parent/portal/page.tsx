"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Download, User, Calendar, CreditCard, FileText, LogOut } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Child {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  admissionNumber: string;
  class: {
    name: string;
    grade: string;
  } | null;
  photoUrl?: string;
  feeRecords: Array<{
    id: string;
    academicYear: string;
    term: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
  }>;
}

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  students: Child[];
}

export default function ParentPortalPage() {
  const router = useRouter();
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    // TODO: Replace with actual parent ID from session
    const parentId = "your-parent-id";

    fetch(`/api/parent/profile?parentId=${parentId}`)
      .then((res) => res.json())
      .then((data) => {
        setParent(data);
        if (data.students.length > 0) {
          setSelectedChild(data.students[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching parent data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-red-600">Unable to load parent information</p>
          <button
            onClick={() => router.push("/parent/login")}
            className="text-primary-600 hover:text-primary-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentFeeRecord = selectedChild?.feeRecords[0];
  const totalOwed = parent.students.reduce(
    (sum, child) => sum + Number(child.feeRecords[0]?.balance || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Portal</h1>
              <p className="text-gray-600">
                Welcome, {parent.firstName} {parent.lastName}
              </p>
            </div>
            <button
              onClick={() => router.push("/parent/login")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Children Selector */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Child</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parent.students.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  selectedChild?.id === child.id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    {child.photoUrl ? (
                      <img
                        src={child.photoUrl}
                        alt={child.firstName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{child.class?.name || "No class"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedChild && (
          <>
            {/* Fee Summary */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Total Fee</p>
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentFeeRecord?.totalAmount || 0)}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Paid</p>
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentFeeRecord?.paidAmount || 0)}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Balance</p>
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(currentFeeRecord?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PayNowButton
                  studentId={selectedChild.id}
                  balance={currentFeeRecord?.balance || 0}
                  parentPhone={parent.phone}
                />
                <button className="flex items-center justify-center space-x-2 rounded-lg bg-gray-100 px-6 py-3 text-gray-900 transition hover:bg-gray-200">
                  <Download className="h-5 w-5" />
                  <span>Download Statement</span>
                </button>
                <button className="flex items-center justify-center space-x-2 rounded-lg bg-gray-100 px-6 py-3 text-gray-900 transition hover:bg-gray-200">
                  <FileText className="h-5 w-5" />
                  <span>View Receipts</span>
                </button>
              </div>
            </div>

            {/* Student Details */}
            <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Admission Number</p>
                  <p className="font-semibold text-gray-900">{selectedChild.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-semibold text-gray-900">
                    {selectedChild.class?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Academic Year</p>
                  <p className="font-semibold text-gray-900">
                    {currentFeeRecord?.academicYear || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Term</p>
                  <p className="font-semibold text-gray-900">
                    Term {currentFeeRecord?.term || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <PaymentHistory studentId={selectedChild.id} />
          </>
        )}

        {/* Total Balance for All Children */}
        {parent.students.length > 1 && (
          <div className="mt-6 rounded-xl bg-primary-600 p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-primary-100">Total Balance (All Children)</p>
                <p className="text-3xl font-bold">{formatCurrency(totalOwed)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PayNowButton({
  studentId,
  balance,
  parentPhone,
}: {
  studentId: string;
  balance: number;
  parentPhone: string;
}) {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handlePayment = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount: Number(amount),
          phoneNumber: parentPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Payment request sent! Please check your phone.");
        setShowModal(false);
        setAmount("");
      } else {
        alert(data.error || "Payment failed. Please try again.");
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={balance <= 0}
        className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CreditCard className="h-5 w-5" />
        <span>Pay via M-Pesa</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Pay via M-Pesa</h3>
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">Balance: {formatCurrency(balance)}</p>
              <p className="mb-4 text-sm text-gray-600">Phone: {parentPhone}</p>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount to Pay (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-gray-900 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PaymentHistory({ studentId }: { studentId: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments?studentId=${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        setPayments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payments:", err);
        setLoading(false);
      });
  }, [studentId]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment History</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-600">No payments yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Receipt</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Method</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-900">
                    {payment.receiptNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

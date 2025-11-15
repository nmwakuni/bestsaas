"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Download,
  User,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
} from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load parent information</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
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
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Children Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Child
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parent.students.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  selectedChild?.id === child.id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    {child.photoUrl ? (
                      <img
                        src={child.photoUrl}
                        alt={child.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {child.class?.name || "No class"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedChild && (
          <>
            {/* Fee Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total Fee</p>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentFeeRecord?.totalAmount || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Paid</p>
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentFeeRecord?.paidAmount || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Balance</p>
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(currentFeeRecord?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PayNowButton
                  studentId={selectedChild.id}
                  balance={currentFeeRecord?.balance || 0}
                  parentPhone={parent.phone}
                />
                <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition">
                  <Download className="w-5 h-5" />
                  <span>Download Statement</span>
                </button>
                <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition">
                  <FileText className="w-5 h-5" />
                  <span>View Receipts</span>
                </button>
              </div>
            </div>

            {/* Student Details */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Student Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Admission Number</p>
                  <p className="font-semibold text-gray-900">
                    {selectedChild.admissionNumber}
                  </p>
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
          <div className="bg-primary-600 text-white rounded-xl shadow-md p-6 mt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-primary-100 mb-1">Total Balance (All Children)</p>
                <p className="text-3xl font-bold">{formatCurrency(totalOwed)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-primary-200" />
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
        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CreditCard className="w-5 h-5" />
        <span>Pay via M-Pesa</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Pay via M-Pesa
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Balance: {formatCurrency(balance)}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Phone: {parentPhone}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Pay (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
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
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Payment History
      </h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-600">No payments yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Receipt
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                  Method
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                    {payment.receiptNumber}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {payment.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-semibold text-right">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
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

"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface Stats {
  students: {
    total: number;
    active: number;
  };
  fees: {
    expected: number;
    collected: number;
    balance: number;
    collectionRate: number;
    defaultersCount: number;
  };
  payments: {
    today: {
      amount: number;
      count: number;
    };
    week: {
      amount: number;
    };
    month: {
      amount: number;
    };
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual school ID from session
    const schoolId = "your-school-id";

    fetch(`/api/dashboard/stats?schoolId=${schoolId}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome back! Here&apos;s your school overview.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={stats?.students.active || 0}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Today's Collection"
            value={`KES ${(stats?.payments.today.amount || 0).toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
            subtitle={`${stats?.payments.today.count || 0} payments`}
          />
          <StatCard
            title="Collection Rate"
            value={`${stats?.fees.collectionRate || 0}%`}
            icon={<TrendingUp className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="Fee Defaulters"
            value={stats?.fees.defaultersCount || 0}
            icon={<AlertCircle className="h-6 w-6" />}
            color="red"
          />
        </div>

        {/* Fee Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Fee Collection Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Expected</span>
                  <span>KES {(stats?.fees.expected || 0).toLocaleString()}</span>
                </div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Collected</span>
                  <span className="font-semibold text-green-600">
                    KES {(stats?.fees.collected || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Balance</span>
                  <span className="font-semibold text-red-600">
                    KES {(stats?.fees.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className="h-3 rounded-full bg-primary-600"
                  style={{ width: `${stats?.fees.collectionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Payments</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Today</span>
                <span className="font-semibold">
                  KES {(stats?.payments.today.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">
                  KES {(stats?.payments.week.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">
                  KES {(stats?.payments.month.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button className="flex items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-3 text-white transition hover:bg-primary-700">
              <Users className="h-5 w-5" />
              <span>Add Student</span>
            </button>
            <button className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-3 text-white transition hover:bg-green-700">
              <DollarSign className="h-5 w-5" />
              <span>Record Payment</span>
            </button>
            <button className="flex items-center justify-center space-x-2 rounded-lg bg-purple-600 px-4 py-3 text-white transition hover:bg-purple-700">
              <CheckCircle className="h-5 w-5" />
              <span>Send Reminders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <h3 className="mb-1 text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

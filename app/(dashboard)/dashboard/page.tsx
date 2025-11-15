"use client";

import { useEffect, useState } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your school overview.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.students.active || 0}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Today's Collection"
            value={`KES ${(stats?.payments.today.amount || 0).toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            subtitle={`${stats?.payments.today.count || 0} payments`}
          />
          <StatCard
            title="Collection Rate"
            value={`${stats?.fees.collectionRate || 0}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Fee Defaulters"
            value={stats?.fees.defaultersCount || 0}
            icon={<AlertCircle className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Fee Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Expected</span>
                  <span>KES {(stats?.fees.expected || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Collected</span>
                  <span className="text-green-600 font-semibold">
                    KES {(stats?.fees.collected || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Balance</span>
                  <span className="text-red-600 font-semibold">
                    KES {(stats?.fees.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full"
                  style={{ width: `${stats?.fees.collectionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
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
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition">
              <Users className="w-5 h-5" />
              <span>Add Student</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition">
              <DollarSign className="w-5 h-5" />
              <span>Record Payment</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition">
              <CheckCircle className="w-5 h-5" />
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
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

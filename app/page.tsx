import Link from "next/link";
import { CheckCircle, DollarSign, MessageSquare, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600"></div>
            <span className="text-xl font-bold text-gray-900">SchoolMS</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login" className="text-gray-600 transition hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary-600 px-4 py-2 text-white transition hover:bg-primary-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            Modern School Management
            <br />
            <span className="text-primary-600">Built for Kenya</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
            Streamline fee collection, improve parent communication, and manage your school
            efficiently with M-Pesa integration.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="rounded-lg bg-primary-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-primary-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-primary-600 bg-white px-8 py-3 text-lg font-semibold text-primary-600 transition hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 text-center shadow-md">
            <div className="mb-2 text-4xl font-bold text-primary-600">25%</div>
            <div className="text-gray-600">Increase in Fee Collection</div>
          </div>
          <div className="rounded-xl bg-white p-6 text-center shadow-md">
            <div className="mb-2 text-4xl font-bold text-primary-600">10hrs</div>
            <div className="text-gray-600">Saved per Week</div>
          </div>
          <div className="rounded-xl bg-white p-6 text-center shadow-md">
            <div className="mb-2 text-4xl font-bold text-primary-600">100%</div>
            <div className="text-gray-600">Parent Satisfaction</div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<DollarSign className="h-8 w-8" />}
              title="M-Pesa Integration"
              description="Parents pay fees directly via M-Pesa. Auto-reconciliation and instant receipts."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Student Management"
              description="Complete student records, attendance tracking, and academic management."
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="Parent Communication"
              description="Send SMS/WhatsApp notifications for fees, events, and announcements."
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8" />}
              title="Reports & Analytics"
              description="Real-time dashboards, fee reports, and performance analytics."
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <PricingCard
              name="Starter"
              price="KES 4,999"
              period="/month"
              features={[
                "Up to 100 students",
                "M-Pesa integration",
                "SMS notifications",
                "Basic reports",
                "Email support",
              ]}
            />
            <PricingCard
              name="Growth"
              price="KES 9,999"
              period="/month"
              features={[
                "Up to 300 students",
                "M-Pesa integration",
                "SMS + WhatsApp",
                "Advanced reports",
                "Priority support",
                "Parent portal",
              ]}
              highlighted
            />
            <PricingCard
              name="Professional"
              price="KES 19,999"
              period="/month"
              features={[
                "Up to 600 students",
                "All Growth features",
                "Multi-campus support",
                "Custom reports",
                "Dedicated support",
                "Training included",
              ]}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-2xl bg-primary-600 p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl opacity-90">
            Join hundreds of schools already using our platform
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-primary-600 transition hover:bg-gray-100"
          >
            Start Your Free Trial
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-gray-400">
            &copy; 2024 School Management System. Built for Kenyan schools.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div className="mb-4 text-primary-600">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white p-8 shadow-md ${
        highlighted ? "relative ring-2 ring-primary-600" : ""
      }`}
    >
      {highlighted && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform">
          <span className="rounded-full bg-primary-600 px-4 py-1 text-sm font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="mb-2 text-2xl font-bold text-gray-900">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600">{period}</span>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600">
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`block w-full rounded-lg py-3 text-center font-semibold transition ${
          highlighted
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

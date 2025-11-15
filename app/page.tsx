import Link from "next/link";
import { CheckCircle, DollarSign, MessageSquare, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">SchoolMS</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Modern School Management
            <br />
            <span className="text-primary-600">Built for Kenya</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline fee collection, improve parent communication, and manage
            your school efficiently with M-Pesa integration.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition border border-primary-600"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">25%</div>
            <div className="text-gray-600">Increase in Fee Collection</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">10hrs</div>
            <div className="text-gray-600">Saved per Week</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-gray-600">Parent Satisfaction</div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<DollarSign className="w-8 h-8" />}
              title="M-Pesa Integration"
              description="Parents pay fees directly via M-Pesa. Auto-reconciliation and instant receipts."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Student Management"
              description="Complete student records, attendance tracking, and academic management."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="Parent Communication"
              description="Send SMS/WhatsApp notifications for fees, events, and announcements."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Reports & Analytics"
              description="Real-time dashboards, fee reports, and performance analytics."
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="mt-20 bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of schools already using our platform
          </p>
          <Link
            href="/signup"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Start Your Free Trial
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
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
      className={`bg-white p-8 rounded-xl shadow-md ${
        highlighted ? "ring-2 ring-primary-600 relative" : ""
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn.email({
        email,
        password,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary-600"></div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your school account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-600"
              placeholder="you@school.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-600"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email/password login
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message || "Login failed");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  // Google OAuth login
  async function handleGoogleLogin() {
    await signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold gradient-text">
            OOTD AI
          </h1>
          <p className="mt-2 text-neutral-400">Welcome back, bestie</p>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleLogin}
          className="glass w-full rounded-xl px-4 py-3 font-medium text-white transition hover:bg-white/10 cursor-pointer"
        >
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-sm text-neutral-500">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-brand-purple focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-brand-purple focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-bg w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-purple hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

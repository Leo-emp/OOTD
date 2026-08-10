"use client";

import { useState } from "react";
import { signUp, signIn } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email/password signup
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signUp.email({ email, password, name });
    if (result.error) {
      setError(result.error.message || "Signup failed");
      setLoading(false);
    } else {
      // New users go straight to the style quiz
      router.push("/quiz");
    }
  }

  // Google OAuth signup
  async function handleGoogleSignup() {
    await signIn.social({ provider: "google", callbackURL: "/quiz" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold gradient-text">
            OOTD AI
          </h1>
          <p className="mt-2 text-neutral-400">
            Let&apos;s find your style DNA
          </p>
        </div>

        {/* Google sign-up */}
        <button
          onClick={handleGoogleSignup}
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
        <form onSubmit={handleEmailSignup} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-brand-purple focus:outline-none"
            required
          />
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
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-neutral-500 focus:border-brand-purple focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-bg w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-purple hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

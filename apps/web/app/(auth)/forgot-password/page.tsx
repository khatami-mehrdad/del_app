"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await resetPassword(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1C1410] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-serif italic text-3xl font-light text-gold-light mb-3">
            Del
          </h1>
          <div className="mt-10 mb-6">
            <p className="font-serif text-xl font-light text-white mb-3">
              Check your email
            </p>
            <p className="font-sans font-extralight text-sm text-white/40 leading-relaxed">
              We sent a password reset link to
            </p>
            <p className="font-sans font-light text-sm text-gold mt-1">
              {email}
            </p>
          </div>
          <p className="font-sans font-extralight text-xs text-white/25 leading-relaxed">
            Click the link in the email to set a new password.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block text-gold font-sans font-extralight text-xs tracking-[0.15em] uppercase underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1410] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-3xl font-light text-gold-light mb-1">
            Del
          </h1>
          <p className="font-sans font-extralight text-[10px] tracking-[0.3em] uppercase text-white/20">
            Reset password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-sans font-extralight text-sm text-white/40 leading-relaxed text-center">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-sans font-light text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors"
          />

          {error && (
            <p className="text-red-400 font-sans font-light text-xs text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-white py-3 rounded-full font-sans font-light text-xs tracking-[0.2em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {submitting ? "..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center mt-6 font-sans font-extralight text-xs text-white/30">
          <Link
            href="/login"
            className="text-gold underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

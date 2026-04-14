"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#1C1410] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-serif italic text-3xl font-light text-gold-light mb-3">
            Del
          </h1>
          <p className="font-serif text-xl font-light text-white mb-3">
            Password updated
          </p>
          <p className="font-sans font-extralight text-sm text-white/40 leading-relaxed">
            Your password has been changed. You can now sign in with your new
            password.
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-8 bg-gold text-white px-8 py-3 rounded-full font-sans font-light text-xs tracking-[0.2em] uppercase hover:bg-gold-light transition-colors"
          >
            Sign in
          </button>
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
            New password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-sans font-light text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
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
            {submitting ? "..." : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}

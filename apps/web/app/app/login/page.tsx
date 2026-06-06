"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClientAuth } from "../components/ClientAuthProvider";
import { supabase } from "@/lib/supabase";

export default function ClientLoginPage() {
  const router = useRouter();
  const { user, loading } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/app");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        router.replace("/app");
      }
    } catch {
      setError("Sign-in failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-bg">
        <p className="font-serif text-2xl font-light italic text-gold-light">del</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="mb-1 font-serif text-3xl font-light italic text-gold-light">
            del
          </h1>
          <p className="font-sans text-[10px] font-extralight uppercase tracking-[0.3em] text-white/20">
            Companion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm font-light text-white placeholder:text-white/25 transition-colors focus:border-gold/50 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm font-light text-white placeholder:text-white/25 transition-colors focus:border-gold/50 focus:outline-none"
          />

          {error && (
            <p className="text-center font-sans text-xs font-light text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center font-sans text-xs font-extralight text-white/30">
          <a
            href="/forgot-password"
            className="text-white/40 underline underline-offset-2 transition-colors hover:text-gold"
          >
            Forgot password?
          </a>
        </p>
      </div>
    </div>
  );
}

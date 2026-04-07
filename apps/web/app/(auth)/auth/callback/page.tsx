"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Phase = "loading" | "password" | "done" | "error";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const routed = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function applySession(session: Session | null) {
      if (!session || routed.current || cancelled) return;
      const role = session.user.user_metadata?.role as string | undefined;
      if (role === "client") {
        routed.current = true;
        setPhase("password");
        return;
      }
      routed.current = true;
      router.replace("/");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          applySession(session);
        }
      }
    );

    void (async () => {
      for (let i = 0; i < 12; i++) {
        if (cancelled || routed.current) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          applySession(session);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (!cancelled && !routed.current) {
        setPhase("error");
        setError(
          "This link is invalid or has expired. Ask your coach for a new invite."
        );
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSetPassword(e: React.FormEvent) {
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
    const { error: upErr } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setPhase("done");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
        <div className="text-center">
          <p className="animate-pulse font-serif text-xl italic text-gold-light">del</p>
          <p className="mt-4 font-sans text-xs font-extralight tracking-[0.2em] text-white/30">
            Finishing sign-in
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-6">
        <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
        <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/50">
          {error}
        </p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-8 text-gold font-sans font-extralight text-xs tracking-[0.15em] uppercase underline underline-offset-2"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-6">
        <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
        <p className="mb-2 font-serif text-xl font-light text-white">You&apos;re set</p>
        <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/45">
          Open the companion app on your phone and sign in with the same email and the
          password you just created.
        </p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="mt-10 rounded-full bg-gold px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="mb-1 font-serif text-3xl font-light italic text-gold-light">
            del
          </h1>
          <p className="font-sans text-[10px] font-extralight tracking-[0.3em] text-white/20 uppercase">
            Set your password
          </p>
        </div>
        <form onSubmit={handleSetPassword} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm font-light text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-sans text-sm font-light text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none"
          />
          {error && (
            <p className="text-center font-sans text-xs font-light text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold py-3 font-sans text-xs font-light tracking-[0.2em] text-white uppercase hover:bg-gold-light disabled:opacity-50"
          >
            {submitting ? "..." : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}

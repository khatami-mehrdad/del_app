"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Phase = "loading" | "launching" | "password" | "done" | "error";

function getInviteType(rawType: string | null): EmailOtpType | null {
  return rawType === "invite" ? rawType : null;
}

export function ClientInviteScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const inviteType = getInviteType(searchParams.get("type"));
  const [phase, setPhase] = useState<Phase>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [originFallback, setOriginFallback] = useState("");

  const queryString = useMemo(() => {
    if (!tokenHash || !inviteType) return "";
    return new URLSearchParams({
      token_hash: tokenHash,
      type: inviteType,
    }).toString();
  }, [inviteType, tokenHash]);

  /** HTTPS URL for universal / app links (primary open path on real devices). */
  const universalInviteUrl = useMemo(() => {
    if (!queryString) return "";
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || originFallback;
    if (!base) return "";
    return `${base}/client-invite?${queryString}`;
  }, [queryString, originFallback]);

  /** Custom scheme fallback when the OS does not hand off HTTPS to the app. */
  const appSchemeInviteUrl = useMemo(() => {
    if (!queryString) return null;
    return `del-companion://client-invite?${queryString}`;
  }, [queryString]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (tokenHash && inviteType) {
        setPhase("launching");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session?.user.user_metadata?.role === "client") {
        setPhase("done");
        return;
      }

      setPhase("error");
      setError("This invite link is invalid or incomplete. Ask your coach for a new invite.");
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [inviteType, tokenHash]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return;
    const id = requestAnimationFrame(() => {
      setOriginFallback(window.location.origin);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  async function handleContinueOnWeb() {
    if (!tokenHash || !inviteType) {
      setPhase("error");
      setError("This invite link is invalid or incomplete. Ask your coach for a new invite.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: inviteType,
    });
    setSubmitting(false);

    if (verifyError) {
      setPhase("error");
      setError(verifyError.message);
      return;
    }

    setPhase("password");
  }

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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPhase("done");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function openAppSchemeFallback() {
    if (appSchemeInviteUrl) {
      window.location.assign(appSchemeInviteUrl);
    } else {
      window.location.assign("del-companion://login");
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
        <div className="text-center">
          <p className="animate-pulse font-serif text-xl italic text-gold-light">del</p>
          <p className="mt-4 font-sans text-xs font-extralight tracking-[0.2em] text-white/30">
            Preparing your invite
          </p>
        </div>
      </div>
    );
  }

  if (phase === "launching") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
        <div className="w-full max-w-sm text-center">
          <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
          <p className="mb-3 font-serif text-xl font-light text-white">Open the companion app</p>
          <p className="mb-8 font-sans text-sm font-extralight leading-relaxed text-white/45">
            Tap below to open the del companion app on this device. On phones with the app
            installed, the same invite opens via your normal web link (universal link).
          </p>
          <div className="space-y-3">
            {universalInviteUrl ? (
              <a
                href={universalInviteUrl}
                className="block w-full rounded-full bg-gold py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
              >
                Open companion app
              </a>
            ) : (
              <button
                type="button"
                onClick={openAppSchemeFallback}
                className="w-full rounded-full bg-gold py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
              >
                Open companion app
              </button>
            )}
            {universalInviteUrl && appSchemeInviteUrl ? (
              <button
                type="button"
                onClick={openAppSchemeFallback}
                className="w-full rounded-full border border-white/10 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:border-gold/40"
              >
                Open with app link instead
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleContinueOnWeb()}
              disabled={submitting}
              className="w-full rounded-full border border-white/15 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white/85 hover:border-gold/50 disabled:opacity-50"
            >
              {submitting ? "..." : "Continue on web instead"}
            </button>
          </div>
          <p className="mt-8 font-sans text-xs font-extralight leading-relaxed text-white/25">
            Web is only a backup for onboarding. Your day-to-day client experience lives in
            the mobile app.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="mb-1 font-serif text-3xl font-light italic text-gold-light">
              del
            </h1>
            <p className="font-sans text-[10px] font-extralight tracking-[0.3em] text-white/20 uppercase">
              Client onboarding fallback
            </p>
          </div>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <p className="text-center font-sans text-sm font-extralight leading-relaxed text-white/45">
              Set your password here, then open the companion app and sign in with the
              same email.
            </p>

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
              className="w-full rounded-full bg-gold py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light disabled:opacity-50"
            >
              {submitting ? "..." : "Save password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-6">
        <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
        <p className="mb-3 font-serif text-xl font-light text-white">You&apos;re set</p>
        <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/45">
          Open the companion app on your phone and sign in with your new password.
        </p>
        <div className="mt-10 space-y-3">
          {universalInviteUrl ? (
            <a
              href={universalInviteUrl}
              className="block w-72 rounded-full bg-gold px-8 py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
            >
              Open companion app
            </a>
          ) : (
            <button
              type="button"
              onClick={openAppSchemeFallback}
              className="w-72 rounded-full bg-gold px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
            >
              Open companion app
            </button>
          )}
          {universalInviteUrl && appSchemeInviteUrl ? (
            <button
              type="button"
              onClick={openAppSchemeFallback}
              className="w-72 rounded-full border border-white/10 px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:border-gold/40"
            >
              Open with app link instead
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="w-72 rounded-full border border-white/15 px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white/85 hover:border-gold/50"
          >
            Sign out on web
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-6">
      <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
      <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/50">
        {error}
      </p>
      <button
        type="button"
        onClick={() => router.replace("/login")}
        className="mt-8 text-gold font-sans text-xs font-extralight uppercase tracking-[0.15em] underline underline-offset-2"
      >
        Back to coach sign in
      </button>
    </div>
  );
}

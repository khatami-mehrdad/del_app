"use client";

import { useEffect, useMemo, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
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
        // If the user just clicked the invite link, Supabase consumed the
        // token server-side and redirected here with an active session but
        // no password set yet. We set a `password_set` flag in user metadata
        // when the password form is submitted — if it's missing, show the
        // password form.
        if (!session.user.user_metadata?.password_set) {
          setPhase("password");
          return;
        }

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
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
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
          <p className="mb-3 font-serif text-xl font-light text-white">Welcome to del</p>
          <p className="mb-8 font-sans text-sm font-extralight leading-relaxed text-white/45">
            Your coach has invited you. Set up your password here, then download and sign
            into the companion app.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleContinueOnWeb()}
              disabled={submitting}
              className="w-full rounded-full bg-gold py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light disabled:opacity-50"
            >
              {submitting ? "..." : "Set up your account"}
            </button>
            {universalInviteUrl ? (
              <a
                href={universalInviteUrl}
                className="block w-full rounded-full border border-white/10 py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] text-white/50 hover:border-gold/40"
              >
                Already have the app? Open it
              </a>
            ) : null}
          </div>
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
              Client onboarding
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
    return <DoneScreen onSignOut={handleSignOut} />;
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

// ── Done screen with QR code for desktop → phone handoff ──

function getIsMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function useIsMobile() {
  // Safe for SSR: returns false on server, real value on client.
  return useMemo(() => getIsMobile(), []);
}

function DoneScreen({ onSignOut }: { onSignOut: () => void }) {
  const apkUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (apkUrl) {
      QRCode.toDataURL(apkUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#1C1410", light: "#FFFFFF" },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [apkUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1410] px-6">
      <p className="mb-2 font-serif text-3xl font-light italic text-gold-light">del</p>
      <p className="mb-3 font-serif text-xl font-light text-white">Your account is ready</p>

      {isMobile ? (
        <>
          <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/45">
            Download the companion app, install it, and sign in with your
            email and the password you just created.
          </p>
          {apkUrl ? (
            <a
              href={apkUrl}
              className="mt-8 block w-72 rounded-full bg-gold px-8 py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
            >
              Download the app
            </a>
          ) : null}
        </>
      ) : (
        <>
          <p className="max-w-sm text-center font-sans text-sm font-extralight leading-relaxed text-white/45">
            Scan this QR code with your phone camera to download the companion
            app. Then open it and sign in with your email and the password you
            just created.
          </p>
          {qrDataUrl ? (
            <div className="mt-8 rounded-2xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Scan to download the app" width={200} height={200} />
            </div>
          ) : apkUrl ? (
            <a
              href={apkUrl}
              className="mt-8 block w-72 rounded-full bg-gold px-8 py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] text-white hover:bg-gold-light"
            >
              Download the app
            </a>
          ) : null}
        </>
      )}

      <button
        type="button"
        onClick={() => void onSignOut()}
        className="mt-6 w-72 rounded-full border border-white/15 px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white/85 hover:border-gold/50"
      >
        Sign out on web
      </button>
    </div>
  );
}

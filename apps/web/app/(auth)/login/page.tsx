"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const hasImplicit =
      hash.includes("access_token") ||
      hash.includes("type=invite") ||
      hash.includes("type=signup") ||
      hash.includes("type=recovery");
    const hasPkce = search.includes("code=");
    if (hasImplicit || hasPkce) {
      window.location.replace(
        `${window.location.origin}/auth/callback${search}${hash}`
      );
    }
  }, []);
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === "login") {
      const result = await signIn(email, password);
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } else {
      const result = await signUp(email, password, fullName);
      setSubmitting(false);
      if (result.error) {
        setError(result.error);
      } else {
        setConfirmationSent(true);
      }
    }
  }

  if (confirmationSent) {
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
              We sent a confirmation link to
            </p>
            <p className="font-sans font-light text-sm text-gold mt-1">
              {email}
            </p>
          </div>
          <p className="font-sans font-extralight text-xs text-white/25 leading-relaxed">
            Click the link in the email to activate your account,
            then come back here to sign in.
          </p>
          <button
            onClick={() => {
              setConfirmationSent(false);
              setMode("login");
            }}
            className="mt-8 text-gold font-sans font-extralight text-xs tracking-[0.15em] uppercase underline underline-offset-2"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C1410] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-3xl font-light text-gold-light mb-1">
            Del
          </h1>
          <p className="font-sans font-extralight text-[10px] tracking-[0.3em] uppercase text-white/20">
            Coach Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-sans font-light text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-sans font-light text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
            {submitting
              ? "..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {mode === "login" && (
          <p className="text-center mt-4 font-sans font-extralight text-xs text-white/30">
            <a
              href="/forgot-password"
              className="text-white/40 underline underline-offset-2 hover:text-gold transition-colors"
            >
              Forgot password?
            </a>
          </p>
        )}

        <p className="text-center mt-4 font-sans font-extralight text-xs text-white/30">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-gold underline underline-offset-2"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-gold underline underline-offset-2"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

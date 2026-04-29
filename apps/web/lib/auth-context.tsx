"use client";

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@del/shared";
import { ProfileSchema } from "@del/shared";
import { useSupabaseAuth } from "@del/data";
import { supabase } from "./supabase";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const AUTH_TIMEOUT_MS = 15000;

async function withAuthTimeout<T>(request: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("auth-timeout"));
    }, AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function authRequestError(error: unknown): string {
  if (error instanceof Error && error.message === "auth-timeout") {
    return "Sign-in is taking longer than expected. Please check your connection and try again.";
  }

  return "Authentication failed. Please check your connection and try again.";
}

async function signIn(email: string, password: string) {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({ email, password })
    );
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: authRequestError(error) };
  }
}

async function signUp(email: string, password: string, fullName: string) {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "coach", full_name: fullName } },
      })
    );
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: authRequestError(error) };
  }
}

async function resetPassword(email: string) {
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback#type=recovery`,
      })
    );
    return { error: error?.message ?? null };
  } catch (error) {
    return { error: authRequestError(error) };
  }
}

async function recoverMissingProfile(session: Session): Promise<Profile | null> {
  const res = await fetch("/api/ensure-profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.profile ? ProfileSchema.parse(data.profile) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session, loading, signOut } = useSupabaseAuth(
    supabase,
    undefined,
    recoverMissingProfile
  );

  return (
    <AuthContext.Provider
      value={{ user, profile, session, loading, signIn, signUp, resetPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

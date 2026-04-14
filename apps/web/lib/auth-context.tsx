"use client";

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@del/shared";
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

async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

async function signUp(email: string, password: string, fullName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "coach", full_name: fullName } },
  });
  return { error: error?.message ?? null };
}

async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback#type=recovery`,
  });
  return { error: error?.message ?? null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session, loading, signOut } = useSupabaseAuth(supabase);

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

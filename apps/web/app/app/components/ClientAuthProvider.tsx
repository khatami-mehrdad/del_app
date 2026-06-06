"use client";

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, Program } from "@del/shared";
import { useSupabaseAuth } from "@del/data";
import { supabase } from "@/lib/supabase";

interface ClientAuthState {
  user: User | null;
  profile: Profile | null;
  program: Program | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthState | null>(null);

async function loadClientProgram(
  userId: string,
  _profile: Profile | null
): Promise<{ program: Program | null }> {
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("client_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return { program: (data as Program) ?? null };
}

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session, extras, loading, signOut } = useSupabaseAuth(
    supabase,
    loadClientProgram
  );

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        profile,
        program: extras?.program ?? null,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
}

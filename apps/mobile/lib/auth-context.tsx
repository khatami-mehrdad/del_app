import { createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, Program } from '@del/shared';
import { useSupabaseAuth } from '@del/data';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  program: Program | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProgram(userId: string, profile: Profile | null): Promise<Program | null> {
  if (profile?.role === 'coach') return null;
  const { data } = await supabase
    .from('programs')
    .select('*')
    .eq('client_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  return (data?.[0] as Program | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session, extras, loading, signOut } =
    useSupabaseAuth<Program>(supabase, loadProgram);

  return (
    <AuthContext.Provider
      value={{ user, profile, program: extras, session, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

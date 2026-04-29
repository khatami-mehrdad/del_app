import { createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, ProgramWithCoach } from '@del/shared';
import { useSupabaseAuth } from '@del/data';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  program: ProgramWithCoach | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadProgram(
  userId: string,
  profile: Profile | null
): Promise<ProgramWithCoach | null> {
  if (profile?.role === 'coach') return null;
  const { data } = await supabase
    .from('programs')
    .select('*, coach:profiles!programs_coach_id_fkey(*)')
    .eq('client_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  return (data?.[0] as ProgramWithCoach | null) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session, extras, loading, signOut } =
    useSupabaseAuth<ProgramWithCoach>(supabase, loadProgram);

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

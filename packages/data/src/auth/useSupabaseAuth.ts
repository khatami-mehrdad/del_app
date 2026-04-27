import { useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@del/shared';
import { fetchProfile } from '../queries/profile';
import type { SupabaseClient } from '../types';

export interface SupabaseAuthState<Extras> {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  extras: Extras | null;
  loading: boolean;
}

export type LoadExtras<Extras> = (
  userId: string,
  profile: Profile | null
) => Promise<Extras | null>;

const EMPTY = {
  user: null,
  profile: null,
  session: null,
  extras: null,
  loading: false,
} as const;

export function useSupabaseAuth<Extras = null>(
  supabase: SupabaseClient,
  loadExtras?: LoadExtras<Extras>
) {
  const [state, setState] = useState<SupabaseAuthState<Extras>>({
    ...EMPTY,
    loading: true,
  });

  const loadExtrasRef = useRef(loadExtras);
  loadExtrasRef.current = loadExtras;

  useEffect(() => {
    let cancelled = false;

    async function hydrate(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setState({ ...EMPTY });
        return;
      }
      try {
        const profile = await fetchProfile(supabase, session.user.id);
        const extras = loadExtrasRef.current
          ? await loadExtrasRef.current(session.user.id, profile)
          : null;
        if (cancelled) return;
        setState({
          user: session.user,
          profile,
          session,
          extras: (extras ?? null) as Extras | null,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setState({
          user: session.user,
          profile: null,
          session,
          extras: null,
          loading: false,
        });
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => hydrate(data.session))
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => hydrate(session));

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setState({ ...EMPTY });
  }

  return { ...state, signOut };
}

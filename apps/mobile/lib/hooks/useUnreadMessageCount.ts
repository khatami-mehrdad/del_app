import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { fetchUnreadMessageCount } from '@del/data';
import { supabase } from '../supabase';

export function useUnreadMessageCount(
  programId: string | undefined,
  userId: string | undefined
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!programId || !userId) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function refetch() {
      try {
        const value = await fetchUnreadMessageCount(supabase, programId!, userId!);
        if (!cancelled) setCount(value);
      } catch {
        // Keep last known count if the refetch fails.
      }
    }

    void refetch();

    const channel = supabase
      .channel(`unread-messages:${programId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `program_id=eq.${programId}`,
        },
        () => {
          if (!cancelled) void refetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !cancelled) void refetch();
      });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !cancelled) void refetch();
    });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      appStateSub.remove();
    };
  }, [programId, userId]);

  return count;
}

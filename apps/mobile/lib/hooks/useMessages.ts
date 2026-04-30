import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Message } from '@del/shared';
import { fetchMessages, subscribeToMessages } from '@del/data';
import { supabase } from '../supabase';

export function useMessages(programId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function refetch() {
      try {
        const data = await fetchMessages(supabase, programId!);
        if (!cancelled) setMessages(data);
      } catch (error) {
        console.warn('Failed to load messages:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    void refetch();

    const unsubscribe = subscribeToMessages(
      supabase,
      programId,
      (msg) => {
        if (!cancelled) {
          setMessages((prev) =>
            prev.some((existing) => existing.id === msg.id) ? prev : [...prev, msg]
          );
        }
      },
      // Refetch once the channel is live so messages inserted during the
      // subscribe handshake — or while Android suspended the socket — are
      // never dropped silently.
      (status) => {
        if (status === 'SUBSCRIBED' && !cancelled) void refetch();
      }
    );

    // Android can drop the realtime socket during Doze without firing a
    // status change before the app foregrounds, so refetch on resume too.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !cancelled) void refetch();
    });

    return () => {
      cancelled = true;
      unsubscribe();
      appStateSub.remove();
    };
  }, [programId]);

  return { messages, loading };
}

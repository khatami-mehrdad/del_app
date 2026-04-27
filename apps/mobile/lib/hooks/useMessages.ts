import { useEffect, useState } from 'react';
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

    setLoading(true);
    fetchMessages(supabase, programId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((error) => {
        console.warn('Failed to load messages:', error);
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeToMessages(supabase, programId, (msg) => {
      if (!cancelled) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [programId]);

  return { messages, loading };
}

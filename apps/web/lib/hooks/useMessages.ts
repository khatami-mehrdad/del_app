"use client";

import { useEffect, useState } from "react";
import type { Message } from "@del/shared";
import { fetchMessages, subscribeToMessages } from "@del/data";
import { supabase } from "../supabase";

export function useMessages(programId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    let cancelled = false;

    fetchMessages(supabase, programId).then((data) => {
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
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

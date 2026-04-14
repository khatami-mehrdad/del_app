"use client";

import { useCallback, useEffect, useState } from "react";
import type { JourneyEntry } from "@del/shared";
import { fetchJourneyEntries } from "@del/data";
import { supabase } from "../supabase";

export function useJourneyEntries(programId: string | null) {
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!programId) return;
    const data = await fetchJourneyEntries(supabase, programId);
    setEntries(data);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await refetch();
      if (cancelled) return;
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [refetch]);

  return { entries, loading, refetch };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Practice } from "@del/shared";
import { fetchPractice } from "@del/data";
import { supabase } from "../supabase";

export function usePractice(programId: string | null, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!programId) return;
    fetchPractice(supabase, programId, weekNumber).then((data) => {
      setPractice(data);
      setLoading(false);
    });
  }, [programId, weekNumber]);

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

  return { practice, loading, refetch };
}

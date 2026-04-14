"use client";

import { useEffect, useState } from "react";
import type { CheckIn } from "@del/shared";
import { fetchWeekCheckins } from "@del/data";
import { supabase } from "../supabase";

export function useCheckins(programId: string | null) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    fetchWeekCheckins(supabase, programId).then((data) => {
      setCheckins(data);
      setLoading(false);
    });
  }, [programId]);

  return { checkins, loading };
}

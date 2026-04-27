import { useEffect, useState } from 'react';
import type { Practice } from '@del/shared';
import { fetchPractice } from '@del/data';
import { supabase } from '../supabase';

export function usePractice(programId: string | undefined, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setPractice(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPractice(supabase, programId, weekNumber)
      .then((data) => {
        if (!cancelled) setPractice(data);
      })
      .catch((error) => {
        console.warn('Failed to load practice:', error);
        if (!cancelled) setPractice(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [programId, weekNumber]);

  return { practice, loading };
}

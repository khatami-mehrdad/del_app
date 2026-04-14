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
    fetchPractice(supabase, programId, weekNumber).then((data) => {
      setPractice(data);
      setLoading(false);
    });
  }, [programId, weekNumber]);

  return { practice, loading };
}

import { useCallback, useEffect, useState } from 'react';
import type { Practice } from '@del/shared';
import { fetchPractice } from '@del/data';
import { supabase } from '../supabase';

export function usePractice(programId: string | undefined, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!programId) {
      setPractice(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPractice(supabase, programId, weekNumber);
      setPractice(data);
    } catch (error) {
      console.warn('Failed to load practice:', error);
      setPractice(null);
    } finally {
      setLoading(false);
    }
  }, [programId, weekNumber]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { practice, loading, refetch };
}

import { useCallback, useEffect, useState } from 'react';
import type { CheckIn } from '@del/shared';
import { fetchWeekCheckins } from '@del/data';
import { supabase } from '../supabase';

export function useWeekCheckins(programId: string | undefined) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!programId) {
      setCheckins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWeekCheckins(supabase, programId);
      setCheckins(data);
    } catch (error) {
      console.warn('Failed to load check-ins:', error);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { checkins, loading, refetch };
}

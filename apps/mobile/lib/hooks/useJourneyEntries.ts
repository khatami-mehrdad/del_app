import { useEffect, useState } from 'react';
import type { JourneyEntry } from '@del/shared';
import { fetchJourneyEntries } from '@del/data';
import { supabase } from '../supabase';

export function useJourneyEntries(programId: string | undefined) {
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchJourneyEntries(supabase, programId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((error) => {
        console.warn('Failed to load journey entries:', error);
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  return { entries, loading };
}

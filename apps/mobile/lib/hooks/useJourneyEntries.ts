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
    fetchJourneyEntries(supabase, programId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [programId]);

  return { entries, loading };
}

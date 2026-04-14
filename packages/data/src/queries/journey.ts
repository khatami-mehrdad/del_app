import type { JourneyEntry } from '@del/shared';
import { JourneyEntrySchema } from '@del/shared';
import type { SupabaseClient } from '../types';

export async function fetchJourneyEntries(
  supabase: SupabaseClient,
  programId: string
): Promise<JourneyEntry[]> {
  const { data } = await supabase
    .from('journey_entries')
    .select('*')
    .eq('program_id', programId)
    .order('week_number', { ascending: false });

  return (data ?? []).map((row) => JourneyEntrySchema.parse(row));
}

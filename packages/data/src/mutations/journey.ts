import type { SupabaseClient } from '../types';

export async function saveJourneyEntry(
  supabase: SupabaseClient,
  programId: string,
  weekNumber: number,
  sessionDate: string,
  title: string,
  body: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('journey_entries').upsert(
    {
      program_id: programId,
      week_number: weekNumber,
      session_date: sessionDate,
      title,
      body,
    },
    { onConflict: 'program_id,week_number' }
  );
  return { error: error?.message ?? null };
}

import type { SupabaseClient } from '../types';

export async function postPractice(
  supabase: SupabaseClient,
  programId: string,
  weekNumber: number,
  title: string,
  description: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('practices').upsert(
    {
      program_id: programId,
      week_number: weekNumber,
      title,
      description,
    },
    { onConflict: 'program_id,week_number' }
  );
  return { error: error?.message ?? null };
}

import type { SupabaseClient } from '../types';

export async function markCheckinsRead(
  supabase: SupabaseClient,
  programId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('checkins')
    .update({ coach_read_at: new Date().toISOString() })
    .eq('program_id', programId)
    .is('coach_read_at', null);

  return { error: error?.message ?? null };
}

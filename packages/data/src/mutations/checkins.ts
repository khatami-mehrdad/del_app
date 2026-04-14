import type { SupabaseClient } from '../types';

export async function markCheckinsRead(
  supabase: SupabaseClient,
  programId: string
): Promise<void> {
  await supabase
    .from('checkins')
    .update({ coach_read_at: new Date().toISOString() })
    .eq('program_id', programId)
    .is('coach_read_at', null);
}

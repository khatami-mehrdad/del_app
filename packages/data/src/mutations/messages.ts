import type { SupabaseClient } from '../types';

export async function markMessagesRead(
  supabase: SupabaseClient,
  programId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('program_id', programId)
    .neq('sender_id', userId)
    .is('read_at', null);

  return { error: error?.message ?? null };
}

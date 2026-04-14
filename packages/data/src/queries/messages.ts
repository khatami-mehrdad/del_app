import type { Message } from '@del/shared';
import { MessageSchema } from '@del/shared';
import type { SupabaseClient } from '../types';

export async function fetchMessages(
  supabase: SupabaseClient,
  programId: string
): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: true });

  return (data ?? []).map((row) => MessageSchema.parse(row));
}

/**
 * Subscribe to new messages on a program's realtime channel.
 * Returns an unsubscribe function that removes the channel.
 */
export function subscribeToMessages(
  supabase: SupabaseClient,
  programId: string,
  onInsert: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${programId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `program_id=eq.${programId}`,
      },
      (payload) => {
        onInsert(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

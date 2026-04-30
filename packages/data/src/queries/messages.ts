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

export async function fetchUnreadMessageCount(
  supabase: SupabaseClient,
  programId: string,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId)
    .neq('sender_id', userId)
    .is('read_at', null);

  return count ?? 0;
}

/**
 * Subscribe to new messages on a program's realtime channel.
 * Returns an unsubscribe function that removes the channel.
 *
 * `onStatus` fires for each subscription state transition (`SUBSCRIBED`,
 * `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`). Callers should use it to refetch
 * after `SUBSCRIBED` so messages inserted during the subscribe handshake — or
 * while a backgrounded socket was reconnecting — are not lost.
 */
export function subscribeToMessages(
  supabase: SupabaseClient,
  programId: string,
  onInsert: (message: Message) => void,
  onStatus?: (status: string) => void
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
      async (payload) => {
        try {
          onInsert(MessageSchema.parse(payload.new));
        } catch (error) {
          const id = typeof payload.new.id === 'string' ? payload.new.id : null;
          if (!id) {
            console.warn('Ignoring malformed message realtime payload:', error);
            return;
          }

          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('id', id)
            .single();

          if (data) {
            onInsert(MessageSchema.parse(data));
          }
        }
      }
    )
    .subscribe((status) => {
      onStatus?.(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Practice, CheckIn, Message, JourneyEntry } from '@del/shared';

// ── Current week's practice ─────────────────────────────────

export function usePractice(programId: string | undefined, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;
    supabase
      .from('practices')
      .select('*')
      .eq('program_id', programId)
      .eq('week_number', weekNumber)
      .maybeSingle()
      .then(({ data }) => {
        setPractice(data as Practice | null);
        setLoading(false);
      });
  }, [programId, weekNumber]);

  return { practice, loading };
}

// ── This week's check-ins (for streak) ──────────────────────

export function useWeekCheckins(programId: string | undefined) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!programId) return;
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const mondayStr = monday.toISOString().split('T')[0];

    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('program_id', programId)
      .gte('checkin_date', mondayStr)
      .order('checkin_date', { ascending: true });

    setCheckins((data as CheckIn[]) ?? []);
    setLoading(false);
  }, [programId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { checkins, loading, refetch: fetch };
}

// ── Journey entries ─────────────────────────────────────────

export function useJourneyEntries(programId: string | undefined) {
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;
    supabase
      .from('journey_entries')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: false })
      .then(({ data }) => {
        setEntries((data as JourneyEntry[]) ?? []);
        setLoading(false);
      });
  }, [programId]);

  return { entries, loading };
}

// ── Messages with realtime ──────────────────────────────────

export function useMessages(programId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    supabase
      .from('messages')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      });

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
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [programId]);

  return { messages, loading };
}

// ── Mutations ───────────────────────────────────────────────

export async function submitCheckin(
  programId: string,
  clientId: string,
  text: string | null,
  practiceCompleted: boolean,
  voiceUri?: string,
  voiceDuration?: number
) {
  const today = new Date().toISOString().split('T')[0];
  let voiceUrl: string | null = null;

  if (voiceUri) {
    const fileName = `${programId}/${today}-${Date.now()}.m4a`;
    const response = await fetch(voiceUri);
    const blob = await response.blob();
    const { error: upErr } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, blob, { contentType: 'audio/m4a' });

    if (!upErr) {
      const { data } = supabase.storage.from('voice-notes').getPublicUrl(fileName);
      voiceUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from('checkins').upsert(
    {
      program_id: programId,
      client_id: clientId,
      content_text: text,
      practice_completed: practiceCompleted,
      checkin_date: today,
      voice_note_url: voiceUrl,
      voice_note_duration_sec: voiceDuration ?? null,
    },
    { onConflict: 'program_id,checkin_date' }
  );
  return { error: error?.message ?? null };
}

export async function markPracticeDone(
  programId: string,
  clientId: string
) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.from('checkins').upsert(
    {
      program_id: programId,
      client_id: clientId,
      practice_completed: true,
      checkin_date: today,
    },
    { onConflict: 'program_id,checkin_date' }
  );
  return { error: error?.message ?? null };
}

export async function sendMessage(
  programId: string,
  senderId: string,
  text: string
) {
  const { error } = await supabase.from('messages').insert({
    program_id: programId,
    sender_id: senderId,
    content_text: text,
  });
  return { error: error?.message ?? null };
}

export async function markMessagesRead(programId: string, userId: string) {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('program_id', programId)
    .neq('sender_id', userId)
    .is('read_at', null);
}

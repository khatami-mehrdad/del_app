import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Practice, CheckIn, Message, JourneyEntry } from '@del/shared';

// ── Current week's practice ─────────────────────────────────

export function usePractice(programId: string | undefined, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setPractice(null);
      setLoading(false);
      return;
    }
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
    if (!programId) {
      setCheckins([]);
      setLoading(false);
      return;
    }
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const mondayStr = monday.toISOString().split('T')[0];

    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('program_id', programId)
      .gte('checkin_date', mondayStr)
      .order('created_at', { ascending: false });

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
    if (!programId) {
      setEntries([]);
      setLoading(false);
      return;
    }
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
    if (!programId) {
      setMessages([]);
      setLoading(false);
      return;
    }

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
    const fileName = `checkins/${programId}/${today}-${Date.now()}.m4a`;
    const formData = new FormData();
    formData.append('', {
      uri: voiceUri,
      type: 'audio/mp4',
      name: `${Date.now()}.m4a`,
    } as unknown as Blob);

    const { error: upErr } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, formData, { contentType: 'audio/mp4' });

    if (upErr) {
      console.warn('Voice upload failed:', upErr.message);
    } else {
      const { data } = supabase.storage.from('voice-notes').getPublicUrl(fileName);
      voiceUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from('checkins').insert({
    program_id: programId,
    client_id: clientId,
    content_text: text,
    practice_completed: practiceCompleted,
    checkin_date: today,
    voice_note_url: voiceUrl,
    voice_note_duration_sec: voiceDuration ?? null,
  });
  return { error: error?.message ?? null };
}

export async function markPracticeDone(
  programId: string,
  clientId: string
) {
  const today = new Date().toISOString().split('T')[0];

  // Check if already marked complete today — avoid duplicates
  const { data: alreadyDone } = await supabase
    .from('checkins')
    .select('id')
    .eq('program_id', programId)
    .eq('checkin_date', today)
    .eq('practice_completed', true)
    .limit(1)
    .maybeSingle();

  if (alreadyDone) {
    return { error: null };
  }

  // Check for an existing incomplete check-in to update
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('program_id', programId)
    .eq('checkin_date', today)
    .eq('practice_completed', false)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('checkins')
      .update({ practice_completed: true })
      .eq('id', existing.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from('checkins').insert({
    program_id: programId,
    client_id: clientId,
    practice_completed: true,
    checkin_date: today,
  });
  return { error: error?.message ?? null };
}

export async function sendMessage(
  programId: string,
  senderId: string,
  text: string,
  voiceUri?: string,
  voiceDuration?: number
) {
  let voiceUrl: string | null = null;

  if (voiceUri) {
    const fileName = `messages/${programId}/${Date.now()}.m4a`;
    const formData = new FormData();
    formData.append('', {
      uri: voiceUri,
      type: 'audio/mp4',
      name: `${Date.now()}.m4a`,
    } as unknown as Blob);

    const { error: upErr } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, formData, { contentType: 'audio/mp4' });

    if (!upErr) {
      const { data } = supabase.storage.from('voice-notes').getPublicUrl(fileName);
      voiceUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from('messages').insert({
    program_id: programId,
    sender_id: senderId,
    content_text: text || null,
    voice_note_url: voiceUrl,
    voice_note_duration_sec: voiceDuration ?? null,
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

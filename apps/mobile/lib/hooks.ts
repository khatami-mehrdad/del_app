import { useEffect, useState, useCallback } from 'react';
import type { Practice, CheckIn, Message, JourneyEntry } from '@del/shared';
import {
  fetchPractice,
  fetchWeekCheckins,
  fetchMessages,
  subscribeToMessages,
  fetchJourneyEntries,
  markMessagesRead as sharedMarkMessagesRead,
} from '@del/data';
import { supabase } from './supabase';

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
    fetchPractice(supabase, programId, weekNumber).then((data) => {
      setPractice(data);
      setLoading(false);
    });
  }, [programId, weekNumber]);

  return { practice, loading };
}

// ── This week's check-ins (for streak) ──────────────────────

export function useWeekCheckins(programId: string | undefined) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!programId) {
      setCheckins([]);
      setLoading(false);
      return;
    }
    const data = await fetchWeekCheckins(supabase, programId);
    setCheckins(data);
    setLoading(false);
  }, [programId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { checkins, loading, refetch };
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
    fetchJourneyEntries(supabase, programId).then((data) => {
      setEntries(data);
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

    let cancelled = false;

    fetchMessages(supabase, programId).then((data) => {
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToMessages(supabase, programId, (msg) => {
      if (!cancelled) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
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
  return sharedMarkMessagesRead(supabase, programId, userId);
}

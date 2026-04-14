import { markMessagesRead as sharedMarkMessagesRead } from '@del/data';
import { supabase } from '../supabase';

async function uploadVoiceNote(
  folder: 'checkins' | 'messages',
  programId: string,
  voiceUri: string
): Promise<string | null> {
  const fileName = `${folder}/${programId}/${Date.now()}.m4a`;
  const formData = new FormData();
  formData.append('', {
    uri: voiceUri,
    type: 'audio/mp4',
    name: `${Date.now()}.m4a`,
  } as unknown as Blob);

  const { error } = await supabase.storage
    .from('voice-notes')
    .upload(fileName, formData, { contentType: 'audio/mp4' });

  if (error) {
    console.warn('Voice upload failed:', error.message);
    return null;
  }
  return supabase.storage.from('voice-notes').getPublicUrl(fileName).data.publicUrl;
}

export async function submitCheckin(
  programId: string,
  clientId: string,
  text: string | null,
  practiceCompleted: boolean,
  voiceUri?: string,
  voiceDuration?: number
) {
  const today = new Date().toISOString().split('T')[0];
  const voiceUrl = voiceUri ? await uploadVoiceNote('checkins', programId, voiceUri) : null;

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

export async function markPracticeDone(programId: string, clientId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: alreadyDone } = await supabase
    .from('checkins')
    .select('id')
    .eq('program_id', programId)
    .eq('checkin_date', today)
    .eq('practice_completed', true)
    .limit(1)
    .maybeSingle();

  if (alreadyDone) return { error: null };

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
  const voiceUrl = voiceUri ? await uploadVoiceNote('messages', programId, voiceUri) : null;

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

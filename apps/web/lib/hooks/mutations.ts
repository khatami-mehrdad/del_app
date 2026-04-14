"use client";

import {
  markMessagesRead,
  markCheckinsRead,
  postPractice,
  saveJourneyEntry,
} from "@del/data";
import { supabase } from "../supabase";

export { type ClientListItem } from "./useClients";

export async function sendMessage(
  programId: string,
  senderId: string,
  text: string,
  voiceBlob?: Blob,
  voiceDuration?: number
) {
  let voiceUrl: string | null = null;

  if (voiceBlob) {
    const fileName = `messages/${programId}/${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage
      .from("voice-notes")
      .upload(fileName, voiceBlob, { contentType: "audio/webm" });

    if (!upErr) {
      const { data } = supabase.storage.from("voice-notes").getPublicUrl(fileName);
      voiceUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from("messages").insert({
    program_id: programId,
    sender_id: senderId,
    content_text: text || null,
    voice_note_url: voiceUrl,
    voice_note_duration_sec: voiceDuration ?? null,
  });
  return { error: error?.message ?? null };
}

export async function inviteClient(
  coachId: string,
  clientEmail: string,
  clientName: string,
  startDate: string
) {
  const { data, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    clientEmail,
    { data: { role: "client", full_name: clientName } }
  );
  if (authError) return { error: authError.message };

  const { error: progError } = await supabase.from("programs").insert({
    coach_id: coachId,
    client_id: data.user.id,
    start_date: startDate,
  });

  return { error: progError?.message ?? null };
}

// Re-export shared mutations pre-bound to the web supabase client
export function webMarkMessagesRead(programId: string, userId: string) {
  return markMessagesRead(supabase, programId, userId);
}

export function webMarkCheckinsRead(programId: string) {
  return markCheckinsRead(supabase, programId);
}

export function webPostPractice(
  programId: string,
  weekNumber: number,
  title: string,
  description: string
) {
  return postPractice(supabase, programId, weekNumber, title, description);
}

export function webSaveJourneyEntry(
  programId: string,
  weekNumber: number,
  sessionDate: string,
  title: string,
  body: string
) {
  return saveJourneyEntry(supabase, programId, weekNumber, sessionDate, title, body);
}

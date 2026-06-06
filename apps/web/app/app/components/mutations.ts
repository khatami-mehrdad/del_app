import { markMessagesRead as sharedMarkMessagesRead } from "@del/data";
import { supabase } from "@/lib/supabase";

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function uploadVoiceNote(
  folder: "checkins" | "messages",
  programId: string,
  blob: Blob
): Promise<string | null> {
  const fileName = `${folder}/${programId}/${Date.now()}.webm`;
  const { error } = await supabase.storage
    .from("voice-notes")
    .upload(fileName, blob, { contentType: "audio/webm" });

  if (error) {
    console.warn("Voice upload failed:", error.message);
    return null;
  }
  return supabase.storage.from("voice-notes").getPublicUrl(fileName).data.publicUrl;
}

export async function submitCheckin(
  programId: string,
  clientId: string,
  text: string | null,
  practiceCompleted: boolean,
  voiceBlob?: Blob | null,
  voiceDuration?: number
) {
  const today = localDateString();
  const voiceUrl = voiceBlob ? await uploadVoiceNote("checkins", programId, voiceBlob) : null;
  if (voiceBlob && !voiceUrl) {
    return { error: "Voice note upload failed. Please try again." };
  }

  const { error } = await supabase.from("checkins").insert({
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
  const today = localDateString();

  const { data: alreadyDone } = await supabase
    .from("checkins")
    .select("id")
    .eq("program_id", programId)
    .eq("checkin_date", today)
    .eq("practice_completed", true)
    .limit(1)
    .maybeSingle();

  if (alreadyDone) return { error: null };

  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("program_id", programId)
    .eq("checkin_date", today)
    .eq("practice_completed", false)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("checkins")
      .update({ practice_completed: true })
      .eq("id", existing.id);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase.from("checkins").insert({
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
  voiceBlob?: Blob | null,
  voiceDuration?: number
) {
  const voiceUrl = voiceBlob ? await uploadVoiceNote("messages", programId, voiceBlob) : null;
  if (voiceBlob && !voiceUrl) {
    return { error: "Voice note upload failed. Please try again." };
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

export function markMessagesRead(programId: string, userId: string) {
  return sharedMarkMessagesRead(supabase, programId, userId);
}

import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@del/supabase';

export type SupabaseClient = BaseSupabaseClient<Database>;

export interface VoiceNoteHook {
  recording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<unknown>;
  reset: () => void;
}

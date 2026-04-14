export type UserRole = 'coach' | 'client';
export type ProgramStatus = 'active' | 'completed' | 'paused';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  coach_id: string;
  client_id: string;
  total_sessions: number;
  total_months: number;
  start_date: string;
  status: ProgramStatus;
  created_at: string;
}

export interface Practice {
  id: string;
  program_id: string;
  week_number: number;
  title: string;
  description: string;
  posted_at: string;
}

export interface CheckIn {
  id: string;
  program_id: string;
  client_id: string;
  content_text: string | null;
  voice_note_url: string | null;
  voice_note_duration_sec: number | null;
  practice_completed: boolean;
  checkin_date: string;
  coach_read_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  program_id: string;
  sender_id: string;
  content_text: string | null;
  voice_note_url: string | null;
  voice_note_duration_sec: number | null;
  read_at: string | null;
  created_at: string;
}

export interface JourneyEntry {
  id: string;
  program_id: string;
  week_number: number;
  session_date: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
}

/** Joined types for UI convenience */

export interface ProgramWithClient extends Program {
  client: Profile;
}

export interface ProgramWithCoach extends Program {
  coach: Profile;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

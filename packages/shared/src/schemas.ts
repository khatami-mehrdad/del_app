import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  role: z.enum(['coach', 'client']),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
});

export const ProgramSchema = z.object({
  id: z.string(),
  coach_id: z.string(),
  client_id: z.string(),
  total_sessions: z.number(),
  total_months: z.number(),
  start_date: z.string(),
  status: z.enum(['active', 'completed', 'paused']),
  created_at: z.string(),
});

export const PracticeSchema = z.object({
  id: z.string(),
  program_id: z.string(),
  week_number: z.number(),
  title: z.string(),
  description: z.string(),
  posted_at: z.string(),
});

export const CheckInSchema = z.object({
  id: z.string(),
  program_id: z.string(),
  client_id: z.string(),
  content_text: z.string().nullable(),
  voice_note_url: z.string().nullable(),
  voice_note_duration_sec: z.number().nullable(),
  practice_completed: z.boolean(),
  checkin_date: z.string(),
  coach_read_at: z.string().nullable(),
  created_at: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  program_id: z.string(),
  sender_id: z.string(),
  content_text: z.string().nullable(),
  voice_note_url: z.string().nullable(),
  voice_note_duration_sec: z.number().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export const JourneyEntrySchema = z.object({
  id: z.string(),
  program_id: z.string(),
  week_number: z.number(),
  session_date: z.string(),
  title: z.string(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PushTokenSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token: z.string(),
  platform: z.enum(['ios', 'android']),
  created_at: z.string(),
});

-- ============================================================
-- del companion app — seed data
-- Matches the mockup: Sahar (coach) with 3 clients
-- ============================================================

-- NOTE: In production, users are created through Supabase Auth.
-- This seed creates profiles directly for local development.
-- Use fixed UUIDs so foreign keys are predictable.

-- Coach: Sahar
INSERT INTO profiles (id, role, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'coach', 'Sahar Shams');

-- Clients
INSERT INTO profiles (id, role, full_name) VALUES
  ('00000000-0000-0000-0000-000000000010', 'client', 'Layla'),
  ('00000000-0000-0000-0000-000000000020', 'client', 'Mina'),
  ('00000000-0000-0000-0000-000000000030', 'client', 'Sara');

-- Programs
INSERT INTO programs (id, coach_id, client_id, total_sessions, total_months, start_date, status) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000010',
   12, 3, '2026-03-06', 'active'),

  ('00000000-0000-0000-0001-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000020',
   12, 3, '2026-01-30', 'active'),

  ('00000000-0000-0000-0001-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000030',
   12, 3, '2026-03-27', 'active');

-- ── Layla's data (Week 4, Month 1) ─────────────────────────

-- Practices
INSERT INTO practices (program_id, week_number, title, description) VALUES
  ('00000000-0000-0000-0001-000000000001', 4,
   'Three breaths before you open your eyes',
   'Before the world touches you — three long exhales. Place one hand on your heart. Notice what is present before you name it. This is yours for this week.'),
  ('00000000-0000-0000-0001-000000000001', 3,
   'Name one thing your body is holding',
   'Each morning, before you reach for your phone, place both hands on your belly. Ask: what are you holding today? You don''t need to fix it. Just name it.'),
  ('00000000-0000-0000-0001-000000000001', 2,
   'Arrive in your body',
   'Three times today, pause. Feel your feet on the ground. Feel the weight of your hands. Take one breath that is just for you.');

-- Check-ins (this week for Layla)
INSERT INTO checkins (program_id, client_id, content_text, practice_completed, checkin_date) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000010',
   'Woke up anxious. Did the breath practice anyway. It helped more than I expected.',
   true, '2026-03-30'),

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000010',
   'Felt my shoulders drop during the morning practice. First time I noticed that.',
   true, '2026-03-31'),

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000010',
   NULL, true, '2026-04-01');

-- The Wednesday check-in was a voice note
UPDATE checkins
SET voice_note_url = 'voice-notes/layla-checkin-wed.m4a',
    voice_note_duration_sec = 42
WHERE checkin_date = '2026-04-01'
  AND program_id = '00000000-0000-0000-0001-000000000001';

-- Messages between Sahar and Layla
INSERT INTO messages (program_id, sender_id, content_text, created_at) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   NULL,
   '2026-03-31 08:42:00+00');

-- First message was a voice note from Sahar
UPDATE messages
SET voice_note_url = 'voice-notes/sahar-msg-tue.m4a',
    voice_note_duration_sec = 84
WHERE created_at = '2026-03-31 08:42:00+00'
  AND program_id = '00000000-0000-0000-0001-000000000001';

INSERT INTO messages (program_id, sender_id, content_text, created_at) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000010',
   'That voice note cracked something open. I cried for the first time in weeks.',
   '2026-03-31 14:15:00+00'),

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000010',
   'I did my practice this morning. Something felt different — lighter.',
   '2026-04-02 08:03:00+00'),

  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'That lightness is yours. It was always there — we just cleared some of the way to it. Bring this to our session tomorrow.',
   '2026-04-02 09:11:00+00');

-- Journey entries (Sahar writes these after each session)
INSERT INTO journey_entries (program_id, week_number, session_date, title, body) VALUES
  ('00000000-0000-0000-0001-000000000001', 4, '2026-04-03',
   'The protector who never rests',
   'Today we met the part of you that has been holding everything together for years. She is exhausted. For the first time, she felt seen rather than managed. Your body softened in the last ten minutes of our session in a way I haven''t seen before.'),

  ('00000000-0000-0000-0001-000000000001', 3, '2026-03-27',
   'She is allowed to want things',
   'Something opened when we followed the tightness in your chest. A younger part surfaced — the one who learned early that her needs were too much. She is not too much. She never was.'),

  ('00000000-0000-0000-0001-000000000001', 2, '2026-03-20',
   'Arriving in the body',
   'Your nervous system is beginning to remember what safety feels like. The breath practice you''ve been doing is working — you arrived to today''s session already more settled than week one.');

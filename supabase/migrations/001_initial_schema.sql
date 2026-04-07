-- ============================================================
-- del companion app — initial schema
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('coach', 'client');
CREATE TYPE program_status AS ENUM ('active', 'completed', 'paused');

-- ============================================================
-- STEP 1: CREATE ALL TABLES
-- ============================================================

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  full_name  text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_sessions int NOT NULL DEFAULT 12,
  total_months   int NOT NULL DEFAULT 3,
  start_date     date NOT NULL,
  status         program_status NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_coach_client UNIQUE (coach_id, client_id)
);

CREATE TABLE practices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  title       text NOT NULL,
  description text NOT NULL,
  posted_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_practice_per_week UNIQUE (program_id, week_number)
);

CREATE TABLE checkins (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  client_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text            text,
  voice_note_url          text,
  voice_note_duration_sec int,
  practice_completed      boolean NOT NULL DEFAULT false,
  checkin_date            date NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  -- Multiple check-ins per day allowed
);

CREATE TABLE messages (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  sender_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text            text,
  voice_note_url          text,
  voice_note_duration_sec int,
  read_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_program_created ON messages(program_id, created_at);

CREATE TABLE journey_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number  int NOT NULL,
  session_date date NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_journey_per_week UNIQUE (program_id, week_number)
);

CREATE TABLE push_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      text NOT NULL,
  platform   text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_token UNIQUE (token)
);

-- ============================================================
-- STEP 2: HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION is_program_participant(p_program_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM programs
    WHERE id = p_program_id
      AND (coach_id = auth.uid() OR client_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER journey_entries_updated_at
  BEFORE UPDATE ON journey_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: ALL RLS POLICIES (tables all exist now)
-- ============================================================

-- profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Coaches can read their clients profiles"
  ON profiles FOR SELECT USING (
    id IN (SELECT client_id FROM programs WHERE coach_id = auth.uid())
  );

CREATE POLICY "Clients can read their coach profile"
  ON profiles FOR SELECT USING (
    id IN (SELECT coach_id FROM programs WHERE client_id = auth.uid())
  );

-- programs
CREATE POLICY "Coaches see their programs"
  ON programs FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Clients see their programs"
  ON programs FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Coaches can create programs"
  ON programs FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their programs"
  ON programs FOR UPDATE USING (coach_id = auth.uid());

-- practices
CREATE POLICY "Participants can read practices"
  ON practices FOR SELECT USING (is_program_participant(program_id));

CREATE POLICY "Coaches can create practices"
  ON practices FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM programs WHERE id = program_id AND coach_id = auth.uid())
  );

CREATE POLICY "Coaches can update practices"
  ON practices FOR UPDATE USING (
    EXISTS (SELECT 1 FROM programs WHERE id = program_id AND coach_id = auth.uid())
  );

-- checkins
CREATE POLICY "Participants can read checkins"
  ON checkins FOR SELECT USING (is_program_participant(program_id));

CREATE POLICY "Clients can create their checkins"
  ON checkins FOR INSERT WITH CHECK (client_id = auth.uid() AND is_program_participant(program_id));

CREATE POLICY "Clients can update their checkins"
  ON checkins FOR UPDATE USING (client_id = auth.uid());

-- messages
CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT USING (is_program_participant(program_id));

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND is_program_participant(program_id));

CREATE POLICY "Recipients can mark messages read"
  ON messages FOR UPDATE USING (is_program_participant(program_id) AND sender_id != auth.uid());

-- journey_entries
CREATE POLICY "Participants can read journey entries"
  ON journey_entries FOR SELECT USING (is_program_participant(program_id));

CREATE POLICY "Coaches can create journey entries"
  ON journey_entries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM programs WHERE id = program_id AND coach_id = auth.uid())
  );

CREATE POLICY "Coaches can update journey entries"
  ON journey_entries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM programs WHERE id = program_id AND coach_id = auth.uid())
  );

-- push_tokens
CREATE POLICY "Users manage own push tokens"
  ON push_tokens FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- STEP 5: STORAGE, REALTIME, AUTH TRIGGER
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', false);

CREATE POLICY "Authenticated users can upload voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-notes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read voice notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-notes' AND auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

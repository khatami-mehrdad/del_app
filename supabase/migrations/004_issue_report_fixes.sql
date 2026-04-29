-- Fixes from the repo issue audit: tighten check-in updates and make stored
-- voice-note URLs reachable through Supabase public object URLs.

DROP POLICY IF EXISTS "Clients can update their checkins" ON checkins;

CREATE POLICY "Clients can update their checkins"
  ON checkins FOR UPDATE
  USING (client_id = auth.uid() AND is_program_participant(program_id))
  WITH CHECK (client_id = auth.uid() AND is_program_participant(program_id));

UPDATE storage.buckets
SET public = true
WHERE id = 'voice-notes';

CREATE INDEX IF NOT EXISTS idx_checkins_program_date
  ON checkins(program_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_journey_entries_program_week
  ON journey_entries(program_id, week_number);

CREATE INDEX IF NOT EXISTS idx_practices_program_week
  ON practices(program_id, week_number);

CREATE OR REPLACE FUNCTION notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  fn_url  text := current_setting('app.settings.edge_function_url', true);
  svc_key text := current_setting('app.settings.service_role_key', true);
  payload jsonb;
BEGIN
  IF fn_url IS NULL OR fn_url = '' THEN
    RAISE WARNING 'Skipping push notification: app.settings.edge_function_url is not configured';
    RETURN NEW;
  END IF;

  IF svc_key IS NULL OR svc_key = '' THEN
    RAISE WARNING 'Skipping push notification: app.settings.service_role_key is not configured';
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type',       'INSERT',
    'table',      TG_TABLE_NAME,
    'schema',     TG_TABLE_SCHEMA,
    'record',     to_jsonb(NEW),
    'old_record', NULL
  );

  PERFORM net.http_post(
    url     := fn_url,
    body    := payload,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || svc_key
    )
  );

  RETURN NEW;
END;
$$;

ALTER TABLE checkins
  ADD CONSTRAINT checkins_voice_note_fields_paired
  CHECK ((voice_note_url IS NULL) = (voice_note_duration_sec IS NULL))
  NOT VALID;

ALTER TABLE messages
  ADD CONSTRAINT messages_voice_note_fields_paired
  CHECK ((voice_note_url IS NULL) = (voice_note_duration_sec IS NULL))
  NOT VALID;

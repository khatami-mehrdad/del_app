-- ============================================================
-- Push notification triggers
--
-- Fires the send-push Edge Function on INSERT for messages,
-- practices, and journey_entries.
--
-- The deployed trigger hardcodes fn_url and svc_key. Update the
-- values below (or via CREATE OR REPLACE after applying) to match
-- your project.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  fn_url  text := 'https://zqvxstbkrybtiyyufhyx.supabase.co/functions/v1/send-push';
  svc_key text := current_setting('app.settings.service_role_key', true);
  payload jsonb;
BEGIN
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
      'Authorization', 'Bearer ' || coalesce(svc_key, '')
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert_push
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_push();

CREATE TRIGGER on_practice_insert_push
  AFTER INSERT ON practices
  FOR EACH ROW
  EXECUTE FUNCTION notify_push();

CREATE TRIGGER on_journey_entry_insert_push
  AFTER INSERT ON journey_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_push();

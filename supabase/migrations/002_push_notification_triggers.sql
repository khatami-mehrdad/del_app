-- ============================================================
-- Push notification triggers
--
-- Fires the send-push Edge Function on INSERT for messages,
-- practices, and journey_entries.
--
-- SETUP (one-time, via Supabase Dashboard → Project Settings):
--   ALTER DATABASE postgres SET app.settings.edge_function_url =
--     'https://<project-ref>.supabase.co/functions/v1/send-push';
--   ALTER DATABASE postgres SET app.settings.service_role_key =
--     '<your-service-role-key>';
--
-- Or configure via Dashboard → Database → Webhooks as an
-- alternative to this migration.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  fn_url  text;
  svc_key text;
  payload jsonb;
BEGIN
  fn_url  := current_setting('app.settings.edge_function_url', true);
  svc_key := current_setting('app.settings.service_role_key', true);

  IF fn_url IS NULL OR fn_url = '' THEN
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

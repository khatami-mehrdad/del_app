-- Use Supabase's modern secret API keys for database-triggered push calls.
-- The actual sb_secret_* value is configured as a database setting, not stored
-- in migration history.

CREATE OR REPLACE FUNCTION notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  fn_url  text := current_setting('app.settings.edge_function_url', true);
  api_key text := current_setting('app.settings.edge_function_api_key', true);
  payload jsonb;
BEGIN
  IF fn_url IS NULL OR fn_url = '' THEN
    RAISE WARNING 'Skipping push notification: app.settings.edge_function_url is not configured';
    RETURN NEW;
  END IF;

  IF api_key IS NULL OR api_key = '' THEN
    RAISE WARNING 'Skipping push notification: app.settings.edge_function_api_key is not configured';
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
      'Content-Type', 'application/json',
      'apikey',       api_key
    )
  );

  RETURN NEW;
END;
$$;

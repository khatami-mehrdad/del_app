-- Store runtime push settings in a locked table so CI/API automation can update
-- the secret value without requiring ALTER DATABASE privileges.

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE app_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE app_settings TO service_role;

INSERT INTO app_settings (key, value)
VALUES (
  'edge_function_url',
  'https://zqvxstbkrybtiyyufhyx.supabase.co/functions/v1/send-push'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

CREATE OR REPLACE FUNCTION notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
  fn_url  text;
  api_key text;
  payload jsonb;
BEGIN
  SELECT value INTO fn_url
  FROM app_settings
  WHERE key = 'edge_function_url';

  SELECT value INTO api_key
  FROM app_settings
  WHERE key = 'edge_function_api_key';

  IF fn_url IS NULL OR fn_url = '' THEN
    RAISE WARNING 'Skipping push notification: edge_function_url is not configured';
    RETURN NEW;
  END IF;

  IF api_key IS NULL OR api_key = '' THEN
    RAISE WARNING 'Skipping push notification: edge_function_api_key is not configured';
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

import type { SupabaseClient } from '../types';

/** Retrieve the current session's access token, or null if expired/missing. */
export async function getAccessToken(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? null;
}

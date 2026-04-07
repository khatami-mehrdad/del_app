import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: { localStorage?: any }
) {
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      ...(options?.localStorage && { storage: options.localStorage }),
    },
  });
}

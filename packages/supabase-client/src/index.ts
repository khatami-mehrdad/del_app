import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: {
    localStorage?: {
      getItem(key: string): string | null | Promise<string | null>;
      setItem(key: string, value: string): void | Promise<void>;
      removeItem(key: string): void | Promise<void>;
    };
    detectSessionInUrl?: boolean;
  }
) {
  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      ...(options?.detectSessionInUrl !== undefined
        ? { detectSessionInUrl: options.detectSessionInUrl }
        : {}),
      ...(options?.localStorage ? { storage: options.localStorage } : {}),
    },
  });
}

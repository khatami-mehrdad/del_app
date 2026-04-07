import { createSupabaseClient } from '@del/supabase';

export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { detectSessionInUrl: true }
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@del/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in the app build environment.'
    : null;

// Use a harmless fallback so missing build env does not crash the app before React can render.
export const supabase = createSupabaseClient(
  supabaseUrl ?? 'https://example.invalid',
  supabaseAnonKey ?? 'invalid-anon-key',
  { localStorage: AsyncStorage }
);

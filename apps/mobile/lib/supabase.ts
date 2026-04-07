import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@del/supabase';

export const supabase = createSupabaseClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { localStorage: AsyncStorage }
);

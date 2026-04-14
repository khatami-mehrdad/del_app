import type { Profile } from '@del/shared';
import { ProfileSchema } from '@del/shared';
import type { SupabaseClient } from '../types';

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return data ? ProfileSchema.parse(data) : null;
}

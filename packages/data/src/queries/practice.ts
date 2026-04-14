import type { Practice } from '@del/shared';
import { PracticeSchema } from '@del/shared';
import type { SupabaseClient } from '../types';

export async function fetchPractice(
  supabase: SupabaseClient,
  programId: string,
  weekNumber: number
): Promise<Practice | null> {
  const { data } = await supabase
    .from('practices')
    .select('*')
    .eq('program_id', programId)
    .eq('week_number', weekNumber)
    .maybeSingle();

  return data ? PracticeSchema.parse(data) : null;
}

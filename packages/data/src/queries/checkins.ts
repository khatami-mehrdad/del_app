import type { CheckIn } from '@del/shared';
import { CheckInSchema } from '@del/shared';
import type { SupabaseClient } from '../types';

/** Returns the Monday of the current week as YYYY-MM-DD. */
export function weekStartDate(): string {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export async function fetchWeekCheckins(
  supabase: SupabaseClient,
  programId: string
): Promise<CheckIn[]> {
  const mondayStr = weekStartDate();

  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('program_id', programId)
    .gte('checkin_date', mondayStr)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => CheckInSchema.parse(row));
}

import type { CheckIn } from '@del/shared';

export const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function getDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function getTodayIndex(): number {
  return (new Date().getDay() + 6) % 7; // 0=Mon
}

export function buildStreakDone(checkins: CheckIn[], todayIndex: number): boolean[] {
  return DAYS.map((_, i) => {
    const monday = new Date();
    monday.setDate(monday.getDate() - todayIndex + i);
    const dateStr = monday.toISOString().split('T')[0];
    return checkins.some(
      (c) => c.checkin_date === dateStr && c.practice_completed
    );
  });
}

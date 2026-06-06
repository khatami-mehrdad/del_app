import type { CheckIn } from "@del/shared";

export const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}

export function getDayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export function getTodayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildStreakDone(checkins: CheckIn[], todayIndex: number): boolean[] {
  return DAYS.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - todayIndex + i);
    const dateStr = localDateString(d);
    return checkins.some((c) => c.checkin_date === dateStr && c.practice_completed);
  });
}

export function getCurrentWeek(startDate: string, totalSessions: number): number {
  const weeksSinceStart = Math.max(
    1,
    Math.ceil((Date.now() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
  );
  return Math.min(weeksSinceStart, totalSessions);
}

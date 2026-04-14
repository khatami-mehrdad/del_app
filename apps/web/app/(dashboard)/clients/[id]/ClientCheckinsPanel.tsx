"use client";

import type { CheckIn } from "@del/shared";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Props {
  checkins: CheckIn[];
}

export function ClientCheckinsPanel({ checkins }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 border border-cream-mid">
      <p className="font-sans font-light text-xs tracking-[0.25em] uppercase text-gold mb-5">
        This week&apos;s check-ins
      </p>
      {checkins.length === 0 ? (
        <p className="font-sans font-light text-base text-brown-light/50">
          No check-ins yet this week
        </p>
      ) : (
        <div className="divide-y divide-cream-mid">
          {checkins.map((ci) => {
            const created = new Date(ci.created_at);
            const dayName = DAY_NAMES[created.getDay()];
            const time = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            return (
              <div key={ci.id} className="py-4 first:pt-0 last:pb-0">
                <p className="font-sans font-light text-xs tracking-[0.15em] uppercase text-brown-light mb-1">
                  {dayName} · {time}
                </p>
                <p className="font-sans font-light text-base text-brown-mid leading-relaxed">
                  {ci.voice_note_url
                    ? `Voice note · ${Math.floor((ci.voice_note_duration_sec ?? 0) / 60)}:${String((ci.voice_note_duration_sec ?? 0) % 60).padStart(2, "0")}`
                    : ci.content_text
                      ? `"${ci.content_text}"`
                      : "Practice completed"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

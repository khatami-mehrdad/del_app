"use client";

import { useEffect, useState } from "react";
import type { JourneyEntry } from "@del/shared";
import { fetchJourneyEntries } from "@del/data";
import { supabase } from "@/lib/supabase";
import { useClientAuth } from "../../components/ClientAuthProvider";
import { getCurrentWeek } from "../../components/helpers";

export default function JourneyPage() {
  const { program } = useClientAuth();
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program) {
      setEntries([]);
      setLoading(false);
      return;
    }
    void fetchJourneyEntries(supabase, program.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [program]);

  const currentWeek = program
    ? getCurrentWeek(program.start_date, program.total_sessions)
    : 1;
  const totalSessions = program?.total_sessions ?? 12;
  const totalMonths = program?.total_months ?? 3;
  const currentMonth = Math.min(Math.ceil(currentWeek / 4), totalMonths);
  const completedSessions = entries.length;
  const progress = completedSessions / totalSessions;

  if (!program) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="font-sans text-sm font-light text-brown-light">
          An active program is required to view your journey.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="bg-brown px-6 pb-5 pt-4">
        <h1 className="font-serif text-2xl font-light text-white">Your journey</h1>
        <p className="mt-0.5 font-sans text-[11px] font-extralight uppercase tracking-[0.15em] text-white/30">
          Written by Sahar after each session
        </p>
      </header>

      {/* Progress */}
      <div className="bg-cream-dark px-6 py-3.5">
        <p className="font-sans text-[10px] font-extralight uppercase tracking-[0.15em] text-brown-mid/70">
          Month {currentMonth} of {totalMonths} · Week {currentWeek}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream-mid">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-1.5 font-sans text-[10px] font-extralight text-brown-light">
          {completedSessions} of {totalSessions} sessions complete
        </p>
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-3 p-4">
        {loading ? (
          <div className="py-10 text-center">
            <p className="font-serif text-sm font-light italic text-gold-light">Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center">
            <p className="mx-auto max-w-[260px] font-sans text-[13px] font-extralight leading-relaxed text-brown-light">
              Your journey entries will appear here after each session with Sahar.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border-l-2 border-gold bg-white p-4"
            >
              <span className="font-sans text-[10px] font-extralight uppercase tracking-[0.15em] text-gold">
                Week {entry.week_number}
                {entry.week_number === currentWeek ? " · This week" : ""}
              </span>
              <h2 className="mt-1.5 font-serif text-[17px] font-light italic text-brown">
                &ldquo;{entry.title}&rdquo;
              </h2>
              <p className="mt-1.5 font-sans text-[13px] font-light leading-relaxed text-brown-mid">
                {entry.body}
              </p>
              <p className="mt-2 font-sans text-[10px] font-extralight text-brown-light/50">
                {new Date(entry.session_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

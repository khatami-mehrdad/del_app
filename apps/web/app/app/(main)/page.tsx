"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPractice, fetchWeekCheckins } from "@del/data";
import type { Practice, CheckIn } from "@del/shared";
import { supabase } from "@/lib/supabase";
import { useClientAuth } from "../components/ClientAuthProvider";
import { useVoiceRecorder } from "../components/useVoiceRecorder";
import { submitCheckin, markPracticeDone } from "../components/mutations";
import {
  DAYS,
  getGreeting,
  getDayName,
  getTodayIndex,
  buildStreakDone,
  getCurrentWeek,
} from "../components/helpers";

export default function HomePage() {
  const { user, profile, program } = useClientAuth();
  const [practice, setPractice] = useState<Practice | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [checkinText, setCheckinText] = useState("");
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const voice = useVoiceRecorder();

  const currentWeek = program
    ? getCurrentWeek(program.start_date, program.total_sessions)
    : 1;

  const loadData = useCallback(async () => {
    if (!program) return;
    const [p, c] = await Promise.all([
      fetchPractice(supabase, program.id, currentWeek),
      fetchWeekCheckins(supabase, program.id),
    ]);
    setPractice(p);
    setCheckins(c);
  }, [program, currentWeek]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!profile || !program) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="mb-4 font-serif text-2xl font-light italic text-gold-light">del</p>
        <p className="font-sans text-sm font-extralight text-brown-light">
          {!profile
            ? "No profile was found for this account."
            : "There is no active program linked to your account yet."}
        </p>
      </div>
    );
  }

  const todayIndex = getTodayIndex();
  const streakDone = buildStreakDone(checkins, todayIndex);
  const todayDone = streakDone[todayIndex];

  async function handleMarkDone() {
    if (!program || !user || marking || todayDone) return;
    setMarking(true);
    try {
      const result = await markPracticeDone(program.id, user.id);
      if (result.error) return;
      await loadData();
    } finally {
      setMarking(false);
    }
  }

  async function handleSendCheckin() {
    if (!program || !user) return;
    if (!checkinText.trim() && !voice.blob) return;
    setSending(true);
    try {
      const result = await submitCheckin(
        program.id,
        user.id,
        checkinText.trim() || null,
        false,
        voice.blob,
        voice.blob ? voice.duration : undefined
      );
      if (result.error) return;
      setCheckinText("");
      voice.reset();
      setJustSent(true);
      setTimeout(() => setJustSent(false), 3000);
      await loadData();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="bg-brown px-6 pb-6 pt-4">
        <p className="font-serif text-sm font-light italic text-gold-light/70">
          {getGreeting()}
        </p>
        <h1 className="font-serif text-2xl font-light text-white">
          {profile.full_name}
        </h1>
        <p className="mt-2 font-sans text-[11px] font-extralight uppercase tracking-[0.15em] text-white/30">
          {getDayName()} · Week {currentWeek} of {program.total_sessions}
        </p>
      </header>

      {/* Body */}
      <div className="flex flex-col gap-3.5 p-4">
        {/* Streak Row */}
        <div className="flex items-center justify-between rounded-xl bg-cream-dark px-4 py-3">
          {DAYS.map((day, i) => {
            const done = streakDone[i];
            const isToday = i === todayIndex;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-light ${
                    done
                      ? "bg-gold text-white"
                      : isToday
                        ? "border border-brown bg-brown text-gold"
                        : "bg-cream-mid text-brown-light"
                  }`}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>

        {/* Practice Card */}
        <div className="rounded-xl border-t-2 border-gold bg-brown p-5">
          <span className="font-sans text-[10px] font-light uppercase tracking-[0.2em] text-gold-light">
            This week&apos;s practice
          </span>
          {practice ? (
            <>
              <h2 className="mt-2 font-serif text-lg font-light italic text-white">
                {practice.title}
              </h2>
              <p className="mt-2 font-sans text-sm font-extralight leading-relaxed text-white/60">
                {practice.description}
              </p>
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={todayDone || marking}
                className={`mt-4 rounded-full px-6 py-2.5 font-sans text-xs font-light uppercase tracking-[0.15em] transition-colors ${
                  todayDone
                    ? "bg-gold/20 text-gold-light"
                    : "bg-gold text-white hover:bg-gold-light"
                } disabled:opacity-50`}
              >
                {todayDone ? "Done today" : marking ? "Marking..." : "Mark as done"}
              </button>
            </>
          ) : (
            <p className="mt-2 font-sans text-sm font-extralight text-white/40">
              No practice posted yet for this week.
            </p>
          )}
        </div>

        {/* Daily Check-in Card */}
        <div className="rounded-xl bg-cream-dark p-5">
          <h3 className="font-sans text-xs font-light uppercase tracking-[0.2em] text-brown-mid">
            Daily check-in
          </h3>
          <p className="mt-1 font-serif text-base font-light italic text-brown">
            What is present in you today?
          </p>

          {justSent ? (
            <p className="mt-4 font-sans text-sm font-light text-gold">
              Sent! Your coach will see this.
            </p>
          ) : (
            <>
              <textarea
                value={checkinText}
                onChange={(e) => setCheckinText(e.target.value)}
                placeholder="Write, or record a voice note..."
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-cream-mid bg-cream px-4 py-3 font-sans text-sm font-light text-brown placeholder:text-brown-light/50 focus:border-gold/50 focus:outline-none"
              />

              <div className="mt-3 flex items-center gap-3">
                {voice.recording ? (
                  <button
                    type="button"
                    onClick={voice.stop}
                    className="flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 font-sans text-xs font-light text-red-500"
                  >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    {voice.duration}s — Stop
                  </button>
                ) : voice.blob ? (
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-light text-brown-light">
                      Voice note ({voice.duration}s)
                    </span>
                    <button
                      type="button"
                      onClick={voice.reset}
                      className="font-sans text-xs text-red-400 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={voice.start}
                    className="rounded-full border border-cream-mid px-4 py-2 font-sans text-xs font-light text-brown-mid transition-colors hover:border-gold hover:text-gold"
                  >
                    Voice Note
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSendCheckin}
                  disabled={sending || (!checkinText.trim() && !voice.blob)}
                  className="ml-auto rounded-full bg-brown px-5 py-2 font-sans text-xs font-light uppercase tracking-[0.15em] text-white transition-colors hover:bg-brown-mid disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

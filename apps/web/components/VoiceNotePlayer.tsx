"use client";

import { useEffect, useRef, useState } from "react";

function formatSeconds(s: number) {
  const safe = Number.isFinite(s) && s > 0 ? s : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

interface Props {
  url: string;
  duration: number;
  variant?: "onDark" | "onLight";
}

export function VoiceNotePlayer({ url, duration, variant = "onLight" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("pause", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("pause", onEnd);
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  const remaining = Math.max(0, duration - currentTime);
  const onDark = variant === "onDark";

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
          onDark ? "bg-white/15 text-white" : "bg-brown text-white"
        }`}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span
        className={`font-sans font-extralight text-[11px] tabular-nums ${
          onDark ? "text-white/70" : "text-brown-light"
        }`}
      >
        {formatSeconds(playing ? currentTime : remaining)}
      </span>
    </div>
  );
}

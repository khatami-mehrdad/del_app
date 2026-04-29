"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@del/shared";
import { useVoiceNote } from "@/lib/use-voice-note";

function formatSeconds(s: number) {
  const safe = Number.isFinite(s) && s > 0 ? s : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
}

function VoiceNotePlayer({
  url,
  duration,
  isMe,
}: {
  url: string;
  duration: number;
  isMe: boolean;
}) {
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

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
          isMe ? "bg-white/15 text-white" : "bg-brown text-white"
        }`}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span
        className={`font-sans font-extralight text-[11px] tabular-nums ${
          isMe ? "text-white/70" : "text-brown-light"
        }`}
      >
        {formatSeconds(playing ? currentTime : remaining)}
      </span>
    </div>
  );
}

interface Props {
  programId: string;
  userId: string;
  clientName: string;
  messages: Message[];
  onBack: () => void;
  onSend: (
    text: string,
    voiceBlob?: Blob,
    voiceDuration?: number
  ) => Promise<{ error: string | null }>;
  onMarkRead: () => Promise<void>;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${m}${ampm}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function MessageThread({
  userId,
  clientName,
  messages,
  onBack,
  onSend,
  onMarkRead,
}: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceNote();

  useEffect(() => {
    void onMarkRead();
  }, [messages.length, onMarkRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !voice.blob) return;
    setSending(true);
    setSendError(null);

    try {
      const result = await onSend(
        input.trim(),
        voice.blob ?? undefined,
        voice.blob ? voice.duration : undefined
      );
      if (result.error) {
        setSendError(result.error);
        return;
      }
      setInput("");
      voice.reset();
    } catch {
      setSendError("Message failed to send. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-cream-mid shrink-0">
        <button
          onClick={onBack}
          className="font-sans text-brown-light hover:text-brown transition-colors"
        >
          &larr;
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-brown-mid flex items-center justify-center shrink-0">
          <span className="font-serif text-sm text-white">
            {clientName.charAt(0)}
          </span>
        </div>
        <div>
          <h2 className="font-serif text-lg font-light text-brown">
            {clientName}
          </h2>
          <p className="font-sans font-extralight text-[10px] text-brown-light tracking-wide">
            Messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
      >
        {messages.map((msg, index) => {
          const msgDate = formatDate(msg.created_at);
          const previousDate =
            index > 0 ? formatDate(messages[index - 1].created_at) : null;
          const showDate = msgDate !== previousDate;
          const isMe = msg.sender_id === userId;

          return (
            <div key={msg.id}>
              {showDate && (
                <p className="text-center font-sans font-extralight text-[10px] tracking-[0.2em] uppercase text-brown-light/50 my-4">
                  {msgDate}
                </p>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    isMe
                      ? "bg-brown rounded-br-sm"
                      : "bg-cream-dark rounded-bl-sm"
                  }`}
                >
                  {msg.voice_note_url ? (
                    <VoiceNotePlayer
                      url={msg.voice_note_url}
                      duration={msg.voice_note_duration_sec ?? 0}
                      isMe={isMe}
                    />
                  ) : (
                    <p
                      className={`font-sans font-light text-sm leading-relaxed ${
                        isMe ? "text-white/75" : "text-brown"
                      }`}
                    >
                      {msg.content_text}
                    </p>
                  )}
                  <p
                    className={`font-sans font-extralight text-[9px] mt-1 ${
                      isMe ? "text-white/25 text-right" : "text-brown-light/50"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-cream-mid bg-white shrink-0">
        {voice.blob && (
          <div className="flex items-center gap-3 px-6 pt-3">
            <audio src={voice.previewUrl ?? undefined} controls className="h-8 flex-1" />
            <button
              type="button"
              onClick={voice.reset}
              className="font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light hover:text-brown transition-colors"
            >
              Remove
            </button>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-3 px-6 py-4"
        >
          <button
            type="button"
            onClick={voice.recording ? voice.stopRecording : voice.startRecording}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              voice.recording
                ? "bg-red-500 text-white"
                : "bg-cream-dark text-brown-light hover:bg-cream-mid"
            }`}
            title={voice.recording ? "Stop recording" : "Record voice note"}
          >
            {voice.recording ? (
              <span className="font-sans text-[10px] font-light">
                {Math.floor(voice.duration / 60)}:{String(voice.duration % 60).padStart(2, "0")}
              </span>
            ) : (
              <span className="text-sm">🎤</span>
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-cream-dark rounded-full px-5 py-3 font-sans font-light text-sm text-brown placeholder:text-brown-light/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && !voice.blob)}
            className="bg-gold text-white px-5 py-3 rounded-full font-sans font-light text-xs tracking-[0.15em] uppercase hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            Send
          </button>
        </form>
        {sendError && (
          <p className="px-6 pb-3 font-sans text-xs font-light text-red-500">
            {sendError}
          </p>
        )}
      </div>
    </div>
  );
}

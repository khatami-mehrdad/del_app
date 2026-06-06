"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@del/shared";
import { fetchMessages, subscribeToMessages } from "@del/data";
import { supabase } from "@/lib/supabase";
import { useClientAuth } from "../../components/ClientAuthProvider";
import { useVoiceRecorder } from "../../components/useVoiceRecorder";
import { sendMessage, markMessagesRead } from "../../components/mutations";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export default function MessagesPage() {
  const { user, program } = useClientAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceRecorder();

  useEffect(() => {
    if (!program) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function refetch() {
      const data = await fetchMessages(supabase, program!.id);
      if (!cancelled) {
        setMessages(data);
        setLoading(false);
      }
    }

    void refetch();

    const unsubscribe = subscribeToMessages(
      supabase,
      program.id,
      (msg) => {
        if (!cancelled) {
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
          );
        }
      },
      (status) => {
        if (status === "SUBSCRIBED" && !cancelled) void refetch();
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [program]);

  useEffect(() => {
    if (program && user) {
      void markMessagesRead(program.id, user.id);
    }
  }, [messages.length, program, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend() {
    if ((!input.trim() && !voice.blob) || !program || !user) return;
    setSending(true);
    try {
      const result = await sendMessage(
        program.id,
        user.id,
        input.trim(),
        voice.blob,
        voice.blob ? voice.duration : undefined
      );
      if (!result.error) {
        setInput("");
        voice.reset();
      }
    } finally {
      setSending(false);
    }
  }

  if (!program) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <p className="font-sans text-sm font-light text-brown-light">
          Messaging needs an active program.
        </p>
      </div>
    );
  }

  let lastDate = "";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 bg-brown px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold">
          <span className="font-serif text-base font-light italic text-white">S</span>
        </div>
        <div>
          <p className="font-serif text-lg font-light text-white">Sahar</p>
          <p className="font-sans text-[10px] font-extralight text-white/35">
            Responds within 24 hours
          </p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-serif text-sm font-light italic text-gold-light">Loading...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {messages.map((msg) => {
              const msgDate = formatDate(msg.created_at);
              const showDate = msgDate !== lastDate;
              lastDate = msgDate;
              const isMe = msg.sender_id === user?.id;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <p className="my-2 text-center font-sans text-[10px] font-extralight uppercase tracking-[0.15em] text-brown-light/50">
                      {msgDate}
                    </p>
                  )}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                        isMe
                          ? "rounded-br-sm bg-cream-dark"
                          : "rounded-bl-sm bg-brown"
                      }`}
                    >
                      {msg.voice_note_url ? (
                        <audio
                          src={msg.voice_note_url}
                          controls
                          className="h-8 w-48"
                        />
                      ) : (
                        <p
                          className={`font-sans text-[13px] font-light leading-relaxed ${
                            isMe ? "text-brown" : "text-white/75"
                          }`}
                        >
                          {msg.content_text}
                        </p>
                      )}
                      <p
                        className={`mt-1 font-sans text-[9px] font-extralight ${
                          isMe ? "text-right text-brown-light/50" : "text-white/25"
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
        )}
      </div>

      {/* Voice preview */}
      {voice.blob && !voice.recording && (
        <div className="mx-3 flex items-center justify-between rounded-lg bg-brown px-4 py-2.5">
          <span className="font-sans text-xs font-light text-gold-light">
            Voice note · {voice.duration}s
          </span>
          <button
            type="button"
            onClick={voice.reset}
            className="font-sans text-[10px] font-extralight uppercase tracking-wider text-white/40"
          >
            Remove
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-cream-mid bg-cream p-3">
        <button
          type="button"
          onClick={voice.recording ? voice.stop : voice.start}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            voice.recording ? "bg-red-50 text-red-500" : "bg-cream-dark text-brown-mid"
          }`}
        >
          {voice.recording ? (
            <span className="text-[10px] font-light">{voice.duration}s</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Write a message..."
          className="flex-1 rounded-full bg-cream-dark px-4 py-2.5 font-sans text-[13px] font-light text-brown placeholder:text-brown-light/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={(!input.trim() && !voice.blob) || sending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brown text-gold transition-colors disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

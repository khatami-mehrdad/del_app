"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@del/shared";

interface Props {
  programId: string;
  userId: string;
  clientName: string;
  messages: Message[];
  onBack: () => void;
  onSend: (text: string) => Promise<void>;
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
  programId,
  userId,
  clientName,
  messages,
  onBack,
  onSend,
  onMarkRead,
}: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMarkRead();
  }, [messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    await onSend(input.trim());
    setInput("");
    setSending(false);
  }

  let lastDate = "";

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
        {messages.map((msg) => {
          const msgDate = formatDate(msg.created_at);
          const showDate = msgDate !== lastDate;
          lastDate = msgDate;
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
                    <p className={`font-sans font-light text-sm ${isMe ? "text-white/70" : "text-brown-mid"}`}>
                      Voice note · {Math.floor((msg.voice_note_duration_sec ?? 0) / 60)}:
                      {String((msg.voice_note_duration_sec ?? 0) % 60).padStart(2, "0")}
                    </p>
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
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-6 py-4 border-t border-cream-mid bg-white shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 bg-cream-dark rounded-full px-5 py-3 font-sans font-light text-sm text-brown placeholder:text-brown-light/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-gold text-white px-5 py-3 rounded-full font-sans font-light text-xs tracking-[0.15em] uppercase hover:bg-gold-light transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

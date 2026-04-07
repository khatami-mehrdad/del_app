"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useClients,
  useCheckins,
  usePractice,
  useJourneyEntries,
  useMessages,
  postPractice,
  saveJourneyEntry,
  sendMessage,
  markMessagesRead,
} from "@/lib/hooks";
import PracticeModal from "@/components/PracticeModal";
import JourneyEditor from "@/components/JourneyEditor";
import MessageThread from "@/components/MessageThread";

export default function ClientDetailPage() {
  const params = useParams();
  const programId = params?.id as string;
  const { user } = useAuth();
  const { clients } = useClients();
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [editingJourney, setEditingJourney] = useState<{
    weekNumber: number;
    sessionDate: string;
    title: string;
    body: string;
  } | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  const clientItem = clients.find((c) => c.program.id === programId);
  const weekNumber = clientItem?.currentWeek ?? 1;

  const { checkins } = useCheckins(programId);
  const { practice, refetch: refetchPractice } = usePractice(programId, weekNumber);
  const { entries, refetch: refetchJourney } = useJourneyEntries(programId);
  const { messages } = useMessages(programId);

  if (!clientItem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif italic text-xl text-gold-light animate-pulse">
          del
        </p>
      </div>
    );
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (showMessages) {
    return (
      <MessageThread
        programId={programId}
        userId={user!.id}
        clientName={clientItem.client.full_name}
        messages={messages}
        onBack={() => setShowMessages(false)}
        onSend={async (text) => {
          await sendMessage(programId, user!.id, text);
        }}
        onMarkRead={async () => {
          await markMessagesRead(programId, user!.id);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-cream-mid shrink-0">
        <div>
          <h1 className="font-serif text-3xl font-light text-brown">
            {clientItem.client.full_name}
          </h1>
          <p className="font-sans font-extralight text-sm tracking-[0.2em] uppercase text-brown-light mt-1">
            Week {clientItem.currentWeek} of {clientItem.program.total_sessions}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMessages(true)}
            className="border border-brown-light/30 text-brown-mid px-6 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-cream-dark transition-colors"
          >
            Messages{clientItem.unread > 0 ? ` (${clientItem.unread})` : ""}
          </button>
          <button
            onClick={() => setShowPracticeModal(true)}
            className="bg-gold text-white px-6 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-gold-light transition-colors"
          >
            + Post weekly practice
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-5 auto-rows-min overflow-y-auto">
        {/* Check-ins */}
        <div className="bg-white rounded-xl p-6 border border-cream-mid">
          <p className="font-sans font-light text-xs tracking-[0.25em] uppercase text-gold mb-5">
            This week's check-ins
          </p>
          {checkins.length === 0 ? (
            <p className="font-sans font-light text-base text-brown-light/50">
              No check-ins yet this week
            </p>
          ) : (
            <div className="divide-y divide-cream-mid">
              {checkins.map((ci) => {
                const date = new Date(ci.checkin_date + "T00:00:00");
                const dayName = dayNames[date.getDay()];
                return (
                  <div key={ci.id} className="py-4 first:pt-0 last:pb-0">
                    <p className="font-sans font-light text-xs tracking-[0.15em] uppercase text-brown-light mb-1">
                      {dayName}
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

        {/* Current practice */}
        <div className="bg-white rounded-xl p-6 border border-cream-mid">
          <p className="font-sans font-light text-xs tracking-[0.25em] uppercase text-gold mb-5">
            Current weekly practice
          </p>
          {practice ? (
            <div className="bg-brown rounded-lg p-6">
              <p className="font-sans font-light text-xs tracking-[0.2em] uppercase text-gold-light/70 mb-3">
                Week {practice.week_number} · Posted after session
              </p>
              <p className="font-serif text-xl text-white mb-3">
                {practice.title}
              </p>
              <p className="font-sans font-light text-sm text-white/60 leading-relaxed">
                {practice.description}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowPracticeModal(true)}
              className="w-full py-10 border-2 border-dashed border-cream-mid rounded-lg text-brown-light/50 font-sans font-light text-sm hover:border-gold/30 hover:text-gold/50 transition-colors"
            >
              No practice posted yet — click to add
            </button>
          )}
        </div>

        {/* Journey notes */}
        <div className="col-span-2 bg-white rounded-xl p-6 border border-cream-mid">
          <div className="flex items-center justify-between mb-5">
            <p className="font-sans font-light text-xs tracking-[0.25em] uppercase text-gold">
              Journey map — your session notes
            </p>
            <button
              onClick={() =>
                setEditingJourney({
                  weekNumber,
                  sessionDate: new Date().toISOString().split("T")[0],
                  title: "",
                  body: "",
                })
              }
              className="font-sans font-light text-xs tracking-[0.12em] uppercase text-gold hover:text-gold-light transition-colors"
            >
              + New entry
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="font-sans font-light text-base text-brown-light/50 py-4">
              No session notes yet
            </p>
          ) : (
            <div className="divide-y divide-cream-mid">
              {entries.map((note) => (
                <div key={note.id} className="py-5 first:pt-0 last:pb-0">
                  <p className="font-sans font-light text-xs tracking-[0.2em] uppercase text-gold mb-2">
                    Week {note.week_number} · {note.session_date}
                  </p>
                  <p className="font-serif italic text-lg text-brown mb-2">
                    "{note.title}"
                  </p>
                  <p className="font-sans font-light text-base text-brown-mid leading-relaxed">
                    {note.body}
                  </p>
                  <button
                    onClick={() =>
                      setEditingJourney({
                        weekNumber: note.week_number,
                        sessionDate: note.session_date,
                        title: note.title,
                        body: note.body,
                      })
                    }
                    className="mt-3 font-sans font-light text-xs tracking-[0.12em] uppercase text-gold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Edit note
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Practice Modal */}
      {showPracticeModal && (
        <PracticeModal
          programId={programId}
          weekNumber={weekNumber}
          onClose={() => setShowPracticeModal(false)}
          onSuccess={refetchPractice}
        />
      )}

      {/* Journey Editor */}
      {editingJourney && (
        <JourneyEditor
          programId={programId}
          weekNumber={editingJourney.weekNumber}
          sessionDate={editingJourney.sessionDate}
          initialTitle={editingJourney.title}
          initialBody={editingJourney.body}
          onClose={() => setEditingJourney(null)}
          onSaved={() => {
            setEditingJourney(null);
            refetchJourney();
          }}
        />
      )}
    </div>
  );
}

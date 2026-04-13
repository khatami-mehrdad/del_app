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
  sendMessage,
  markMessagesRead,
} from "@/lib/hooks";
import { PracticeModal } from "@/components/PracticeModal";
import { JourneyEditor } from "@/components/JourneyEditor";
import { MessageThread } from "@/components/MessageThread";

export default function ClientDetailPage() {
  const params = useParams();
  const programId = params?.id as string;
  const { user } = useAuth();
  const { clients, refetch } = useClients();
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [editingJourney, setEditingJourney] = useState<{
    weekNumber: number;
    sessionDate: string;
    title: string;
    body: string;
  } | null>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleResendInvite() {
    setResending(true);
    setResendResult(null);
    try {
      const { data: session } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch("/api/resend-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId: clientItem!.client.id }),
      });
      if (res.ok) {
        setResendResult("Invite sent!");
        refetch();
      } else {
        const json = await res.json();
        setResendResult(json.error ?? "Failed to resend invite");
      }
    } catch {
      setResendResult("Failed to resend invite");
    }
    setResending(false);
  }

  async function handleDeleteClient() {
    setDeleting(true);
    try {
      const { data: session } = await (await import("@/lib/supabase")).supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch("/api/delete-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientId: clientItem!.client.id }),
      });
      if (res.ok) {
        // Full reload so the Sidebar re-fetches the client list
        window.location.href = "/";
        return;
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to delete client");
      }
    } catch {
      alert("Failed to delete client");
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
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
          await refetch();
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
            {clientItem.pending ? (
              <span className="text-amber-600">Invite pending — client has not signed up yet</span>
            ) : (
              <>Week {clientItem.currentWeek} of {clientItem.program.total_sessions}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {clientItem.pending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleResendInvite()}
                disabled={resending}
                className="border border-amber-500/40 text-amber-700 px-6 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend invite"}
              </button>
              {resendResult && (
                <span className={`font-sans text-xs font-light ${resendResult === "Invite sent!" ? "text-green-600" : "text-red-500"}`}>
                  {resendResult}
                </span>
              )}
            </div>
          )}
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
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="border border-red-300/40 text-red-400 px-4 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-red-50 transition-colors"
            title="Remove client"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 p-6 grid grid-cols-2 gap-5 auto-rows-min overflow-y-auto">
        {/* Check-ins */}
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
                const dayName = dayNames[created.getDay()];
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
                    &quot;{note.title}&quot;
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

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-2 font-serif text-xl font-light text-brown">
              Remove {clientItem.client.full_name}?
            </h2>
            <p className="mb-6 font-sans text-sm font-light leading-relaxed text-brown-light">
              This will permanently delete this client&apos;s account and all their data
              including check-ins, messages, practices, and session notes. This cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full border border-brown-light/30 py-3 font-sans text-xs font-light uppercase tracking-[0.12em] text-brown-mid hover:bg-cream-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteClient()}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 py-3 font-sans text-xs font-light uppercase tracking-[0.12em] text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Remove client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

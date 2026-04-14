"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { JourneyEntry } from "@del/shared";
import {
  useClients,
  useCheckins,
  usePractice,
  useJourneyEntries,
  useMessages,
  sendMessage,
  markMessagesRead,
  markCheckinsRead,
} from "@/lib/hooks";
import { PracticeModal } from "@/components/PracticeModal";
import { JourneyEditor } from "@/components/JourneyEditor";
import { MessageThread } from "@/components/MessageThread";
import { ClientDetailHeader } from "./ClientDetailHeader";
import { ClientCheckinsPanel } from "./ClientCheckinsPanel";
import { JourneyNotesSection } from "./JourneyNotesSection";
import { DeleteClientDialog } from "./DeleteClientDialog";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const clientItem = clients.find((c) => c.program.id === programId);
  const weekNumber = clientItem?.currentWeek ?? 1;

  const { checkins } = useCheckins(programId);
  const { practice, refetch: refetchPractice } = usePractice(programId, weekNumber);

  useEffect(() => {
    if (programId) {
      void markCheckinsRead(programId).then(() => refetch());
    }
  }, [programId, checkins.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const { entries, refetch: refetchJourney } = useJourneyEntries(programId);
  const { messages } = useMessages(programId);

  if (!clientItem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif italic text-xl text-gold-light animate-pulse">
          Del
        </p>
      </div>
    );
  }

  if (showMessages) {
    return (
      <MessageThread
        programId={programId}
        userId={user!.id}
        clientName={clientItem.client.full_name}
        messages={messages}
        onBack={() => setShowMessages(false)}
        onSend={async (text, voiceBlob, voiceDuration) => {
          await sendMessage(programId, user!.id, text, voiceBlob, voiceDuration);
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
      <ClientDetailHeader
        clientItem={clientItem}
        onShowMessages={() => setShowMessages(true)}
        onShowPracticeModal={() => setShowPracticeModal(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
        onRefetch={refetch}
      />

      <div className="flex-1 p-6 grid grid-cols-2 gap-5 auto-rows-min overflow-y-auto">
        <ClientCheckinsPanel checkins={checkins} />

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

        <JourneyNotesSection
          entries={entries}
          onNewEntry={() =>
            setEditingJourney({
              weekNumber,
              sessionDate: new Date().toISOString().split("T")[0],
              title: "",
              body: "",
            })
          }
          onEditEntry={(note: JourneyEntry) =>
            setEditingJourney({
              weekNumber: note.week_number,
              sessionDate: note.session_date,
              title: note.title,
              body: note.body,
            })
          }
        />
      </div>

      {showPracticeModal && (
        <PracticeModal
          programId={programId}
          weekNumber={weekNumber}
          onClose={() => setShowPracticeModal(false)}
          onSuccess={refetchPractice}
        />
      )}

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

      {showDeleteConfirm && (
        <DeleteClientDialog
          clientName={clientItem.client.full_name}
          clientId={clientItem.client.id}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

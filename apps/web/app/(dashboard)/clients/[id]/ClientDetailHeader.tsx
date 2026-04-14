"use client";

import { useState } from "react";
import type { ClientListItem } from "@/lib/hooks";
import { resendInvite } from "./client-actions";

interface Props {
  clientItem: ClientListItem;
  onShowMessages: () => void;
  onShowPracticeModal: () => void;
  onShowDeleteConfirm: () => void;
  onRefetch: () => Promise<void>;
}

export function ClientDetailHeader({
  clientItem,
  onShowMessages,
  onShowPracticeModal,
  onShowDeleteConfirm,
  onRefetch,
}: Props) {
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  async function handleResendInvite() {
    setResending(true);
    setResendResult(null);
    try {
      const result = await resendInvite(clientItem.client.id);
      setResendResult(result.message);
      if (result.ok) onRefetch();
    } catch {
      setResendResult("Failed to resend invite");
    }
    setResending(false);
  }

  return (
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
          onClick={onShowMessages}
          className="border border-brown-light/30 text-brown-mid px-6 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-cream-dark transition-colors"
        >
          Messages{clientItem.unread > 0 ? ` (${clientItem.unread})` : ""}
        </button>
        <button
          onClick={onShowPracticeModal}
          className="bg-gold text-white px-6 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-gold-light transition-colors"
        >
          + Post weekly practice
        </button>
        <button
          onClick={onShowDeleteConfirm}
          className="border border-red-300/40 text-red-400 px-4 py-3 rounded-full font-sans font-light text-sm tracking-[0.12em] uppercase hover:bg-red-50 transition-colors"
          title="Remove client"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

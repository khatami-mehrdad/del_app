"use client";

import { useState } from "react";
import { deleteClient } from "./client-actions";

interface Props {
  clientName: string;
  clientId: string;
  onClose: () => void;
}

export function DeleteClientDialog({ clientName, clientId, onClose }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteClient(clientId);
      if (result.ok) {
        window.location.href = "/";
        return;
      }
      alert(result.message);
    } catch {
      alert("Failed to delete client");
    }
    setDeleting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-2 font-serif text-xl font-light text-brown">
          Remove {clientName}?
        </h2>
        <p className="mb-6 font-sans text-sm font-light leading-relaxed text-brown-light">
          This will permanently delete this client&apos;s account and all their data
          including check-ins, messages, practices, and session notes. This cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-brown-light/30 py-3 font-sans text-xs font-light uppercase tracking-[0.12em] text-brown-mid hover:bg-cream-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex-1 rounded-full bg-red-500 py-3 font-sans text-xs font-light uppercase tracking-[0.12em] text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove client"}
          </button>
        </div>
      </div>
    </div>
  );
}

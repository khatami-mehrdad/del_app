"use client";

import { useState } from "react";
import { saveJourneyEntry } from "@/lib/hooks";

interface Props {
  programId: string;
  weekNumber: number;
  sessionDate: string;
  initialTitle: string;
  initialBody: string;
  onClose: () => void;
  onSaved: () => void;
}

export function JourneyEditor({
  programId,
  weekNumber,
  sessionDate,
  initialTitle,
  initialBody,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [date, setDate] = useState(sessionDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = initialTitle !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await saveJourneyEntry(programId, weekNumber, date, title, body);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-light text-brown">
            {isEditing ? "Edit session note" : "New session note"}
          </h2>
          <button
            onClick={onClose}
            className="text-brown-light hover:text-brown transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Week
            </label>
            <p className="font-sans font-light text-sm text-brown">
              {weekNumber}
            </p>
          </div>
          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Session date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-cream-mid rounded-lg px-3 py-2 font-sans font-light text-sm text-brown focus:outline-none focus:border-gold/50"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder='e.g., "The protector who never rests"'
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-serif italic text-lg text-brown placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Session narrative
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Write your reflection on this session... This will be visible to your client as part of their journey map."
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-sans font-light text-sm text-brown-mid leading-relaxed placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-500 font-sans text-xs">{error}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-sans font-light text-xs tracking-[0.15em] uppercase text-brown-light hover:text-brown transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold text-white px-6 py-2.5 rounded-full font-sans font-light text-xs tracking-[0.15em] uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditing ? "Update note" : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

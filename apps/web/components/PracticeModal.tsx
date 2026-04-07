"use client";

import { useState } from "react";
import { postPractice } from "@/lib/hooks";

interface Props {
  programId: string;
  weekNumber: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PracticeModal({ programId, weekNumber, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await postPractice(programId, weekNumber, title, description);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-light text-brown">
            Post weekly practice
          </h2>
          <button
            onClick={onClose}
            className="text-brown-light hover:text-brown transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <p className="font-sans font-extralight text-[10px] tracking-[0.2em] uppercase text-gold mb-4">
          Week {weekNumber}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Practice title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Three breaths before you open your eyes"
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-serif text-lg text-brown placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Write the practice instruction for your client..."
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-sans font-light text-sm text-brown leading-relaxed placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50 resize-none"
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
              {submitting ? "Posting..." : "Post practice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

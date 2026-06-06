"use client";

import type { JourneyEntry } from "@del/shared";

interface Props {
  entries: JourneyEntry[];
  onNewEntry: () => void;
  onEditEntry: (entry: JourneyEntry) => void;
}

export function JourneyNotesSection({ entries, onNewEntry, onEditEntry }: Props) {
  return (
    <div className="col-span-2 bg-white rounded-xl p-6 border border-cream-mid">
      <div className="flex items-center justify-between mb-5">
        <p className="font-sans font-light text-xs tracking-[0.25em] uppercase text-gold">
          Journey map — your session notes
        </p>
        <button
          onClick={onNewEntry}
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
                onClick={() => onEditEntry(note)}
                className="mt-3 font-sans font-light text-xs tracking-[0.12em] uppercase text-gold opacity-60 hover:opacity-100 transition-opacity"
              >
                Edit note
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

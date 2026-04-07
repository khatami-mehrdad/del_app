"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddClientModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    if (!token) {
      setError("Session expired. Please refresh and try again.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/add-client", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, startDate }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    onClose();
    onSuccess?.();
    router.push(`/clients/${data.program.id}`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-light text-brown">
            Add a new client
          </h2>
          <button
            onClick={onClose}
            className="text-brown-light hover:text-brown transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Client name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Layla"
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-sans font-light text-sm text-brown placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Client email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="layla@email.com"
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-sans font-light text-sm text-brown placeholder:text-brown-light/30 focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label className="block font-sans font-extralight text-[10px] tracking-[0.15em] uppercase text-brown-light mb-2">
              Program start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-cream-mid rounded-lg px-4 py-3 font-sans font-light text-sm text-brown focus:outline-none focus:border-gold/50"
            />
          </div>

          <p className="font-sans font-extralight text-xs text-brown-light/50 leading-relaxed">
            The client will receive an email to set up their account and access the companion app.
          </p>

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
              {submitting ? "Adding..." : "Add client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

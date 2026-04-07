"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClients } from "@/lib/hooks";
import { AddClientModal } from "@/components/AddClientModal";

export default function DashboardHome() {
  const router = useRouter();
  const { clients, loading, refetch } = useClients();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!loading && clients.length > 0) {
      router.replace(`/clients/${clients[0].program.id}`);
    }
  }, [clients, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="font-serif italic text-xl text-gold-light animate-pulse">del</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <p className="font-serif italic text-3xl font-light text-gold-light mb-3">del</p>
      <p className="font-sans font-extralight text-sm text-brown-light mb-8 max-w-xs leading-relaxed">
        Welcome. Add your first client to get started.
      </p>
      <button
        onClick={() => setShowAdd(true)}
        className="bg-gold text-white px-8 py-3 rounded-full font-sans font-light text-xs tracking-[0.2em] uppercase hover:bg-gold-light transition-colors"
      >
        + Add a client
      </button>
      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onSuccess={refetch} />
      )}
    </div>
  );
}

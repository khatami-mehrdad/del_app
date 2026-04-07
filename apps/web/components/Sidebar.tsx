"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useClients } from "@/lib/hooks";
import AddClientModal from "@/components/AddClientModal";

const GRADIENTS = [
  "from-[#B8924A] to-[#6B4C38]",
  "from-[#6B4C38] to-[#2A1A0E]",
  "from-[#9A7560] to-[#6B4C38]",
  "from-[#B8924A] to-[#9A7560]",
  "from-[#2A1A0E] to-[#6B4C38]",
];

export default function Sidebar() {
  const params = useParams();
  const activeId = params?.id as string;
  const { signOut } = useAuth();
  const { clients, loading, refetch } = useClients();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <aside className="w-[280px] bg-brown flex flex-col border-r border-white/5 shrink-0">
      {/* Logo */}
      <div className="px-7 pt-7 pb-6 border-b border-white/5">
        <p className="font-serif italic text-2xl font-light text-gold-light">
          del
        </p>
        <p className="font-sans font-light text-xs tracking-[0.2em] uppercase text-white/25 mt-1">
          Coach dashboard
        </p>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto pt-5">
        <p className="px-7 pb-3 font-sans font-light text-xs tracking-[0.25em] uppercase text-white/25">
          Your clients
        </p>

        {loading ? (
          <div className="px-7 py-4">
            <div className="h-4 bg-white/5 rounded animate-pulse mb-3" />
            <div className="h-4 bg-white/5 rounded animate-pulse mb-3" />
            <div className="h-4 bg-white/5 rounded animate-pulse" />
          </div>
        ) : clients.length === 0 ? (
          <p className="px-7 py-4 font-sans font-light text-sm text-white/25">
            No clients yet
          </p>
        ) : (
          clients.map((item, i) => (
            <Link
              key={item.program.id}
              href={`/clients/${item.program.id}`}
              className={`flex items-center gap-3 px-7 py-3.5 transition-colors ${
                activeId === item.program.id
                  ? "bg-gold/10"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center shrink-0`}
              >
                <span className="font-serif text-base text-white">
                  {item.client.full_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-light text-base text-white/70">
                  {item.client.full_name}
                </p>
                <p className="font-sans font-light text-xs text-white/30 tracking-wide">
                  Week {item.currentWeek} · Month {item.currentMonth}
                </p>
              </div>
              {item.unread > 0 && (
                <span className="w-6 h-6 rounded-full bg-gold flex items-center justify-center font-sans text-[10px] font-light text-white">
                  {item.unread}
                </span>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Add client + Sign out */}
      <div className="px-7 py-5 border-t border-white/5 space-y-3">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2.5 border border-gold/30 rounded-full font-sans font-light text-xs tracking-[0.12em] uppercase text-gold/60 hover:text-gold hover:border-gold/60 transition-colors"
        >
          + Add client
        </button>
        <button
          onClick={signOut}
          className="font-sans font-light text-xs tracking-[0.12em] uppercase text-white/20 hover:text-white/40 transition-colors"
        >
          Sign out
        </button>
      </div>
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </aside>
  );
}

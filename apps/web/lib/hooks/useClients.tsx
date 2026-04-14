"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Profile, Program } from "@del/shared";
import { getAccessToken } from "@del/data";
import { supabase } from "../supabase";
import { useAuth } from "../auth-context";

export interface ClientListItem {
  program: Program;
  client: Profile;
  unread: number;
  currentWeek: number;
  currentMonth: number;
  pending: boolean;
}

type ClientProgramRow = Program & {
  client: Profile;
};

interface ClientsContextValue {
  clients: ClientListItem[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) return;

    const { data: programs } = await supabase
      .from("programs")
      .select("*, client:profiles!programs_client_id_fkey(*)")
      .eq("coach_id", user.id)
      .eq("status", "active");

    if (!programs) {
      setLoading(false);
      return;
    }

    const clientIds = (programs as ClientProgramRow[]).map((p) => p.client_id);
    let statuses: Record<string, { confirmed: boolean }> = {};
    try {
      const token = await getAccessToken(supabase);
      if (token && clientIds.length > 0) {
        const res = await globalThis.fetch("/api/client-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clientIds }),
        });
        if (res.ok) {
          const json = await res.json();
          statuses = json.statuses ?? {};
        }
      }
    } catch {
      // If status check fails, treat all as confirmed (non-blocking)
    }

    const items: ClientListItem[] = await Promise.all(
      (programs as ClientProgramRow[]).map(async (program) => {
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("program_id", program.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

        const { count: ciCount } = await supabase
          .from("checkins")
          .select("*", { count: "exact", head: true })
          .eq("program_id", program.id)
          .is("coach_read_at", null);

        const weeksSinceStart = Math.max(
          1,
          Math.ceil(
            (Date.now() - new Date(program.start_date).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        );
        const currentMonth = Math.ceil(weeksSinceStart / 4);

        const status = statuses[program.client_id];
        const pending = status ? !status.confirmed : false;

        return {
          program,
          client: program.client,
          unread: (msgCount ?? 0) + (ciCount ?? 0),
          currentWeek: Math.min(weeksSinceStart, program.total_sessions),
          currentMonth: Math.min(currentMonth, program.total_months),
          pending,
        };
      })
    );

    setClients(items);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchClients();
      if (cancelled) return;
    }
    void load();
    return () => { cancelled = true; };
  }, [fetchClients]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`sidebar-activity-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new && (payload.new as { sender_id: string }).sender_id !== user.id) {
            void fetchClients();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkins",
        },
        () => {
          void fetchClients();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchClients]);

  return (
    <ClientsContext.Provider value={{ clients, loading, refetch: fetchClients }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within a ClientsProvider");
  return ctx;
}

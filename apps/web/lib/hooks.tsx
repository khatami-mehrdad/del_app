"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";
import type { Profile, Program, Practice, CheckIn, Message, JourneyEntry } from "@del/shared";

// ── Client list with unread counts ──────────────────────────

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
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
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
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("program_id", program.id)
          .neq("sender_id", user.id)
          .is("read_at", null);

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
          unread: count ?? 0,
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
      .channel(`sidebar-messages-${user.id}`)
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

// ── Current week's practice for a program ───────────────────

export function usePractice(programId: string | null, weekNumber: number) {
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!programId) return;
    supabase
      .from("practices")
      .select("*")
      .eq("program_id", programId)
      .eq("week_number", weekNumber)
      .maybeSingle()
      .then(({ data }) => {
        setPractice(data as Practice | null);
        setLoading(false);
      });
  }, [programId, weekNumber]);

  useEffect(() => {
    let cancelled = false;

    async function loadPractice() {
      await fetch();
      if (cancelled) return;
    }

    void loadPractice();

    return () => {
      cancelled = true;
    };
  }, [fetch]);

  return { practice, loading, refetch: fetch };
}

// ── Check-ins for a program (current week) ──────────────────

export function useCheckins(programId: string | null) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const mondayStr = monday.toISOString().split("T")[0];

    supabase
      .from("checkins")
      .select("*")
      .eq("program_id", programId)
      .gte("checkin_date", mondayStr)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCheckins((data as CheckIn[]) ?? []);
        setLoading(false);
      });
  }, [programId]);

  return { checkins, loading };
}

// ── Journey entries for a program ───────────────────────────

export function useJourneyEntries(programId: string | null) {
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!programId) return;
    const { data } = await supabase
      .from("journey_entries")
      .select("*")
      .eq("program_id", programId)
      .order("week_number", { ascending: false });

    setEntries((data as JourneyEntry[]) ?? []);
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    let cancelled = false;

    async function loadJourneyEntries() {
      await fetch();
      if (cancelled) return;
    }

    void loadJourneyEntries();

    return () => {
      cancelled = true;
    };
  }, [fetch]);

  return { entries, loading, refetch: fetch };
}

// ── Messages for a program (with realtime) ──────────────────

export function useMessages(programId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;

    supabase
      .from("messages")
      .select("*")
      .eq("program_id", programId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`messages:${programId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `program_id=eq.${programId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [programId]);

  return { messages, loading };
}

// ── Mutations ───────────────────────────────────────────────

export async function sendMessage(
  programId: string,
  senderId: string,
  text: string
) {
  const { error } = await supabase.from("messages").insert({
    program_id: programId,
    sender_id: senderId,
    content_text: text,
  });
  return { error: error?.message ?? null };
}

export async function postPractice(
  programId: string,
  weekNumber: number,
  title: string,
  description: string
) {
  const { error } = await supabase.from("practices").upsert(
    {
      program_id: programId,
      week_number: weekNumber,
      title,
      description,
    },
    { onConflict: "program_id,week_number" }
  );
  return { error: error?.message ?? null };
}

export async function saveJourneyEntry(
  programId: string,
  weekNumber: number,
  sessionDate: string,
  title: string,
  body: string
) {
  const { error } = await supabase.from("journey_entries").upsert(
    {
      program_id: programId,
      week_number: weekNumber,
      session_date: sessionDate,
      title,
      body,
    },
    { onConflict: "program_id,week_number" }
  );
  return { error: error?.message ?? null };
}

export async function markMessagesRead(programId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("program_id", programId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function inviteClient(
  coachId: string,
  clientEmail: string,
  clientName: string,
  startDate: string
) {
  const { data, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    clientEmail,
    { data: { role: "client", full_name: clientName } }
  );
  if (authError) return { error: authError.message };

  const { error: progError } = await supabase.from("programs").insert({
    coach_id: coachId,
    client_id: data.user.id,
    start_date: startDate,
  });

  return { error: progError?.message ?? null };
}

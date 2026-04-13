import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: null;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: "default";
}

async function getCoachName(
  supabase: ReturnType<typeof createClient>,
  programId: string
): Promise<{ coachName: string; clientId: string } | null> {
  const { data } = await supabase
    .from("programs")
    .select("coach_id, client_id, coach:profiles!programs_coach_id_fkey(full_name)")
    .eq("id", programId)
    .single();

  if (!data) return null;
  const coach = data.coach as { full_name: string } | null;
  return {
    coachName: coach?.full_name ?? "Your coach",
    clientId: data.client_id as string,
  };
}

async function getClientPushTokens(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  return (data ?? []).map((row: { token: string }) => row.token);
}

async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (expoToken) {
    headers["Authorization"] = `Bearer ${expoToken}`;
  }

  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });
}

function buildNotification(
  table: string,
  record: Record<string, unknown>,
  coachName: string,
  programId: string
): { title: string; body: string; data: Record<string, unknown> } | null {
  switch (table) {
    case "messages":
      return {
        title: `New message from ${coachName}`,
        body: (record.content_text as string)?.slice(0, 100) ?? "You have a new message",
        data: { type: "message", programId },
      };
    case "practices":
      return {
        title: `${coachName} posted this week's practice`,
        body: (record.title as string) ?? "Check your new practice",
        data: { type: "practice", programId },
      };
    case "journey_entries":
      return {
        title: `${coachName} added a session note`,
        body: (record.title as string) ?? "A new session note is available",
        data: { type: "journey_entry", programId },
      };
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const { table, record } = payload;
    const programId = record.program_id as string | undefined;

    if (!programId) {
      return new Response(JSON.stringify({ skipped: "no program_id" }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const info = await getCoachName(supabase, programId);
    if (!info) {
      return new Response(JSON.stringify({ skipped: "program not found" }), { status: 200 });
    }

    // Don't notify the sender (e.g. if client sends a message, don't push to client)
    const senderId = record.sender_id as string | undefined;
    if (senderId && senderId === info.clientId) {
      return new Response(JSON.stringify({ skipped: "sender is client" }), { status: 200 });
    }

    const tokens = await getClientPushTokens(supabase, info.clientId);
    if (tokens.length === 0) {
      return new Response(JSON.stringify({ skipped: "no push tokens" }), { status: 200 });
    }

    const notification = buildNotification(table, record, info.coachName, programId);
    if (!notification) {
      return new Response(JSON.stringify({ skipped: "unknown table" }), { status: 200 });
    }

    const messages: PushMessage[] = tokens
      .filter((t) => t.startsWith("ExponentPushToken["))
      .map((to) => ({
        to,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: "default" as const,
      }));

    await sendExpoPush(messages);

    return new Response(
      JSON.stringify({ sent: messages.length }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 }
    );
  }
});

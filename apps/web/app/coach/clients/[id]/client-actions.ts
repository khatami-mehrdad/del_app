import { getAccessToken } from "@del/data";
import { supabase } from "@/lib/supabase";

export async function resendInvite(clientId: string): Promise<{ ok: boolean; message: string }> {
  const token = await getAccessToken(supabase);
  const res = await fetch("/api/resend-invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ clientId }),
  });
  if (res.ok) {
    return { ok: true, message: "Invite sent!" };
  }
  const json = await res.json();
  return { ok: false, message: json.error ?? "Failed to resend invite" };
}

export async function deleteClient(clientId: string): Promise<{ ok: boolean; message: string }> {
  const token = await getAccessToken(supabase);
  const res = await fetch("/api/delete-client", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ clientId }),
  });
  if (res.ok) {
    return { ok: true, message: "" };
  }
  const json = await res.json();
  return { ok: false, message: json.error ?? "Failed to delete client" };
}

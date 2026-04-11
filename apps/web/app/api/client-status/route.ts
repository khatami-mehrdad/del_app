import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "../_lib/admin";

/** Return signup status for a list of client IDs (coach-only). */
export async function POST(req: NextRequest) {
  const result = await requireCoach(req);
  if (result.error) return result.error;
  const { coach, supabaseAdmin } = result;

  const { clientIds } = await req.json();
  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    return NextResponse.json({ error: "clientIds array required" }, { status: 400 });
  }

  // Verify these clients actually belong to this coach
  const { data: programs } = await supabaseAdmin
    .from("programs")
    .select("client_id")
    .eq("coach_id", coach.id)
    .in("client_id", clientIds);

  const allowedIds = new Set((programs ?? []).map((p) => p.client_id));

  const statuses: Record<string, { confirmed: boolean }> = {};

  await Promise.all(
    clientIds
      .filter((id: string) => allowedIds.has(id))
      .map(async (clientId: string) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(clientId);
        if (data?.user) {
          statuses[clientId] = {
            confirmed: !!data.user.email_confirmed_at,
          };
        }
      })
  );

  return NextResponse.json({ statuses });
}

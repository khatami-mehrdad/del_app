import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "../_lib/admin";

/** Delete a client and all their associated data (coach-only). */
export async function POST(req: NextRequest) {
  const result = await requireCoach(req);
  if (result.error) return result.error;
  const { coach, supabaseAdmin } = result;

  const { clientId } = await req.json();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Verify this client belongs to the coach
  const { data: program } = await supabaseAdmin
    .from("programs")
    .select("id")
    .eq("coach_id", coach.id)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!program) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Delete the auth user — cascades to profiles → programs → all related data
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

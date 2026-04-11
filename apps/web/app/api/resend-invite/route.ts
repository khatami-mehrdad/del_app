import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "../_lib/admin";

/** Resend the invite email for a client who hasn't signed up yet (coach-only). */
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

  // Get the client's email from auth
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(clientId);
  if (!userData?.user?.email) {
    return NextResponse.json({ error: "Could not find client email" }, { status: 404 });
  }

  if (userData.user.email_confirmed_at) {
    return NextResponse.json({ error: "Client has already signed up" }, { status: 400 });
  }

  // Resend the invite
  const redirectTo = (() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
        : undefined);
    return base ? `${base}/client-invite` : undefined;
  })();

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    userData.user.email,
    {
      data: { role: "client", full_name: userData.user.user_metadata?.full_name },
      ...(redirectTo ? { redirectTo } : {}),
    }
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Invite links use this as redirect_to when set; add the URL to Supabase Auth redirect allow list. */
function clientInviteRedirectTo(): string | undefined {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : undefined);
  return base ? `${base}/auth/callback` : undefined;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createSupabaseAdmin();
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const {
    data: { user: coach },
  } = await supabaseAdmin.auth.getUser(token);
  if (!coach) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: coachProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", coach.id)
    .maybeSingle();

  if (!coachProfile || coachProfile.role !== "coach") {
    return NextResponse.json(
      { error: "Only coaches can add clients" },
      { status: 403 }
    );
  }

  const { name, email, startDate } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  // inviteUserByEmail sends the invite / set-password email. createUser does not.
  const redirectTo = clientInviteRedirectTo();
  const { data: invited, error: userError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { role: "client", full_name: name },
      ...(redirectTo ? { redirectTo } : {}),
    });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  if (!invited.user) {
    return NextResponse.json(
      { error: "Could not create invited user" },
      { status: 500 }
    );
  }

  const { data: program, error: progError } = await supabaseAdmin
    .from("programs")
    .insert({
      coach_id: coach.id,
      client_id: invited.user.id,
      start_date: startDate || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (progError) {
    return NextResponse.json({ error: progError.message }, { status: 500 });
  }

  return NextResponse.json({ program });
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
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

  const { name, email, startDate } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  const { data: newUser, error: userError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { role: "client", full_name: name },
    });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  const { data: program, error: progError } = await supabaseAdmin
    .from("programs")
    .insert({
      coach_id: coach.id,
      client_id: newUser.user.id,
      start_date: startDate || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (progError) {
    return NextResponse.json({ error: progError.message }, { status: 500 });
  }

  return NextResponse.json({ program });
}

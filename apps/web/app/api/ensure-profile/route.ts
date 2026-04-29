import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../_lib/admin";

type ValidRole = "coach" | "client";

function validRole(value: unknown): ValidRole | null {
  return value === "coach" || value === "client" ? value : null;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createSupabaseAdmin();
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingProfile, error: existingError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingProfile) {
    return NextResponse.json({ profile: existingProfile });
  }

  const role = validRole(user.user_metadata?.role);
  const fullName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "User";

  if (!role) {
    return NextResponse.json(
      { error: "Profile is missing and user metadata does not include a valid role" },
      { status: 409 }
    );
  }

  const { data: profile, error: insertError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: user.id,
      role,
      full_name: fullName,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

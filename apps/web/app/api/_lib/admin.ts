import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Verify the request comes from an authenticated coach. Returns the coach user or a JSON error response. */
export async function requireCoach(req: NextRequest) {
  const supabaseAdmin = createSupabaseAdmin();
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabaseAdmin };
  }

  const token = authHeader.slice(7);
  const {
    data: { user: coach },
  } = await supabaseAdmin.auth.getUser(token);
  if (!coach) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabaseAdmin };
  }

  const { data: coachProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", coach.id)
    .maybeSingle();

  if (!coachProfile || coachProfile.role !== "coach") {
    return { error: NextResponse.json({ error: "Only coaches can perform this action" }, { status: 403 }), supabaseAdmin };
  }

  return { coach, supabaseAdmin, error: null };
}

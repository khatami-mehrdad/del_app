import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@del/supabase";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const hasAuthCookies = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  // If auth cookies exist, attempt to refresh the session (sets new cookies
  // on the response) and let the request through regardless of whether
  // getUser succeeds — the client-side guards handle expired sessions
  // gracefully without a hard redirect.
  if (hasAuthCookies) {
    await supabase.auth.getUser();
    return response;
  }

  // No auth cookies at all — redirect to login
  if (path.startsWith("/coach")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (path === "/app" || path.startsWith("/app/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/coach/:path*", "/app/:path*"],
};

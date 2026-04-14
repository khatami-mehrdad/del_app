"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const routed = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function applySession(session: Session | null) {
      if (!session || routed.current || cancelled) return;

      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        routed.current = true;
        router.replace("/reset-password");
        return;
      }

      const role = session.user.user_metadata?.role as string | undefined;
      routed.current = true;

      if (role === "coach") {
        router.replace("/");
        return;
      }

      router.replace("/client-invite");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        applySession(session);
      }
    });

    void (async () => {
      for (let i = 0; i < 12; i++) {
        if (cancelled || routed.current) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          applySession(session);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      if (!cancelled && !routed.current) {
        setError("This sign-in link is invalid or has expired.");
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
      <div className="text-center">
        <p className="animate-pulse font-serif text-xl italic text-gold-light">Del</p>
        <p className="mt-4 font-sans text-xs font-extralight tracking-[0.2em] text-white/30">
          {error ?? "Finishing sign-in"}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-8 text-gold font-sans text-xs font-extralight uppercase tracking-[0.15em] underline underline-offset-2"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

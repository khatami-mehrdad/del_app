"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ClientUsingCoachDashboardScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-cream px-8 text-center">
      <p className="mb-4 font-serif text-3xl font-light italic text-gold-light">del</p>
      <h1 className="mb-3 font-serif text-xl font-light text-brown">Client account</h1>
      <p className="mb-8 max-w-sm font-sans text-sm font-extralight leading-relaxed text-brown-light">
        This site is the coach dashboard. Your companion experience is in the mobile app — sign
        in there with this email. Coaches use the web with their coach account.
      </p>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="rounded-full bg-brown px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white transition-colors hover:bg-brown-mid"
      >
        Sign out
      </button>
    </div>
  );
}

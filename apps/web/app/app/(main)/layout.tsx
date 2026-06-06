"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useClientAuth } from "../components/ClientAuthProvider";
import { BottomNav } from "../components/BottomNav";

function ClientGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <p className="font-serif text-2xl font-light italic text-gold-light">del</p>
      </div>
    );
  }

  if (!user) return null;

  if (profile?.role === "coach") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-cream px-8 text-center">
        <p className="mb-4 font-serif text-3xl font-light italic text-gold-light">del</p>
        <h1 className="mb-3 font-serif text-xl font-light text-brown">
          Coach account detected
        </h1>
        <p className="mb-8 max-w-sm font-sans text-sm font-extralight leading-relaxed text-brown-light">
          This is the client companion app. Please use the coach dashboard instead.
        </p>
        <button
          type="button"
          onClick={() => router.push("/coach")}
          className="rounded-full bg-brown px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white transition-colors hover:bg-brown-mid"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream pb-16">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}

export default function ClientMainLayout({ children }: { children: React.ReactNode }) {
  return <ClientGuard>{children}</ClientGuard>;
}

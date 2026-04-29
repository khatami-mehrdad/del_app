"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ClientsProvider } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";
import { ClientUsingCoachDashboardScreen } from "@/components/ClientUsingCoachDashboardScreen";
import { LoginScreen } from "@/components/LoginScreen";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && window.location.pathname !== "/") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!user) {
    return <LoginScreen />;
  }

  if (profile?.role === "client") {
    return <ClientUsingCoachDashboardScreen />;
  }

  if (profile?.role !== "coach") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-cream px-8 text-center">
        <p className="mb-4 font-serif text-3xl font-light italic text-gold-light">Del</p>
        <h1 className="mb-3 font-serif text-xl font-light text-brown">
          Account setup issue
        </h1>
        <p className="mb-8 max-w-sm font-sans text-sm font-extralight leading-relaxed text-brown-light">
          This dashboard is only for coach accounts. We could not load a valid coach
          profile for this session.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full bg-brown px-8 py-3 font-sans text-xs font-light uppercase tracking-[0.2em] text-white transition-colors hover:bg-brown-mid"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <ClientsProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-cream">{children}</main>
      </div>
    </ClientsProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </AuthProvider>
  );
}

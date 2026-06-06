"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ClientsProvider } from "@/lib/hooks";
import { Sidebar } from "@/components/Sidebar";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
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

  if (profile?.role === "client") {
    router.replace("/app");
    return null;
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
      <MobileResponsiveShell>{children}</MobileResponsiveShell>
    </ClientsProvider>
  );
}

function MobileResponsiveShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full w-[280px]">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-cream-mid bg-cream px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brown-mid"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <p className="font-serif text-lg font-light italic text-gold-light">del</p>
        </div>
        <main className="flex-1 overflow-y-auto bg-cream">{children}</main>
      </div>
    </div>
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

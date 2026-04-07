"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <div className="text-center px-6">
          <p className="font-serif italic text-xl text-gold-light animate-pulse">
            del
          </p>
          {!loading && (
            <p className="mt-3 font-sans font-extralight text-[10px] tracking-[0.2em] uppercase text-brown-light">
              Redirecting to sign in
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-cream">{children}</main>
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

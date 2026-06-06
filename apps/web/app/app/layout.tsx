"use client";

import { ClientAuthProvider } from "./components/ClientAuthProvider";

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <ClientAuthProvider>{children}</ClientAuthProvider>;
}

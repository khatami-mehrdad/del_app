import { Suspense } from "react";
import { ClientInviteScreen } from "./ClientInviteScreen";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1C1410] px-6">
      <div className="text-center">
        <p className="animate-pulse font-serif text-xl italic text-gold-light">Del</p>
        <p className="mt-4 font-sans text-xs font-extralight tracking-[0.2em] text-white/30">
          Preparing your invite
        </p>
      </div>
    </div>
  );
}

export default function ClientInvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClientInviteScreen />
    </Suspense>
  );
}

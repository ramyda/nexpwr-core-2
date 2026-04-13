"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./shared/Toast";
import { ActiveClientProvider } from "@/lib/context/ActiveClientContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActiveClientProvider>
      <ToastProvider>
        <SessionProvider>{children}</SessionProvider>
      </ToastProvider>
    </ActiveClientProvider>
  );
}

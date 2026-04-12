"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./shared/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>{children}</SessionProvider>
    </ToastProvider>
  );
}

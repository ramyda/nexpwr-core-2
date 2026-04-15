"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./shared/Toast";
import { ActiveClientProvider } from "@/lib/context/ActiveClientContext";

import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ActiveClientProvider>
        <ToastProvider>
          <SessionProvider>{children}</SessionProvider>
        </ToastProvider>
      </ActiveClientProvider>
    </ThemeProvider>
  );
}

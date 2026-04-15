import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark:bg-zinc-950 bg-zinc-50 flex h-screen font-sans antialiased overflow-hidden selection:bg-indigo-500/30 transition-colors duration-300">
      <ClientSidebar />
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col relative w-full dark:bg-zinc-950 bg-zinc-50 text-zinc-900 dark:text-zinc-50">
        {/* Context Bar Placeholder */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-8 shrink-0 dark:bg-zinc-950/50 bg-white/50 backdrop-blur-md sticky top-0 z-10 w-full">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-bold font-sans tracking-tight uppercase tracking-widest text-[11px]">Dashboard Overview</div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 w-full relative">
          <div className="p-8 w-full max-w-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

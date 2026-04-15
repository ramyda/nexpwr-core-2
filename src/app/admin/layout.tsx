import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-hidden antialiased">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar bg-zinc-950">
        <div className="max-w-[1400px] mx-auto px-10 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}

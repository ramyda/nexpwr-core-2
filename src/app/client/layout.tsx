import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#fff] text-[#111] font-sans selection:bg-emerald-500/30 overflow-hidden">
      <ClientSidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

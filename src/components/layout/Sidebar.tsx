"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, Activity, PenTool, FileText, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Map },
  { name: "Inspections", href: "/admin/inspections", icon: Activity },
  { name: "Annotations", href: "/admin/annotations", icon: PenTool },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="w-[240px] flex-shrink-0 bg-[#000000] border-r border-[#333333] h-screen flex flex-col pt-6 pb-6 text-[#ededed]">
      {/* Brand */}
      <div className="px-6 flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center shrink-0">
          <span className="font-bold text-white tracking-widest text-xs">NP</span>
        </div>
        <span className="text-sm font-semibold tracking-wide">NexPwr</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-colors ${
                isActive 
                  ? "bg-[#222222] text-[#ededed] font-medium" 
                  : "text-[#888888] hover:text-[#ededed] hover:bg-[#111111]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="px-4 mt-auto">
        <div className="border-t border-[#333333] pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
               <span className="text-xs font-medium text-zinc-300">
                 {session?.user?.name?.charAt(0) || "U"}
               </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[#ededed] leading-none mb-1">
                {session?.user?.name || "User"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-[9px] font-bold tracking-wider text-zinc-400 uppercase leading-none">
                  {(session?.user as any)?.role || "ADMIN"}
                </span>
              </div>
            </div>
          </div>
          <button 
             onClick={() => signOut({ callbackUrl: "/login" })}
             className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-900 transition-colors"
             title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

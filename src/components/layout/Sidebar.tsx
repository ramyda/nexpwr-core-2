"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Thermometer } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ClientSwitcher } from "./ClientSwitcher";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { NexpwrLogo } from "@/components/icons/NexpwrLogo";
import { GlobalSearch } from "@/components/layout/GlobalSearch";


import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronUp, Globe } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { activeClient, activeSite, activeInspection } = useActiveClient();

  const getReportsHref = () => {
    if (activeSite) return `/admin/reports?site_id=${activeSite.id}`;
    if (activeClient) return `/admin/reports?client_id=${activeClient.id}`;
    return "/admin/reports";
  };

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Thermography", href: "/admin/thermography", icon: Thermometer },
    { name: "Reports", href: getReportsHref(), icon: FileText },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="w-[240px] flex-shrink-0 bg-zinc-100 dark:bg-black border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col pt-6 pb-6 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Brand */}
      <div className="px-6 flex items-center gap-3 mb-8">
        <NexpwrLogo size={32} />
        <span className="text-sm font-bold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">NexPwr</span>
      </div>

      <ClientSwitcher />

      <GlobalSearch />

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href.split('?')[0]);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-colors ${
                isActive 
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold" 
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Card Dropdown */}
      <div className="px-4 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="rounded-full bg-zinc-900 text-[10px] font-bold text-white uppercase">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {session?.user?.name?.split(' ')[0] || "Admin"}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
                    {(session?.user as any)?.role || "ADMIN"}
                  </span>
                </div>
              </div>
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="center" 
            className="w-[208px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 p-2 shadow-2xl rounded-xl mb-2"
          >
            <div className="px-2 py-2 mb-2 flex flex-col gap-0.5">
              <span className="text-sm font-bold truncate">{session?.user?.name || "Admin User"}</span>
              <span className="text-[10px] text-zinc-500 truncate">{session?.user?.email || "admin@nexpwr.ai"}</span>
            </div>
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 mb-1" />
            
            <ThemeToggle />
            
            <DropdownMenuItem className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg group">
              <Settings className="w-4 h-4 mr-2 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
              <span>System Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 my-1" />
            
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg font-bold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

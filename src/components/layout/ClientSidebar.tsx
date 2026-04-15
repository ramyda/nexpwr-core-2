"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Map, 
  BarChart2, 
  FileText, 
  MapPin, 
  Target, 
  LogOut,
  Globe,
  Settings,
  Activity
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NavGlowLink } from "./NavGlowLink";
import { NexpwrLogo } from "@/components/icons/NexpwrLogo";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "Sites", href: "/client/sites", icon: Map },
  { name: "Anomalies", href: "/client/map", icon: MapPin },
  { name: "Reports", href: "/client/reports", icon: FileText },
  { name: "Activity", href: "/client/insights", icon: Activity },
];

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronUp } from "lucide-react";

export function ClientSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="w-[260px] flex-shrink-0 bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col transition-colors duration-300">
      {/* Brand & Badge */}
      <div className="px-6 py-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NexpwrLogo size={32} />
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Nexpwr</span>
          </div>
          <Badge variant="secondary" className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] uppercase font-bold tracking-wider px-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
            Pro
          </Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <NavGlowLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              isActive={isActive}
            >
              {item.name}
            </NavGlowLink>
          );
        })}
      </nav>

      {/* Bottom Actions & User Profile Dropdown */}
      <div className="p-4 flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer group shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-800 shadow-md">
                  <AvatarFallback className="rounded-full bg-indigo-500 text-xs font-bold text-white uppercase">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {session?.user?.name?.split(' ')[0] || "Client"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    {(session?.user as any)?.role || "VIEWER"}
                  </span>
                </div>
              </div>
              <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="center" 
            className="w-[228px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 p-2 shadow-2xl rounded-xl mb-2"
          >
            <div className="px-2 py-2 mb-2 flex flex-col gap-0.5">
              <span className="text-sm font-bold truncate">{session?.user?.name || "User"}</span>
              <span className="text-[10px] text-zinc-500 truncate">{session?.user?.email || "user@client.com"}</span>
            </div>
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 mb-1" />
            
            <ThemeToggle />
            
            <DropdownMenuItem className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg group">
              <Settings className="w-4 h-4 mr-2 text-zinc-500 group-hover:text-indigo-500" />
              <span>Workspace Settings</span>
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
        
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
          <Globe className="w-3 h-3" />
          <span>English (US)</span>
        </div>
      </div>
    </div>
  );
}

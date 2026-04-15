"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { 
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer">
        <div className="flex items-center gap-2">
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : theme === "dark" ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Monitor className="w-4 h-4 text-zinc-400" />
          )}
          <span>Appearance</span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="bg-zinc-950 border-zinc-800 text-zinc-300 min-w-[140px]">
          <DropdownMenuItem 
            onClick={() => setTheme("light")}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </div>
            {theme === "light" && <Check className="w-3 h-3 text-indigo-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </div>
            {theme === "dark" && <Check className="w-3 h-3 text-indigo-500" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("system")}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </div>
            {theme === "system" && <Check className="w-3 h-3 text-indigo-500" />}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

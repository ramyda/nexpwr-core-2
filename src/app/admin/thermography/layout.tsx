"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ClipboardList, Rocket, PenTool, BarChart3 } from "lucide-react";

const subNavItems = [
  { name: "Sites", href: "/admin/thermography/sites", icon: MapPin },
  { name: "Audits", href: "/admin/thermography/audits", icon: ClipboardList },
  { name: "Summary", href: "/admin/thermography/summary", icon: BarChart3 },
];

export default function ThermographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show sub-nav on annotator pages (they need full viewport)
  const isAnnotator = pathname.includes("/annotator/");

  if (isAnnotator) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {subNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
                isActive
                  ? "border-zinc-100 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}

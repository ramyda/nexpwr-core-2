"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface NavGlowLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  isActive: boolean;
}

export function NavGlowLink({ href, icon: Icon, children, isActive }: NavGlowLinkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Link href={href} className="w-full">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg overflow-hidden transition-colors duration-200 ${
          isActive 
            ? "bg-indigo-500/10 text-indigo-400 font-bold" 
            : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        }`}
      >
        {/* The Magnetic Glow */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(99, 102, 241, 0.1), transparent 100%)`,
          }}
        />
        
        {/* Nav Item Content */}
        <Icon className="w-4 h-4 relative z-10" />
        <span className="relative z-10 font-medium text-sm">{children}</span>
      </div>
    </Link>
  );
}

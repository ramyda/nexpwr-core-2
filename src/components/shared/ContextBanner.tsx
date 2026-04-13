"use client";

import React from "react";
import { Building2, MapPin, Search, AlertCircle, X, ChevronRight } from "lucide-react";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import Link from "next/link";

export function ContextBanner() {
  const { activeClient, activeSite, clearContext, isLoading } = useActiveClient();

  if (isLoading) return (
    <div className="h-10 bg-zinc-50 border-b border-zinc-200 animate-pulse" />
  );

  if (!activeClient) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-[12px] font-medium text-amber-800">
            No client workspace selected. Data is showing all available records.
          </p>
        </div>
        <Link 
          href="/admin/clients"
          className="text-[11px] font-bold uppercase tracking-wider text-amber-700 hover:text-amber-900 flex items-center gap-1"
        >
          Select Client <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F0FDF4] border-b border-[#DCFCE7] px-6 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-emerald-900">
          <Building2 className="w-3.5 h-3.5 opacity-60" />
          <span className="text-[12px] font-bold uppercase tracking-wide opacity-60">Client:</span>
          <span className="text-[13px] font-semibold">{activeClient.company}</span>
        </div>
        
        {activeSite && (
          <div className="flex items-center gap-2 text-emerald-900 border-l border-emerald-200 pl-6">
            <MapPin className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[12px] font-bold uppercase tracking-wide opacity-60">Site:</span>
            <span className="text-[13px] font-semibold">{activeSite.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={clearContext}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors text-[11px] font-bold uppercase tracking-wider"
        >
          <X className="w-3 h-3" /> Clear Context
        </button>
      </div>
    </div>
  );
}

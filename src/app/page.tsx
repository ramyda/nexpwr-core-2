"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { SetupTab } from "@/components/Tabs/SetupTab";
import { InspectionTab } from "@/components/Tabs/InspectionTab";
import { AnnotateTab } from "@/components/Tabs/AnnotateTab";
import { ReportTab } from "@/components/Tabs/ReportTab";

export default function SolarDashboard() {
  const activeTab = useAppStore((state) => state.inspectionMetadata.activeTab);
  const setInspectionMeta = useAppStore((state) => state.setInspectionMetadata);

  const tabs = [
    { id: 'setup', label: '1. SETUP' },
    { id: 'inspection', label: '2. INSPECTION' },
    { id: 'annotate', label: '3. ANNOTATE' },
    { id: 'report', label: '4. REPORT' }
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans flex flex-col">
      <header className="bg-zinc-950 border-b border-zinc-900 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="font-bold text-white tracking-widest text-xs">NP</span>
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-100 hidden sm:block">
              Solar Anomaly<span className="text-zinc-500 font-light ml-2">Admin Dashboard</span>
            </h1>
          </div>
          
          <div className="flex border border-zinc-800 rounded bg-zinc-900/50 p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setInspectionMeta({ activeTab: tab.id })}
                className={`px-4 py-1.5 text-xs font-semibold tracking-wider rounded transition-colors ${
                  activeTab === tab.id 
                    ? "bg-zinc-800 text-emerald-400 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 overflow-hidden">
        {activeTab === 'setup' && <SetupTab />}
        {activeTab === 'inspection' && <InspectionTab />}
        {activeTab === 'annotate' && <AnnotateTab />}
        {activeTab === 'report' && <ReportTab />}
      </main>
    </div>
  );
}

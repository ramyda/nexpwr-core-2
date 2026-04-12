"use client";

import React, { useEffect, useState } from "react";
import { CanvasViewer } from "@/components/CanvasViewer";
import { AnomalyTable } from "@/components/AnomalyTable";
import { MiniMap } from "@/components/MiniMap";
import { SummaryStats } from "@/components/SummaryStats";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, Save, Download, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/BackButton";

export default function WorkspacePage() {
  const router = useRouter();
  const thermalImageFile = useAppStore((state) => state.thermalImageFile);
  const anomalies = useAppStore((state) => state.anomalies);
  const [activeTab, setActiveTab] = useState<"Annotations" | "Properties">("Annotations");

  // Auth/Protection guard for direct link hits without store images (temporary for local state)
  useEffect(() => {
    if (!thermalImageFile) {
      router.push("/admin/inspections/new");
    }
  }, [thermalImageFile, router]);

  if (!thermalImageFile) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#111] text-[#ededed] font-sans overflow-hidden">
      
      {/* TOPBAR */}
      <div className="h-[48px] shrink-0 border-b border-[#333] bg-[#000] flex items-center justify-between px-4">
         <div className="flex items-center gap-4">
            <BackButton className="mb-0 bg-transparent hover:bg-zinc-900 border-0" />
            <div className="flex items-center gap-2 bg-emerald-950/30 px-3 py-1 rounded-md border border-emerald-900/50">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">Live Annotator</span>
            </div>
            <div className="text-sm font-medium text-zinc-500 hidden md:block">
               {thermalImageFile.name}
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex gap-2 mr-4">
              <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>{anomalies.filter(a=>a.severity === 'critical').length}</span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>{anomalies.filter(a=>a.severity === 'moderate').length}</span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{anomalies.filter(a=>a.severity === 'minor').length}</span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>{anomalies.filter(a=>a.severity === 'not_significant').length}</span>
            </div>
            <button className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button className="flex items-center gap-2 bg-[#ededed] hover:bg-white text-black px-4 py-1.5 rounded text-xs font-semibold transition-colors">
              <Save className="w-3.5 h-3.5" /> Save Inspection
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* LEFT TOOLBAR is now inside CanvasViewer or rendered conceptually near it. Our existing Component renders a floating toolbar inside it. */}
         
         {/* MAIN CANVAS AREA */}
         <div className="flex-1 relative bg-[#0a0a0a]">
            {/* Our legacy CanvasViewer has its own internal toolbars that float over the map. */}
            <CanvasViewer imageFile={thermalImageFile} />
            
            {/* MINI MAP OVERLAY */}
            <div className="absolute bottom-6 right-6 w-64 shadow-2xl overflow-hidden rounded border border-zinc-800 bg-black z-10 pointer-events-none">
                {/* MiniMap is legacy pointer-events-auto but floating here */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                   <span>Overview</span>
                   <Navigation className="w-3 h-3" />
                </div>
                <div className="p-1 pointer-events-auto">
                  <MiniMap />
                </div>
            </div>
         </div>

         {/* RIGHT SIDEBAR */}
         <div className="w-[360px] shrink-0 bg-[#000] border-l border-[#333] flex flex-col pt-2">
            <div className="flex items-center gap-4 px-6 border-b border-[#333] mb-4">
              <button 
                onClick={() => setActiveTab("Annotations")}
                className={`py-3 text-xs font-medium uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'Annotations' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Annotations ({anomalies.length})
              </button>
              <button 
                onClick={() => setActiveTab("Properties")}
                className={`py-3 text-xs font-medium uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'Properties' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                Properties
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-6 custom-scrollbar">
               {activeTab === "Annotations" ? (
                 <div className="space-y-4">
                   <SummaryStats />
                   <div className="pt-2 border-t border-zinc-900">
                     <AnomalyTable />
                   </div>
                 </div>
               ) : (
                 <div className="text-zinc-500 text-sm text-center mt-12 px-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg">
                      <p>Select an anomaly on the canvas to view or edit its physical properties, coordinate mapping, and thermal attributes here.</p>
                      <p className="mt-4 text-xs">If no anomaly is active, use the polygon tool to draw over a panel.</p>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* STATUSBAR */}
      <div className="h-[28px] shrink-0 bg-[#000] border-t border-[#333] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-500">
         <div className="flex items-center gap-4">
           <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sensor Ready</span>
           <span>Zoom: Auto</span>
           <span>Annotations: {anomalies.length}</span>
         </div>
         <div className="flex justify-end gap-4">
           <span>Tool: Polygon</span>
           <span>Standard: IEC 62446-3:2017</span>
         </div>
      </div>
    </div>
  );
}

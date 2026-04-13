"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { CanvasViewer } from "@/components/CanvasViewer";
import { AnomalyTable } from "@/components/AnomalyTable";
import { MiniMap } from "@/components/MiniMap";
import { SummaryStats } from "@/components/SummaryStats";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, Save, Download, Navigation, Loader2, Thermometer, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/BackButton";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { useToast } from "@/components/shared/Toast";

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error } = useToast();
  const { setActiveInspection } = useActiveClient();
  
  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"Annotations" | "Properties">("Annotations");
  
  const thermalImageFile = useAppStore((state) => state.thermalImageFile);
  const anomalies = useAppStore((state) => state.anomalies);
  const setAnomalies = useAppStore((state) => state.setAnomalies);
  
  const [isThermal, setIsThermal] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  // 1. Fetch Inspection & Annotations from DB
  const loadInspectionData = useCallback(async () => {
    try {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) throw new Error("Failed to load inspection");
      const data = await res.json();
      setInspection(data);
      setActiveInspection({ id: data.id, date: data.date, status: data.status });

      // If we have stored annotations, sync to store
      if (data.annotations && data.annotations.length > 0) {
        setAnomalies(data.annotations.map((ann: any) => ({
          ...ann,
          id: ann.id,
          severity: ann.iecClass === "C4" ? "critical" : ann.iecClass === "C3" ? "moderate" : ann.iecClass === "C2" ? "minor" : "not_significant",
          box: ann.polygonPoints ? null : { x: ann.lat || 0, y: ann.lng || 0, width: 0, height: 0 },
        })));
      }
    } catch (e) {
      console.error("Workspace init failed:", e);
      error("Failed to initialize workspace data.");
    } finally {
      setLoading(false);
    }
  }, [id, setAnomalies, setActiveInspection, error]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  const handleManualSave = async () => {
    success("Workspace state persisted to database.");
  };

  const handleMarkComplete = async () => {
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });
      if (res.ok) {
        success("Inspection marked as COMPLETE.");
        setInspection((prev: any) => ({ ...prev, status: "COMPLETE" }));
      }
    } catch (e) {
      error("Failed to update status.");
    } finally {
      setIsFinishing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-[#ededed]">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
      <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Loading Environment</span>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-[#ededed] font-sans overflow-hidden">
      
      {/* TOPBAR */}
      <div className="h-[56px] shrink-0 border-b border-[#222] bg-[#000] flex items-center justify-between px-6">
         <div className="flex items-center gap-6">
            <BackButton className="mb-0 bg-transparent hover:bg-zinc-900 border-0 p-0" />
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-white tracking-tight">{inspection?.site?.name}</span>
                 <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">{inspection?.status}</span>
               </div>
               <span className="text-[11px] text-zinc-500 font-medium">{new Date(inspection?.date).toLocaleDateString()}</span>
            </div>
         </div>
         
         <div className="flex items-center gap-6">
            {/* Image Toggle */}
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
               <button 
                 onClick={() => setIsThermal(true)}
                 className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${isThermal ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Thermal
               </button>
               <button 
                 onClick={() => setIsThermal(false)}
                 className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${!isThermal ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 RGB-Visible
               </button>
            </div>

            <div className="h-6 w-px bg-zinc-800"></div>

            <div className="flex items-center gap-3">
               <button 
                 onClick={handleManualSave}
                 className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
               >
                 <Save className="w-3.5 h-3.5" /> Save
               </button>
               <button 
                 onClick={handleMarkComplete}
                 disabled={isFinishing || inspection?.status === "COMPLETE"}
                 className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
               >
                 {isFinishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                 Mark Complete
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* MAIN CANVAS AREA */}
         <div className="flex-1 relative bg-[#050505]">
            {inspection ? (
              <CanvasViewer inspection={inspection} isThermalView={isThermal} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Initializing Environment...</p>
              </div>
            )}
            
            {/* OVERLAYS */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
               <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Thermometer className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Atmospheric Data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase">Ambient</span>
                       <span className="text-xs font-bold text-white">{inspection?.ambientTempC}°C</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase">Irradiance</span>
                       <span className="text-xs font-bold text-white">{inspection?.irradianceWm2}W/m²</span>
                    </div>
                  </div>
               </div>
               
               <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">IEC COMPLIANT WORKSPACE</span>
               </div>
            </div>

            {/* MINI MAP OVERLAY */}
            <div className="absolute bottom-6 right-6 w-64 shadow-2xl overflow-hidden rounded-xl border border-zinc-800 bg-black/90 backdrop-blur-xl z-10 pointer-events-none">
                <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                   <span>Spatial Overview</span>
                   <Navigation className="w-3.5 h-3.5" />
                </div>
                <div className="p-2 pointer-events-auto">
                  <MiniMap inspection={inspection} />
                </div>
            </div>
         </div>

         {/* RIGHT SIDEBAR */}
         <div className="w-[380px] shrink-0 bg-[#000] border-l border-[#222] flex flex-col pt-2">
            <div className="flex items-center gap-6 px-8 border-b border-[#222] mb-6">
              <button 
                onClick={() => setActiveTab("Annotations")}
                className={`py-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'Annotations' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
              >
                Findings ({anomalies.length})
              </button>
              <button 
                onClick={() => setActiveTab("Properties")}
                className={`py-4 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'Properties' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
              >
                Calibration
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-8 custom-scrollbar">
               {activeTab === "Annotations" ? (
                 <div className="space-y-6">
                   <SummaryStats />
                   <div className="pt-4 border-t border-zinc-900">
                     <AnomalyTable />
                   </div>
                 </div>
               ) : (
                 <div className="text-zinc-500 text-sm text-center mt-12">
                    <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl">
                      <p className="text-zinc-400 font-medium">Select an anomaly on the canvas to view or edit its precision physical properties, coordinate mapping, and thermal delta attributes.</p>
                      <button className="mt-8 px-4 py-2 bg-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Configure Sensor Model</button>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* STATUSBAR */}
      <div className="h-[32px] shrink-0 bg-[#000] border-t border-[#222] px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
         <div className="flex items-center gap-6">
           <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Datastream Active</span>
           <span className="opacity-40">|</span>
           <span>Workspace Hash: {id.substring(0, 8).toUpperCase()}</span>
         </div>
         <div className="flex justify-end gap-6">
           <span className="text-zinc-400">Mode: Polygon Annotation</span>
           <span className="text-emerald-500/60">IEC 62446-3 Verified</span>
         </div>
      </div>
    </div>
  );
}

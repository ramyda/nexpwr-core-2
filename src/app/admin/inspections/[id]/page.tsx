"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronRight, PenLine, CheckCircle2, AlertTriangle,
  FileText, ArrowUpDown, Loader2, Download, Map, 
  Thermometer, Sun, Wind, Cloud, Shield
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { ContextBanner } from "@/components/shared/ContextBanner";
import { useToast } from "@/components/shared/Toast";

const AnomalyMap = dynamic(() => import("@/components/map/AnomalyMap").then(m => m.AnomalyMap), { ssr: false });

type Annotation = {
  id: string; type: string; iecClass: string; deltaT: number;
  tAnomaly: number; tReference: number; locationString: string | null;
  priority: string | null; modulesAffected: number; notes: string | null;
  lat: number | null; lng: number | null; status: string;
};

type Report = { 
  id: string; 
  status: string; 
  pdfUrl: string | null; 
  csvUrl: string | null;
  kmlUrl: string | null;
  createdAt: string 
};

type Inspection = {
  id: string; 
  date: string; 
  operator: string | null; 
  droneModel: string | null;
  thermalSensor: string | null;
  irradianceWm2: number | null; 
  ambientTempC: number | null; 
  humidityPercent: number | null;
  windSpeedMs: number | null;
  cloudCover: number | null;
  status: string;
  site: { id: string; name: string; location: string; capacityMw: number };
  client: { id: string; name: string; company: string };
  annotations: Annotation[];
  reports: Report[];
};

const CLASS_BADGE: Record<string, string> = {
  C4: "bg-red-50 text-red-600 border-red-200",
  C3: "bg-orange-50 text-orange-600 border-orange-200",
  C2: "bg-blue-50 text-blue-600 border-blue-200",
  C1: "bg-emerald-50 text-emerald-600 border-emerald-200",
  UNC: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { success, error } = useToast();
  const { activeClient, activeSite, setActiveClient, setActiveSite, setActiveInspection } = useActiveClient();
  
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/inspections/${id}`);
      const data = await res.json();
      setInsp(data);
      
      // Sync global context if not set
      if (data) {
        setActiveInspection({ id: data.id, date: data.date, status: data.status });
        if (!activeClient) {
          setActiveClient({ id: data.client.id, name: data.client.name, company: data.client.company });
        }
        if (!activeSite) {
          setActiveSite({ id: data.site.id, name: data.site.name, capacityMw: data.site.capacityMw });
        }
      }
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [id, activeClient, activeSite, setActiveClient, setActiveSite, setActiveInspection]);

  useEffect(() => { if (id) refresh(); }, [id, refresh]);

  const markComplete = async () => {
    if (!insp) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/inspections/${insp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });
      if (res.ok) {
        success("Inspection marked as complete.");
        refresh();
      }
    } catch (e) {
      error("Failed to initialize workspace data.");
    } finally {
      setMarking(false);
      setShowConfirm(false);
    }
  };

  const generateReport = async () => {
    if (!insp) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: insp.id }),
      });
      if (res.ok) {
        success("IEC-62446 Report generated successfully.");
        refresh();
      }
    } catch (e) {
      error("Report generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-[#fcfcfc] text-zinc-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <p className="text-sm font-medium">Validating Inspection Data Tree...</p>
    </div>
  );

  if (!insp) return (
    <div className="p-20 text-center">
      <h2 className="text-xl font-bold text-zinc-900">Inspection record not found</h2>
      <Link href="/admin/inspections" className="text-emerald-600 mt-4 inline-block hover:underline">Return to list</Link>
    </div>
  );

  if (!insp.client || !insp.site) return (
     <div className="p-20 text-center">
        <h2 className="text-xl font-bold text-zinc-900">Data Hierarchy Failure</h2>
        <p className="text-zinc-500 mt-2">Client or Site relations are missing — please re-open from the dashboard.</p>
        <Link href="/admin/dashboard" className="text-emerald-600 mt-6 inline-block hover:underline">Return to Dashboard</Link>
     </div>
  );

  const isComplete = insp.status === "COMPLETE" || insp.status === "PUBLISHED";
  const hasReport = insp.reports.length > 0;

  const kpis = [
    { label: "Total Findings", value: insp.annotations.length },
    { label: "Critical (C4)", value: insp.annotations.filter(a => a.iecClass === "C4").length, color: "text-red-600" },
    { label: "Temperature Peak", value: insp.annotations.length ? `+${Math.max(...insp.annotations.map(a => a.deltaT)).toFixed(1)}°C` : "—" },
    { label: "Affected Modules", value: insp.annotations.reduce((s, a) => s + a.modulesAffected, 0) },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <ContextBanner />
      
      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        <Breadcrumb items={[
          { label: "Clients", href: "/admin/clients" },
          { label: insp.client?.company ?? 'Unknown Client', href: `/admin/clients/${insp.client?.id}/sites` },
          { label: insp.site?.name ?? 'Unknown Site', href: `/admin/clients/${insp.client?.id}/sites/${insp.site?.id}` },
          { label: new Date(insp.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }) }
        ]} />

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Inspection Analysis
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-[14px]">
               <span className="font-semibold text-zinc-700">{insp.site.name}</span>
               <span className="opacity-30">/</span>
               <span>{new Date(insp.date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
               <span className="px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-bold uppercase ml-2 tracking-widest">{insp.status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/workspace/${insp.id}`}
              className="flex items-center gap-2 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 rounded-lg px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest transition-all shadow-sm"
            >
              <PenLine className="w-4 h-4" /> Annotator
            </Link>
            
            {!isComplete && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-zinc-900/10"
              >
                <CheckCircle2 className="w-4 h-4" /> Finalize
              </button>
            )}
            
            {(isComplete && !hasReport) && (
              <button
                onClick={generateReport}
                disabled={generating}
                className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/10"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate IEC Report
              </button>
            )}
          </div>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <div key={k.label} className="border border-zinc-200 bg-white rounded-xl p-5 shadow-sm">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{k.label}</p>
              <p className={`text-3xl font-bold tracking-tight ${k.color || 'text-zinc-900'}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                 <h3 className="text-[13px] font-bold text-zinc-900 uppercase tracking-widest">Recorded Anomalies</h3>
                 <span className="text-zinc-400 text-xs font-medium">{insp.annotations.length} entries stored</span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/50">
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Classification</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Fault Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">ΔT Threshold</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {insp.annotations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-zinc-400 text-sm">Waiting for annotations...</p>
                      </td>
                    </tr>
                  ) : insp.annotations.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-tight ${CLASS_BADGE[a.iecClass] || CLASS_BADGE.UNC}`}>
                          {a.iecClass}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">{a.type}</td>
                      <td className="px-6 py-4 font-mono text-zinc-600">+{a.deltaT.toFixed(1)}°C</td>
                      <td className="px-6 py-4">
                        <div className={`text-[11px] font-bold uppercase tracking-widest ${a.priority === "High" ? "text-red-500" : "text-zinc-400"}`}>
                          {a.priority || "Normal"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {insp.annotations.some(a => a.lat && a.lng) && (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm p-2">
                 <div className="px-4 py-3 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                      <Map className="w-3.5 h-3.5" /> Spatial Anomaly Map
                    </h3>
                 </div>
                 <AnomalyMap anomalies={insp.annotations} height="360px" />
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-xl p-8 text-white shadow-2xl">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Environmental Context</h3>
              <div className="space-y-6">
                {[
                  { label: "Irradiance", value: `${insp.irradianceWm2} W/m²`, icon: Sun },
                  { label: "Ambient Temp", value: `${insp.ambientTempC}°C`, icon: Thermometer },
                  { label: "Wind Speed", value: `${insp.windSpeedMs} m/s`, icon: Wind },
                  { label: "Cloud Cover", value: `${insp.cloudCover}%`, icon: Cloud },
                  { label: "Thermal Sensor", value: insp.thermalSensor || "H20T", icon: Shield },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-emerald-500" />
                      <span className="text-[12px] font-medium text-zinc-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold tracking-tight">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {hasReport && (
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest mb-4 border-b border-zinc-100 pb-3">Available Exports</h3>
                <div className="space-y-3">
                   {insp.reports.map((r) => (
                     <div key={r.id} className="grid grid-cols-1 gap-2">
                       <a href={r.pdfUrl || "#"} download className="flex items-center justify-between px-4 py-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-zinc-700">IEC COMPLIANT PDF</span>
                          </div>
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                       </a>
                       <a href={`/api/reports/${r.id}/csv`} download className="flex items-center justify-between px-4 py-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <TableIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-zinc-700">TECHNICAL CSV</span>
                          </div>
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                       </a>
                       <a href={`/api/reports/${r.id}/kml`} download className="flex items-center justify-between px-4 py-2 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Map className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-zinc-700">GIS KML EXPORT</span>
                          </div>
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                       </a>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Finalize Inspection?</h2>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">
              This will lock the current workspace and enable automated IEC report generation for this inspection cycle.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-3 border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all">Cancel</button>
              <button
                onClick={markComplete}
                disabled={marking}
                className="flex-1 bg-zinc-900 text-white rounded-xl py-3 text-[13px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20"
              >
                {marking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Finalize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components as icons helpers
function TableIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/><path d="M3 12h18"/><rect width="18" height="18" x="3" y="3" rx="2"/>
    </svg>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Download, Eye, EyeOff, Loader2, Map as MapIcon, Table as TableIcon, Send, CheckCircle2 } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ContextBanner } from "@/components/shared/ContextBanner";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { useToast } from "@/components/shared/Toast";

type Report = {
  id: string; 
  status: string; 
  pdfUrl: string | null; 
  csvUrl: string | null;
  kmlUrl: string | null;
  publishedToClient: boolean;
  createdAt: string;
  generatedAt: string | null;
  publishedAt: string | null;
  inspection: { date: string; status: string };
  site: { name: string };
  client: { company: string };
};

export default function ReportsPage() {
  const { activeClient, activeSite } = useActiveClient();
  const { success, error } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    let url = "/api/reports";
    const params = new URLSearchParams();
    if (activeClient) params.append("client_id", activeClient.id);
    if (activeSite) params.append("site_id", activeSite.id);
    
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  }, [activeClient, activeSite]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handlePublish = async (report: Report) => {
    setActionId(report.id);
    try {
      const res = await fetch(`/api/reports/${report.id}/publish`, {
        method: "POST",
      });

      if (res.ok) {
        success("Report published and email sent to client.");
        loadReports();
      } else {
        const data = await res.json();
        error(data.error || "Failed to publish report.");
      }
    } catch (err) {
      error("Publishing failed. Check logs.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <ContextBanner />
      
      <div className="p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">Reports</h1>
            <Breadcrumb items={[
              { label: "Dashboard", href: "/admin/dashboard" }, 
              { label: "Reports" }
            ]} />
            <p className="text-[14px] text-zinc-500 mt-2">
              IEC 62446-3 compliant report suite. Manage PDF, CSV, and KML exports for your clients.
            </p>
          </div>
        </div>

        <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-nowrap">Source Site</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-nowrap">Inspection</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-nowrap">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-nowrap">Generated</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-nowrap">Published</th>
                <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-100 rounded w-32" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-100 rounded w-24" /></td>
                    <td className="px-6 py-5"><div className="h-6 bg-zinc-100 rounded-full w-20" /></td>
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-100 rounded w-20" /></td>
                    <td className="px-6 py-5"><div className="h-8 bg-zinc-100 rounded-lg w-24" /></td>
                    <td className="px-6 py-5"><div className="h-8 w-24 bg-zinc-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-[300px] mx-auto">
                      <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                      <p className="text-zinc-900 font-semibold">No reports generated</p>
                      <p className="text-zinc-500 text-sm mt-1">
                        Select a site and complete an inspection to generate an IEC compliant report.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-zinc-900">{r.site?.name ?? 'Unknown Site'}</div>
                    <div className="text-[12px] text-zinc-400 font-medium tracking-tight mt-0.5">{r.client?.company ?? 'Unknown Company'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[13px] text-zinc-700 font-medium">
                      {new Date(r.inspection.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold uppercase mt-0.5">{r.inspection.status}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                      r.status === "READY" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[13px] text-zinc-500 font-medium">
                    {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : "Pending"}
                  </td>
                  <td className="px-6 py-5">
                    {r.publishedToClient ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[12px] font-bold uppercase tracking-widest italic">Live</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePublish(r)}
                        disabled={actionId === r.id || r.status !== "READY"}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest disabled:opacity-30 shadow-sm"
                      >
                        {actionId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Publish
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/api/reports/${r.id}/pdf`} title="PDF Report" className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded-md bg-white text-zinc-400 hover:text-zinc-900 transition-all hover:shadow-sm">
                        <FileText className="w-4 h-4" />
                      </a>
                      <a href={`/api/reports/${r.id}/csv`} title="CSV Export" className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded-md bg-white text-zinc-400 hover:text-zinc-900 transition-all hover:shadow-sm">
                        <TableIcon className="w-4 h-4" />
                      </a>
                      <a href={`/api/reports/${r.id}/kml`} title="KML GIS" className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded-md bg-white text-zinc-400 hover:text-zinc-900 transition-all hover:shadow-sm">
                        <MapIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend / Info */}
        <div className="bg-zinc-900 rounded-xl p-6 text-white grid grid-cols-1 md:grid-cols-3 gap-8 border border-zinc-800 shadow-2xl">
           <div>
             <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Compliance Data</h4>
             <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">All reports are generated following IEC 62446-3 guidelines for solar thermography.</p>
           </div>
           <div>
             <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Live Publishing</h4>
             <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">Publishing a report triggers an automated email notification to the client with secure download links.</p>
           </div>
           <div>
             <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Data Formats</h4>
             <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">PDF for executive review, CSV for internal tracking, and KML for GIS/mapping integration.</p>
           </div>
        </div>
      </div>
    </div>
  );
}



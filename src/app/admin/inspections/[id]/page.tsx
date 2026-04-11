"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ChevronRight, PenLine, CheckCircle2, AlertTriangle,
  FileText, ArrowUpDown, Loader2, Download, Map
} from "lucide-react";

const AnomalyMap = dynamic(() => import("@/components/map/AnomalyMap").then(m => m.AnomalyMap), { ssr: false });

type Anomaly = {
  id: string; type: string; iecClass: string; deltaTC: number;
  tAnomalyC: number; tReferenceC: number; locationString: string | null;
  priority: string | null; modulesAffected: number; notes: string | null;
  lat: number | null; lng: number | null; status: string;
};
type Report = { id: string; status: string; pdfUrl: string | null; createdAt: string };
type Inspection = {
  id: string; date: string; operator: string | null; droneModel: string | null;
  irradianceWm2: number | null; ambientTempC: number | null; status: string;
  site: { id: string; name: string; location: string };
  anomalies: Anomaly[];
  reports: Report[];
};

const CLASS_BADGE: Record<string, string> = {
  C4: "bg-red-50 text-red-600 border-red-200",
  C3: "bg-orange-50 text-orange-600 border-orange-200",
  C2: "bg-blue-50 text-blue-600 border-blue-200",
  C1: "bg-emerald-50 text-emerald-600 border-emerald-200",
  UNC: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function InspectionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const refresh = () =>
    fetch(`/api/inspections/${id}`)
      .then((r) => r.json())
      .then((d) => { setInsp(d); setLoading(false); })
      .catch(() => { setLoading(false); });

  useEffect(() => { if (id) refresh(); }, [id]);

  const markComplete = async () => {
    if (!insp) return;
    setMarking(true);
    await fetch(`/api/inspections/${insp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETE" }),
    });
    await refresh();
    setMarking(false);
    setShowConfirm(false);
  };

  const generateReport = async () => {
    if (!insp) return;
    setGenerating(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspectionId: insp.id }),
    });
    await refresh();
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#888] text-sm">Loading inspection...</div>
  );
  if (!insp) return null;

  const isComplete = insp.status === "COMPLETE";
  const hasReport = insp.reports.length > 0;

  const kpis = [
    { label: "Total Anomalies", value: insp.anomalies.length },
    { label: "C4 Critical", value: insp.anomalies.filter(a => a.iecClass === "C4").length },
    { label: "Max ΔT", value: insp.anomalies.length ? `+${Math.max(...insp.anomalies.map(a => a.deltaTC)).toFixed(1)}°C` : "—" },
    { label: "Modules Affected", value: insp.anomalies.reduce((s, a) => s + a.modulesAffected, 0) },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#888]">
        <Link href="/admin/sites" className="hover:text-[#111]">Sites</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/admin/sites/${insp.site.id}`} className="hover:text-[#111]">{insp.site.name}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111] font-medium font-mono">{new Date(insp.date).toLocaleDateString("en-GB")}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">
            Inspection — {new Date(insp.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </h1>
          <p className="text-[14px] text-[#888] mt-0.5">{insp.site.name} · {insp.operator || "Operator unspecified"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${insp.id}`}
            className="flex items-center gap-2 border border-[#eaeaea] bg-white text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
          >
            <PenLine className="w-4 h-4" /> Open Annotator
          </Link>
          {!isComplete ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 bg-[#16A34A] text-white hover:bg-[#15803d] rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </button>
          ) : (
            <button
              onClick={generateReport}
              disabled={generating || hasReport}
              className="flex items-center gap-2 bg-[#111] text-white hover:bg-[#333] rounded-md px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {hasReport ? "Report Generated" : "Generate Report"}
            </button>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${isComplete ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
          {isComplete ? "Complete" : "Pending Annotation"}
        </span>
        {!isComplete && (
          <span className="text-xs text-[#888]">Mark inspection complete to unlock report generation</span>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-[#eaeaea] bg-white rounded-lg p-4">
            <p className="text-xs text-[#888] mb-1">{k.label}</p>
            <p className="text-2xl font-semibold text-[#111] font-mono">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Inspection metadata */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eaeaea]">
          <h3 className="text-sm font-semibold text-[#111]">Inspection Conditions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-[#eaeaea] flex-wrap">
          {[
            { label: "Drone", value: insp.droneModel || "—" },
            { label: "Irradiance", value: insp.irradianceWm2 ? `${insp.irradianceWm2} W/m²` : "—" },
            { label: "Ambient Temp", value: insp.ambientTempC ? `${insp.ambientTempC}°C` : "—" },
          ].map((m) => (
            <div key={m.label} className="px-6 py-4">
              <p className="text-xs text-[#888] mb-0.5">{m.label}</p>
              <p className="text-sm font-semibold text-[#111] font-mono">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Table */}
      <div>
        <h2 className="text-lg font-semibold text-[#111] mb-4">Anomalies ({insp.anomalies.length})</h2>
        <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
                <th className="px-5 py-3 font-medium text-[#444]">Type</th>
                <th className="px-5 py-3 font-medium text-[#444]">IEC Class</th>
                <th className="px-5 py-3 font-medium text-[#444] flex items-center gap-1">ΔT <ArrowUpDown className="w-3 h-3" /></th>
                <th className="px-5 py-3 font-medium text-[#444]">T Anomaly</th>
                <th className="px-5 py-3 font-medium text-[#444]">Location</th>
                <th className="px-5 py-3 font-medium text-[#444]">Priority</th>
                <th className="px-5 py-3 font-medium text-[#444]">Modules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeaea]">
              {insp.anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <AlertTriangle className="w-7 h-7 text-[#ccc] mx-auto mb-3" />
                    <p className="text-[#888] text-sm">No anomalies recorded yet.</p>
                    <p className="text-[#bbb] text-xs mt-1">Open the annotator and draw on the thermal image to add anomalies.</p>
                    <Link href={`/workspace/${insp.id}`} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-emerald-600 hover:underline">
                      <PenLine className="w-4 h-4" /> Open Annotator
                    </Link>
                  </td>
                </tr>
              ) : insp.anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#111]">{a.type}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${CLASS_BADGE[a.iecClass] || CLASS_BADGE.UNC}`}>
                      {a.iecClass}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[#444]">+{a.deltaTC.toFixed(1)}°C</td>
                  <td className="px-5 py-3 font-mono text-[#444]">{a.tAnomalyC.toFixed(1)}°C</td>
                  <td className="px-5 py-3 text-[#666]">{a.locationString || "—"}</td>
                  <td className={`px-5 py-3 font-medium text-sm ${a.priority === "High" ? "text-red-500" : a.priority === "Medium" ? "text-amber-500" : "text-zinc-400"}`}>
                    {a.priority || "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-[#444]">{a.modulesAffected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports */}
      {hasReport && (
        <div>
          <h2 className="text-lg font-semibold text-[#111] mb-4">Reports</h2>
          <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
            {insp.reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-4 border-b border-[#eaeaea] last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#888]" />
                  <div>
                    <p className="text-sm font-medium text-[#111]">Inspection Report</p>
                    <p className="text-xs text-[#888]">Generated {new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${r.status === "READY" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly Map */}
      {insp.anomalies.some(a => a.lat && a.lng) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-[#888]" />
            <h2 className="text-lg font-semibold text-[#111]">Anomaly Map</h2>
          </div>
          <AnomalyMap anomalies={insp.anomalies} height="420px" />
        </div>
      )}

      {/* Export Downloads */}
      {hasReport && (
        <div>
          <h2 className="text-lg font-semibold text-[#111] mb-4">Export</h2>
          <div className="flex flex-wrap gap-3">
            {insp.reports.map((r) => (
              <>
                <a key={`pdf-${r.id}`} href={`/api/reports/${r.id}/pdf`} download
                  className="flex items-center gap-2 border border-[#eaeaea] bg-white text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-[13px] font-medium transition-colors">
                  <Download className="w-4 h-4" /> PDF Report
                </a>
                <a key={`csv-${r.id}`} href={`/api/reports/${r.id}/csv`} download
                  className="flex items-center gap-2 border border-[#eaeaea] bg-white text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-[13px] font-medium transition-colors">
                  <Download className="w-4 h-4" /> CSV Data
                </a>
                <a key={`kml-${r.id}`} href={`/api/reports/${r.id}/kml`} download
                  className="flex items-center gap-2 border border-[#eaeaea] bg-white text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-[13px] font-medium transition-colors">
                  <Download className="w-4 h-4" /> KML (Google Earth)
                </a>
              </>
            ))}
          </div>
        </div>
      )}

      {/* Mark Complete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#eaeaea] p-8 max-w-md w-full shadow-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4" />
            <h2 className="text-xl font-semibold text-[#111] mb-2">Mark Inspection Complete?</h2>
            <p className="text-[#666] text-sm mb-6">
              This will lock the inspection for further annotation and unlock report generation. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-[#eaeaea] rounded-md text-sm text-[#666] hover:bg-zinc-50">
                Cancel
              </button>
              <button
                onClick={markComplete}
                disabled={marking}
                className="px-4 py-2 bg-[#16A34A] text-white rounded-md text-sm font-semibold hover:bg-[#15803d] flex items-center gap-2 disabled:opacity-60"
              >
                {marking && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

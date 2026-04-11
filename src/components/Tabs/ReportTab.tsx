"use client";

import React, { useMemo, useState } from "react";
import { Download, FileText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { generateRaptorPDF, preflightCheck } from "@/lib/pdfGenerator";

export function ReportTab() {
  const anomalies = useAppStore((s) => s.anomalies);
  const plantMeta = useAppStore((s) => s.plantMetadata);
  const inspMeta  = useAppStore((s) => s.inspectionMetadata);
  const [isExporting, setIsExporting] = useState(false);

  const preflight = useMemo(
    () => preflightCheck(anomalies, plantMeta, inspMeta),
    [anomalies, plantMeta, inspMeta]
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateRaptorPDF(anomalies, plantMeta, inspMeta);
    } catch (err: any) {
      alert("Report generation blocked:\n\n" + (err?.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    try {
      const { generateRaptorHTML } = await import("@/lib/htmlGenerator");
      await generateRaptorHTML(anomalies, plantMeta, inspMeta);
    } catch (err: any) {
      alert("Report generation blocked:\n\n" + (err?.message || "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (anomalies.length === 0) { alert("No anomalies to export."); return; }
    const headers = ["ID", "Type", "IEC Class", "ΔT (°C)", "Modules Affected", "Severity", "Panel Location", "Annual kWh", "Annual $", "Notes", "Timestamp"];
    const rows = anomalies.map(a => [
      a.id, `"${a.type}"`,
      a.severity, a.tempDeltaC ?? "", a.modulesAffected ?? 1,
      a.severity, `"${a.panelLocation || ""}"`,
      "", "", // kWh/$ would need imports here
      `"${(a.notes || "").replace(/"/g, '""')}"`,
      new Date(a.timestamp).toLocaleString(),
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `${plantMeta.name || "inspection"}_anomalies.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (anomalies.length === 0) { alert("No anomalies to export."); return; }
    const exportData = {
      plantMetadata: plantMeta,
      inspectionMetadata: inspMeta,
      anomalies
    };
    const json = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", json);
    link.setAttribute("download", `${plantMeta.name || "inspection"}_data.json`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-2xl p-8 max-w-3xl mx-auto w-full items-center">
      <div className={`w-16 h-16 ${preflight.ok ? "bg-emerald-500/10" : "bg-red-500/10"} rounded-full flex items-center justify-center mb-6`}>
        {preflight.ok
          ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          : <XCircle className="w-8 h-8 text-red-400" />
        }
      </div>

      <h2 className="text-2xl font-bold text-zinc-100 mb-2">
        {preflight.ok ? "Inspection Ready for Export" : "Report Generation Blocked"}
      </h2>
      <p className="text-zinc-400 max-w-lg mb-6 text-center">
        {preflight.ok
          ? `${anomalies.length} anomalies annotated. The IEC 62446-3 compliant PDF will include thermal/RGB image pairs, findings table with footnotes, and financial impact analysis.`
          : "Fix all blocking errors below before generating the report."}
      </p>

      {/* Blocking errors */}
      {preflight.blockingErrors.length > 0 && (
        <div className="w-full mb-6 p-4 bg-red-950/30 border border-red-800/40 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4" /> Blocking Errors — Report Cannot Be Generated
          </h3>
          {preflight.blockingErrors.map((e, i) => (
            <p key={i} className="text-xs text-red-300 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">✗</span> {e}
            </p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {preflight.warnings.length > 0 && (
        <div className="w-full mb-6 p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Warnings — Report Will Be Generated With These Caveats
          </h3>
          {preflight.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">⚠</span> {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExportPDF}
          disabled={isExporting || !preflight.ok}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-900/40"
        >
          <Download className="w-5 h-5" />
          {isExporting ? "Generating PDF..." : "Generate IEC-Compliant PDF"}
        </button>
        <button
          onClick={handleExportHTML}
          disabled={isExporting || !preflight.ok}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/40"
        >
          <FileText className="w-5 h-5" /> Export HTML
        </button>
        <button
          onClick={handleExportCSV}
          disabled={anomalies.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
        >
          <FileText className="w-5 h-5" /> Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={anomalies.length === 0}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-base font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
        >
          <FileText className="w-5 h-5" /> Export JSON
        </button>
      </div>

      {preflight.ok && (
        <p className="text-xs text-zinc-600 mt-6 text-center max-w-md">
          Report includes footnotes ①–⑧ per specification, IEC 62446-3 methodology footer on every page, and Section 13 disclaimer. Loss factors are disclosed as engineering estimates, not IEC-certified.
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Eye, EyeOff, Loader2 } from "lucide-react";

type Report = {
  id: string; status: string; pdfUrl: string | null; published: boolean;
  createdAt: string;
  inspection: { date: string; site: { name: string } };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadReports = () =>
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { loadReports(); }, []);

  const togglePublish = async (report: Report) => {
    setToggling(report.id);
    await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !report.published }),
    });
    await loadReports();
    setToggling(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Reports</h1>
        <p className="text-[14px] text-[#888] mt-1">IEC 62446-3 inspection reports. Toggle publish to share with clients.</p>
      </div>

      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">Site</th>
              <th className="px-5 py-3 font-medium text-[#444]">Inspection Date</th>
              <th className="px-5 py-3 font-medium text-[#444]">Generated</th>
              <th className="px-5 py-3 font-medium text-[#444]">Status</th>
              <th className="px-5 py-3 font-medium text-[#444]">Published</th>
              <th className="px-5 py-3 font-medium text-[#444] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[#888] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </td></tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <FileText className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                  <p className="text-[#888] text-sm font-medium">No reports generated yet</p>
                  <p className="text-[#bbb] text-xs mt-1">Mark an inspection complete and generate a report to see it here.</p>
                </td>
              </tr>
            ) : reports.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-5 py-4 font-medium text-[#111]">{r.inspection.site.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-[#444]">{new Date(r.inspection.date).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-4 font-mono text-xs text-[#444]">{new Date(r.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${r.status === "READY" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => togglePublish(r)}
                    disabled={toggling === r.id}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                      r.published
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                    }`}
                  >
                    {toggling === r.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : r.published ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {r.published ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/reports/${r.id}/pdf`} download title="PDF"
                      className="p-1.5 border border-[#eaeaea] rounded hover:bg-zinc-50 text-[#888] hover:text-[#111] transition-colors inline-flex">
                      <Download className="w-4 h-4" />
                    </a>
                    <a href={`/api/reports/${r.id}/csv`} download title="CSV"
                      className="p-1.5 border border-[#eaeaea] rounded hover:bg-zinc-50 text-[#888] hover:text-[#111] transition-colors inline-flex text-[10px] font-bold">
                      CSV
                    </a>
                    <a href={`/api/reports/${r.id}/kml`} download title="KML"
                      className="p-1.5 border border-[#eaeaea] rounded hover:bg-zinc-50 text-[#888] hover:text-[#111] transition-colors inline-flex text-[10px] font-bold">
                      KML
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

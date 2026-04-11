"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, AlertTriangle, ArrowUpDown } from "lucide-react";

type Anomaly = {
  id: string;
  type: string;
  iecClass: string;
  deltaTC: number;
  locationString: string | null;
  priority: string | null;
  modulesAffected: number;
  status: string;
  inspection: { date: string; site: { name: string } };
};

const CLASS_COLORS: Record<string, string> = {
  C4: "bg-red-50 text-red-600 border-red-200",
  C3: "bg-orange-50 text-orange-600 border-orange-200",
  C2: "bg-blue-50 text-blue-600 border-blue-200",
  C1: "bg-emerald-50 text-emerald-600 border-emerald-200",
  UNC: "bg-zinc-100 text-zinc-500 border-zinc-200",
};
const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-amber-500",
  Low: "text-zinc-400",
};

export default function AnnotationsPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  useEffect(() => {
    fetch("/api/anomalies")
      .then((r) => r.json())
      .then((d) => { setAnomalies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = anomalies.filter((a) => {
    const matchSearch = a.type.toLowerCase().includes(search.toLowerCase()) ||
      (a.locationString || "").toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "All" || a.iecClass === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Annotations</h1>
        <p className="text-[14px] text-[#888] mt-1">All detected anomalies across your inspections</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {["All", "C4", "C3", "C2", "C1"].map((cls) => (
          <button
            key={cls}
            onClick={() => setClassFilter(cls)}
            className={`rounded-lg border p-4 text-left transition-all ${classFilter === cls ? "border-emerald-400 bg-emerald-50" : "border-[#eaeaea] bg-white hover:bg-zinc-50"}`}
          >
            <div className="text-xs text-[#888] mb-1">{cls === "All" ? "Total" : `IEC ${cls}`}</div>
            <div className="text-2xl font-semibold text-[#111]">
              {cls === "All" ? anomalies.length : anomalies.filter((a) => a.iecClass === cls).length}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            className="w-full bg-white border border-[#eaeaea] rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#111]"
            placeholder="Search by type or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">ID</th>
              <th className="px-5 py-3 font-medium text-[#444]">Type</th>
              <th className="px-5 py-3 font-medium text-[#444]">IEC Class</th>
              <th className="px-5 py-3 font-medium text-[#444] flex items-center gap-1">
                ΔT <ArrowUpDown className="w-3 h-3" />
              </th>
              <th className="px-5 py-3 font-medium text-[#444]">Location</th>
              <th className="px-5 py-3 font-medium text-[#444]">Priority</th>
              <th className="px-5 py-3 font-medium text-[#444]">Modules</th>
              <th className="px-5 py-3 font-medium text-[#444]">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-[#888]">Loading anomalies...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <AlertTriangle className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                  <p className="text-[#888] text-sm font-medium">No anomalies found</p>
                  <p className="text-[#bbb] text-xs mt-1">Annotate an inspection to see results here.</p>
                </td>
              </tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-mono text-[11px] text-[#888]">{a.id.slice(0, 8)}…</td>
                <td className="px-5 py-3 font-medium text-[#111]">{a.type}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${CLASS_COLORS[a.iecClass] || CLASS_COLORS.UNC}`}>
                    {a.iecClass}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-[#444]">+{a.deltaTC.toFixed(1)}°C</td>
                <td className="px-5 py-3 text-[#666]">{a.locationString || "—"}</td>
                <td className={`px-5 py-3 font-medium ${PRIORITY_COLORS[a.priority || ""] || "text-[#888]"}`}>
                  {a.priority || "—"}
                </td>
                <td className="px-5 py-3 font-mono text-[#444]">{a.modulesAffected}</td>
                <td className="px-5 py-3 text-[#666] text-xs">{a.inspection.site.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

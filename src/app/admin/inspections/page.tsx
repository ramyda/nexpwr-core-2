"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Activity, ExternalLink } from "lucide-react";

type Inspection = {
  id: string;
  date: string;
  operator: string | null;
  droneModel: string | null;
  status: string;
  site: { name: string; location: string };
  _count: { anomalies: number };
};

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/inspections")
      .then((r) => r.json())
      .then((data) => { setInspections(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = inspections.filter(
    (i) =>
      i.site.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.operator || "").toLowerCase().includes(search.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "COMPLETE") return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium">Complete</span>;
    return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium">Pending</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Inspections</h1>
          <p className="text-[14px] text-[#888] mt-1">All aerial inspection records across your portfolio</p>
        </div>
        <Link href="/admin/inspections/new" className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Upload Inspection
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            className="w-full bg-white border border-[#eaeaea] rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#111] transition-colors"
            placeholder="Search by site or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-white border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#444] focus:outline-none focus:border-[#111]">
          <option>All Statuses</option>
          <option>Complete</option>
          <option>Pending</option>
        </select>
      </div>

      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">Site</th>
              <th className="px-5 py-3 font-medium text-[#444]">Date</th>
              <th className="px-5 py-3 font-medium text-[#444]">Operator</th>
              <th className="px-5 py-3 font-medium text-[#444]">Anomalies</th>
              <th className="px-5 py-3 font-medium text-[#444]">Status</th>
              <th className="px-5 py-3 font-medium text-[#444] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-[#888]">Loading inspections...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Activity className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                  <p className="text-[#888] text-sm font-medium">No inspections found</p>
                  <p className="text-[#bbb] text-xs mt-1">Upload your first inspection to get started.</p>
                  <Link href="/admin/inspections/new" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-emerald-600 hover:underline">
                    <Plus className="w-4 h-4" /> Upload Inspection
                  </Link>
                </td>
              </tr>
            ) : filtered.map((insp) => (
              <tr key={insp.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-medium text-[#111]">{insp.site.name}</div>
                  <div className="text-xs text-[#888] mt-0.5">{insp.site.location}</div>
                </td>
                <td className="px-5 py-4 font-mono text-[#444] text-xs">
                  {new Date(insp.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-4 text-[#666]">{insp.operator || "—"}</td>
                <td className="px-5 py-4 font-mono text-[#444]">{insp._count.anomalies}</td>
                <td className="px-5 py-4"><StatusBadge status={insp.status} /></td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/admin/inspections/${insp.id}`} className="p-1.5 text-[#888] hover:text-[#111] opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-zinc-100 inline-flex">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

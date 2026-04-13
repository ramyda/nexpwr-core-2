"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Activity, ExternalLink, Filter, Calendar } from "lucide-react";
import { ContextBanner } from "@/components/shared/ContextBanner";
import { useActiveClient } from "@/lib/context/ActiveClientContext";

type Inspection = {
  id: string;
  date: string;
  operator: string | null;
  droneModel: string | null;
  status: string;
  site: { name: string; location: string; capacityMw: number };
  _count: { annotations: number };
};

export default function InspectionsPage() {
  const { activeClient, activeSite } = useActiveClient();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    let url = "/api/inspections";
    const params = new URLSearchParams();
    if (activeClient) params.append("client_id", activeClient.id);
    if (activeSite) params.append("site_id", activeSite.id);
    
    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setInspections(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch inspections:", err);
        setLoading(false);
      });
  }, [activeClient, activeSite]);

  const filtered = inspections.filter((i) => {
    const matchesSearch = 
      i.site.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.operator || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || i.status === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-zinc-100 text-zinc-600 border-zinc-200",
      UPLOADED: "bg-blue-50 text-blue-600 border-blue-200",
      IN_PROGRESS: "bg-amber-50 text-amber-600 border-amber-200",
      COMPLETE: "bg-emerald-50 text-emerald-600 border-emerald-200",
      PUBLISHED: "bg-purple-50 text-purple-600 border-purple-200",
    };

    const style = styles[status] || styles.DRAFT;
    const label = status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");

    return (
      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <ContextBanner />
      
      <div className="p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Inspections</h1>
            <p className="text-[14px] text-zinc-500 mt-1">
              {activeClient ? `Showing inspections for ${activeClient.company}` : "All aerial inspection records across your portfolio"}
            </p>
          </div>
          <Link 
            href="/admin/inspections/new" 
            className="bg-zinc-900 text-white hover:bg-zinc-800 transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Upload Inspection
          </Link>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              className="w-full bg-white border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow"
              placeholder="Search by site or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-zinc-200 rounded-md pl-10 pr-8 py-2 text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
            >
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Uploaded</option>
              <option>In Progress</option>
              <option>Complete</option>
              <option>Published</option>
            </select>
          </div>
        </div>

        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Site Detail</th>
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Operator</th>
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Anomalies</th>
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-32 mb-1" /><div className="h-3 bg-zinc-50 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-10" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-zinc-100 rounded-full w-20" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-zinc-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-[280px] mx-auto">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-zinc-900 text-[15px] font-semibold">No inspections found</p>
                      <p className="text-zinc-500 text-sm mt-1">
                        Select a different workspace or upload your first inspection to begin analysis.
                      </p>
                      <Link 
                        href="/admin/inspections/new" 
                        className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-white border border-zinc-200 text-zinc-900 rounded-md text-[13px] font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Upload Inspection
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((insp) => (
                <tr key={insp.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-900">{insp.site?.name ?? 'Unknown Site'}</div>
                    <div className="text-[12px] text-zinc-500 mt-0.5 flex items-center gap-1.5 font-medium tracking-tight">
                      {insp.site?.capacityMw ?? 0} MW DC • {insp.site?.location ?? 'Location N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[13px] text-zinc-600">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(insp.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-zinc-600 font-medium">{insp.operator || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-[13px] font-bold ${insp._count.annotations > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                         {insp._count.annotations}
                       </span>
                       <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">Anomalies</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={insp.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/inspections/${insp.id}`} 
                      className="inline-flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-zinc-900 rounded-md hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all group-hover:shadow-sm"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

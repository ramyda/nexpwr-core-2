"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Building2, Activity, AlertTriangle, FileText, Plus, ExternalLink, CheckCircle2, MoreHorizontal } from "lucide-react";

type Site = {
  id: string; name: string; location: string; capacityMw: number;
  modules: number | null; inverter: string | null; mountType: string | null;
  ppaRate: number | null; performanceRatio: number | null; isActive: boolean;
  inspections: Array<{
    id: string; date: string; operator: string | null; status: string;
    _count: { anomalies: number };
  }>;
};

type TabId = "Inspections" | "Anomalies" | "Reports" | "Map";

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("Inspections");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/sites/${id}`)
      .then((r) => r.json())
      .then((d) => { setSite(d); setLoading(false); })
      .catch(() => { setLoading(false); router.push("/admin/sites"); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[#888] text-sm">Loading site...</div>
  );
  if (!site) return null;

  const totalAnomalies = site.inspections.reduce((s, i) => s + i._count.anomalies, 0);
  const TABS: TabId[] = ["Inspections", "Anomalies", "Reports", "Map"];

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#888]">
        <Link href="/admin/sites" className="hover:text-[#111] transition-colors">Sites</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111] font-medium">{site.name}</span>
      </nav>

      {/* Site Metadata Card */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eaeaea]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#111]">{site.name}</h1>
              <p className="text-sm text-[#888] mt-0.5">{site.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${site.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
              {site.isActive ? "Active" : "Inactive"}
            </span>
            <button className="p-1.5 border border-[#eaeaea] rounded hover:bg-zinc-50 transition-colors text-[#888]">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#eaeaea]">
          {[
            { label: "Capacity", value: `${site.capacityMw} MW` },
            { label: "Modules", value: site.modules?.toLocaleString() || "—" },
            { label: "PPA Rate", value: site.ppaRate ? `$${site.ppaRate}/kWh` : "—" },
            { label: "Performance Ratio", value: site.performanceRatio ? `${(site.performanceRatio * 100).toFixed(0)}%` : "—" },
          ].map((m) => (
            <div key={m.label} className="px-6 py-4">
              <p className="text-xs text-[#888] mb-0.5">{m.label}</p>
              <p className="text-[15px] font-semibold text-[#111] font-mono">{m.value}</p>
            </div>
          ))}
        </div>
        {/* Extra metadata row */}
        <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-[#eaeaea] border-t border-[#eaeaea]">
          {[
            { label: "Inverter", value: site.inverter || "—" },
            { label: "Mount Type", value: site.mountType || "—" },
            { label: "Total Inspections", value: site.inspections.length },
          ].map((m) => (
            <div key={m.label} className="px-6 py-4">
              <p className="text-xs text-[#888] mb-0.5">{m.label}</p>
              <p className="text-[15px] font-semibold text-[#111]">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-[#eaeaea] mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-[#111] text-[#111]"
                  : "border-transparent text-[#888] hover:text-[#444]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Inspections Tab */}
        {activeTab === "Inspections" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link href="/admin/inspections/new" className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Upload Inspection
              </Link>
            </div>
            <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
                    <th className="px-5 py-3 font-medium text-[#444]">Date</th>
                    <th className="px-5 py-3 font-medium text-[#444]">Operator</th>
                    <th className="px-5 py-3 font-medium text-[#444]">Anomalies</th>
                    <th className="px-5 py-3 font-medium text-[#444]">Status</th>
                    <th className="px-5 py-3 font-medium text-[#444] text-right">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {site.inspections.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-[#888] text-sm">No inspections yet for this site.</td></tr>
                  ) : site.inspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-5 py-4 font-mono text-xs text-[#444]">{new Date(insp.date).toLocaleDateString("en-GB")}</td>
                      <td className="px-5 py-4 text-[#666]">{insp.operator || "—"}</td>
                      <td className="px-5 py-4 font-mono text-[#444]">{insp._count.anomalies}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${insp.status === "COMPLETE" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                          {insp.status === "COMPLETE" ? "Complete" : "Pending"}
                        </span>
                      </td>
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
        )}

        {activeTab === "Anomalies" && (
          <div className="border border-[#eaeaea] rounded-lg bg-white p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[#888] text-sm">Total anomalies across {site.inspections.length} inspections: <span className="font-semibold text-[#111]">{totalAnomalies}</span></p>
            <p className="text-[#bbb] text-xs mt-1">Go to an inspection to see individual anomaly breakdown.</p>
          </div>
        )}

        {(activeTab === "Reports" || activeTab === "Map") && (
          <div className="border border-[#eaeaea] rounded-lg bg-white p-12 text-center">
            <FileText className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
            <p className="text-[#888] text-sm font-medium">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

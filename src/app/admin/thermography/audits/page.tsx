"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, MoreHorizontal, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const auditSubTabs = [
  { key: "drone", label: "Drone Thermography" },
  { key: "drone_summary", label: "Drone Summary" },
  { key: "iv", label: "IV Testing" },
  { key: "el", label: "EL Testing" },
  { key: "transmission", label: "Transmission Line" },
  { key: "power_equip", label: "Power Equipment" },
  { key: "structure", label: "Structure" },
  { key: "tech_dd", label: "Tech DD Report" },
];

interface Audit {
  id: string;
  name: string;
  groupId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  totalModulesInspected: number;
  createdAt: string;
  site: { id: string; name: string; clientId: string | null; client: { id: string; name: string; company: string } | null } | null;
}

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("drone");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/thermography/audits");
        const data = await res.json();
        if (Array.isArray(data)) setAudits(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/thermography/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      if (res.ok) { setIsModalOpen(false); const data = await res.json(); setAudits(prev => [data, ...prev]); }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      not_started: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.not_started}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Audits</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add audit
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {auditSubTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md whitespace-nowrap transition-colors ${
              activeSubTab === tab.key
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab !== "drone" ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-16 text-center">
          <p className="text-zinc-500 text-sm font-medium">Coming Soon</p>
          <p className="text-zinc-600 text-[12px] mt-1">This section is under development.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Started</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Group ID</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-500 text-sm">Loading...</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-zinc-600 text-sm">No audits found</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-medium text-zinc-100">{audit.name}</td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{audit.startedAt ? new Date(audit.startedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{audit.completedAt ? new Date(audit.completedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4">{getStatusBadge(audit.status)}</td>
                    <td className="px-6 py-4">
                      {audit.site?.client ? (
                        <button onClick={() => router.push(`/admin/clients/${audit.site!.client!.id}`)} className="text-[13px] text-emerald-400 hover:underline">{audit.site.client.name}</button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-zinc-600 italic">Unlinked</span>
                          <button className="text-[11px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Link
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-zinc-500 font-mono">{audit.groupId || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{audit.totalModulesInspected}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-zinc-500 hover:text-zinc-200 outline-none"><MoreHorizontal className="w-4 h-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]"><BarChart3 className="w-3.5 h-3.5" /> Analytics</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]">Rename</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]">Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px] text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Add audit</DialogTitle>
            <DialogDescription className="text-zinc-500">Create a new thermography audit.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Audit Name *</label>
              <input name="name" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Group ID</label>
              <input name="groupId" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                {isSubmitting ? "Creating..." : "Create Audit"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

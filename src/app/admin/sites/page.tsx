"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MoreHorizontal, Building2, Loader2, X } from "lucide-react";

type Site = {
  id: string; name: string; location: string; capacityMw: number;
  isActive: boolean; updatedAt: string;
  _count: { inspections: number };
};

const StatusBadge = ({ active }: { active: boolean }) => active
  ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium">Active</span>
  : <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-xs font-medium">Inactive</span>;

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", capacityMw: "" });
  const [saving, setSaving] = useState(false);

  const loadSites = () =>
    fetch("/api/sites")
      .then((r) => r.json())
      .then((d) => { setSites(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { loadSites(); }, []);

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, capacityMw: parseFloat(form.capacityMw || "0") }),
    });
    setShowModal(false);
    setForm({ name: "", location: "", capacityMw: "" });
    setSaving(false);
    loadSites();
  };

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Sites</h1>
          <p className="text-[14px] text-[#888] mt-1">Manage your solar portfolio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input
            className="w-full bg-white border border-[#eaeaea] rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#111] transition-colors"
            placeholder="Search sites..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">Site Name</th>
              <th className="px-5 py-3 font-medium text-[#444]">Location</th>
              <th className="px-5 py-3 font-medium text-[#444]">Capacity (MW)</th>
              <th className="px-5 py-3 font-medium text-[#444]">Inspections</th>
              <th className="px-5 py-3 font-medium text-[#444]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-[#888]">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <Building2 className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                  <p className="text-[#888] text-sm font-medium">No sites found</p>
                  <button onClick={() => setShowModal(true)} className="mt-4 text-sm font-medium text-emerald-600 hover:underline flex items-center gap-1 mx-auto">
                    <Plus className="w-4 h-4" /> Add your first site
                  </button>
                </td>
              </tr>
            ) : filtered.map((site) => (
              <tr key={site.id} className="hover:bg-zinc-50 transition-colors cursor-pointer group">
                <td className="px-5 py-4">
                  <Link href={`/admin/sites/${site.id}`} className="font-medium text-[#111] hover:underline block">{site.name}</Link>
                </td>
                <td className="px-5 py-4 text-[#666]">{site.location}</td>
                <td className="px-5 py-4 font-mono text-[#444]">{site.capacityMw.toFixed(2)}</td>
                <td className="px-5 py-4 font-mono text-[#444]">{site._count.inspections}</td>
                <td className="px-5 py-4"><StatusBadge active={site.isActive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Site Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#eaeaea] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#111]">Add New Site</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#888] hover:text-[#111]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSite} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Site Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#111]"
                  placeholder="Alpha Solar Array" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Location *</label>
                <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="mt-1.5 w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#111]"
                  placeholder="Nevada, USA" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Capacity (MW) *</label>
                <input required type="number" step="0.01" value={form.capacityMw} onChange={(e) => setForm({ ...form, capacityMw: e.target.value })}
                  className="mt-1.5 w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#111]"
                  placeholder="120" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#eaeaea] rounded-md text-sm text-[#666] hover:bg-zinc-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-[#111] text-white rounded-md text-sm font-semibold hover:bg-[#333] flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

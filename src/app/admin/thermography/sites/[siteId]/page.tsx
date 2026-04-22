"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Calendar, ChevronRight, ExternalLink, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface SiteDetail {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  acCapacity: number | null;
  dcCapacity: number | null;
  acUnit: string;
  dcUnit: string;
  address: string | null;
  client: { id: string; name: string; company: string } | null;
  inspections: {
    id: string;
    name: string;
    inspectionYear: number;
    createdAt: string;
    missions: { id: string; name: string; imageCount: number; status: string }[];
  }[];
}

export default function ThermographySiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const router = useRouter();
  const { siteId } = React.use(params);
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSite = async () => {
    try {
      const res = await fetch(`/api/thermography/sites/${siteId}`);
      const data = await res.json();
      setSite(data);
    } catch (error) {
      console.error("Failed to fetch site:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSite(); }, [siteId]);

  const handleCreateInspection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/thermography/sites/${siteId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchSite();
      }
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading site...</div>;
  if (!site) return <div className="p-8 text-center text-red-500">Site not found</div>;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Header Bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Name of Plant</span>
            <p className="text-[15px] font-semibold text-zinc-100 mt-0.5">{site.name}</p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Total Capacity</span>
            <p className="text-[15px] font-semibold text-zinc-100 mt-0.5">
              {site.dcCapacity ? `${site.dcCapacity} ${site.dcUnit} DC` : "—"}
              {site.acCapacity ? ` / ${site.acCapacity} ${site.acUnit} AC` : ""}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Client</span>
            <p className="text-[15px] font-semibold text-zinc-100 mt-0.5">
              {site.client ? site.client.name : <span className="text-zinc-600 italic">Unlinked</span>}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Geo Location</span>
            {site.latitude && site.longitude ? (
              <a
                href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
              </a>
            ) : (
              <p className="text-[13px] text-zinc-600 mt-0.5">Not set</p>
            )}
          </div>
        </div>
      </div>

      {/* Inspections */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Inspections</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Start a new inspection
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800">
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Inspection Name</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Missions</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {site.inspections.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-sm">No inspections yet</td>
              </tr>
            ) : (
              site.inspections.map((insp, i) => (
                <tr
                  key={insp.id}
                  className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/thermography/missions/${insp.id}`)}
                >
                  <td className="px-6 py-4 text-[13px] text-zinc-500 font-mono">{i + 1}</td>
                  <td className="px-6 py-4 text-[13px] font-medium text-zinc-100">{insp.name}</td>
                  <td className="px-6 py-4 text-[13px] text-zinc-400">{insp.inspectionYear}</td>
                  <td className="px-6 py-4 text-[13px] text-zinc-400">{timeAgo(insp.createdAt)}</td>
                  <td className="px-6 py-4 text-[13px] text-zinc-400">{insp.missions.length}</td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-zinc-600 inline" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Inspection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Start a new inspection</DialogTitle>
            <DialogDescription className="text-zinc-500">Create a new drone thermography inspection for {site.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInspection} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Inspection Name *</label>
              <input name="name" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" placeholder="e.g. Annual Inspection 2025" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Inspection Year *</label>
              <input name="inspectionYear" type="number" required defaultValue={new Date().getFullYear()} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                {isSubmitting ? "Creating..." : "Create Inspection"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

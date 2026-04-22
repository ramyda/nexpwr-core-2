"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, MapPin, Pencil, Trash2, Link2, MoreHorizontal, ExternalLink,
} from "lucide-react";
import { SitesMap } from "@/components/thermography/SitesMap";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThermographySite {
  id: string;
  name: string;
  clientId: string | null;
  projectCode: string | null;
  latitude: number | null;
  longitude: number | null;
  acCapacity: number | null;
  dcCapacity: number | null;
  acUnit: string;
  dcUnit: string;
  mountType: string | null;
  address: string | null;
  createdAt: string;
  client: { id: string; name: string; company: string } | null;
  audits: { id: string; status: string; name: string }[];
  _count: { inspections: number; audits: number };
}

export default function ThermographySitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<ThermographySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<ThermographySite | null>(null);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/thermography/sites");
      const data = await res.json();
      if (Array.isArray(data)) setSites(data);
    } catch (error) {
      console.error("Failed to fetch sites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  const handleAddSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      const res = await fetch("/api/thermography/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchSites();
      }
    } catch (error) {
      console.error("Failed to create site:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSite) return;
    try {
      await fetch(`/api/thermography/sites/${selectedSite.id}`, { method: "DELETE" });
      setSites((prev) => prev.filter((s) => s.id !== selectedSite.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.projectCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (site: ThermographySite) => {
    const latestAudit = site.audits[0];
    if (!latestAudit) return <span className="text-[10px] text-zinc-600">No audits</span>;
    const statusStyles: Record<string, string> = {
      in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      not_started: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };
    const style = statusStyles[latestAudit.status] || statusStyles.not_started;
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style}`}>
        {latestAudit.status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Thermography Sites</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Manage solar plant sites for drone thermography inspections</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add a new plant
        </button>
      </div>

      {/* Satellite Map */}
      <SitesMap
        sites={filteredSites
          .filter((s) => s.latitude && s.longitude)
          .map((s) => ({
            id: s.id,
            name: s.name,
            latitude: s.latitude!,
            longitude: s.longitude!,
            address: s.address,
            status: s.audits[0]?.status,
          }))}
        onSiteClick={(siteId) => router.push(`/admin/thermography/sites/${siteId}`)}
        height="320px"
      />

      {/* Sites Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search plants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-[13px] text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Plant Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Project Code</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Latest Audit Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mx-auto mb-2" />
                    Loading sites...
                  </td>
                </tr>
              ) : filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-zinc-400">No plants found</p>
                    <p className="text-[12px] text-zinc-600 mt-1">Add your first plant to get started</p>
                  </td>
                </tr>
              ) : (
                filteredSites.map((site, i) => (
                  <tr
                    key={site.id}
                    className="hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/admin/thermography/sites/${site.id}`)}
                  >
                    <td className="px-6 py-4 text-[13px] text-zinc-500 font-mono">{i + 1}</td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {site.name}
                      </span>
                      {site.address && (
                        <p className="text-[11px] text-zinc-600 mt-0.5">{site.address}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400 font-mono">
                      {site.projectCode || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {site.client ? (
                        <span className="text-[13px] text-zinc-300">{site.client.name}</span>
                      ) : (
                        <span className="text-[12px] text-zinc-600 italic">Unlinked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(site)}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors outline-none">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] bg-zinc-950 border-zinc-800 text-zinc-300">
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-[13px]"
                            onClick={() => router.push(`/admin/thermography/sites/${site.id}`)}
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Site
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]">
                            <Link2 className="w-3.5 h-3.5" /> Link Client
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2 text-[13px]">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-[13px] text-red-400 focus:text-red-400 focus:bg-red-950/20"
                            onClick={() => { setSelectedSite(site); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Plant Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Add a new plant</DialogTitle>
            <DialogDescription className="text-zinc-500">Enter the details for the new thermography site.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSite} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Plant Name *</label>
                <input name="name" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Project Code</label>
                <input name="projectCode" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Address</label>
                <input name="address" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Latitude</label>
                <input name="latitude" type="number" step="any" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Longitude</label>
                <input name="longitude" type="number" step="any" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">DC Capacity</label>
                <input name="dcCapacity" type="number" step="0.01" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AC Capacity</label>
                <input name="acCapacity" type="number" step="0.01" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mount Type</label>
                <select name="mountType" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select...</option>
                  <option value="Rooftop">Rooftop</option>
                  <option value="Ground Mounted">Ground Mounted</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Module Type</label>
                <select name="moduleType" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900">
                  <option value="">Select...</option>
                  <option value="Polycrystalline">Polycrystalline</option>
                  <option value="Monocrystalline">Monocrystalline</option>
                  <option value="Thin Film">Thin Film</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Commissioned Date</label>
                <input name="commissionedDate" type="date" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Land Area (acres)</label>
                <input name="landAreaAcres" type="number" step="0.01" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                {isSubmitting ? "Creating..." : "Create Plant"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-zinc-500 pt-2">
              Are you sure you want to delete <strong>{selectedSite?.name}</strong>? This will remove all inspections, missions, and annotations associated with this site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 border-t border-zinc-100">
            <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

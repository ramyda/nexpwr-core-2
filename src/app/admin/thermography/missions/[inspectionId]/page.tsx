"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, FileText, CheckCircle2, MapPin, Download, ExternalLink } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface MissionData {
  id: string;
  name: string;
  blockName: string | null;
  imageCount: number;
  annotatedImageCount: number;
  s3Id: string | null;
  status: string;
  orthoStatus: string;
  orthoTilesPath: string | null;
  orthoTifUrl: string | null;
  layoutGeoJson: string | null;
  createdAt: string;
  _count: { images: number };
}

interface InspectionDetail {
  id: string;
  name: string;
  inspectionYear: number;
  site: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    acCapacity: number | null;
    dcCapacity: number | null;
    acUnit: string;
    dcUnit: string;
    client: { id: string; name: string; company: string } | null;
  };
  missions: MissionData[];
}

export default function MissionDetailPage({ params }: { params: Promise<{ inspectionId: string }> }) {
  const router = useRouter();
  const { inspectionId } = React.use(params);
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"user" | "system" | "ortho">("user");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/thermography/missions/${inspectionId}`);
      const data = await res.json();
      setInspection(data);
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [inspectionId]);

  const handleCreateMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/thermography/missions/${inspectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      if (res.ok) {
        const mission = await res.json();
        setIsModalOpen(false);
        router.push(`/admin/thermography/annotator/${mission.id}`);
      }
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading mission detail...</div>;
  if (!inspection) return <div className="p-8 text-center text-red-500">Inspection not found</div>;

  const site = inspection.site;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return "Today";
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Info Grid Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Name of plant</span>
          <p className="text-[14px] font-semibold text-zinc-100 mt-1">{site.name}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Capacity</span>
          <p className="text-[14px] font-semibold text-zinc-100 mt-1">
            {site.acCapacity ? `${site.acCapacity} ${site.acUnit} AC` : "—"} / {site.dcCapacity ? `${site.dcCapacity} ${site.dcUnit} DC` : "—"}
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Client</span>
          <p className="text-[14px] font-semibold text-zinc-100 mt-1">{site.client?.name || "Unlinked"}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Geo Location</span>
          {site.latitude && site.longitude ? (
            <a href={`https://maps.google.com/?q=${site.latitude},${site.longitude}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-emerald-400 hover:underline flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </a>
          ) : (
            <p className="text-[13px] text-zinc-600 mt-1">Not set</p>
          )}
        </div>
      </div>

      {/* Info Grid Row 2 - File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">OrthoTIF</span>
          <div className="mt-2">
            <button className="text-[12px] text-emerald-400 hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Upload .tif
            </button>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">DEM</span>
          <div className="mt-2">
            <button className="text-[12px] text-emerald-400 hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Upload .tif
            </button>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Layout</span>
          <div className="mt-2">
            <button className="text-[12px] text-emerald-400 hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Upload Images</span>
          <div className="mt-2">
            <button className="text-[12px] text-emerald-400 hover:underline flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Upload .jpg/.png
            </button>
          </div>
        </div>
      </div>

      {/* Ortho Annotator Button */}
      {inspection.missions.some(m => m.orthoStatus === "ready") && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              const mission = inspection.missions.find(m => m.orthoStatus === "ready");
              if (mission) router.push(`/admin/thermography/annotator/${mission.id}/ortho`);
            }}
            className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Open Ortho Annotator
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {(["user", "system", "ortho"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab === "user" ? "User Missions" : tab === "system" ? "System Missions" : "OrthoTIFs"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "user" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create a new mission
            </button>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800">
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Images</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {inspection.missions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-sm">No missions yet</td>
                  </tr>
                ) : (
                  inspection.missions.map((m, i) => (
                    <tr key={m.id} className="hover:bg-zinc-900/60 transition-colors cursor-pointer" onClick={() => router.push(`/admin/thermography/annotator/${m.id}`)}>
                      <td className="px-6 py-4 text-[13px] text-zinc-500 font-mono">{i + 1}</td>
                      <td className="px-6 py-4 text-[13px] font-medium text-zinc-100">{m.name}</td>
                      <td className="px-6 py-4 text-[13px] text-zinc-400">{timeAgo(m.createdAt)}</td>
                      <td className="px-6 py-4 text-[13px] text-zinc-400">{m.imageCount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          m.status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>{m.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ExternalLink className="w-4 h-4 text-zinc-600 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-500 text-sm">System missions are auto-generated. No system missions found.</p>
        </div>
      )}

      {activeTab === "ortho" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-500 text-sm">No OrthoTIFs uploaded yet. Upload an ortho to begin.</p>
        </div>
      )}

      {/* Create Mission Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Create a new mission</DialogTitle>
            <DialogDescription className="text-zinc-500">Add a new user mission for this inspection.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMission} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mission Name *</label>
              <input name="name" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Block / Section Name</label>
              <input name="blockName" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">
                {isSubmitting ? "Creating..." : "Create Mission"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

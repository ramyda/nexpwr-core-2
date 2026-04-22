"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, MapPin, Activity, FileText, MessageSquare, Plus,
  ChevronRight, ExternalLink, Clock, Send,
} from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";

type TabKey = "overview" | "sites" | "inspections" | "reports" | "notes";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "sites", label: "Sites", icon: MapPin },
  { key: "inspections", label: "Inspections", icon: Activity },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "notes", label: "Notes", icon: MessageSquare },
];

interface ClientData {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  plan: string;
  createdAt: string;
  _count: { sites: number; inspections: number; reports: number; annotations: number; thermographySites: number };
  thermographySites: ThermographySite[];
  sites: ClientSite[];
  inspections: InspectionItem[];
  reports: ReportItem[];
}

interface ThermographySite {
  id: string;
  name: string;
  address: string | null;
  audits: { id: string; status: string; createdAt: string; site: object }[];
  inspections: { id: string; name: string; missions: { id: string; imageCount: number; annotatedImageCount: number; _count: { images: number }; annotations: { id: string; severity: string; faultType: string | null }[] }[] }[];
}

interface ClientSite { id: string; name: string; location: string; capacityMw: number; inspections: { id: string; date: string; status: string }[] }
interface InspectionItem { id: string; date: string; status: string; createdAt: string; site: { name: string }; _count: { annotations: number } }
interface ReportItem { id: string; status: string; createdAt: string; publishedAt: string | null; site: { name: string } | null; inspection: { date: string } | null }
interface TimelineEvent { id: string; type: string; action: string; status: string; timestamp: string }
interface Note { id: string; text: string; author: string; createdAt: string }

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        const data = await res.json();
        setClient(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (activeTab === "overview") {
      fetch(`/api/clients/${id}/activity`).then(r => r.json()).then(d => { if (Array.isArray(d)) setTimeline(d); });
    }
    if (activeTab === "notes") {
      fetch(`/api/clients/${id}/notes`).then(r => r.json()).then(d => { if (Array.isArray(d)) setNotes(d); });
    }
  }, [activeTab, id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/clients/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNote("");
      }
    } catch (e) { console.error(e); }
    finally { setAddingNote(false); }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading client...</div>;
  if (!client) return <div className="p-8 text-center text-red-500">Client not found</div>;

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Active operations: sites with in_progress audits
  const activeOps = client.thermographySites.filter(
    s => s.audits.some(a => a.status === "in_progress")
  );

  const totalAnomalies = client.thermographySites.reduce((sum, site) =>
    sum + site.inspections.reduce((sSum, insp) =>
      sSum + insp.missions.reduce((mSum, m) => mSum + m.annotations.length, 0), 0), 0);

  return (
    <div className="space-y-6">
      <BackButton />

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{client.name}</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{client.company} · {client.email}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${client.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
          {client.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab.key
                ? "border-zinc-100 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sites", value: client._count.sites + client._count.thermographySites },
              { label: "Inspections", value: client._count.inspections },
              { label: "Reports", value: client._count.reports },
              { label: "Total Anomalies", value: totalAnomalies },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{stat.label}</span>
                <p className="text-2xl font-bold text-zinc-50 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Ongoing Operations */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Ongoing Operations</h3>
            {activeOps.length === 0 ? (
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6 text-center">
                <p className="text-[12px] text-zinc-600">No active operations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOps.map(site => {
                  const latestMission = site.inspections[0]?.missions[0];
                  const progress = latestMission ? Math.round((latestMission.annotatedImageCount / Math.max(latestMission.imageCount, 1)) * 100) : 0;
                  const anomalyCount = latestMission?.annotations.length || 0;
                  return (
                    <div key={site.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-100 truncate">{site.name}</p>
                          <p className="text-[11px] text-zinc-500">{site.address || "No location"}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Mission in progress</p>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">{latestMission?.annotatedImageCount || 0} of {latestMission?.imageCount || 0} images · {anomalyCount} anomalies</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {latestMission && (
                          <button onClick={() => router.push(`/admin/thermography/annotator/${latestMission.id}`)} className="text-[11px] text-emerald-400 hover:underline">View Mission</button>
                        )}
                        <button onClick={() => router.push(`/admin/thermography/sites/${site.id}`)} className="text-[11px] text-zinc-400 hover:underline">View Site</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sites at a Glance */}
          {client.thermographySites.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Sites at a Glance</h3>
              <div className="flex flex-wrap gap-2">
                {client.thermographySites.map(site => {
                  const anomalyCount = site.inspections.reduce((s, i) =>
                    s + i.missions.reduce((ms, m) => ms + m.annotations.length, 0), 0);
                  const lastAudit = site.audits[0];
                  return (
                    <button
                      key={site.id}
                      onClick={() => router.push(`/admin/thermography/sites/${site.id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${lastAudit?.status === "in_progress" ? "bg-emerald-400" : lastAudit?.status === "completed" ? "bg-blue-400" : "bg-zinc-600"}`} />
                      <span className="text-[11px] font-medium text-zinc-300">{site.name}</span>
                      {lastAudit && <span className="text-[10px] text-zinc-600">{timeAgo(lastAudit.createdAt)}</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${anomalyCount > 0 ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-600"}`}>{anomalyCount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Timeline & Client Portal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Recent Activity</h3>
              {timeline.length === 0 ? (
                <p className="text-[12px] text-zinc-600">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {timeline.map(event => (
                    <div key={event.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
                      <Clock className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-zinc-300 truncate">{event.action}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        event.status === "COMPLETED" || event.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        event.status === "DRAFT" ? "bg-zinc-800 text-zinc-500 border-zinc-700" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>{event.status}</span>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">{timeAgo(event.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Client Portal Access</h3>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Login URL</label>
                  <div className="mt-1 flex items-center justify-between bg-zinc-950 p-2.5 rounded-md border border-zinc-800">
                    <span className="text-[13px] text-zinc-300 font-mono truncate">http://localhost:3001/login</span>
                    <button onClick={() => navigator.clipboard.writeText("http://localhost:3001/login")} className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold">Copy</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Authentication Email</label>
                  <div className="mt-1 flex items-center justify-between bg-zinc-950 p-2.5 rounded-md border border-zinc-800">
                    <span className="text-[13px] text-zinc-300 truncate">{client.email}</span>
                    <button onClick={() => navigator.clipboard.writeText(client.email)} className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold">Copy</button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">
                  The client signs in using their email address. Access is restricted to active client accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...client.sites.map(s => ({ ...s, type: "existing" })), ...client.thermographySites.map(s => ({ id: s.id, name: s.name, location: s.address || "", capacityMw: 0, inspections: [], type: "thermography" }))].map((site) => (
            <div
              key={site.id}
              onClick={() => router.push(site.type === "thermography" ? `/admin/thermography/sites/${site.id}` : `/admin/clients/${id}/sites`)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">{site.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{site.location}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                {site.type === "thermography" && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Thermography</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "inspections" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Annotations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {client.inspections.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-sm">No inspections</td></tr>
              ) : (
                client.inspections.map(insp => (
                  <tr key={insp.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-6 py-4 text-[13px] text-zinc-200">{insp.site.name}</td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{new Date(insp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${insp.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{insp.status}</span></td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{insp._count.annotations}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {client.reports.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-sm">No reports</td></tr>
              ) : (
                client.reports.map(report => (
                  <tr key={report.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-6 py-4 text-[13px] text-zinc-200">{report.site?.name || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${report.status === "READY" || report.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{report.status}</span></td>
                    <td className="px-6 py-4 text-[13px] text-zinc-400">{report.publishedAt ? new Date(report.publishedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-[13px] text-zinc-100 outline-none focus:ring-1 focus:ring-zinc-600"
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
              className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> {addingNote ? "Adding..." : "Add Note"}
            </button>
          </div>
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-[12px] text-zinc-600 py-4">No notes yet</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <p className="text-[13px] text-zinc-200">{note.text}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">{note.author} · {timeAgo(note.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { 
  Filter, Share2, Video, X,
  Map as MapIcon, Thermometer, Info, ChevronDown, Check, Loader2
} from "lucide-react";
import { useClientStore } from "@/lib/store/useClientStore";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "next/navigation";
import { getSeverityFromDelta, IEC_SEVERITY_CLASSES } from "@/lib/constants";

// ---- Types from the Map API ----
interface MapAnomaly {
  id: string;
  type: string;
  iecClass: string;
  severity: string;
  severityColor: string;
  status: string;
  deltaT: number;
  tAnomaly: number;
  tReference: number;
  lat: number | null;
  lng: number | null;
  polygonPoints: any;
  modulesAffected: number;
  notes: string | null;
  locationString: string | null;
  lossResults: any;
  thermalPreviewUrl: string | null;
  siteName: string | null;
  inspectionId: string;
  siteId: string | null;
}

interface MapSite {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

function MapContent() {
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get("site");

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletLoaded = useRef(false);
  const mapInstance = useRef<any>(null);
  const polygonsRef = useRef<Record<string, any>>({});

  const [filterOpen, setFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("anomaly");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId);

  // ---- Live data state ----
  const [anomalies, setAnomalies] = useState<MapAnomaly[]>([]);
  const [sites, setSites] = useState<MapSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { selectedAnomalyId, setSelectedAnomalyId, hoveredAnomalyId, setHoveredAnomalyId } = useClientStore();

  const selectedAnomaly = anomalies.find((a) => a.id === selectedAnomalyId) ?? null;

  // ---- Fetch map data ----
  const fetchMapData = useCallback(async (siteId?: string | null) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/client/map", window.location.origin);
      if (siteId) url.searchParams.set("siteId", siteId);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies ?? []);
        setSites(data.sites ?? []);
      }
    } catch (e) {
      console.error("[MapPage] fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData(selectedSiteId);
  }, [selectedSiteId, fetchMapData]);

  // ---- Update anomaly status ----
  const updateStatus = async (anomalyId: string, newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/client/map/${anomalyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAnomalies((prev) =>
          prev.map((a) => (a.id === anomalyId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (e) {
      console.error("[MapPage] status update failed:", e);
    } finally {
      setStatusUpdating(false);
    }
  };

  // ---- Initialize Leaflet ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = () => {
      if (!leafletLoaded.current || !mapRef.current || mapInstance.current) return;
      const L = (window as any).L;
      const defaultCenter: [number, number] = [20.5937, 78.9629];
      const map = L.map(mapRef.current, { zoomControl: false }).setView(defaultCenter, 14);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 22,
      }).addTo(map);
      mapInstance.current = map;
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => { leafletLoaded.current = true; initMap(); };
      document.head.appendChild(script);
    } else if ((window as any).L) {
      leafletLoaded.current = true;
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Re-render polygons when anomalies change ----
  useEffect(() => {
    if (!mapInstance.current || !leafletLoaded.current || anomalies.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing polygons
    Object.values(polygonsRef.current).forEach((p: any) => p.remove());
    polygonsRef.current = {};

    const bounds = L.latLngBounds([]);

    anomalies.forEach((anomaly) => {
      let polygon: any = null;

      if (anomaly.polygonPoints && Array.isArray(anomaly.polygonPoints) && anomaly.polygonPoints.length >= 3) {
        polygon = L.polygon(anomaly.polygonPoints, {
          color: anomaly.severityColor,
          weight: 2,
          fillColor: anomaly.severityColor,
          fillOpacity: 0.2,
        }).addTo(mapInstance.current);
        bounds.extend(anomaly.polygonPoints);
      } else if (anomaly.lat && anomaly.lng) {
        // Fallback: render a circle marker if no polygon
        polygon = L.circleMarker([anomaly.lat, anomaly.lng], {
          radius: 8,
          color: anomaly.severityColor,
          fillColor: anomaly.severityColor,
          fillOpacity: 0.5,
        }).addTo(mapInstance.current);
        bounds.extend([anomaly.lat, anomaly.lng]);
      }

      if (!polygon) return;

      const tooltipContent = `
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-xl min-w-[200px]">
          <div class="text-xs text-zinc-500 mb-1 font-mono">${anomaly.id.slice(0,8)}…</div>
          <div class="text-sm font-semibold text-zinc-100 mb-2">${anomaly.type}</div>
          <div class="text-xs bg-zinc-800 rounded p-1 inline-flex items-center text-zinc-300">
            <span class="w-2 h-2 rounded-full mr-1.5" style="background: ${anomaly.severityColor}"></span>
            ${anomaly.severity.toUpperCase()} · ΔT ${anomaly.deltaT}°C
          </div>
        </div>
      `;

      polygon.bindTooltip(tooltipContent, {
        sticky: true,
        className: "custom-leaflet-tooltip",
        opacity: 1,
      });

      polygon.on("mouseover", () => {
        polygon.setStyle?.({ fillOpacity: 0.5, weight: 3 });
        setHoveredAnomalyId(anomaly.id);
      });

      polygon.on("mouseout", () => {
        polygon.setStyle?.({ fillOpacity: 0.2, weight: 2 });
        setHoveredAnomalyId(null);
      });

      polygon.on("click", () => {
        setSelectedAnomalyId(anomaly.id);
        setSidebarOpen(true);
      });

      polygonsRef.current[anomaly.id] = polygon;
    });

    if (bounds.isValid()) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [anomalies, setSelectedAnomalyId, setHoveredAnomalyId]);

  // ---- Custom Leaflet tooltip CSS ----
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-tooltip.custom-leaflet-tooltip {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .leaflet-tooltip.custom-leaflet-tooltip::before { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const currentSiteName = sites.find((s) => s.id === selectedSiteId)?.name ?? "All Sites";

  // ---- Render ----
  return (
    <div className="absolute inset-x-8 inset-y-8 flex flex-col bottom-8 border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Control Bar */}
      <div className="h-14 shrink-0 bg-black/40 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 z-10 w-full relative">
        <div className="flex items-center gap-2">
          {/* Site selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-colors">
              {currentSiteName} <ChevronDown className="ml-1 w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
              <DropdownMenuItem className="hover:bg-zinc-800" onClick={() => setSelectedSiteId(null)}>
                All Sites
              </DropdownMenuItem>
              {sites.map((site) => (
                <DropdownMenuItem key={site.id} className="hover:bg-zinc-800" onClick={() => setSelectedSiteId(site.id)}>
                  {site.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-zinc-800 mx-2" />

          {/* Anomaly count badge */}
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
          ) : (
            <span className="text-xs text-zinc-500 font-mono">{anomalies.length} anomalies</span>
          )}

          <button className="inline-flex items-center h-8 px-3 text-xs font-bold rounded-md border border-zinc-800 bg-zinc-900 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors" onClick={() => setFilterOpen(true)}>
            <Filter className="w-3.5 h-3.5 mr-2" /> Filter
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-zinc-400 hover:text-white h-8 w-8 flex items-center justify-center rounded"><Video className="w-4 h-4" /></button>
          <button className="text-zinc-400 hover:text-white h-8 w-8 flex items-center justify-center rounded"><Share2 className="w-4 h-4" /></button>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex items-center p-0.5">
            <button className="px-3 py-1 rounded bg-zinc-800 text-xs font-bold text-white shadow">RGB</button>
            <button className="px-3 py-1 rounded text-zinc-500 hover:text-zinc-200 text-xs font-bold transition-colors">Thermal</button>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full relative z-0 bg-zinc-950">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs text-zinc-500">Loading anomaly data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Slide-in Detail Sidebar */}
      {sidebarOpen && selectedAnomaly && (
        <div className="absolute right-0 top-14 bottom-0 w-[400px] bg-black/95 backdrop-blur-xl border-l border-zinc-800 z-20 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <div className="text-xs text-zinc-500 font-mono mb-0.5">{selectedAnomaly.id.slice(0, 12)}…</div>
              <h3 className="text-sm font-bold text-zinc-50 tracking-tight">{selectedAnomaly.type}</h3>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-zinc-500 hover:text-zinc-50 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="px-5 py-3 border-b border-zinc-800 bg-black flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Status</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={statusUpdating}
                className={`inline-flex items-center gap-1 h-7 px-2 text-xs font-bold uppercase tracking-widest rounded-md border border-zinc-800 transition-colors
                  ${selectedAnomaly.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : selectedAnomaly.status === 'FALSE_POSITIVE' ? 'bg-zinc-800/50 text-zinc-500'
                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`}
              >
                {statusUpdating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {selectedAnomaly.status.replace('_', ' ')} <ChevronDown className="ml-1.5 w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                {["OPEN","IN_PROGRESS","NOT_FOUND","FALSE_POSITIVE","RESOLVED"].map((s) => (
                  <DropdownMenuItem
                    key={s}
                    className={`cursor-pointer ${s === "RESOLVED" ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900"}`}
                    onClick={() => updateStatus(selectedAnomaly.id, s)}
                  >
                    {s.replace("_", " ")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sub-Tabs */}
          <div className="px-5 border-b border-zinc-800 flex items-center gap-6 shrink-0 bg-black/40">
            {["anomaly", "panel", "comments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-xs font-bold uppercase tracking-widest relative ${activeTab === tab ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 custom-scrollbar">
            {activeTab === "anomaly" && (
              <div className="p-5 space-y-6">
                {/* Images */}
                <div className="space-y-2">
                  <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Attachments</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                      {selectedAnomaly.thermalPreviewUrl ? (
                        <img src={selectedAnomaly.thermalPreviewUrl} alt="Thermal" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent mix-blend-overlay" />
                          <Thermometer className="w-6 h-6 text-zinc-600 group-hover:scale-110 transition-transform" />
                        </>
                      )}
                      <div className="absolute bottom-2 left-2 text-[10px] uppercase font-bold text-white/50 bg-black/50 px-1 rounded">Thermal</div>
                    </div>
                    <div className="aspect-square rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                      <MapIcon className="w-6 h-6 text-zinc-600 group-hover:scale-110 transition-transform" />
                      <div className="absolute bottom-2 left-2 text-[10px] uppercase font-bold text-white/50 bg-black/50 px-1 rounded">RGB</div>
                    </div>
                  </div>
                </div>

                {/* Diagnostics Table */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Diagnostics</span>
                  <div className="rounded-lg border border-zinc-800 overflow-hidden bg-black/20">
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-zinc-800">
                        {[
                          ["ΔT (Hotspot vs Ref)", `${selectedAnomaly.deltaT.toFixed(1)}°C`],
                          ["Hotspot Temp (T_anomaly)", `${selectedAnomaly.tAnomaly.toFixed(1)}°C`],
                          ["Ref Temp (T_reference)", `${selectedAnomaly.tReference.toFixed(1)}°C`],
                          ["Severity", selectedAnomaly.severity.toUpperCase()],
                          ["IEC CoA", selectedAnomaly.iecClass],
                          ["Modules Affected", selectedAnomaly.modulesAffected.toString()],
                          ["Site", selectedAnomaly.siteName ?? "—"],
                        ].map(([label, value]) => (
                          <tr key={label} className="hover:bg-white/[0.04] transition-colors">
                            <td className="px-3 py-2.5 text-zinc-500 font-medium tracking-tight">{label}</td>
                            <td className="px-3 py-2.5 text-zinc-100 font-bold text-right">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Loss Results */}
                {selectedAnomaly.lossResults && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Calculated Loss (IEC 60891)</span>
                    <div className="rounded-lg border border-zinc-800 overflow-hidden bg-black/20">
                      <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-zinc-800">
                          <tr className="hover:bg-white/[0.04] transition-colors">
                            <td className="px-3 py-2.5 text-zinc-500">Specific Power Loss</td>
                            <td className="px-3 py-2.5 text-red-400 font-bold text-right">
                              {(selectedAnomaly.lossResults as any).specificPowerLossKwp?.toFixed(3)} kWp
                            </td>
                          </tr>
                          <tr className="hover:bg-white/[0.04] transition-colors">
                            <td className="px-3 py-2.5 text-zinc-500">Annual Revenue Loss</td>
                            <td className="px-3 py-2.5 text-orange-400 font-bold text-right">
                              ₹{(selectedAnomaly.lossResults as any).annualRevenueLoss?.toFixed(2)}
                            </td>
                          </tr>
                          <tr className="hover:bg-white/[0.04] transition-colors">
                            <td className="px-3 py-2.5 text-zinc-500">Loss Factor</td>
                            <td className="px-3 py-2.5 text-zinc-100 font-bold text-right">
                              {((selectedAnomaly.lossResults as any).lossFactor * 100).toFixed(0)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-zinc-700 leading-relaxed">
                      Estimated per IEC 60891 simplified procedure. Loss factors are engineering estimates; definitive assessment requires I-V curve tracing.
                    </p>
                  </div>
                )}

                {/* IEC Notes */}
                {selectedAnomaly.notes && (
                  <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-4">
                    <div className="flex gap-3">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                      <p className="text-xs text-zinc-400 leading-relaxed font-medium">{selectedAnomaly.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "panel" && (
              <div className="p-5">
                <p className="text-sm text-zinc-500">Panel-level data not yet available for this anomaly.</p>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="p-5">
                <p className="text-sm text-zinc-500">No comments yet.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Filter Modal */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden gap-0 flex h-[500px]">
          <div className="w-[200px] border-r border-zinc-800 bg-black/40 p-4 flex flex-col gap-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6 px-3">Filter Engine</h3>
            {["Name", "Severity", "Category", "Status", "IEC CoA"].map((opt, i) => (
              <button key={opt} className={`text-left text-xs px-3 py-2.5 rounded-md font-bold transition-all ${i === 1 ? "bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_10px_rgba(99,102,241,0.05)]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"}`}>
                {opt}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col bg-zinc-950">
            <DialogHeader className="p-4 border-b border-zinc-800">
              <DialogTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">Filter by Severity</DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-6 space-y-4">
              {["Critical (ΔT > 20°C)", "Moderate (10°C < ΔT < 20°C)", "Minor (3°C < ΔT < 10°C)", "Not Significant (< 3°C)"].map((s) => (
                <div key={s} className="flex items-center space-x-3 group">
                  <div className="w-4 h-4 rounded border border-zinc-800 group-hover:border-indigo-400 transition-colors flex items-center justify-center bg-black/20">
                    {s.startsWith("C") && <Check className="w-3 h-3 text-indigo-400" />}
                  </div>
                  <label className="text-sm text-zinc-400 font-medium leading-none cursor-pointer group-hover:text-zinc-200 transition-colors">{s}</label>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-black/40 flex justify-end gap-3">
              <button className="h-8 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white px-3 rounded transition-colors" onClick={() => setFilterOpen(false)}>Clear All</button>
              <button className="h-8 text-[11px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded transition-colors" onClick={() => setFilterOpen(false)}>Apply</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AnomaliesMapPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Initialising Spatial Data...</span>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}

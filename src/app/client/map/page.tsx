"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Filter } from "lucide-react";

const AnomalyMap = dynamic(
  () => import("@/components/map/AnomalyMap").then((m) => m.AnomalyMap),
  { ssr: false }
);

type Anomaly = {
  id: string; type: string; iecClass: string; deltaTC: number;
  tAnomalyC: number; locationString: string | null; priority: string | null;
  modulesAffected: number; lat: number | null; lng: number | null;
  status: string;
};

const CLASS_FILTERS = ["All", "C4", "C3", "C2", "C1", "UNC"];

export default function ClientMapPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/anomalies")
      .then((r) => r.json())
      .then((d) => { setAnomalies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = anomalies.filter((a) =>
    filter === "All" || a.iecClass === filter
  );

  const geoCount = filtered.filter((a) => a.lat && a.lng).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Anomaly Map</h1>
        <p className="text-[14px] text-[#888] mt-1">
          Live GPS positions of all detected anomalies across your portfolio
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[#888] text-sm">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>
        {CLASS_FILTERS.map((cls) => (
          <button
            key={cls}
            onClick={() => setFilter(cls)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === cls
                ? "bg-[#111] text-white border-[#111]"
                : "bg-white text-[#555] border-[#eaeaea] hover:bg-zinc-50"
            }`}
          >
            {cls === "All" ? `All (${anomalies.length})` : `${cls} (${anomalies.filter(a => a.iecClass === cls).length})`}
          </button>
        ))}
        <div className="ml-auto text-xs text-[#888] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {geoCount} anomalies with GPS coordinates
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="border border-[#eaeaea] rounded-lg bg-zinc-50 h-[480px] flex items-center justify-center text-[#888] text-sm">
          Loading map data...
        </div>
      ) : geoCount === 0 ? (
        <div className="border border-[#eaeaea] rounded-lg bg-white h-[480px] flex flex-col items-center justify-center gap-3 text-center px-6">
          <MapPin className="w-10 h-10 text-[#ccc]" />
          <p className="text-[#888] font-medium">No GPS coordinates found</p>
          <p className="text-[#bbb] text-sm max-w-xs">
            GPS data is extracted from GeoTIFF metadata during annotation. Ensure your thermal images contain valid geolocation tags.
          </p>
        </div>
      ) : (
        <AnomalyMap anomalies={filtered} height="520px" />
      )}

      {/* Anomaly coordinate table */}
      {geoCount > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#111] mb-3">GPS Coordinates Table</h2>
          <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
                  <th className="px-5 py-3 font-medium text-[#444]">Type</th>
                  <th className="px-5 py-3 font-medium text-[#444]">IEC</th>
                  <th className="px-5 py-3 font-medium text-[#444]">ΔT</th>
                  <th className="px-5 py-3 font-medium text-[#444]">Latitude</th>
                  <th className="px-5 py-3 font-medium text-[#444]">Longitude</th>
                  <th className="px-5 py-3 font-medium text-[#444]">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeaea]">
                {filtered.filter(a => a.lat && a.lng).map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-[#111]">{a.type}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${
                        a.iecClass === "C4" ? "bg-red-50 text-red-600 border-red-200" :
                        a.iecClass === "C3" ? "bg-orange-50 text-orange-600 border-orange-200" :
                        a.iecClass === "C2" ? "bg-blue-50 text-blue-600 border-blue-200" :
                        a.iecClass === "C1" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-zinc-100 text-zinc-500 border-zinc-200"
                      }`}>{a.iecClass}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[#444]">+{a.deltaTC.toFixed(1)}°C</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#666]">{a.lat?.toFixed(6)}°</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#666]">{a.lng?.toFixed(6)}°</td>
                    <td className="px-5 py-3 text-[#666]">{a.locationString || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

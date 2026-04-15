"use client";

import { useEffect, useRef } from "react";

type Anomaly = {
  id: string; type: string; iecClass: string; deltaT: number;
  tAnomaly: number; locationString: string | null;
  priority: string | null; modulesAffected: number;
  lat: number | null; lng: number | null;
};

interface AnomalyMapProps {
  anomalies: Anomaly[];
  height?: string;
}

const CLASS_HEX: Record<string, string> = {
  C4: "#DC2626",
  C3: "#EA580C",
  C2: "#2563EB",
  C1: "#16A34A",
  UNC: "#7C3AED",
};

export function AnomalyMap({ anomalies, height = "500px" }: AnomalyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const L = require("leaflet");
    // Fix default icon paths for Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const geoAnoms = anomalies.filter((a) => a.lat !== null && a.lng !== null);

    // Default center: first anomaly or world center
    const center: [number, number] = geoAnoms.length > 0
      ? [geoAnoms[0].lat!, geoAnoms[0].lng!]
      : [20, 78];

    const map = L.map(mapRef.current, {
      center,
      zoom: geoAnoms.length > 0 ? 16 : 5,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    // Satellite tile layer
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri, Maxar, Earthstar Geographics", maxZoom: 21 }
    ).addTo(map);

    // Street overlay
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap contributors", opacity: 0.3, maxZoom: 21 }
    ).addTo(map);

    // Plot each anomaly
    geoAnoms.forEach((a) => {
      const color = CLASS_HEX[a.iecClass] || CLASS_HEX.UNC;
      const svgIcon = L.divIcon({
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: bold; color: white;
          font-family: ui-monospace, monospace;
        ">${a.iecClass}</div>`,
      });

      const popup = `
        <div style="font-family: ui-sans-serif, sans-serif; min-width: 200px; color: #f4f4f5; background: #09090b;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; color: #fafafa;">${a.type}</div>
          <div style="display: flex; gap: 6px; margin-bottom: 8px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;">${a.iecClass}</span>
            ${a.priority ? `<span style="background: #27272a; color: #a1a1aa; padding: 2px 8px; border-radius: 99px; font-size: 11px;">${a.priority}</span>` : ""}
          </div>
          <div style="color: #a1a1aa; font-size: 12px; line-height: 1.6;">
            <div><b style="color: #d4d4d8;">ΔT:</b> +${a.deltaT.toFixed(1)}°C</div>
            <div><b style="color: #d4d4d8;">T Anomaly:</b> ${a.tAnomaly.toFixed(1)}°C</div>
            <div><b style="color: #d4d4d8;">Modules:</b> ${a.modulesAffected}</div>
            ${a.locationString ? `<div><b style="color: #d4d4d8;">Location:</b> ${a.locationString}</div>` : ""}
            <div style="color:#52525b;font-size:10px;margin-top:4px;font-family:ui-monospace,monospace;">${a.lat?.toFixed(5)}°, ${a.lng?.toFixed(5)}°</div>
          </div>
        </div>`;

      L.marker([a.lat!, a.lng!], { icon: svgIcon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 280, className: "nexpwr-dark-popup" });
    });

    // Fit bounds to all markers
    if (geoAnoms.length > 1) {
      const bounds = L.latLngBounds(geoAnoms.map((a) => [a.lat!, a.lng!]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [anomalies]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-800">
      {/* Legend overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-lg p-3 shadow-2xl">
        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">IEC Class Registry</div>
        {Object.entries(CLASS_HEX).filter(([cls]) => cls !== "UNC").map(([cls, color]) => (
          <div key={cls} className="flex items-center gap-2 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-black shadow-sm" style={{ background: color }} />
            <span className="text-[10px] font-bold font-mono text-zinc-400">{cls}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-zinc-800/50">
          <div className="w-2.5 h-2.5 rounded-full border border-black shadow-sm bg-purple-600" />
          <span className="text-[10px] font-bold font-mono text-zinc-500 italic">UNC</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height }} />
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export function MiniMap({ inspection }: { inspection?: any }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const anomalies = useAppStore((state) => state.anomalies);
  const leafletLoaded = useRef(false);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        leafletLoaded.current = true;
        initMap();
      };
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
  }, []);

  const initMap = () => {
    if (!leafletLoaded.current || !mapRef.current || mapInstance.current) return;
    
    const L = (window as any).L;
    
    // Get coords from site data
    const siteLat = inspection?.site?.latitude;
    const siteLng = inspection?.site?.longitude;
    
    let center: [number, number];
    let zoom = 19;
    
    if (siteLat && siteLng) {
      center = [siteLat, siteLng];
      zoom = 17;
    } else {
      // Fallback: world view centered on India if no GPS
      center = [20.5937, 78.9629];
      zoom = 4;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    if (siteLat && siteLng) {
      L.marker([siteLat, siteLng])
        .addTo(map)
        .bindPopup(inspection.site.name || "Site Location");
    }

    mapInstance.current = map;
    updateMarkers();
  };

    mapInstance.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstance.current || !leafletLoaded.current) return;
    const L = (window as any).L;

    // Clear old markers not in anomalies
    const currentIds = new Set(anomalies.map(a => a.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        mapInstance.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    const getIconColor = (severity: string) => {
      if (severity === "critical") return "red";
      if (severity === "moderate") return "orange";
      if (severity === "minor") return "blue";
      if (severity === "not_significant") return "green";
      return "grey";
    };

    let bounds = L.latLngBounds();
    let hasMarkers = false;

    anomalies.forEach(a => {
      if (a.lat !== undefined && a.lng !== undefined) {
         hasMarkers = true;
         bounds.extend([a.lat, a.lng]);
         
         if (!markersRef.current[a.id]) {
            // Create minimal colored SVG icon
            const color = getIconColor(a.severity);
            const svgIcon = L.divIcon({
              html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`,
              className: "",
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              popupAnchor: [0, -24]
            });

            const marker = L.marker([a.lat, a.lng], { icon: svgIcon }).addTo(mapInstance.current);
            markersRef.current[a.id] = marker;
            
            marker.on('click', () => {
               const elem = document.getElementById(`anomaly-row-${a.id}`);
               if (elem) elem.scrollIntoView({ behavior: "smooth", block: "center" });
            });
         }
         
         // Update popup content
         const popupContent = `
           <div style="font-family: sans-serif; min-width: 150px;">
             <strong>ID: ${a.id.slice(0, 5)}</strong><br/>
             Type: ${a.type}<br/>
             Class: ${a.severity.toUpperCase()}<br/>
             ΔT: ${a.tempDeltaC ? a.tempDeltaC + '°C' : 'N/A'}
           </div>
         `;
         markersRef.current[a.id].bindPopup(popupContent);
      }
    });

    if (hasMarkers) {
       mapInstance.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 21 });
    }
  };

  useEffect(() => {
    updateMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anomalies]);

  return <div ref={mapRef} className="w-full h-[200px] border border-zinc-800 rounded-lg shrink-0 mt-4 bg-zinc-900 z-0"></div>;
}

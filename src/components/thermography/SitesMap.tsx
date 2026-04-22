"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// mapbox-gl uses dynamic import to avoid SSR issues
let mapboxgl: any = null;

interface SitePin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  status?: string;
}

interface SitesMapProps {
  sites: SitePin[];
  onSiteClick?: (siteId: string) => void;
  height?: string;
}

export function SitesMap({ sites, onSiteClick, height = "300px" }: SitesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const geoSites = sites.filter((s) => s.latitude && s.longitude);

  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return;

    // Dynamic import of mapbox-gl
    import("mapbox-gl")
      .then((mb) => {
        mapboxgl = mb.default || mb;
        mapboxgl.accessToken = token;

        // Import CSS
        import("mapbox-gl/dist/mapbox-gl.css");

        const bounds = new mapboxgl.LngLatBounds();
        geoSites.forEach((s) => bounds.extend([s.longitude, s.latitude]));

        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: geoSites.length > 0 ? [geoSites[0].longitude, geoSites[0].latitude] : [78.9629, 20.5937], // Default: India center
          zoom: geoSites.length > 0 ? 5 : 4,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", () => {
          setMapLoaded(true);

          // Fit all pins if multiple
          if (geoSites.length > 1) {
            map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
          } else if (geoSites.length === 1) {
            map.flyTo({ center: [geoSites[0].longitude, geoSites[0].latitude], zoom: 10 });
          }

          // Add markers for each site
          geoSites.forEach((site) => {
            // Create custom marker element
            const el = document.createElement("div");
            el.className = "site-marker";
            el.style.cssText = `
              width: 32px; height: 32px; cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              background: rgba(16, 185, 129, 0.9); border-radius: 50%;
              border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              transition: transform 0.2s;
            `;
            el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
            el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
            el.onmouseleave = () => { el.style.transform = "scale(1)"; };

            // Create popup
            const popup = new mapboxgl.Popup({
              offset: 20,
              closeButton: false,
              maxWidth: "220px",
            }).setHTML(`
              <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
                <div style="font-size: 13px; font-weight: 600; color: #111;">${site.name}</div>
                ${site.address ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${site.address}</div>` : ""}
                <div style="font-size: 10px; color: #999; margin-top: 4px;">${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}</div>
              </div>
            `);

            const marker = new mapboxgl.Marker(el)
              .setLngLat([site.longitude, site.latitude])
              .setPopup(popup)
              .addTo(map);

            // Click to navigate
            el.addEventListener("click", () => {
              if (onSiteClick) onSiteClick(site.id);
            });
          });
        });

        map.on("error", () => {
          setMapError(true);
        });

        mapRef.current = map;
      })
      .catch(() => {
        setMapError(true);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token, geoSites.length]);

  // No token or error → show fallback
  if (!token || mapError) {
    return (
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center relative"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-[13px] text-zinc-500 font-medium">Satellite Map</p>
          <p className="text-[11px] text-zinc-600 mt-1">
            {!token
              ? "Add NEXT_PUBLIC_MAPBOX_TOKEN to .env to enable"
              : "Map failed to load. Check your Mapbox token."}
          </p>
        </div>
        {geoSites.length > 0 && (
          <div className="absolute top-3 left-3 bg-zinc-950/80 border border-zinc-800 rounded-md px-2.5 py-1.5">
            <span className="text-[11px] text-zinc-400">
              {geoSites.length} site{geoSites.length !== 1 ? "s" : ""} with coordinates
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-800" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[11px] text-zinc-500">Loading satellite map...</p>
          </div>
        </div>
      )}
      {/* Site count badge */}
      <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-md px-2.5 py-1.5 z-10">
        <span className="text-[11px] text-zinc-300 font-medium">
          {geoSites.length} site{geoSites.length !== 1 ? "s" : ""} on map
        </span>
      </div>
    </div>
  );
}

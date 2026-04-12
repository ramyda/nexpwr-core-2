"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ 
  position, 
  onPositionChange 
}: { 
  position: [number, number] | null; 
  onPositionChange: (pos: [number, number]) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function RecenterMap({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({ 
  initialPos, 
  onSelect 
}: { 
  initialPos?: [number, number]; 
  onSelect: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = React.useState<[number, number] | null>(initialPos || [36.1147, -115.1728]); // Default to Vegas as placeholder

  const handlePositionChange = (pos: [number, number]) => {
    setPosition(pos);
    onSelect(pos[0], pos[1]);
  };

  return (
    <div className="h-[300px] w-full border border-zinc-200 rounded-lg overflow-hidden shadow-inner mt-2">
      <MapContainer 
        center={position || [36.1147, -115.1728]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onPositionChange={handlePositionChange} />
        <RecenterMap position={position} />
      </MapContainer>
      <div className="bg-zinc-50 border-t border-zinc-200 px-3 py-1.5 text-[10px] text-zinc-500 font-medium italic">
        Click anywhere on the map to set GPS coordinates.
      </div>
    </div>
  );
}

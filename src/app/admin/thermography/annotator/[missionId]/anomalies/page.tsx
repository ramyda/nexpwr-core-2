"use client";

import React from "react";
import { BackButton } from "@/components/shared/BackButton";
import { MapPin, List, Info } from "lucide-react";

export default function AnomaliesPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = React.use(params);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <BackButton />
          <span className="text-[13px] font-medium text-zinc-300">Anomaly Map Viewer</span>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Anomaly List */}
        <div className="w-[240px] border-r border-zinc-800 bg-zinc-950 overflow-y-auto custom-scrollbar p-3">
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Anomalies</h3>
          <div className="text-center py-8">
            <List className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-600">No anomalies marked yet</p>
          </div>
        </div>

        {/* Center — Map */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-500 font-medium">Satellite Anomaly Map</p>
            <p className="text-[11px] text-zinc-600 mt-1">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable satellite view</p>
          </div>
        </div>

        {/* Right — Detail Panel */}
        <div className="w-[220px] border-l border-zinc-800 bg-zinc-950 p-3">
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Anomaly Detail</h3>
          <div className="text-center py-8">
            <Info className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-600">Select an anomaly to view details</p>
          </div>
        </div>
      </div>
    </div>
  );
}

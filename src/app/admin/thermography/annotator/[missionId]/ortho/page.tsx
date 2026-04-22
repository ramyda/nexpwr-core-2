"use client";

import React, { useState, useEffect, useRef } from "react";
import { BackButton } from "@/components/shared/BackButton";
import { ZoomIn, ZoomOut, MousePointer2, PenTool, Save, Undo, Eye, Thermometer, MapPin, List, Info } from "lucide-react";

const faultTypes = [
  "Hot Spot", "Hot Spot - Multi Cell", "Hot Spot - Module", "Bypass Diode",
  "Short Circuit", "Cell Crack", "PID Degradation", "Soiling", "Shading", "Other",
];

const severityLevels = ["Low", "Medium", "High", "Critical"];

interface OrthoAnnotation {
  id: string;
  panelPolygonId: string | null;
  faultType: string | null;
  rackId: string | null;
  panelId: string | null;
  severity: string;
  moduleTemp: number | null;
  hotspotTemp: number | null;
}

export default function OrthoAnnotatorPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = React.use(params);
  const [mode, setMode] = useState<"select" | "draw">("select");
  const [annotations, setAnnotations] = useState<OrthoAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<OrthoAnnotation | null>(null);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showTempOverlay, setShowTempOverlay] = useState(false);
  const [faultForm, setFaultForm] = useState({
    faultType: faultTypes[0],
    rackId: "",
    panelId: "",
    moduleTemp: "",
    hotspotTemp: "",
    severity: "Low",
  });
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch existing ortho annotations
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/thermography/annotations/ortho?missionId=${missionId}`);
        const data = await res.json();
        if (Array.isArray(data)) setAnnotations(data);
      } catch (e) { console.error(e); }
    })();
  }, [missionId]);

  const handleSave = async () => {
    try {
      const payload = {
        missionId,
        faultType: faultForm.faultType,
        rackId: faultForm.rackId || null,
        panelId: faultForm.panelId || null,
        moduleTemp: faultForm.moduleTemp ? parseFloat(faultForm.moduleTemp) : null,
        hotspotTemp: faultForm.hotspotTemp ? parseFloat(faultForm.hotspotTemp) : null,
        severity: faultForm.severity,
        panelPolygonId: selectedAnnotation?.panelPolygonId || null,
        deltaT: faultForm.moduleTemp && faultForm.hotspotTemp
          ? parseFloat(faultForm.hotspotTemp) - parseFloat(faultForm.moduleTemp)
          : null,
      };

      const res = await fetch("/api/thermography/annotations/ortho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const annotation = await res.json();
        setAnnotations(prev => [...prev, annotation]);
        setFaultForm({ faultType: faultTypes[0], rackId: "", panelId: "", moduleTemp: "", hotspotTemp: "", severity: "Low" });
      }
    } catch (e) { console.error(e); }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": case "High": return "text-red-400";
      case "Medium": return "text-orange-400";
      case "Low": return "text-yellow-400";
      default: return "text-emerald-400";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
        <BackButton />
        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <button className="p-1.5 text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded hover:bg-zinc-900 transition-colors">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded hover:bg-zinc-900 transition-colors">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => setMode("draw")}
          className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1.5 ${mode === "draw" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 border border-zinc-800 hover:bg-zinc-900"}`}
        >
          <PenTool className="w-3 h-3" /> Draw
        </button>
        <button
          onClick={() => setMode("select")}
          className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1.5 ${mode === "select" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-zinc-400 border border-zinc-800 hover:bg-zinc-900"}`}
        >
          <MousePointer2 className="w-3 h-3" /> Select
        </button>
        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <button onClick={handleSave} className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 border border-zinc-800 rounded hover:bg-zinc-900 transition-colors flex items-center gap-1.5">
          <Save className="w-3 h-3" /> Save
        </button>
        <button className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 border border-zinc-800 rounded hover:bg-zinc-900 transition-colors flex items-center gap-1.5">
          <Undo className="w-3 h-3" /> Undo
        </button>
        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={showAnomalies} onChange={(e) => setShowAnomalies(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0" />
          <Eye className="w-3 h-3" /> Anomalies
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={showTempOverlay} onChange={(e) => setShowTempOverlay(e.target.checked)} className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0" />
          <Thermometer className="w-3 h-3" /> Temp Overlay
        </label>
      </div>

      {/* 3-Panel Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Anomaly List (200px) */}
        <div className="w-[200px] border-r border-zinc-800 bg-zinc-950 overflow-y-auto custom-scrollbar flex-shrink-0">
          <div className="p-2.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Anomalies</h3>
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">{annotations.length}</span>
            </div>
            {annotations.length === 0 ? (
              <div className="text-center py-6">
                <MapPin className="w-5 h-5 text-zinc-700 mx-auto mb-1.5" />
                <p className="text-[10px] text-zinc-600">No anomalies marked</p>
              </div>
            ) : (
              <div className="space-y-1">
                {annotations.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAnnotation(a)}
                    className={`w-full text-left px-2.5 py-2 rounded transition-colors ${selectedAnnotation?.id === a.id ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${a.severity === "Critical" || a.severity === "High" ? "bg-red-400" : a.severity === "Medium" ? "bg-orange-400" : "bg-yellow-400"}`} />
                      <span className="text-[11px] font-medium text-zinc-300 truncate">#{i + 1} {a.faultType || "Unknown"}</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 ml-4">{a.rackId || ""} {a.panelId || ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center — OpenLayers Map */}
        <div ref={mapRef} className="flex-1 bg-zinc-900 flex items-center justify-center relative">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-[14px] text-zinc-500 font-medium">OrthoTIF Map Canvas</p>
            <p className="text-[11px] text-zinc-600 mt-1">OpenLayers XYZ Tile Layer + GeoJSON Panel Polygons</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Upload OrthoTIF and layout GeoJSON from mission page to load the map</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500" />
                <span className="text-[10px] text-zinc-500">Critical/High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-500/60 border border-orange-500" />
                <span className="text-[10px] text-zinc-500">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-yellow-500/60 border border-yellow-500" />
                <span className="text-[10px] text-zinc-500">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-500" />
                <span className="text-[10px] text-zinc-500">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Fault Form (220px) */}
        <div className="w-[220px] border-l border-zinc-800 bg-zinc-950 overflow-y-auto custom-scrollbar flex-shrink-0 p-3 space-y-3">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Panel Details</h3>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Fault Type</label>
            <select
              value={faultForm.faultType}
              onChange={(e) => setFaultForm(prev => ({ ...prev, faultType: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            >
              {faultTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Severity</label>
            <select
              value={faultForm.severity}
              onChange={(e) => setFaultForm(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            >
              {severityLevels.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Rack ID</label>
            <input
              value={faultForm.rackId}
              onChange={(e) => setFaultForm(prev => ({ ...prev, rackId: e.target.value }))}
              placeholder="Pre-filled from GeoJSON"
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Panel ID</label>
            <input
              value={faultForm.panelId}
              onChange={(e) => setFaultForm(prev => ({ ...prev, panelId: e.target.value }))}
              placeholder="Pre-filled from GeoJSON"
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Module Temp (°C)</label>
            <input
              type="number" step="0.1"
              value={faultForm.moduleTemp}
              onChange={(e) => setFaultForm(prev => ({ ...prev, moduleTemp: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Hotspot Temp (°C)</label>
            <input
              type="number" step="0.1"
              value={faultForm.hotspotTemp}
              onChange={(e) => setFaultForm(prev => ({ ...prev, hotspotTemp: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          {faultForm.moduleTemp && faultForm.hotspotTemp && (
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">ΔT</span>
              <p className="text-[13px] font-semibold text-zinc-200">
                {(parseFloat(faultForm.hotspotTemp) - parseFloat(faultForm.moduleTemp)).toFixed(1)}°C
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-md text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

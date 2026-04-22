"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Save, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";

interface ThermalImg {
  id: string;
  filename: string;
  s3Url: string | null;
  reviewed: boolean;
  isFaulty: boolean;
  annotationsCount: number;
}

const faultTypes = [
  "Hot Spot",
  "Hot Spot - Multi Cell",
  "Hot Spot - Module",
  "Hot Spot - String",
  "Bypass Diode",
  "Short Circuit",
  "Cell Crack",
  "PID Degradation",
  "Soiling",
  "Shading",
  "Junction Box",
  "Cable / Connector",
  "Other",
];

const severityLevels = ["Low", "Medium", "High", "Critical"];

export default function AnnotatorPage({ params }: { params: Promise<{ missionId: string }> }) {
  const router = useRouter();
  const { missionId } = React.use(params);
  const [images, setImages] = useState<ThermalImg[]>([]);
  const [selectedImage, setSelectedImage] = useState<ThermalImg | null>(null);
  const [loading, setLoading] = useState(true);
  const [faultForm, setFaultForm] = useState({
    faultType: faultTypes[0],
    rackId: "",
    panelId: "",
    moduleTemp: "",
    hotspotTemp: "",
    severity: "Low",
  });
  const [annotations, setAnnotations] = useState<Array<{ id: string; x: number; y: number; width: number; height: number; faultType: string; severity: string }>>([]);
  const [drawMode, setDrawMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      try {
        // Fetch images for this mission
        const res = await fetch(`/api/thermography/missions/${missionId}/images`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setImages(data);
          setSelectedImage(data[0]);
        } else {
          setImages([]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [missionId]);

  const handleReview = async (img: ThermalImg) => {
    if (img.reviewed) return;
    try {
      // Mark as reviewed
      await fetch(`/api/thermography/missions/${missionId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 1 }),
      });
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, reviewed: true } : i));
    } catch (e) { console.error(e); }
  };

  const handleSaveAnnotation = async () => {
    if (!selectedImage) return;
    try {
      const payload = {
        imageId: selectedImage.id,
        x: 10, y: 10, width: 100, height: 100,
        ...faultForm,
        moduleTemp: faultForm.moduleTemp ? parseFloat(faultForm.moduleTemp) : null,
        hotspotTemp: faultForm.hotspotTemp ? parseFloat(faultForm.hotspotTemp) : null,
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
        if (!selectedImage.reviewed) {
          handleReview(selectedImage);
        }
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-zinc-500">Loading annotator...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <BackButton />
          <span className="text-[13px] font-medium text-zinc-300">Mission Annotator</span>
          <span className="text-[11px] text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-500">{images.length} images</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-200 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${drawMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400 border border-zinc-800 hover:bg-zinc-900"}`}
          >
            {drawMode ? "Drawing" : "Draw"}
          </button>
          <button
            onClick={() => router.push(`/admin/thermography/annotator/${missionId}/anomalies`)}
            className="px-3 py-1.5 text-[12px] font-medium text-zinc-400 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" /> Anomaly Map
          </button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Image List */}
        <div className="w-[200px] border-r border-zinc-800 bg-zinc-950 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-0.5">
            {images.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-zinc-600">No images. Upload from mission page.</div>
            ) : (
              images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={`w-full text-left px-2.5 py-2 rounded-md transition-colors group ${
                    selectedImage?.id === img.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium truncate flex-1">{img.filename}</span>
                    {img.reviewed ? (
                      <Lock className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Unlock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    )}
                  </div>
                  {img.annotationsCount > 0 && (
                    <span className="text-[10px] text-amber-400">{img.annotationsCount} annotations</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 bg-zinc-900 flex items-center justify-center relative">
          {selectedImage ? (
            <div className="relative">
              {/* Placeholder for thermal image — would load from s3Url */}
              <div className="w-[640px] h-[480px] bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <p className="text-zinc-500 text-sm font-medium">{selectedImage.filename}</p>
                  <p className="text-zinc-600 text-[11px] mt-1">Thermal image canvas</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">{drawMode ? "Click and drag to draw bounding box" : "Select draw mode to annotate"}</p>
                </div>
              </div>
              {/* Annotation overlays would render here */}
              {annotations.filter(a => selectedImage).map((a) => (
                <div
                  key={a.id}
                  className="absolute border-2 border-yellow-400 bg-yellow-400/10"
                  style={{ left: a.x, top: a.y, width: a.width, height: a.height }}
                />
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Select an image from the sidebar</p>
          )}
        </div>

        {/* Right — Fault Form */}
        <div className="w-[220px] border-l border-zinc-800 bg-zinc-950 overflow-y-auto custom-scrollbar p-3 space-y-3">
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Annotation Detail</h3>

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
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Panel ID</label>
            <input
              value={faultForm.panelId}
              onChange={(e) => setFaultForm(prev => ({ ...prev, panelId: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Module Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={faultForm.moduleTemp}
              onChange={(e) => setFaultForm(prev => ({ ...prev, moduleTemp: e.target.value }))}
              className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-zinc-500 uppercase">Hotspot Temp (°C)</label>
            <input
              type="number"
              step="0.1"
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
            onClick={handleSaveAnnotation}
            disabled={!selectedImage}
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-40 px-3 py-2 rounded-md text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-3.5 h-3.5" /> Save Annotation
          </button>

          {selectedImage && !selectedImage.reviewed && (
            <button
              onClick={() => selectedImage && handleReview(selectedImage)}
              className="w-full border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 px-3 py-2 rounded-md text-[12px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" /> Mark Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore, Anomaly } from "@/lib/store";
import { SeverityType, SEVERITY_STROKE_COLORS } from "@/lib/constants";
import { AnomalyForm } from "./AnomalyForm";
import { ZoomIn, ZoomOut, Maximize, Minimize, Camera, RefreshCw, Hand, MousePointer2 } from "lucide-react";
import * as turf from "@turf/turf";

interface CanvasViewerProps {
  inspection?: any;
  isThermalView?: boolean;
  imageFile?: File | null;
}

interface Point { x: number; y: number; }

export function CanvasViewer({ inspection, isThermalView, imageFile }: CanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Initializing workspace...");

  const anomalies = useAppStore((state) => state.anomalies);
  const addAnomaly = useAppStore((state) => state.addAnomaly);

  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [currentMouse, setCurrentMouse] = useState<Point>({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState<Point>({ x: 0, y: 0 });

  const [pendingBox, setPendingBox] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Image Logic
  const loadImage = useCallback(async () => {
    setIsImageLoaded(false);
    setLoadingMsg("Loading high-performance preview...");
    
    // Choose URL based on view and availability
    let url = "";
    if (imageFile) {
      url = URL.createObjectURL(imageFile);
    } else if (inspection) {
      const rawUrl = isThermalView 
        ? (inspection.thermalPreviewUrl || inspection.thermalFilePath || "")
        : (inspection.visualFilePath || "");
      
      if (rawUrl && !rawUrl.startsWith("http") && !rawUrl.startsWith("blob:")) {
        url = `/api/files/${encodeURIComponent(rawUrl)}`;
      } else {
        url = rawUrl;
      }
    }

    if (!url) {
      setLoadingMsg("No image data available for this view.");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      setIsImageLoaded(true);
      // Auto-fit on load
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const s = Math.min((rect.width - 40) / img.naturalWidth, (rect.height - 40) / img.naturalHeight, 1);
        setScale(s);
        setOffset({
          x: (rect.width - img.naturalWidth * s) / 2,
          y: (rect.height - img.naturalHeight * s) / 2
        });
      }
    };
    img.onerror = () => setLoadingMsg("Failed to load image asset.");
    img.src = url;
  }, [inspection, isThermalView]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Keyboard Handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(true);
      if (e.key === "0") handleReset();
      if (e.key === "+" || e.key === "=") handleZoom(1.2);
      if (e.key === "-") handleZoom(0.8);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleZoom = (factor: number, center?: Point) => {
    setScale(prev => {
      const next = Math.max(0.01, Math.min(20, prev * factor));
      // If we have a center point (cursor), adjust offset to zoom into it
      if (center && transformRef.current) {
         setOffset(off => ({
            x: center.x - (center.x - off.x) * (next / prev),
            y: center.y - (center.y - off.y) * (next / prev)
         }));
      }
      return next;
    });
  };

  const handleReset = () => {
    if (!imageObj || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const s = Math.min((rect.width - 40) / imageObj.naturalWidth, (rect.height - 40) / imageObj.naturalHeight, 1);
    setScale(s);
    setOffset({
      x: (rect.width - imageObj.naturalWidth * s) / 2,
      y: (rect.height - imageObj.naturalHeight * s) / 2
    });
  };

  // Click Handlers
  const getCanvasCoords = (e: React.MouseEvent | MouseEvent): Point => {
    if (!transformRef.current) return { x: 0, y: 0 };
    const rect = transformRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (isThermalView) {
      setIsDrawing(true);
      const pos = getCanvasCoords(e);
      setDrawStart(pos);
      setCurrentMouse(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setHoverPos(coords);

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (isDrawing) {
      setCurrentMouse(coords);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const x = Math.min(drawStart.x, currentMouse.x);
      const y = Math.min(drawStart.y, currentMouse.y);
      const width = Math.abs(currentMouse.x - drawStart.x);
      const height = Math.abs(currentMouse.y - drawStart.y);

      if (width > 5 && height > 5) {
        // Create thumbnail from canvas
        const thumb = extractThumbnail(x, y, width, height);
        setPendingBox({
          box: { x, y, width, height },
          thumbnail: thumb
        });
      }
    }
    setIsPanning(false);
  };

  const extractThumbnail = (x: number, y: number, w: number, h: number): string => {
    if (!canvasRef.current || !imageObj) return "";
    const tCanvas = document.createElement("canvas");
    const targetW = 400;
    const s = Math.min(1, targetW / w);
    
    tCanvas.width = (w + 40) * s;
    tCanvas.height = (h + 40) * s;
    const ctx = tCanvas.getContext("2d");
    if (!ctx) return "";

    ctx.drawImage(
      imageObj,
      x - 20, y - 20, w + 40, h + 40,
      0, 0, tCanvas.width, tCanvas.height
    );
    return tCanvas.toDataURL("image/jpeg", 0.9);
  };

  // Render Loop
  useEffect(() => {
    if (!isImageLoaded || !imageObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageObj.naturalWidth;
    canvas.height = imageObj.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObj, 0, 0);

    // Draw existing anomalies
    anomalies.forEach((ann: Anomaly) => {
      const box = ann.box;
      if (!box) return;
      ctx.strokeStyle = SEVERITY_STROKE_COLORS[ann.severity] || "#FF0000";
      ctx.lineWidth = 4 / scale; // Keep lines visible but thin
      ctx.setLineDash([]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.fillStyle = (SEVERITY_STROKE_COLORS[ann.severity] || "#FF0000") + "22";
      ctx.fillRect(box.x, box.y, box.width, box.height);

      // Label
      ctx.fillStyle = SEVERITY_STROKE_COLORS[ann.severity] || "#FF0000";
      ctx.font = `bold ${Math.max(12, 14 / scale)}px sans-serif`;
      const label = ann.severity === "critical" ? "C4" : ann.severity === "moderate" ? "C3" : "C2";
      ctx.fillText(label, box.x, box.y - (5 / scale));
    });

    // Draw current selection
    if (isDrawing) {
      const x = Math.min(drawStart.x, currentMouse.x);
      const y = Math.min(drawStart.y, currentMouse.y);
      const w = Math.abs(currentMouse.x - drawStart.x);
      const h = Math.abs(currentMouse.y - drawStart.y);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([5 / scale, 5 / scale]);
      ctx.strokeRect(x, y, w, h);
    }
  }, [isImageLoaded, imageObj, anomalies, isDrawing, drawStart, currentMouse, scale, isThermalView]);

  return (
    <div className={`flex flex-col bg-[#050505] relative h-full w-full overflow-hidden ${isFullscreen ? "fixed inset-0 z-[100]" : ""}`}>
      
      {/* Workspace HUD / Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full z-50 shadow-2xl">
         <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            {isSpacePressed ? <Hand className="w-4 h-4 text-emerald-400" /> : <MousePointer2 className="w-4 h-4 text-zinc-400" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isSpacePressed ? "Pan Tool" : isThermalView ? "Select Tool" : "View Only"}</span>
         </div>
         
         <div className="flex items-center gap-1">
            <button onClick={() => handleZoom(0.8)} className="p-1.5 text-zinc-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[11px] font-bold text-white min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => handleZoom(1.2)} className="p-1.5 text-zinc-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
         </div>

         <div className="h-4 w-px bg-white/10 mx-2" />

         <button onClick={handleReset} className="p-1.5 text-zinc-400 hover:text-white transition-colors" title="Fit to View"><RefreshCw className="w-4 h-4" /></button>
         <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
         </button>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${isSpacePressed ? "cursor-grab active:cursor-grabbing" : isThermalView ? "cursor-crosshair" : "cursor-default"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const factor = e.deltaY > 0 ? 0.9 : 1.1;
          handleZoom(factor, { x: e.clientX, y: e.clientY });
        }}
      >
        {!isImageLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{loadingMsg}</span>
          </div>
        ) : (
          <div 
            ref={transformRef}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              width: imageObj?.naturalWidth,
              height: imageObj?.naturalHeight,
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>

      {/* Coordinate HUD */}
      {isImageLoaded && (
        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-white/5 text-[9px] font-mono text-zinc-500 pointer-events-none uppercase tracking-widest z-50">
          POS: {Math.round(hoverPos.x)}, {Math.round(hoverPos.y)} | RES: {imageObj?.naturalWidth}x{imageObj?.naturalHeight}
        </div>
      )}

      {pendingBox && (
        <AnomalyForm
          initialX={pendingBox.box.x}
          initialY={pendingBox.box.y}
          initialThumbnail={pendingBox.thumbnail}
          onSave={(data) => {
            addAnomaly({
              type: data.type,
              severity: data.severity,
              tempDeltaC: data.tempDeltaC,
              modulesAffected: data.modulesAffected,
              panelLocation: data.panelLocation,
              notes: data.notes,
              box: pendingBox.box,
              thumbnail: pendingBox.thumbnail,
            });
            setPendingBox(null);
          }}
          onCancel={() => setPendingBox(null)}
        />
      )}
    </div>
  );
}

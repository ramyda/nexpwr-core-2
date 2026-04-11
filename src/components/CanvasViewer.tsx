"use client";

import React, { useEffect, useRef, useState } from "react";
import { fromBlob } from "geotiff";
import { useAppStore } from "@/lib/store";
import { SEVERITY_STROKE_COLORS } from "@/lib/constants";
import { AnomalyForm } from "./AnomalyForm";
import { ZoomIn, ZoomOut, Maximize, Minimize, Camera } from "lucide-react";
import * as turf from "@turf/turf";
import { getSeverityFromDelta } from "@/lib/utils";

interface CanvasViewerProps {
  imageFile: File;
}

interface BoxCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CanvasViewer({ imageFile }: CanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rgbCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLCanvasElement | HTMLImageElement | null>(null);
  const [rgbImageObj, setRgbImageObj] = useState<HTMLCanvasElement | HTMLImageElement | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Loading primary map...");

  const anomalies = useAppStore((state) => state.anomalies);
  const addAnomaly = useAppStore((state) => state.addAnomaly);
  const plantMeta = useAppStore((state) => state.plantMetadata);
  const rgbImageFile = useAppStore((state) => state.rgbImageFile);

  const tiepointRef = useRef<{ i: number; j: number; x: number; y: number } | null>(null);
  const pixelScaleRef = useRef<number[] | null>(null);

  // Drawing state
  const [activeView, setActiveView] = useState<"RGB" | "THERMAL">("RGB");
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const [tempArray, setTempArray] = useState<{ data: Float32Array; width: number; height: number; scaleY: number } | null>(null);
  const [referenceTemp, setReferenceTemp] = useState<number>(0);

  // Modal state
  const [pendingBox, setPendingBox] = useState<{ 
    box: BoxCoords; 
    thumbnail: string; 
    rgbThumbnail?: string; 
    locationCode?: string;
    lat?: number;
    lng?: number;
    tAnomaly?: number;
    tempDeltaC?: number;
  } | null>(null);

  // Zoom and Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.2, 10));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.1, 0.1));
  const handleResetZoom = () => setZoomLevel(1);
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);
  
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key.toLowerCase() === 't' && isImageLoaded && rgbImageObj) {
        setActiveView(prev => prev === "RGB" ? "THERMAL" : "RGB");
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isFullscreen, isImageLoaded, rgbImageObj]);

  const processImageFile = async (file: File, isThermal: boolean) => {
    if (file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
      const tiff = await fromBlob(file);
      const image = await tiff.getImage();
      
      if (isThermal) {
         try {
           const fd = image.getFileDirectory() as any;
           if (fd.ModelTiepoint && fd.ModelPixelScale) {
             tiepointRef.current = { i: fd.ModelTiepoint[0], j: fd.ModelTiepoint[1], x: fd.ModelTiepoint[3], y: fd.ModelTiepoint[4] };
             pixelScaleRef.current = fd.ModelPixelScale;
           }
         } catch(e) {}
      }

      let width = image.getWidth();
      let height = image.getHeight();
      
      let tArrayInfo: { data: Float32Array; width: number; height: number; scaleY: number } | null = null;
      let refTemp = 0;

      if (isThermal) {
        try {
           const rasters = await image.readRasters() as any;
           if (rasters && rasters[0]) {
              const raw = rasters[0];
              const tData = new Float32Array(raw.length);
              // Calculate reference temp
              const sorted = new Float32Array(raw.length);
              for (let i = 0; i < raw.length; i++) {
                const val = raw[i] * 0.1;
                tData[i] = val;
                sorted[i] = val;
              }
              sorted.sort();
              let sum = 0, count = 0;
              const p10 = Math.floor(sorted.length * 0.1);
              const p50 = Math.floor(sorted.length * 0.5);
              for (let i = p10; i < p50; i++) {
                sum += sorted[i]; count++;
              }
              refTemp = count > 0 ? sum / count : 0;
              tArrayInfo = { data: tData, width, height, scaleY: 1 };
           }
        } catch(e) { console.warn("Failed to extract thermal rasters", e); }
      }

      const MAX_DIM = 4096;
      let scaleY = 1;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        scaleY = 1 / scale;
        if (tArrayInfo) tArrayInfo.scaleY = scaleY;
        if (isThermal && pixelScaleRef.current) {
          // Adjust pixel scale for geo location mapping if we downscale
          pixelScaleRef.current = [pixelScaleRef.current[0] / scale, pixelScaleRef.current[1] / scale, pixelScaleRef.current[2]];
        }
      }

      const rgb = await image.readRGB({ width, height }) as any;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2d context");
      const imageData = ctx.createImageData(width, height);
      
      if (Array.isArray(rgb) || (rgb.length === 3 && rgb[0] && rgb[0].length)) {
          const R = rgb[0];
          const G = rgb[1];
          const B = rgb[2];
          const maxVal = R instanceof Uint16Array ? 65535 : 255;
          const scale = 255 / maxVal;
          for (let i = 0, j = 0; i < R.length; i++, j += 4) {
            imageData.data[j] = R[i] * scale;
            imageData.data[j + 1] = G[i] * scale;
            imageData.data[j + 2] = B[i] * scale;
            imageData.data[j + 3] = 255;
          }
      } else {
        const data = rgb as Uint8Array | Uint16Array;
        const maxVal = data instanceof Uint16Array ? 65535 : 255;
        const scale = 255 / maxVal;
        const samplesPerPixel = data.length / (width * height);
        for (let i = 0, j = 0; i < data.length; i += samplesPerPixel, j += 4) {
          imageData.data[j] = data[i] * scale;
          imageData.data[j + 1] = data[i + 1] * scale;
          imageData.data[j + 2] = data[i + 2] * scale;
          imageData.data[j + 3] = samplesPerPixel === 4 ? (data[i + 3] * scale) : 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // We only return the canvas normally, but we have some extra state for thermal
      if (isThermal && tArrayInfo) {
         setTempArray(tArrayInfo);
         setReferenceTemp(refTemp);
      }

      return canvas;
    } else {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  };

  useEffect(() => {
    let active = true;
    async function loadImages() {
      setIsImageLoaded(false);
      try {
        setLoadingMsg("Parsing primary thermal map...");
        const thermalObj = await processImageFile(imageFile, true);
        if (active) {
            setImageObj(thermalObj);
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const scaleToFitWidth = rect.width / thermalObj.width;
              const initialZoom = Math.min(1, scaleToFitWidth * 0.95);
              if (initialZoom > 0) setZoomLevel(initialZoom);
            }
        }

        if (rgbImageFile && active) {
          setLoadingMsg("Parsing secondary RGB map...");
          const rgbObj = await processImageFile(rgbImageFile, false);
          if (active) setRgbImageObj(rgbObj);
        }

        if (active) setIsImageLoaded(true);
      } catch (err) {
        console.error(err);
        setLoadingMsg("Failed to load map arrays");
      }
    }
    loadImages();
    return () => { active = false; };
  }, [imageFile, rgbImageFile]);

  // Render loop
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== imageObj.width || canvas.height !== imageObj.height) {
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (activeView === "RGB" && rgbImageObj) {
      ctx.drawImage(rgbImageObj, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(imageObj, 0, 0);
    }

      anomalies.forEach((anomaly) => {
      ctx.strokeStyle = SEVERITY_STROKE_COLORS[anomaly.severity];
      ctx.lineWidth = 3;
      ctx.strokeRect(anomaly.box.x, anomaly.box.y, anomaly.box.width, anomaly.box.height);
      ctx.fillStyle = SEVERITY_STROKE_COLORS[anomaly.severity] + "33"; 
      ctx.fillRect(anomaly.box.x, anomaly.box.y, anomaly.box.width, anomaly.box.height);
      
      // Draw IEC class badge above the polygon
      ctx.fillStyle = SEVERITY_STROKE_COLORS[anomaly.severity];
      const badgeText = anomaly.severity === "critical" ? "C4" : anomaly.severity === "moderate" ? "C3" : anomaly.severity === "minor" ? "C2" : "C1";
      ctx.font = "bold 12px sans-serif";
      const tm = ctx.measureText(badgeText);
      ctx.fillRect(anomaly.box.x, anomaly.box.y - 20, tm.width + 10, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(badgeText, anomaly.box.x + 5, anomaly.box.y - 6);
    });

    if (isDrawing) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const w = Math.abs(currentPos.x - startPos.x);
      const h = Math.abs(currentPos.y - startPos.y);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]); 
    }
  };

  useEffect(() => {
    if (rgbImageObj && rgbCanvasRef.current) {
        rgbCanvasRef.current.width = rgbImageObj.width;
        rgbCanvasRef.current.height = rgbImageObj.height;
        const ctx = rgbCanvasRef.current.getContext("2d");
        if (ctx) ctx.drawImage(rgbImageObj, 0, 0);
    }
  }, [rgbImageObj]);

  useEffect(() => {
    if (isImageLoaded) drawCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImageLoaded, imageObj, rgbImageObj, anomalies, isDrawing, currentPos, activeView]);

  // Mouse Event Handlers
  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (pendingBox || !isDrawModeEnabled) return;
    if (activeView === "RGB" && rgbImageObj) return; // Block drawing in RGB only if it is genuinely displayed
    const pos = getMousePos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setHoverPos(pos);
    if (!isDrawing) return;
    setCurrentPos(pos);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 5 && height > 5) {
      const thumb = extractThumbnail(x, y, width, height, canvasRef.current);
      let rgbThumb = undefined;
      // Extract RGB identically mapped crop if available
      if (rgbCanvasRef.current) {
          rgbThumb = extractThumbnail(x, y, width, height, rgbCanvasRef.current);
      }

      // GeoSPATIAL Logic extraction
      const centerX = x + (width / 2);
      const centerY = y + (height / 2);
      let autoLocation: string | undefined = undefined;
      let mappedLat: number | undefined = undefined;
      let mappedLng: number | undefined = undefined;

      if (tiepointRef.current && pixelScaleRef.current) {
         mappedLng = tiepointRef.current.x + (centerX - tiepointRef.current.i) * pixelScaleRef.current[0];
         mappedLat = tiepointRef.current.y + (centerY - tiepointRef.current.j) * -pixelScaleRef.current[1];
         
         if (plantMeta.geojson) {
           try {
             const pt = turf.point([mappedLng, mappedLat]);
             turf.featureEach(plantMeta.geojson, (currentFeature) => {
               if (currentFeature.geometry && (currentFeature.geometry.type === 'Polygon' || currentFeature.geometry.type === 'MultiPolygon')) {
                  if (turf.booleanPointInPolygon(pt, currentFeature as any)) {
                     autoLocation = currentFeature.properties?.id || currentFeature.properties?.name || "Mapped Panel";
                  }
               }
             });
           } catch(e) {
             console.error("Geo intersection failure:", e);
           }
         }
      }

      // Auto ΔT calculation
      let tAnomaly: number | undefined;
      let tempDeltaC: number | undefined;
      
      if (tempArray) {
        let maxT = -Infinity;
        const scaleY = tempArray.scaleY;
        
        // Convert canvas box to raw array bounds
        const sx = Math.floor(x * scaleY);
        const sy = Math.floor(y * scaleY);
        const ex = Math.floor((x + width) * scaleY);
        const ey = Math.floor((y + height) * scaleY);

        for (let row = Math.max(0, Math.min(sy, tempArray.height-1)); row <= Math.max(0, Math.min(ey, tempArray.height-1)); row++) {
          for (let col = Math.max(0, Math.min(sx, tempArray.width-1)); col <= Math.max(0, Math.min(ex, tempArray.width-1)); col++) {
             const idx = row * tempArray.width + col;
             if (tempArray.data[idx] > maxT) {
                 maxT = tempArray.data[idx];
             }
          }
        }
        if (maxT > -Infinity) {
          tAnomaly = maxT;
          tempDeltaC = parseFloat((maxT - referenceTemp).toFixed(1));
        }
      }

      setPendingBox({
        box: { x, y, width, height },
        thumbnail: thumb,
        rgbThumbnail: rgbThumb,
        locationCode: autoLocation,
        lat: mappedLat,
        lng: mappedLng,
        tAnomaly,
        tempDeltaC
      });
    }
  };

  const extractThumbnail = (x: number, y: number, w: number, h: number, sourceCanvas: HTMLCanvasElement | null): string => {
    if (!sourceCanvas) return "";
    const tCanvas = document.createElement("canvas");
    const targetW = 300;
    const scale = Math.min(1, targetW / w);
    
    tCanvas.width = w * scale;
    tCanvas.height = h * scale;
    
    const tCtx = tCanvas.getContext("2d");
    if (!tCtx) return "";
    
    // Add some padding to the crop naturally to see the surrounding context
    const padX = w * 0.2;
    const padY = h * 0.2;
    const cropX = Math.max(0, x - padX);
    const cropY = Math.max(0, y - padY);
    const cropW = Math.min(sourceCanvas.width - cropX, w + (padX * 2));
    const cropH = Math.min(sourceCanvas.height - cropY, h + (padY * 2));

    tCtx.drawImage(
      sourceCanvas,
      cropX, cropY, cropW, cropH,
      0, 0, tCanvas.width, tCanvas.height
    );
    return tCanvas.toDataURL("image/jpeg", 0.8);
  };

  const getHoverHUD = () => {
    if (activeView === "RGB" && rgbImageObj) return null;
    if (!tempArray || !isImageLoaded) return null;
    const px = Math.floor(hoverPos.x * tempArray.scaleY);
    const py = Math.floor(hoverPos.y * tempArray.scaleY);
    
    if (px < 0 || py < 0 || px >= tempArray.width || py >= tempArray.height) return null;
    
    const temp = tempArray.data[py * tempArray.width + px];
    const dt = temp - referenceTemp;
    const severity = getSeverityFromDelta(dt);
    
    let colorClass = "text-emerald-400";
    if (severity === "critical") colorClass = "text-red-500";
    else if (severity === "moderate") colorClass = "text-amber-500";
    else if (severity === "minor") colorClass = "text-blue-400";
    
    return (
      <div className="absolute top-16 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-lg p-3 pointer-events-none z-30 shadow-2xl flex flex-col gap-1 min-w-[120px]">
         <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1 border-b border-zinc-800 pb-1">Radiometry <span className="text-zinc-600 font-mono font-normal normal-case float-right">x:{Math.round(hoverPos.x)}, y:{Math.round(hoverPos.y)}</span></div>
         <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-400">Temp</span>
            <span className="text-xl font-bold text-white">{temp.toFixed(1)}°C</span>
         </div>
         <div className="flex justify-between items-baseline">
            <span className="text-xs text-zinc-400">ΔT vs Ref</span>
            <span className={`text-sm font-bold ${colorClass}`}>
               {dt > 0 ? "+" : ""}{dt.toFixed(1)}°C
            </span>
         </div>
         <div className="text-[9px] text-zinc-600 mt-1 italic">Ref Temp: {referenceTemp.toFixed(1)}°C</div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-zinc-950 overflow-hidden shadow-inner border border-zinc-800 ${isFullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen" : "relative w-full h-full rounded-xl"}`}>
      <div className="absolute top-0 left-0 right-0 p-3 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 z-10 flex justify-between items-center text-sm">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => setIsDrawModeEnabled(!isDrawModeEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              isDrawModeEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDrawModeEnabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
            {isDrawModeEnabled ? "DRAW MODE: ON" : "DRAW MODE: OFF"}
          </button>
          <span className="text-zinc-500 text-[10px] hidden sm:inline ml-1">
            {activeView === "RGB" && rgbImageObj
              ? "Switch to thermal view to draw annotations." 
              : isDrawModeEnabled 
                ? "Click and drag on the image to mark an anomaly." 
                : "Drawing disabled. Use scroll to pan."}
          </span>
        </div>
        
        {rgbImageObj && (
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1 mx-4">
            <button
              onClick={() => setActiveView("RGB")}
              className={`px-4 py-1 text-[10px] font-bold rounded-full transition-colors ${activeView === "RGB" ? "bg-slate-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              RGB
            </button>
            <button
              onClick={() => setActiveView("THERMAL")}
              className={`px-4 py-1 text-[10px] font-bold rounded-full transition-colors ${activeView === "THERMAL" ? "bg-slate-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              THERMAL
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (canvasRef.current) {
                const link = document.createElement('a');
                link.download = `${plantMeta.name.replace(/\\s+/g, '_')}_${activeView}_annotated_${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvasRef.current.toDataURL("image/png");
                link.click();
              }
            }}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-colors mr-2" 
            title="Download Annotated Screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <span onClick={handleResetZoom} className="px-2 text-xs font-medium text-zinc-300 min-w-[50px] text-center cursor-pointer hover:text-white" title="Reset Zoom">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
          </div>
          <button onClick={toggleFullscreen} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors ml-2">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {getHoverHUD()}

      <div 
        ref={containerRef} 
        className={`flex-1 w-full h-full overflow-auto relative custom-scrollbar mt-[48px] ${
          isDrawModeEnabled && (activeView === "THERMAL" || !rgbImageObj) ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
        }`}
        onMouseMove={handleMouseMove}
      >
        {isImageLoaded && (
          <div className="absolute top-3 left-3 pointer-events-none z-20">
            {activeView === "THERMAL" || !rgbImageObj ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900/90 text-emerald-500 text-[10px] font-bold tracking-wider rounded-full border border-zinc-800 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                THERMAL — radiometric active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900/90 text-blue-500 text-[10px] font-bold tracking-wider rounded-full border border-zinc-800 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                RGB — visual reference
              </span>
            )}
          </div>
        )}
        {!isImageLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
             <div className="w-8 h-8 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
             {loadingMsg}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block origin-top-left"
            style={{ 
              width: imageObj ? `${imageObj.width * zoomLevel}px` : "auto",
              height: imageObj ? `${imageObj.height * zoomLevel}px` : "auto",
              maxWidth: "none",
            }}
          />
        )}
      </div>

      {/* Hidden canvas to hold the RGB array context strictly for thumbnail cropping bounds matching the thermal array */}
      <canvas ref={rgbCanvasRef} className="hidden" />

      {pendingBox && (
        <AnomalyForm
          initialX={pendingBox.box.x}
          initialY={pendingBox.box.y}
          initialThumbnail={pendingBox.thumbnail}
          initialRgbThumbnail={pendingBox.rgbThumbnail}
          initialLocationCode={pendingBox.locationCode}
          initialLat={pendingBox.lat}
          initialLng={pendingBox.lng}
          initialTempDeltaC={pendingBox.tempDeltaC}
          onSave={(data) => {
            addAnomaly({
              type: data.type,
              severity: data.severity,
              tempDeltaC: data.tempDeltaC,
              modulesAffected: data.modulesAffected,
              panelLocation: pendingBox.locationCode || data.panelLocation,
              notes: data.notes,
              box: pendingBox.box,
              thumbnail: pendingBox.thumbnail,
              rgbThumbnail: pendingBox.rgbThumbnail,
              lat: pendingBox.lat,
              lng: pendingBox.lng,
            });
            setPendingBox(null);
          }}
          onCancel={() => setPendingBox(null)}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ANOMALY_TYPE_NAMES, SEVERITY_COLORS, IEC_SEVERITY_CLASSES } from "@/lib/constants";
import { getSeverityFromDelta } from "@/lib/constants";
import { X, AlertTriangle, Info } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { calcAnomaly } from "@/lib/utils";
import type { SeverityType } from "@/lib/constants";

interface AnomalyFormProps {
  initialX: number;
  initialY: number;
  initialThumbnail: string;
  initialRgbThumbnail?: string;
  initialLocationCode?: string;
  initialLat?: number;
  initialLng?: number;
  initialTempDeltaC?: number;
  onSave: (data: {
    type: string;
    severity: SeverityType;
    tempDeltaC: number | null;
    modulesAffected: number;
    panelLocation: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

function Tooltip({ text }: { text: string }) {
  const [v, setV] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button type="button" className="text-zinc-600 hover:text-zinc-400 transition-colors focus:outline-none"
        onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}>
        <Info className="w-3.5 h-3.5" />
      </button>
      {v && (
        <span className="absolute z-50 bottom-6 left-0 w-72 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed shadow-xl pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

export function AnomalyForm({
  initialX, initialY, initialThumbnail, initialRgbThumbnail, initialLocationCode,
  initialLat, initialLng, initialTempDeltaC,
  onSave, onCancel,
}: AnomalyFormProps) {
  const plantMeta = useAppStore((s) => s.plantMetadata);
  const inspMeta  = useAppStore((s) => s.inspectionMetadata);

  const [selectedType, setSelectedType]     = useState<string>("");
  const [tempDeltaC, setTempDeltaC]         = useState<string>(initialTempDeltaC !== undefined ? initialTempDeltaC.toString() : "");
  const [modulesAffected, setModulesAffected] = useState<number>(1);
  const [location, setLocation]             = useState(initialLocationCode || "");
  const [notes, setNotes]                   = useState("");
  const [deltaTouched, setDeltaTouched]     = useState(false);

  // Auto-select type based on Delta T if it's prepopulated
  useEffect(() => {
    if (initialTempDeltaC !== undefined && !selectedType) {
      if (initialTempDeltaC >= 20) setSelectedType("HOT SPOT");
      else if (initialTempDeltaC >= 10) setSelectedType("STRING FAULT");
      else if (initialTempDeltaC >= 3) setSelectedType("CELL FAULT");
      else setSelectedType("UNDERPERFORMING STRING");
    }
  }, [initialTempDeltaC, selectedType]);

  const parsedDelta  = tempDeltaC !== "" ? parseFloat(tempDeltaC) : null;
  const severity     = getSeverityFromDelta(parsedDelta);
  const severityInfo = IEC_SEVERITY_CLASSES[severity];

  // Live calculation
  const plantCapacityKwp = plantMeta.capacityMw * 1000;
  const calcResult = selectedType && modulesAffected >= 1 && plantMeta.modulePowerW > 0
    ? calcAnomaly({
        anomalyType: selectedType,
        modulesAffected,
        modulePowerWp: plantMeta.modulePowerW,
        irradianceWm2: inspMeta.irradianceWm2,
        tempCoeffPmax: plantMeta.tempCoeffPmax,
        moduleTempC: inspMeta.moduleTempC,
        annualPoaIrradiance: inspMeta.annualPoaIrradiance,
        performanceRatio: inspMeta.performanceRatio,
        ppaRate: inspMeta.ppaRate,
        plantCapacityKwp: plantCapacityKwp,
      })
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) { alert("Select an anomaly type."); return; }
    if (modulesAffected < 1) { alert("Modules affected must be at least 1."); return; }
    onSave({
      type: selectedType,
      severity,
      tempDeltaC: parsedDelta,
      modulesAffected,
      panelLocation: location,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-base font-semibold text-zinc-100">Mark Anomaly</h3>
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Thermal + RGB thumbnails */}
          <div className="flex gap-2">
            <div className="relative w-28 h-24 bg-zinc-800 rounded-md overflow-hidden border border-zinc-700 shrink-0">
              <span className="absolute top-0 left-0 bg-black/60 text-white text-[9px] px-1 rounded-br z-10">IR</span>
              {initialThumbnail && <img src={initialThumbnail} alt="Thermal preview" className="w-full h-full object-cover" />}
            </div>
            <div className="relative w-28 h-24 bg-zinc-800 rounded-md overflow-hidden border border-zinc-700 border-dashed shrink-0 flex items-center justify-center text-zinc-600 text-[10px] text-center">
              <span className="absolute top-0 left-0 bg-black/60 text-white text-[9px] px-1 rounded-br z-10">RGB</span>
              {initialRgbThumbnail
                ? <img src={initialRgbThumbnail} alt="RGB preview" className="w-full h-full object-cover" />
                : <span className="text-zinc-600">No RGB</span>
              }
            </div>
            <div className="text-xs text-zinc-400 flex flex-col justify-center gap-1 overflow-hidden">
              <p>Coords: X:{Math.round(initialX)} Y:{Math.round(initialY)}</p>
              {initialLat !== undefined && initialLng !== undefined && (
                 <p className="text-[10px] text-blue-400 font-mono truncate" title={`${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`}>
                    GPS: {initialLat.toFixed(5)}, {initialLng.toFixed(5)}
                 </p>
              )}
              {initialLocationCode && <p className="text-emerald-400 font-mono text-[10px]">Match: {initialLocationCode}</p>}
            </div>
          </div>

          {/* Anomaly type */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Anomaly Type *</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="" disabled>Select a type...</option>
              {ANOMALY_TYPE_NAMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* ΔT — MANDATORY */}
          <div>
            <label className="text-sm font-medium text-zinc-300 flex items-center mb-1">
              Temperature Delta ΔT (°C) — REQUIRED
              <Tooltip text="Anomalous component temperature minus reference cell temperature under identical irradiance. Mandatory for IEC 62446-3 severity classification." />
            </label>
            <input
              type="number"
              step="0.1"
              min="-5"
              max="150"
              value={tempDeltaC}
              onChange={(e) => { setTempDeltaC(e.target.value); setDeltaTouched(true); }}
              onBlur={() => setDeltaTouched(true)}
              placeholder="e.g. 15.4"
              className={`w-full bg-zinc-800 border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                deltaTouched && parsedDelta == null
                  ? "border-red-500 focus:ring-red-500"
                  : "border-zinc-700 focus:ring-emerald-500"
              }`}
            />
            {deltaTouched && parsedDelta == null && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> ΔT is required. Without it this anomaly will be flagged as Non-compliant in the report.
              </p>
            )}
          </div>

          {/* Severity badge (auto from ΔT) */}
          <div>
            <label className="text-sm font-medium text-zinc-400 block mb-1">IEC 62446-3 Severity (auto-classified from ΔT)</label>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${SEVERITY_COLORS[severity]}`}>
              {severityInfo.label}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{severityInfo.action}</p>
          </div>

          {/* Modules affected */}
          <div>
            <label className="text-sm font-medium text-zinc-300 flex items-center mb-1">
              Modules Affected *
              <Tooltip text="Manual entry only — never estimated from pixel area. Count from drone imagery or plant layout." />
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={modulesAffected}
              onChange={(e) => setModulesAffected(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live calculation preview */}
          {calcResult && (
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 text-xs space-y-1 font-mono">
              <p className="text-zinc-400 font-sans font-medium mb-1.5">Live Calculation Preview</p>
              <div className="flex justify-between"><span className="text-zinc-500">Loss factor:</span><span className="text-zinc-200">{(calcResult.lossFactor * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Module operating power:</span><span className="text-zinc-200">{calcResult.pOperatingW.toFixed(1)} W</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">DC loss (instant):</span><span className="text-zinc-200">{calcResult.dcLossInstantKw.toFixed(3)} kW</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">DC loss (STC basis):</span><span className="text-zinc-200">{calcResult.dcLossStcKw.toFixed(3)} kW</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">DC loss (%):</span><span className="text-zinc-200">{calcResult.dcLossPct.toFixed(3)}%</span></div>
              <div className="flex justify-between border-t border-zinc-700 pt-1 mt-1"><span className="text-zinc-500">Annual energy loss:</span><span className="text-yellow-400">{Math.round(calcResult.annualKwhLoss).toLocaleString()} kWh/yr</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Annual financial loss:</span><span className="text-emerald-400">${calcResult.annualDollarLoss.toFixed(2)}</span></div>
              <p className="text-zinc-600 font-sans text-[10px] pt-1">Estimated engineering values — not IEC-certified. See footnote ⑥.</p>
            </div>
          )}

          {/* Location & Notes */}
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Panel Location Code</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. S1-R3-STR2-M15"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional observations..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-zinc-800">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 transition shadow-lg shadow-emerald-900/20">
              Save Anomaly
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

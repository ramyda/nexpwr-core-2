"use client";

import React, { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Upload, AlertTriangle, Info, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { IEC_THERMAL_EQUILIBRIUM_STATEMENT } from "@/lib/constants";

function Tooltip({ text }: { text: string }) {
  const [v, setV] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
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

function Label({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <label className="flex items-center text-sm font-medium text-zinc-400 mb-1">
      {children}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );
}

function NumInput({ value, onChange, min, max, step = 1, placeholder, className = "" }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; placeholder?: string; className?: string;
}) {
  return (
    <input type="number" min={min} max={max} step={step}
      className={`w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 ${className}`}
      value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder} />
  );
}

export function InspectionTab() {
  const meta    = useAppStore((s) => s.inspectionMetadata);
  const setMeta = useAppStore((s) => s.setInspectionMetadata);
  const thermalImageFile = useAppStore((s) => s.thermalImageFile);
  const rgbImageFile     = useAppStore((s) => s.rgbImageFile);
  const setThermalImageFile = useAppStore((s) => s.setThermalImageFile);
  const setRgbImageFile     = useAppStore((s) => s.setRgbImageFile);

  const thermalRef = useRef<HTMLInputElement>(null);
  const rgbRef     = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, isThermal: boolean) => {
    const file = e.target.files?.[0];
    if (file) { isThermal ? setThermalImageFile(file) : setRgbImageFile(file); }
  };

  // IEC 62446-3 irradiance gate (Section 4 Check 1)
  const irradianceInvalid = meta.irradianceWm2 > 0 && meta.irradianceWm2 < 600;
  const irradianceOk      = meta.irradianceWm2 >= 600;

  // Wind speed warning (Section 4 Check 2)
  const windHigh = meta.windSpeedMs > 4;

  // Compliance checklist
  const checks = [
    { label: "Irradiance ≥ 600 W/m²",  ok: irradianceOk },
    { label: "Module temp. recorded",   ok: meta.moduleTempC > 0 },
    { label: "Wind ≤ 4 m/s",           ok: meta.windSpeedMs <= 4 },
    { label: "Emissivity recorded",     ok: meta.cameraEmissivity > 0 },
    { label: "ΔT threshold set",        ok: meta.minTempDeltaThreshold > 0 },
    { label: "Annual POA entered",      ok: meta.annualPoaIrradiance >= 800 },
    { label: "Performance ratio set",   ok: meta.performanceRatio > 0 },
  ];
  const iecOk = checks.every(c => c.ok);

  return (
    <div className="flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-2xl p-8 max-w-5xl mx-auto w-full overflow-y-auto max-h-[calc(100vh-130px)]">
      {/* Title */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-medium text-zinc-100">Inspection Configuration</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${iecOk
          ? "bg-emerald-900/40 text-emerald-400 border-emerald-800/50"
          : "bg-red-900/30 text-red-400 border-red-800/40"}`}>
          {iecOk ? "✓ IEC 62446-3 Compliant" : "⚠ Non-compliant"}
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-6 border-b border-zinc-800 pb-4">
        Fields on the right are mandatory per IEC 62446-3:2017 for certified thermographic inspection reports.
      </p>

      {/* IEC mandatory statement (Section 4 Check 3) */}
      <div className="mb-6 p-3 border border-amber-800/40 bg-amber-900/10 rounded-lg text-xs text-amber-300">
        <span className="font-semibold">IEC 62446-3 Required Statement: </span>
        {IEC_THERMAL_EQUILIBRIUM_STATEMENT}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* ── Column 1: Flight Details ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Flight Details</h3>
          <div>
            <Label>Inspection Date</Label>
            <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.date} onChange={e => setMeta({ date: e.target.value })} />
          </div>
          <div>
            <Label>Operator Name</Label>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.operator} onChange={e => setMeta({ operator: e.target.value })} placeholder="Inspector name" />
          </div>
          <div>
            <Label>Drone Model</Label>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.droneModel} onChange={e => setMeta({ droneModel: e.target.value })} placeholder="e.g. DJI Matrice 30T" />
          </div>
          <div>
            <Label>Camera / Sensor</Label>
            <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.cameraModel} onChange={e => setMeta({ cameraModel: e.target.value })} placeholder="e.g. Zenmuse H20T" />
          </div>
          <div className="pt-3 border-t border-zinc-800 space-y-4">
            <div>
              <Label tooltip="Converts annual kWh loss into annual financial impact ($).">PPA Rate ($/kWh)</Label>
              <NumInput value={meta.ppaRate} onChange={v => setMeta({ ppaRate: v })} min={0.001} max={1.0} step={0.001} placeholder="0.040" />
            </div>
            <div>
              <Label tooltip="Annual plane-of-array irradiance for site. Source from PVGIS or on-site pyranometer. Default 1600 for central India.">
                Annual POA Irradiance (kWh/m²/yr)
              </Label>
              <NumInput value={meta.annualPoaIrradiance} onChange={v => setMeta({ annualPoaIrradiance: v })} min={800} max={2500} step={10} placeholder="1600" />
            </div>
            <div>
              <Label tooltip="System efficiency factor per IEC 61724-1. Accounts for all annual temperature, wiring, and inverter losses. Typical range 0.75–0.85.">
                Performance Ratio (0–1)
              </Label>
              <NumInput value={meta.performanceRatio} onChange={v => setMeta({ performanceRatio: v })} min={0.50} max={1.00} step={0.01} placeholder="0.80" />
            </div>
          </div>
        </div>

        {/* ── Column 2: Weather ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Weather at Inspection</h3>
          <div>
            <Label>Ambient Temperature (°C)</Label>
            <NumInput value={meta.weatherTempC} onChange={v => setMeta({ weatherTempC: v })} min={-20} max={60} step={0.5} placeholder="30" />
          </div>
          <div>
            <Label>Humidity (%)</Label>
            <NumInput value={meta.weatherHumidity} onChange={v => setMeta({ weatherHumidity: v })} min={0} max={100} placeholder="45" />
          </div>
          <div>
            <Label tooltip="IEC 62446-3 recommends below 4 m/s. Higher speeds suppress hotspot temperatures and understate severity.">
              Wind Speed (m/s)
            </Label>
            <div className="relative">
              <NumInput
                value={meta.windSpeedMs} onChange={v => setMeta({ windSpeedMs: v })} min={0} max={30} step={0.1} placeholder="2.0"
                className={windHigh ? "border-amber-500/70" : ""}
              />
            </div>
            {windHigh && (
              <p className="text-xs text-amber-400 mt-1 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                WARNING — Wind speed at inspection was {meta.windSpeedMs} m/s. IEC 62446-3 recommends below 4 m/s. Convective cooling at elevated wind speeds may suppress hotspot temperatures causing anomaly severity to be understated.
              </p>
            )}
          </div>
          <div>
            <Label>Cloud Cover (%)</Label>
            <NumInput value={meta.weatherCloudCover} onChange={v => setMeta({ weatherCloudCover: v })} min={0} max={100} placeholder="0" />
          </div>
        </div>

        {/* ── Column 3: IEC 62446-3 Mandatory Parameters ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">IEC 62446-3 Parameters</h3>

          <div>
            <Label tooltip="IEC 62446-3 mandates minimum 600 W/m² for a valid inspection. Measure with calibrated reference cell or pyranometer.">
              Irradiance (W/m²)
            </Label>
            <div className="relative">
              <NumInput value={meta.irradianceWm2} onChange={v => setMeta({ irradianceWm2: v })} min={0} max={1500} step={10} placeholder="800"
                className={irradianceInvalid ? "border-red-500/70" : irradianceOk ? "border-emerald-700/50" : ""} />
              <span className="absolute right-2.5 top-2.5">
                {irradianceOk ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : irradianceInvalid ? <XCircle className="w-4 h-4 text-red-400" /> : null}
              </span>
            </div>
            {irradianceInvalid && (
              <p className="text-xs text-red-400 mt-1 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                INSPECTION INVALID — IEC 62446-3 requires minimum 600 W/m² in-plane irradiance. Measured irradiance was {meta.irradianceWm2} W/m². Report generation is blocked.
              </p>
            )}
          </div>

          <div>
            <Label tooltip="Measured backsheet temperature. Used for IEC 60891 correction.">
              Module temperature (°C)
            </Label>
            <NumInput value={meta.moduleTempC} onChange={v => setMeta({ moduleTempC: v })} min={-20} max={90} step={0.5} placeholder="55" />
          </div>

          <div>
            <Label>Camera Emissivity Setting</Label>
            <NumInput value={meta.cameraEmissivity} onChange={v => setMeta({ cameraEmissivity: v })} min={0.80} max={1.0} step={0.01} placeholder="0.85" />
          </div>

          <div>
            <Label tooltip="Temperature Delta threshold for anomaly detection. Minimum 3°C per IEC 62446-3. Anomalies below this threshold cannot be classified as severity level 1-3.">
              Temperature Delta threshold (ΔT)
            </Label>
            <NumInput value={meta.minTempDeltaThreshold} onChange={v => setMeta({ minTempDeltaThreshold: v })} min={1} max={30} step={0.5} placeholder="3" />
          </div>

          {/* IEC compliance checklist */}
          <div className={`p-3 rounded-lg border text-xs mt-2 ${iecOk ? "bg-emerald-900/15 border-emerald-800/40" : "bg-zinc-900 border-zinc-800"}`}>
            <p className="font-semibold mb-2 text-zinc-300">Compliance Status (IEC 62446-3):</p>
            <div className="space-y-1">
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-1.5">
                  {c.ok
                    ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    : <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                  <span className={c.ok ? "text-zinc-400" : "text-red-400"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Uploads ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-zinc-800 rounded-xl bg-zinc-900/20">
        <div>
          <h3 className="text-sm font-semibold text-emerald-400 mb-1">Thermal Orthomosaic (Required)</h3>
          <p className="text-xs text-zinc-500 mb-4">Primary annotation canvas. Supports GeoTIFF, TIFF, JPG, PNG.</p>
          <input type="file" accept="image/jpeg,image/png,image/tiff,.tif" ref={thermalRef} className="hidden" onChange={e => handleFile(e, true)} />
          <button onClick={() => thermalRef.current?.click()}
            className={`flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed rounded-xl transition-all ${thermalImageFile
              ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-400"}`}>
            <Upload className="w-5 h-5" />
            {thermalImageFile ? `Loaded: ${(thermalImageFile as File).name}` : "Upload Thermal (.tiff / .jpg)"}
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-400 mb-1">RGB Orthomosaic (Optional)</h3>
          <p className="text-xs text-zinc-500 mb-4">Secondary RGB for side-by-side image pairs in the PDF report.</p>
          <input type="file" accept="image/jpeg,image/png,image/tiff,.tif" ref={rgbRef} className="hidden" onChange={e => handleFile(e, false)} />
          <button onClick={() => rgbRef.current?.click()}
            className={`flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed rounded-xl transition-all ${rgbImageFile
              ? "border-blue-500/50 bg-blue-500/5 text-blue-400"
              : "border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-400"}`}>
            <Upload className="w-5 h-5" />
            {rgbImageFile ? `Loaded: ${(rgbImageFile as File).name}` : "Upload RGB (.tiff / .jpg)"}
          </button>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <div className="flex justify-end mt-8">
        <button 
          onClick={() => setMeta({ activeTab: 'annotate' })}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg transition-all"
        >
          Next: Annotate Thermal Map <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { MODULE_BRANDS, MODULE_CATALOG, INVERTER_BRANDS, INVERTER_CATALOG, LOCATION_SUGGESTIONS, MODULE_TECH_OPTIONS } from "@/lib/productCatalog";
import { Info, CheckCircle2, AlertTriangle, Upload, MapPin, FileText, Download, ArrowRight } from "lucide-react";
import { generateSiteSpecPDF } from "@/lib/pdfGenerator";

function Tooltip({ text }: { text: string }) {
  const [v, setV] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button type="button" className="text-zinc-600 hover:text-zinc-400 transition-colors focus:outline-none"
        onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)} aria-label="info">
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

function Warning({ text }: { text: string }) {
  return (
    <p className="mt-1 text-xs text-amber-400 flex items-start gap-1">
      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {text}
    </p>
  );
}

function Combobox({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(value.toLowerCase()));
  return (
    <div className="relative">
      <input
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && filtered.length > 0 && !disabled && (
        <ul className="absolute z-40 w-full bg-zinc-900 border border-zinc-700 rounded-lg mt-1 overflow-auto max-h-52 shadow-xl">
          {filtered.map(o => (
            <li key={o} className="px-3 py-2 text-sm text-zinc-200 hover:bg-emerald-600/20 cursor-pointer"
              onMouseDown={() => { onChange(o); setOpen(false); }}>
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SetupTab() {
  const meta    = useAppStore((s) => s.plantMetadata);
  const setMeta = useAppStore((s) => s.setPlantMetadata);
  const setInspectionMeta = useAppStore((s) => s.setInspectionMetadata);
  const geojsonRef = useRef<HTMLInputElement>(null);
  const [locationQuery, setLocationQuery] = useState(meta.locationText);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Filtered location suggestions
  const filteredLocs = LOCATION_SUGGESTIONS.filter(l =>
    l.display.toLowerCase().includes(locationQuery.toLowerCase())
  );

  const handleLocSelect = (loc: typeof LOCATION_SUGGESTIONS[0]) => {
    setLocationQuery(loc.display);
    setMeta({ locationText: loc.display, lat: loc.lat, lng: loc.lng });
    setShowLocSuggestions(false);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        setLocationQuery(`${lat}, ${lng}`);
        setMeta({ locationText: `${lat}, ${lng}`, lat, lng });
        setGpsLoading(false);
      },
      () => { alert("Could not get location."); setGpsLoading(false); }
    );
  };

  // Module brand → models
  const modelsForBrand = meta.moduleBrand ? (MODULE_CATALOG[meta.moduleBrand] ?? []) : [];
  const modelNames = modelsForBrand.map(m => m.model);

  const handleModuleBrandChange = (brand: string) => {
    setMeta({ moduleBrand: brand, moduleModel: "", modulePowerW: 0, tempCoeffPmax: -0.35, noct: 44, moduleTechnology: "mono-PERC" });
  };

  const handleModuleModelChange = (model: string) => {
    const spec = modelsForBrand.find(m => m.model === model);
    if (spec) {
      setMeta({
        moduleModel: spec.model,
        modulePowerW: spec.powerW,
        tempCoeffPmax: spec.tempCoeff,
        noct: spec.noct,
        moduleTechnology: spec.technology,
      });
    } else {
      setMeta({ moduleModel: model });
    }
  };

  // Inverter brand → models
  const inverterModels = meta.inverterBrand ? (INVERTER_CATALOG[meta.inverterBrand] ?? []) : [];
  const handleInverterBrandChange = (brand: string) => setMeta({ inverterBrand: brand, inverterModel: "" });

  // Capacity validation (Section 1)
  const plantCapacityKwp = meta.capacityMw * 1000;
  let capacityWarning: string | undefined;
  if (meta.capacityMw > 0 && meta.modulesCount > 0 && meta.modulePowerW > 0) {
    const expectedModules = (meta.capacityMw * 1_000_000) / meta.modulePowerW;
    const diff = Math.abs(meta.modulesCount - expectedModules);
    if (diff > expectedModules * 0.10) {
      capacityWarning = `Module count (${meta.modulesCount.toLocaleString()}) does not match expected count for ${meta.capacityMw} MW at ${meta.modulePowerW} Wp per module (expected ~${Math.round(expectedModules).toLocaleString()} modules). Verify your entries — wrong values produce wrong financial figures.`;
    }
  }

  // GeoJSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMeta({
          geojson: null,
          layoutPdfBase64: ev.target?.result as string,
          layoutRefBase64: null,
          layoutFileName: file.name,
          layoutType: "pdf",
        });
        alert("PDF Layout Reference loaded.");
      };
      reader.readAsDataURL(file);
    } else if (file.name.toLowerCase().endsWith(".dwg")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMeta({
          geojson: null,
          layoutPdfBase64: null,
          layoutRefBase64: ev.target?.result as string,
          layoutFileName: file.name,
          layoutType: "dwg",
        });
        alert("AutoCAD DWG Reference loaded. Note: Automatic GPS mapping is disabled for binary DWG files.");
      };
      reader.readAsDataURL(file);
    } else if (file.name.toLowerCase().endsWith(".zip") || file.name.toLowerCase().endsWith(".shp")) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          // shpjs can parse arraybuffer from ZIP containing shp/dbf/shx
          const shp = (await import("shpjs")).default;
          const geojson = await shp(ev.target?.result as ArrayBuffer);
          setMeta({
            geojson,
            layoutPdfBase64: null,
            layoutRefBase64: null,
            layoutFileName: file.name,
            layoutType: "shapefile",
          });
          alert("Shapefile successfully converted to GeoJSON. Automatic mapping active.");
        } catch (err) {
          console.error(err);
          alert("Failed to parse Shapefile. Ensure it is a valid .zip containing .shp, .dbf, and .shx.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          setMeta({
            geojson: JSON.parse(ev.target?.result as string),
            layoutPdfBase64: null,
            layoutRefBase64: null,
            layoutFileName: file.name,
            layoutType: "geojson",
          });
          alert("GeoJSON layout loaded.");
        } catch { alert("Invalid GeoJSON file."); }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-2xl p-8 max-w-4xl mx-auto w-full overflow-y-auto max-h-[calc(100vh-130px)]">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="text-xl font-medium text-zinc-100">Plant Configuration Setup</h2>
          <p className="text-xs text-zinc-500 border-b border-zinc-800 pb-4 mt-1">
            All module and inverter fields auto-fill from the product catalog. Ensure accuracy — values flow directly into financial calculations.
          </p>
        </div>
        <button
          onClick={() => generateSiteSpecPDF(meta)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20"
          title="Export Site Datasheet as PDF"
        >
          <Download className="w-4 h-4" /> Download Site Specs (PDF)
        </button>
      </div>

      {/* ── Plant Information ─────────────────────────── */}
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Plant Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <Label>Plant Name</Label>
          <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.name} onChange={e => setMeta({ name: e.target.value })} placeholder="e.g. Solar Farm Alpha" />
        </div>

        <div>
          <Label tooltip="IEC 62446-3 §5.1 requires GPS coordinates for irradiance normalization.">
            Location &amp; GPS
          </Label>
          <div className="relative">
            <input
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 pr-20"
              value={locationQuery}
              onChange={e => { setLocationQuery(e.target.value); setMeta({ locationText: e.target.value }); setShowLocSuggestions(true); }}
              onFocus={() => setShowLocSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocSuggestions(false), 150)}
              placeholder="Type city or region..."
            />
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={gpsLoading}
              className="absolute right-2 top-1.5 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 disabled:opacity-50"
            >
              <MapPin className="w-3 h-3" /> {gpsLoading ? "..." : "GPS"}
            </button>
            {showLocSuggestions && filteredLocs.length > 0 && (
              <ul className="absolute z-40 w-full bg-zinc-900 border border-zinc-700 rounded-lg mt-1 overflow-auto max-h-52 shadow-xl">
                {filteredLocs.map(loc => (
                  <li key={loc.display} className="px-3 py-2 text-sm text-zinc-200 hover:bg-emerald-600/20 cursor-pointer flex justify-between"
                    onMouseDown={() => handleLocSelect(loc)}>
                    <span>{loc.display}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {meta.lat && (
            <p className="text-[10px] text-emerald-400 mt-1 font-mono">
              Lat: {meta.lat.toFixed(5)} Lon: {meta.lng?.toFixed(5)}
            </p>
          )}
        </div>

        <div>
          <Label tooltip="Denominator for DC loss % calculation across the whole plant.">
            Capacity (MW DC)
          </Label>
          <input type="number" min={0.001} max={2000} step={0.001}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.capacityMw || ""} onChange={e => setMeta({ capacityMw: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 10.000" />
          {plantCapacityKwp > 0 && (
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">{plantCapacityKwp.toLocaleString()} kWp</p>
          )}
        </div>

        <div>
          <Label>Module count</Label>
          <input type="number" min={1} max={10000000} step={1}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.modulesCount || ""} onChange={e => setMeta({ modulesCount: parseInt(e.target.value, 10) || 0 })}
            placeholder="e.g. 28000" />
          {capacityWarning && <Warning text={capacityWarning} />}
        </div>
      </div>

      {/* ── Module Specs ─────────────────────────────── */}
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Module Specifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <Label tooltip="Required to calculate temperature-corrected power loss. Wrong model = wrong financial impact in report.">
            Module Brand
          </Label>
          <Combobox value={meta.moduleBrand} onChange={handleModuleBrandChange} options={MODULE_BRANDS} placeholder="Search manufacturer..." />
        </div>

        <div>
          <Label tooltip="Required to calculate temperature-corrected power loss. Wrong model = wrong financial impact in report.">
            Module Model (auto-fills specs)
          </Label>
          <Combobox value={meta.moduleModel} onChange={handleModuleModelChange} options={modelNames}
            placeholder={meta.moduleBrand ? "Select model..." : "Select brand first"} disabled={!meta.moduleBrand} />
        </div>

        <div>
          <Label>Module Power (Wp) — STC</Label>
          <input type="number" min={50} max={800} step={1}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.modulePowerW || ""} onChange={e => setMeta({ modulePowerW: parseInt(e.target.value, 10) || 0 })}
            placeholder="e.g. 540" />
        </div>

        <div>
          <Label>Modules Per String</Label>
          <input type="number" min={2} max={30} step={1}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.modulesPerString || ""} onChange={e => setMeta({ modulesPerString: parseInt(e.target.value, 10) || 0 })}
            placeholder="e.g. 22" />
        </div>

        <div>
          <Label>Module Technology</Label>
          <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.moduleTechnology} onChange={e => setMeta({ moduleTechnology: e.target.value })}>
            {MODULE_TECH_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label tooltip="Used in IEC 60891 correction. Typically -0.30 to -0.45 %/°C. Check module datasheet.">
              Module Temp Coefficient (%/°C)
            </Label>
            <input type="number" min={-1.0} max={-0.1} step={0.01}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.tempCoeffPmax} onChange={e => setMeta({ tempCoeffPmax: parseFloat(e.target.value) || -0.35 })}
              placeholder="-0.35" />
          </div>
          <div>
            <Label>NOCT (°C)</Label>
            <input type="number" min={30} max={60} step={0.5}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              value={meta.noct} onChange={e => setMeta({ noct: parseFloat(e.target.value) || 44 })}
              placeholder="44" />
          </div>
        </div>
      </div>

      {/* ── Inverter Specs ───────────────────────────── */}
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Inverter Specifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <Label tooltip="Identifies expected performance baseline for anomaly benchmarking and string configuration.">
            Inverter Brand
          </Label>
          <Combobox value={meta.inverterBrand} onChange={handleInverterBrandChange} options={INVERTER_BRANDS} placeholder="Search brand..." />
        </div>
        <div>
          <Label tooltip="Identifies expected performance baseline for anomaly benchmarking and string configuration.">
            Inverter Model
          </Label>
          <Combobox value={meta.inverterModel} onChange={v => setMeta({ inverterModel: v })} options={inverterModels}
            placeholder={meta.inverterBrand ? "Select model..." : "Select brand first"} disabled={!meta.inverterBrand} />
        </div>
        <div>
          <Label>Inverter Power (kW)</Label>
          <input type="number" min={1} max={10000} step={0.1}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.inverterPowerKw || ""} onChange={e => setMeta({ inverterPowerKw: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 110" />
        </div>
        <div>
          <Label>Mount Type</Label>
          <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            value={meta.mountType} onChange={e => setMeta({ mountType: e.target.value })}>
            <option value="ground">Ground Mount</option>
            <option value="roof">Roof Mount</option>
            <option value="tracker">Single-Axis Tracker</option>
            <option value="dual-tracker">Dual-Axis Tracker</option>
            <option value="floating">Floating</option>
          </select>
        </div>
      </div>

      {/* ── Plant Layout Upload ───────────────────────── */}
      <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/20">
        <h3 className="text-sm font-medium text-zinc-200 mb-1">Plant Layout</h3>
        <div className="mb-6">
          <p className="text-xs text-zinc-500">
            Supported: <span className="text-zinc-300 font-mono">.geojson, .dwg, .shp, .zip (Shapefile), .pdf</span>
          </p>
          <p className="text-[11px] text-zinc-600 mt-1">
            Required for automatic GPS-to-panel location code assignment (IEC 62446-3 §6.2).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <input type="file" accept=".geojson,application/json,application/pdf,.pdf,.dwg,.zip,.shp" ref={geojsonRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={() => geojsonRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg transition-all text-white border border-zinc-700 hover:border-zinc-500 shadow-lg">
            <Upload className="w-4 h-4" /> {meta.layoutFileName ? "Change Layout File" : "Upload Layout File"}
          </button>
          
          {!meta.layoutFileName && (
            <span className="text-xs text-zinc-600 italic">No layout file selected</span>
          )}

          {(meta.geojson && (meta.layoutType === 'geojson' || meta.layoutType === 'shapefile')) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">
                {meta.layoutType === 'shapefile' ? "Shapefile (Parsed)" : "GeoJSON (Active)"} — Auto-mapping enabled
              </span>
            </div>
          )}

          {meta.layoutType === 'pdf' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-medium">
              <FileText className="w-4 h-4" /> PDF Reference: {meta.layoutFileName}
              <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 text-[9px] rounded uppercase">Manual Mode</span>
            </div>
          )}

          {meta.layoutType === 'dwg' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium">
              <FileText className="w-4 h-4" /> DWG Drawing: {meta.layoutFileName}
              <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 text-[9px] rounded uppercase">Manual Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────── */}
      <div className="flex justify-end mt-8">
        <button 
          onClick={() => setInspectionMeta({ activeTab: 'inspection' })}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg transition-all"
        >
          Next: Inspection Configuration <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

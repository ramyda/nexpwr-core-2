"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowRight, CheckCircle2, MapPin, Building2, Calendar, Wind, Thermometer, Cloud, Sun, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/BackButton";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { ContextBanner } from "@/components/shared/ContextBanner";

export default function NewInspectionPage() {
  const router = useRouter();
  const { activeClient, activeSite } = useActiveClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    operator: "",
    droneModel: "",
    thermalSensor: "",
    ambientTempC: "25",
    humidityPercent: "40",
    windSpeedMs: "2",
    cloudCover: "0",
    irradianceWm2: "800",
    moduleTempC: "45",
    emissivity: "0.85",
    deltaTThreshold: "3.0",
    annualPoa: "1800",
    ppaRate: "0.10"
  });

  const rgbImageFile = useAppStore((state) => state.rgbImageFile);
  const thermalImageFile = useAppStore((state) => state.thermalImageFile);
  const setRgbImageFile = useAppStore((state) => state.setRgbImageFile);
  const setThermalImageFile = useAppStore((state) => state.setThermalImageFile);
  const clearAnomalies = useAppStore((state) => state.clearAnomalies);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUploadRgb = (file: File) => setRgbImageFile(file);
  const handleUploadThermal = (file: File) => {
    setThermalImageFile(file);
    clearAnomalies();
  };

  const handleSubmit = async () => {
    if (!activeSite || !activeClient) {
      alert("Please select a Client and Site Workspace first.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        siteId: activeSite.id,
        clientId: activeClient.id,
        ambientTempC: parseFloat(formData.ambientTempC),
        humidityPercent: parseFloat(formData.humidityPercent),
        windSpeedMs: parseFloat(formData.windSpeedMs),
        cloudCover: parseFloat(formData.cloudCover),
        irradianceWm2: parseFloat(formData.irradianceWm2),
        moduleTempC: parseFloat(formData.moduleTempC),
        emissivity: parseFloat(formData.emissivity),
        deltaTThreshold: parseFloat(formData.deltaTThreshold),
        annualPoa: parseFloat(formData.annualPoa),
        ppaRate: parseFloat(formData.ppaRate),
        // In real app, we'd upload these files to S3/Local and save the paths
        thermalFilePath: thermalImageFile?.name,
        visualFilePath: rgbImageFile?.name,
      };

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/inspections/${data.id}`);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Failed to create inspection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <ContextBanner />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[800px] mx-auto">
          <BackButton />
          <div className="mb-10 mt-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Upload Inspection</h1>
            <p className="text-[15px] text-zinc-500 mt-2">Initialize a new aerial inspection namespace and link it to a site workspace.</p>
          </div>

          <div className="flex items-center gap-4 mb-10 border-b border-zinc-100 pb-4">
             <div className={`text-sm font-bold uppercase tracking-widest ${step === 1 ? 'text-zinc-900 border-b-2 border-zinc-900 pb-4 -mb-[18px]' : 'text-zinc-400'}`}>1. Assets</div>
             <div className="w-8"></div>
             <div className={`text-sm font-bold uppercase tracking-widest ${step === 2 ? 'text-zinc-900 border-b-2 border-zinc-900 pb-4 -mb-[18px]' : 'text-zinc-400'}`}>2. Metadata</div>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              {!activeSite && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <p><strong>Heads up:</strong> You haven't selected a Site Workspace. Go to the sidebar or Clients page to select a site so we can link this inspection.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Thermal Orthomosaic (GeoTIFF) *</h3>
                  <div className="h-[240px]">
                    <ImageUpload onImageSelected={handleUploadThermal} />
                  </div>
                  {thermalImageFile && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5"/> Optimized Asset: {thermalImageFile.name}</p>}
                </div>
                <div>
                   <h3 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-3">RGB Visual Orthomosaic (GeoTIFF)</h3>
                   <div className="h-[240px]">
                      <ImageUpload onImageSelected={handleUploadRgb} />
                   </div>
                   {rgbImageFile && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5"/> Optimized Asset: {rgbImageFile.name}</p>}
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  onClick={() => setStep(2)} 
                  disabled={!thermalImageFile || !activeSite}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 transition-all rounded-md px-8 py-3 text-[14px] font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 shadow-lg shadow-zinc-900/10"
                >
                  Configure Parameters <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
                  <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-emerald-600" /> IEC 62446-3 Environmental Context
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Inspection Date</label>
                      <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Operator Name</label>
                      <input type="text" name="operator" placeholder="e.g. John Doe" value={formData.operator} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Drone Platform</label>
                      <input type="text" name="droneModel" placeholder="e.g. DJI Matrice 300 RTK" value={formData.droneModel} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Thermal Sensor</label>
                      <input type="text" name="thermalSensor" placeholder="e.g. Zenmuse H20T" value={formData.thermalSensor} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Thermometer className="w-3 h-3" /> Ambient Temp (°C)</label>
                      <input type="number" name="ambientTempC" step="0.1" value={formData.ambientTempC} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Sun className="w-3 h-3" /> Irradiance (W/m²)</label>
                      <input type="number" name="irradianceWm2" value={formData.irradianceWm2} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Wind className="w-3 h-3" /> Wind Speed (m/s)</label>
                      <input type="number" name="windSpeedMs" step="0.1" value={formData.windSpeedMs} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Emissivity</label>
                      <input type="number" name="emissivity" step="0.01" value={formData.emissivity} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">ΔT Threshold (°C)</label>
                      <input type="number" name="deltaTThreshold" step="0.1" value={formData.deltaTThreshold} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest"><Cloud className="w-3 h-3 inline mr-1" /> Cloud Cover (%)</label>
                      <input type="number" name="cloudCover" value={formData.cloudCover} onChange={handleChange} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  </div>
               </div>

               <div className="bg-emerald-950 border border-emerald-900 rounded-xl p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-900/50 rounded-lg">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-widest text-emerald-400">Ready for Processing</p>
                      <p className="text-sm font-medium opacity-80">Workspace: {activeClient?.company} / {activeSite?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Back</button>
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-30 px-8 py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                    >
                      {loading ? "Initializing..." : "Publish & Open Annotator"}
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

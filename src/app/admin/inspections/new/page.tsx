"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewInspectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const rgbImageFile = useAppStore((state) => state.rgbImageFile);
  const thermalImageFile = useAppStore((state) => state.thermalImageFile);
  const setRgbImageFile = useAppStore((state) => state.setRgbImageFile);
  const setThermalImageFile = useAppStore((state) => state.setThermalImageFile);
  const clearAnomalies = useAppStore((state) => state.clearAnomalies);

  const handleUploadRgb = (file: File) => setRgbImageFile(file);
  const handleUploadThermal = (file: File) => {
    setThermalImageFile(file);
    clearAnomalies();
  };

  const handleNext = () => setStep(2);

  const handleSubmit = async () => {
    setLoading(true);
    // Real implementation will POST to /api/inspections
    // For now, simulate API lag
    setTimeout(() => {
      setLoading(false);
      // Generate dummy id to load annotator
      router.push(`/admin/inspections/insp-123/annotate`);
    }, 1500);
  };

  return (
    <div className="max-w-[800px] mx-auto py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[#111]">Upload Inspection</h1>
        <p className="text-[15px] text-[#888] mt-2">Initialize a new aerial inspection namespace.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 mb-10">
         <div className={`text-sm font-medium ${step === 1 ? 'text-[#111]' : 'text-[#888]'}`}>1. Upload Data</div>
         <div className="h-px bg-[#eaeaea] w-8"></div>
         <div className={`text-sm font-medium ${step === 2 ? 'text-[#111]' : 'text-[#888]'}`}>2. Verify & Process</div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h3 className="text-sm font-medium text-[#111] mb-3">Thermal Orthomosaic (GeoTIFF) *</h3>
            <div className="h-[200px]">
              <ImageUpload onImageSelected={handleUploadThermal} />
            </div>
            {thermalImageFile && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Loaded: {thermalImageFile.name}</p>}
          </div>
          <div>
             <h3 className="text-sm font-medium text-[#111] mb-3">RGB Visual Orthomosaic (GeoTIFF)</h3>
             <div className="h-[200px]">
                <ImageUpload onImageSelected={handleUploadRgb} />
             </div>
             {rgbImageFile && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Loaded: {rgbImageFile.name}</p>}
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              onClick={handleNext} 
              disabled={!thermalImageFile}
              className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-6 py-2.5 text-[14px] font-medium flex items-center gap-2 disabled:opacity-50"
            >
              Continue to verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="bg-zinc-50 border border-[#eaeaea] rounded-lg p-6">
              <h3 className="font-medium text-[#111] mb-1">Inspection Context</h3>
              <p className="text-sm text-[#666] mb-4">You are about to launch the annotation workspace for these assets.</p>
              
              <ul className="space-y-2 text-sm text-[#444] mb-6">
                <li className="flex justify-between border-b border-[#eaeaea] pb-1"><span>Thermal Asset</span> <span className="font-mono text-[#111]">{thermalImageFile?.name}</span></li>
                <li className="flex justify-between border-b border-[#eaeaea] pb-1"><span>Target Site</span> <span className="font-medium text-[#111]">Alpha Solar Array (Nevada)</span></li>
              </ul>
           </div>
           
           <div className="flex justify-between pt-4">
             <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[#666] hover:text-[#111]">Back</button>
             <button 
               onClick={handleSubmit} 
               disabled={loading}
               className="bg-[#16A34A] text-white hover:bg-[#15803d] transition-colors rounded-md px-8 py-2.5 text-[14px] font-medium shadow-sm flex items-center gap-2 shadow-[#16A34A]/20"
             >
               {loading ? "Initializing..." : "Open Annotation Workspace"}
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

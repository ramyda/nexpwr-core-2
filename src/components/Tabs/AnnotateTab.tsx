"use client";

import React from "react";
import { CanvasViewer } from "@/components/CanvasViewer";
import { AnomalyTable } from "@/components/AnomalyTable";
import { SummaryStats } from "@/components/SummaryStats";
import { useAppStore } from "@/lib/store";
import { Trash2, ArrowRight } from "lucide-react";
import { calcAnomaly } from "@/lib/utils";
import { MiniMap } from "@/components/MiniMap";

export function AnnotateTab() {
  const thermalImageFile = useAppStore((state) => state.thermalImageFile);
  const clearAnomalies = useAppStore((state) => state.clearAnomalies);
  const anomalies = useAppStore((state) => state.anomalies);
  const plantMeta = useAppStore((state) => state.plantMetadata);
  const inspMeta = useAppStore((state) => state.inspectionMetadata);
  const setInspectionMeta = useAppStore((state) => state.setInspectionMetadata);

  if (!thermalImageFile) {
     return <div className="flex items-center justify-center p-12 text-center text-zinc-500 bg-zinc-950/50 border border-zinc-900 rounded-2xl h-[500px]">Please complete the Inspection setup and upload a thermal map first.</div>;
  }

  const plantCapacityKwp = (plantMeta.capacityMw || 0) * 1000;

  return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full w-full">
        <div className="lg:col-span-7 flex flex-col gap-4 h-[calc(100vh-180px)]">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-medium text-zinc-200">Orthomosaic Viewer</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                   if (confirm("Clear all anomalies?")) clearAnomalies();
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 rounded flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear Anomalies
              </button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[500px] flex flex-col gap-3">
            {/* IEC Live Summary Bar (Section 2) */}
            <div className="flex flex-wrap gap-4 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-mono uppercase tracking-tight text-zinc-400">
               <div className="flex gap-1.5"><span className="text-zinc-600">Anomalies:</span> <span className="text-zinc-200">{anomalies.length}</span></div>
               <div className="flex gap-1.5"><span className="text-zinc-600">Modules:</span> <span className="text-zinc-200">{anomalies.reduce((s, a) => s + (a.modulesAffected || 1), 0)}</span></div>
               <div className="flex gap-1.5"><span className="text-zinc-600">DC Loss Instant:</span> <span className="text-emerald-400 font-bold">{
                 anomalies.reduce((s, a) => s + calcAnomaly({
                   anomalyType: a.type, modulesAffected: a.modulesAffected || 1, modulePowerWp: plantMeta.modulePowerW,
                   irradianceWm2: inspMeta.irradianceWm2, tempCoeffPmax: plantMeta.tempCoeffPmax, moduleTempC: inspMeta.moduleTempC,
                   annualPoaIrradiance: inspMeta.annualPoaIrradiance, performanceRatio: inspMeta.performanceRatio, ppaRate: inspMeta.ppaRate,
                   plantCapacityKwp: plantCapacityKwp
                 }).dcLossInstantKw, 0).toFixed(2)
               } kW</span></div>
               <div className="flex gap-1.5"><span className="text-zinc-600">DC Loss Annual:</span> <span className="text-blue-400 font-bold">{
                 Math.round(anomalies.reduce((s, a) => s + calcAnomaly({
                   anomalyType: a.type, modulesAffected: a.modulesAffected || 1, modulePowerWp: plantMeta.modulePowerW,
                   irradianceWm2: inspMeta.irradianceWm2, tempCoeffPmax: plantMeta.tempCoeffPmax, moduleTempC: inspMeta.moduleTempC,
                   annualPoaIrradiance: inspMeta.annualPoaIrradiance, performanceRatio: inspMeta.performanceRatio, ppaRate: inspMeta.ppaRate,
                   plantCapacityKwp: plantCapacityKwp
                 }).annualKwhLoss, 0)).toLocaleString()
               } kWh</span></div>
               <div className="flex gap-1.5"><span className="text-zinc-600">Annual:</span> <span className="text-amber-400 font-bold">${
                 anomalies.reduce((s, a) => s + calcAnomaly({
                   anomalyType: a.type, modulesAffected: a.modulesAffected || 1, modulePowerWp: plantMeta.modulePowerW,
                   irradianceWm2: inspMeta.irradianceWm2, tempCoeffPmax: plantMeta.tempCoeffPmax, moduleTempC: inspMeta.moduleTempC,
                   annualPoaIrradiance: inspMeta.annualPoaIrradiance, performanceRatio: inspMeta.performanceRatio, ppaRate: inspMeta.ppaRate,
                   plantCapacityKwp: plantCapacityKwp
                 }).annualDollarLoss, 0).toFixed(2)
               }</span></div>
            </div>
            <CanvasViewer imageFile={thermalImageFile} />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col h-[calc(100vh-180px)] bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-lg font-medium text-zinc-200 mb-1">Inspection Findings</h2>
              <p className="text-sm text-zinc-500">Review anomalies detected in the orthomosaic.</p>
            </div>
          </div>
          <SummaryStats />
          <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-6 mt-6">
            <AnomalyTable />
          </div>
          <MiniMap />

          {/* ── Navigation ──────────────────────────────── */}
          <div className="flex justify-end mt-4 shrink-0">
            <button 
              onClick={() => setInspectionMeta({ activeTab: 'report' })}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg transition-all w-full justify-center"
            >
              Next: Generate Final Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
  );
}

"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { SEVERITY_COLORS, IEC_SEVERITY_CLASSES } from "@/lib/constants";
import { Trash2, TrendingDown, DollarSign, Calculator } from "lucide-react";
import { cn, formatDate, calcAnomaly } from "@/lib/utils";

export function AnomalyTable() {
  const anomalies = useAppStore((state) => state.anomalies);
  const plantMeta = useAppStore((state) => state.plantMetadata);
  const inspMeta  = useAppStore((state) => state.inspectionMetadata);
  const deleteAnomaly = useAppStore((state) => state.deleteAnomaly);

  const plantCapacityKwp = (plantMeta.capacityMw || 0) * 1000;

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-zinc-800 rounded-xl bg-zinc-900/30 text-zinc-500">
        <div className="text-xl mb-2">No anomalies marked</div>
        <p className="text-sm">Draw boxes on the image to add anomalies to this list.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-zinc-800 rounded-xl bg-zinc-900 shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-800/50 text-[10px] uppercase font-semibold text-zinc-400">
            <tr>
              <th className="px-4 py-3">Anomaly Details</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">ΔT & Severity</th>
              <th className="px-4 py-3">Impact (Estimated)</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {anomalies.map((a) => {
              const r = calcAnomaly({
                anomalyType: a.type,
                modulesAffected: a.modulesAffected || 1,
                modulePowerWp: plantMeta.modulePowerW,
                irradianceWm2: inspMeta.irradianceWm2,
                tempCoeffPmax: plantMeta.tempCoeffPmax,
                moduleTempC: inspMeta.moduleTempC,
                annualPoaIrradiance: inspMeta.annualPoaIrradiance,
                performanceRatio: inspMeta.performanceRatio,
                ppaRate: inspMeta.ppaRate,
                plantCapacityKwp,
              });
              const svInfo = IEC_SEVERITY_CLASSES[a.severity] || IEC_SEVERITY_CLASSES.unclassified;

              return (
                <tr key={a.id} id={`anomaly-row-${a.id}`} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="flex gap-3">
                      <div className="w-16 h-12 rounded border border-zinc-700 overflow-hidden bg-black shrink-0">
                        <img src={a.thumbnail} alt="Anomaly thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="font-medium text-white line-clamp-1">{a.type}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{a.modulesAffected} modules affected</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-400 font-mono text-[11px]">
                    {a.panelLocation || <span className="italic text-zinc-600">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className={cn(
                      "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-1",
                      SEVERITY_COLORS[a.severity]
                    )}>
                      {svInfo.label}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-zinc-500" />
                      ΔT: <span className={a.tempDeltaC != null ? "text-white" : "text-red-400"}>
                        {a.tempDeltaC != null ? `${a.tempDeltaC.toFixed(1)}°C` : "Missing"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <TrendingDown className="w-3 h-3 text-amber-500" />
                        <span className="text-zinc-200">{Math.round(r.annualKwhLoss).toLocaleString()} kWh/yr</span>
                        <span className="text-[10px] text-zinc-500">({r.dcLossPct.toFixed(3)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-400 font-semibold">${r.annualDollarLoss.toFixed(2)}</span>
                        <span className="text-[10px] text-zinc-500">annual loss</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => deleteAnomaly(a.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Anomaly"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-zinc-800/30 px-4 py-3 text-[10px] text-zinc-500 italic border-t border-zinc-800">
        Estimated engineering loss figures — not IEC-certified. Power loss values trace to STC ratings per IEC 60891 (simplified).
      </div>
    </div>
  );
}

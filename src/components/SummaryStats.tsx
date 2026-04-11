"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { calcAnomaly } from "@/lib/utils";

export function SummaryStats() {
  const anomalies = useAppStore((state) => state.anomalies);
  const plantMeta = useAppStore((state) => state.plantMetadata);
  const inspMeta  = useAppStore((state) => state.inspectionMetadata);

  const stats = useMemo(() => {
    const total = anomalies.length;
    let modules = 0;
    let dcInstant = 0;
    let dcStc = 0;
    let annualKwh = 0;
    let annualDollar = 0;

    anomalies.forEach(a => {
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
        plantCapacityKwp: plantMeta.capacityMw * 1000,
      });
      modules += (a.modulesAffected || 1);
      dcInstant += r.dcLossInstantKw;
      dcStc += r.dcLossStcKw;
      annualKwh += r.annualKwhLoss;
      annualDollar += r.annualDollarLoss;
    });

    return { total, modules, dcInstant, dcStc, annualKwh, annualDollar };
  }, [anomalies, plantMeta, inspMeta]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-center">
        <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Total Anomalies</div>
        <div className="text-2xl font-light text-white">{stats.total}</div>
        <div className="text-[10px] text-zinc-600 mt-1">{stats.modules} modules affected</div>
      </div>
      
      <div className="bg-zinc-900 border border-emerald-900/30 rounded-xl p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl"></div>
        <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Instant DC Loss</div>
        <div className="text-2xl font-light text-white">{stats.dcInstant.toFixed(2)} <span className="text-xs text-zinc-500">kW</span></div>
        <div className="text-[10px] text-zinc-600 mt-1">at current conditions</div>
      </div>

      <div className="bg-zinc-900 border border-blue-900/30 rounded-xl p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
        <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Annual Energy Loss</div>
        <div className="text-2xl font-light text-white">{Math.round(stats.annualKwh).toLocaleString()} <span className="text-xs text-zinc-500">kWh</span></div>
        <div className="text-[10px] text-zinc-600 mt-1">projected 1-year</div>
      </div>

      <div className="bg-zinc-900 border border-amber-900/30 rounded-xl p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-xl"></div>
        <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Annual Revenue Loss</div>
        <div className="text-2xl font-light text-emerald-400">${Math.round(stats.annualDollar).toLocaleString()}</div>
        <div className="text-[10px] text-zinc-600 mt-1">estimated financial</div>
      </div>
    </div>
  );
}

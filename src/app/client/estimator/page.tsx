"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingDown, DollarSign, Zap, Info } from "lucide-react";

type Anomaly = {
  id: string; type: string; iecClass: string; deltaTC: number;
  modulesAffected: number;
};

function Slider({ label, value, min, max, step, unit, onChange, info }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; info?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-[#444]">{label}</label>
          {info && (
            <span title={info} className="text-[#bbb] cursor-help">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <span className="text-sm font-semibold font-mono text-[#111]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
      />
      <div className="flex justify-between text-[10px] text-[#bbb]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, color = "text-[#111]" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="border border-[#eaeaea] bg-white rounded-lg p-5">
      <p className="text-xs text-[#888] font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#888] mt-1">{sub}</p>}
    </div>
  );
}

export default function EnergyEstimatorPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [ppaRate, setPpaRate] = useState(0.07);
  const [annualPoa, setAnnualPoa] = useState(1600);
  const [pr, setPr] = useState(0.80);
  const [modulePowerW, setModulePowerW] = useState(400);
  const [years, setYears] = useState(10);

  useEffect(() => {
    fetch("/api/anomalies")
      .then((r) => r.json())
      .then((d) => setAnomalies(Array.isArray(d) ? d : []));
  }, []);

  const calcAnomaly = (a: Anomaly) => {
    const derateFraction = Math.min(a.deltaTC * 0.004, 0.95); // 0.4%/°C typical
    const dcLossKw = (a.modulesAffected * modulePowerW * derateFraction) / 1000;
    const annKwh = dcLossKw * annualPoa * pr;
    const annDollar = annKwh * ppaRate;
    return { dcLossKw, annKwh, annDollar };
  };

  const total = anomalies.reduce(
    (acc, a) => {
      const { dcLossKw, annKwh, annDollar } = calcAnomaly(a);
      return { dc: acc.dc + dcLossKw, kwh: acc.kwh + annKwh, usd: acc.usd + annDollar };
    },
    { dc: 0, kwh: 0, usd: 0 }
  );

  const c4Only = anomalies.filter((a) => a.iecClass === "C4").reduce(
    (acc, a) => {
      const { annKwh, annDollar } = calcAnomaly(a);
      return { kwh: acc.kwh + annKwh, usd: acc.usd + annDollar };
    },
    { kwh: 0, usd: 0 }
  );

  const fmt = (n: number, d = 0) => n.toFixed(d);
  const currency = (n: number) => `$${(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Energy Loss Estimator</h1>
        <p className="text-[14px] text-[#888] mt-1">
          Adjust parameters below to estimate financial and energy impact from {anomalies.length} detected anomalies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Controls */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6 space-y-6 h-fit">
          <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#888]" /> Parameters
          </h3>
          <Slider label="PPA Rate" value={ppaRate} min={0.03} max={0.20} step={0.001} unit=" $/kWh" onChange={setPpaRate}
            info="Power Purchase Agreement price per kWh" />
          <Slider label="Annual POA Irradiance" value={annualPoa} min={800} max={2400} step={50} unit=" kWh/m²" onChange={setAnnualPoa}
            info="Plane-of-array irradiance annually at site" />
          <Slider label="Performance Ratio" value={pr} min={0.60} max={0.95} step={0.01} unit="" onChange={setPr}
            info="System performance ratio (typically 0.75–0.85)" />
          <Slider label="Module Power" value={modulePowerW} min={250} max={700} step={5} unit=" Wp" onChange={setModulePowerW} />
          <Slider label="Projection Horizon" value={years} min={1} max={25} step={1} unit=" yr" onChange={setYears} />
        </div>

        {/* Results */}
        <div className="space-y-5">
          {/* Summary KPI cards */}
          <div className="grid grid-cols-2 gap-4">
            <ResultCard label="Instantaneous DC Loss" value={`${fmt(total.dc, 2)} kW`}
              sub="Across all active anomalies" color="text-red-600" />
            <ResultCard label="Annual kWh Loss" value={`${Math.round(total.kwh).toLocaleString()} kWh`}
              sub="Generation loss per year" color="text-orange-600" />
            <ResultCard label="Annual Financial Loss" value={currency(total.usd)}
              sub="At current PPA rate" color="text-amber-600" />
            <ResultCard label={`${years}-Year Projection`} value={currency(total.usd * years)}
              sub="Assuming no degradation curve" color="text-[#111]" />
          </div>

          {/* Comparison cards */}
          <div className="border border-[#eaeaea] bg-white rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#111] mb-4">Repair Impact Scenarios</h3>
            <div className="space-y-3">
              {[
                {
                  label: "If C4 Critical Anomalies Repaired",
                  kwh: c4Only.kwh, usd: c4Only.usd,
                  count: anomalies.filter(a => a.iecClass === "C4").length,
                  color: "text-emerald-600", bar: "bg-red-500",
                },
                {
                  label: "If All Anomalies Repaired",
                  kwh: total.kwh, usd: total.usd,
                  count: anomalies.length,
                  color: "text-emerald-700", bar: "bg-emerald-500",
                },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-zinc-50 rounded-lg border border-[#eaeaea]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#111]">{s.label}</span>
                    <span className="text-xs text-[#888]">{s.count} anomalies</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-1.5 mb-3">
                    <div className={`h-1.5 rounded-full ${s.bar}`}
                      style={{ width: `${Math.min((s.kwh / Math.max(total.kwh, 1)) * 100, 100)}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-[#888]">Recovered kWh</p>
                      <p className={`text-base font-bold font-mono ${s.color}`}>{Math.round(s.kwh).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">Annual Recovery</p>
                      <p className={`text-base font-bold font-mono ${s.color}`}>{currency(s.usd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888]">{years}-Year Recovery</p>
                      <p className={`text-base font-bold font-mono ${s.color}`}>{currency(s.usd * years)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-anomaly breakdown */}
          {anomalies.length > 0 && (
            <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#eaeaea]">
                <h3 className="text-sm font-semibold text-[#111]">Per-Anomaly Breakdown</h3>
              </div>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-[#eaeaea] bg-zinc-50/50 sticky top-0">
                      <th className="px-5 py-3 font-medium text-[#444]">Type</th>
                      <th className="px-5 py-3 font-medium text-[#444]">IEC</th>
                      <th className="px-5 py-3 font-medium text-[#444]">ΔT</th>
                      <th className="px-5 py-3 font-medium text-[#444]">DC Loss</th>
                      <th className="px-5 py-3 font-medium text-[#444]">kWh/yr</th>
                      <th className="px-5 py-3 font-medium text-[#444]">$/yr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeaea]">
                    {anomalies
                      .slice()
                      .sort((a, b) => b.deltaTC - a.deltaTC)
                      .map((a) => {
                        const { dcLossKw, annKwh, annDollar } = calcAnomaly(a);
                        return (
                          <tr key={a.id} className="hover:bg-zinc-50">
                            <td className="px-5 py-3 font-medium text-[#111]">{a.type}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${
                                a.iecClass === "C4" ? "bg-red-50 text-red-600 border-red-200" :
                                a.iecClass === "C3" ? "bg-orange-50 text-orange-600 border-orange-200" :
                                a.iecClass === "C2" ? "bg-blue-50 text-blue-600 border-blue-200" :
                                "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}>{a.iecClass}</span>
                            </td>
                            <td className="px-5 py-3 font-mono text-[#444]">+{a.deltaTC.toFixed(1)}°C</td>
                            <td className="px-5 py-3 font-mono text-[#444]">{dcLossKw.toFixed(3)} kW</td>
                            <td className="px-5 py-3 font-mono text-[#444]">{Math.round(annKwh).toLocaleString()}</td>
                            <td className="px-5 py-3 font-mono text-orange-600 font-semibold">${annDollar.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

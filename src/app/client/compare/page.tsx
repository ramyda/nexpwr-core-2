"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

type Inspection = {
  id: string; date: string; operator: string | null; status: string;
  site: { name: string };
  annotations: {
    id: string; type: string; iecClass: string; deltaT: number;
    locationString: string | null; modulesAffected: number;
  }[];
};

const CLASS_COLORS: Record<string, string> = {
  C4: "bg-red-50 text-red-600 border-red-200",
  C3: "bg-orange-50 text-orange-600 border-orange-200",
  C2: "bg-blue-50 text-blue-600 border-blue-200",
  C1: "bg-emerald-50 text-emerald-600 border-emerald-200",
  UNC: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function AuditComparePage() {
  const [inspections, setInspections] = useState<{ id: string; date: string; site: { name: string } }[]>([]);
  const [inspA, setInspA] = useState<Inspection | null>(null);
  const [inspB, setInspB] = useState<Inspection | null>(null);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/inspections")
      .then(r => r.json())
      .then(d => setInspections(Array.isArray(d) ? d : []));
  }, []);

  const load = async (id: string, which: "A" | "B") => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/inspections/${id}`);
    const data = await res.json();
    which === "A" ? setInspA({ ...data, annotations: data.annotations || [] }) : setInspB({ ...data, annotations: data.annotations || [] });
    setLoading(false);
  };

  const totalLoss = (insp: Inspection | null) => {
    if (!insp) return 0;
    return (insp.annotations || []).reduce((s, a) => {
      const derateFraction = Math.min(a.deltaT * 0.004, 0.95);
      return s + (a.modulesAffected * 400 * derateFraction * 1600 * 0.80) / 1000;
    }, 0);
  };

  const lossA = totalLoss(inspA);
  const lossB = totalLoss(inspB);
  const deltaLoss = lossB - lossA;

  const getNew = () => {
    if (!inspA || !inspB) return [];
    const aTypes = new Set((inspA.annotations || []).map(a => a.type + a.locationString));
    return (inspB.annotations || []).filter(a => !aTypes.has(a.type + a.locationString));
  };
  
  const getResolved = () => {
    if (!inspA || !inspB) return [];
    const bTypes = new Set((inspB.annotations || []).map(a => a.type + a.locationString));
    return (inspA.annotations || []).filter(a => !bTypes.has(a.type + a.locationString));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Audit Comparison</h1>
        <p className="text-[14px] text-[#888] mt-1">Compare two inspections side-by-side to track changes in anomaly count and energy loss.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_48px_1fr] gap-4 items-center">
        <div>
          <label className="text-xs font-medium text-[#888] uppercase tracking-wide mb-1.5 block">Inspection A (Baseline)</label>
          <select
            className="w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]"
            value={idA}
            onChange={(e) => { setIdA(e.target.value); load(e.target.value, "A"); }}
          >
            <option value="">Select inspection...</option>
            {inspections.map(i => (
              <option key={i.id} value={i.id}>
                {i.site.name} — {new Date(i.date).toLocaleDateString("en-GB")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-center items-center mt-5">
          <div className="w-10 h-10 rounded-full bg-zinc-100 border border-[#eaeaea] flex items-center justify-center text-[#888]">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[#888] uppercase tracking-wide mb-1.5 block">Inspection B (Latest)</label>
          <select
            className="w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]"
            value={idB}
            onChange={(e) => { setIdB(e.target.value); load(e.target.value, "B"); }}
          >
            <option value="">Select inspection...</option>
            {inspections.map(i => (
              <option key={i.id} value={i.id}>
                {i.site.name} — {new Date(i.date).toLocaleDateString("en-GB")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-24 text-[#888] text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading inspection data...
        </div>
      )}

      {inspA && inspB && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "New Anomalies", value: getNew().length,
                icon: <TrendingUp className="w-4 h-4" />, color: "text-red-600",
                desc: "Found in B, not in A",
              },
              {
                label: "Resolved", value: getResolved().length,
                icon: <TrendingDown className="w-4 h-4" />, color: "text-emerald-600",
                desc: "In A, not in B",
              },
              {
                label: "Net Anomaly Change", value: `${(inspB.annotations.length - inspA.annotations.length) >= 0 ? "+" : ""}${inspB.annotations.length - inspA.annotations.length}`,
                icon: <Minus className="w-4 h-4" />, color: inspB.annotations.length > inspA.annotations.length ? "text-red-600" : "text-emerald-600",
                desc: "B vs A",
              },
              {
                label: "DC Loss Δ",
                value: `${deltaLoss >= 0 ? "+" : ""}${deltaLoss.toFixed(2)} kWh/yr`,
                icon: deltaLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
                color: deltaLoss >= 0 ? "text-red-600" : "text-emerald-600",
                desc: "Estimated annual change",
              },
            ].map(card => (
              <div key={card.label} className="border border-[#eaeaea] bg-white rounded-lg p-5">
                <div className="flex items-center gap-2 mb-1 text-[#888]">
                  {card.icon}
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
                <div className={`text-2xl font-bold font-mono ${card.color}`}>{card.value}</div>
                <div className="text-xs text-[#bbb] mt-1">{card.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([["A", inspA], ["B", inspB]] as const).map(([label, insp]) => (
              <div key={label} className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eaeaea] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#111] text-white text-xs font-bold flex items-center justify-center">{label}</span>
                      <h3 className="text-sm font-semibold text-[#111]">{insp.site.name}</h3>
                    </div>
                    <p className="text-xs text-[#888] mt-0.5 ml-8">{new Date(insp.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[#111]">{insp.annotations.length}</div>
                    <div className="text-xs text-[#888]">anomalies</div>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
                        <th className="px-4 py-2 font-medium text-[#444]">Type</th>
                        <th className="px-4 py-2 font-medium text-[#444]">IEC</th>
                        <th className="px-4 py-2 font-medium text-[#444]">ΔT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeaea]">
                      {insp.annotations.map(a => (
                        <tr key={a.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 font-medium text-[#111]">{a.type}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${CLASS_COLORS[a.iecClass] || CLASS_COLORS.UNC}`}>
                              {a.iecClass}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[#444]">+{a.deltaT.toFixed(1)}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {getNew().length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-3">⚠ New Anomalies in Inspection B ({getNew().length})</h3>
              <div className="flex flex-wrap gap-2">
                {getNew().map(a => (
                  <span key={a.id} className="bg-white border border-red-200 rounded-full px-3 py-1 text-xs font-medium text-red-700">
                    {a.type} · +{a.deltaT.toFixed(1)}°C
                  </span>
                ))}
              </div>
            </div>
          )}
          {getResolved().length > 0 && (
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-emerald-700 mb-3">✓ Resolved Anomalies ({getResolved().length})</h3>
              <div className="flex flex-wrap gap-2">
                {getResolved().map(a => (
                  <span key={a.id} className="bg-white border border-emerald-200 rounded-full px-3 py-1 text-xs font-medium text-emerald-700">
                    {a.type} · +{a.deltaT.toFixed(1)}°C
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {(!idA || !idB) && !loading && (
        <div className="border border-[#eaeaea] bg-white rounded-lg p-16 text-center">
          <ArrowLeftRight className="w-10 h-10 text-[#ccc] mx-auto mb-4" />
          <p className="text-[#888] font-medium">Select two inspections above to begin comparison</p>
          <p className="text-[#bbb] text-sm mt-1">You'll see a side-by-side breakdown of anomaly delta, resolved issues, and energy change.</p>
        </div>
      )}
    </div>
  );
}

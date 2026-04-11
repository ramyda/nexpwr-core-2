"use client";

import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { Target } from "lucide-react";

type Anomaly = {
  id: string; type: string; iecClass: string; deltaTC: number;
  modulesAffected: number; locationString: string | null; priority: string | null;
};

const CLASS_COLOR: Record<string, string> = {
  C4: "#DC2626", C3: "#EA580C", C2: "#2563EB", C1: "#16A34A", UNC: "#7C3AED",
};

const EFFORT_MAP: Record<string, number> = {
  C4: 0.5, C3: 1.5, C2: 2.5, C1: 3.5, UNC: 2,
};

const QUADRANT_TEXT = [
  { x: 10, y: 85, text: "🔴 DO FIRST", sub: "High impact, quick fix" },
  { x: 75, y: 85, text: "📅 SCHEDULE", sub: "High impact, plan carefully" },
  { x: 10, y: 15, text: "✅ MONITOR", sub: "Low impact, low effort" },
  { x: 75, y: 15, text: "⬇️ DEPRIORITIZE", sub: "Low impact, high effort" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-[#eaeaea] rounded-lg shadow-lg p-4 text-sm max-w-[220px]">
      <div className="font-semibold text-[#111] mb-1">{d.type}</div>
      <div style={{ color: CLASS_COLOR[d.iecClass] }} className="text-xs font-bold mb-2">{d.iecClass}</div>
      <div className="space-y-1 text-[#666] text-xs">
        <div>ΔT: <span className="font-mono font-medium text-[#111]">+{d.deltaTC.toFixed(1)}°C</span></div>
        <div>Modules: <span className="font-mono font-medium text-[#111]">{d.modulesAffected}</span></div>
        <div>Impact: <span className="font-mono font-medium text-[#111]">{d.impact.toFixed(0)} kWh/yr</span></div>
        {d.locationString && <div>Location: {d.locationString}</div>}
      </div>
    </div>
  );
};

export default function RepairPriorityPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/anomalies")
      .then(r => r.json())
      .then(d => { setAnomalies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const data = anomalies.map(a => ({
    ...a,
    effort: EFFORT_MAP[a.iecClass] + Math.random() * 0.8 - 0.4, // slight jitter per anomaly
    impact: (a.modulesAffected * 400 * a.deltaTC * 0.004 * 1600 * 0.80) / 1000,
  }));

  const midEffort = 2;
  const midImpact = data.length > 0 ? data.reduce((s, d) => s + d.impact, 0) / data.length : 500;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Repair Priority Matrix</h1>
        <p className="text-[14px] text-[#888] mt-1">
          Each dot represents an anomaly. Hover to see details. Focus on the top-left quadrant first.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* Chart */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-[#888]" />
            <h3 className="text-sm font-semibold text-[#111]">Impact vs. Repair Effort</h3>
          </div>
          {loading ? (
            <div className="h-[420px] flex items-center justify-center text-[#888] text-sm">Loading...</div>
          ) : data.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-[#888] text-sm">No anomaly data to display.</div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <XAxis
                  type="number" dataKey="effort" name="Repair Effort"
                  domain={[0, 5]} label={{ value: "Repair Effort (days) →", position: "bottom", offset: 20, fontSize: 12, fill: "#888" }}
                  tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                />
                <YAxis
                  type="number" dataKey="impact" name="Energy Impact"
                  label={{ value: "Annual kWh Loss ↑", angle: -90, position: "left", offset: 20, fontSize: 12, fill: "#888" }}
                  tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={midEffort} stroke="#eaeaea" strokeDasharray="4 4" />
                <ReferenceLine y={midImpact} stroke="#eaeaea" strokeDasharray="4 4" />
                {/* Quadrant labels */}
                {QUADRANT_TEXT.map((q) => (
                  <text key={q.text} x={`${q.x}%`} y={`${q.y}%`} textAnchor="middle" fontSize={10} fill="#ccc" fontWeight={600}>
                    {q.text}
                  </text>
                ))}
                <Scatter data={data} fillOpacity={0.85}>
                  {data.map((d) => (
                    <Cell
                      key={d.id}
                      fill={CLASS_COLOR[d.iecClass] || CLASS_COLOR.UNC}
                      stroke={highlighted === d.id ? "#111" : "white"}
                      strokeWidth={highlighted === d.id ? 2 : 1}
                      r={Math.max(6, Math.min(d.modulesAffected * 2, 16))}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
          <p className="text-[11px] text-[#bbb] mt-2 text-center">Dot size = modules affected · Color = IEC class · Dot position = effort estimate + annual loss</p>
        </div>

        {/* Legend + Table */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="border border-[#eaeaea] bg-white rounded-lg p-5">
            <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">IEC Class</h4>
            {Object.entries(CLASS_COLOR).filter(([c]) => c !== "UNC").map(([cls, color]) => (
              <div key={cls} className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs font-mono text-[#444]">{cls}</span>
              </div>
            ))}
          </div>

          {/* Quadrant guide */}
          <div className="border border-[#eaeaea] bg-white rounded-lg p-5">
            <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">Quadrant Guide</h4>
            {[
              { label: "Do First", desc: "High impact, low effort", color: "bg-red-100 text-red-700" },
              { label: "Schedule", desc: "High impact, high effort", color: "bg-orange-100 text-orange-700" },
              { label: "Monitor", desc: "Low impact, low effort", color: "bg-emerald-100 text-emerald-700" },
              { label: "Deprioritize", desc: "Low impact, high effort", color: "bg-zinc-100 text-zinc-500" },
            ].map((q) => (
              <div key={q.label} className="mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.color}`}>{q.label}</span>
                <p className="text-xs text-[#888] mt-1">{q.desc}</p>
              </div>
            ))}
          </div>

          {/* Top 5 priority */}
          <div className="border border-[#eaeaea] bg-white rounded-lg p-5">
            <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">Top Priority</h4>
            {data
              .filter(d => d.impact > midImpact && d.effort < midEffort)
              .slice(0, 5)
              .map((d, i) => (
                <div key={d.id} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[#bbb] w-4">#{i + 1}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CLASS_COLOR[d.iecClass] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#111] truncate">{d.type}</p>
                    <p className="text-[10px] text-[#888]">{d.impact.toFixed(0)} kWh/yr</p>
                  </div>
                </div>
              ))}
            {data.filter(d => d.impact > midImpact && d.effort < midEffort).length === 0 && (
              <p className="text-xs text-[#bbb]">No anomalies in this quadrant yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

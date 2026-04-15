"use client";

import React, { useEffect } from "react";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { Loader2, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const PIE_COLORS = ["#16A34A", "#2563EB", "#D97706", "#DC2626", "#7C3AED"];
const BAR_COLORS: Record<string, string> = { 
  "Class 4": "#DC2626", 
  "Class 3": "#F59E0B", 
  "Class 2": "#3B82F6", 
  "Class 1": "#16A34A",
  "C4": "#DC2626", "C3": "#F59E0B", "C2": "#3B82F6", "C1": "#16A34A" 
};

export default function ClientInsightsPage() {
  const { 
    anomalySummary, 
    anomalyBreakdown, 
    isLoading, 
    fetchAll 
  } = useDashboardStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (isLoading && !anomalySummary) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Aggregating Statistics...</span>
        </div>
      </div>
    );
  }

  // Map API response to Chart data
  const barData = (anomalySummary?.iec || []).map(i => ({
    class: i.label.split(" — ")[0], // "Class 4" -> "C4"
    count: i.count
  }));

  const pieData = (anomalyBreakdown || []).map(b => ({
    name: b.name,
    value: b.value
  }));
  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Performance Insights</h1>
          <p className="text-sm text-zinc-400">Holistic fleet analytics derived from multi-sensor data.</p>
        </div>
        <button className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">
          <Calendar className="w-4 h-4" /> Last 12 months
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Anomalies by IEC Class */}
        <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">IEC 62446-3 Severity</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-1">Class distribution by ΔT Thresholds</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData.length > 0 ? barData : [
              { class: "C4", count: 0 }, { class: "C3", count: 0 }, { class: "C2", count: 0 }, { class: "C1", count: 0 }
            ]} barCategoryGap="40%">
              <XAxis dataKey="class" tick={{ fontSize: 10, fill: "#71717a", fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", fontSize: 11, borderRadius: '8px' }} 
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }} 
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((e, i) => <Cell key={i} fill={BAR_COLORS[e.class] || '#3f3f46'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Type Breakdown */}
        <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Anomaly Type Breakdown</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-1">Fault distribution by category</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }]} 
                cx="50%" cy="50%" 
                innerRadius={65} outerRadius={95} 
                dataKey="value" paddingAngle={4}
                stroke="none"
              >
                {pieData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: '20px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", fontSize: 11, borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Loss summary */}
        <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm rounded-xl p-6 hover:border-zinc-700 transition-colors lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Fleet Recovery Potential</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-1">Annual projected financial loss by operational site</p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total: ${anomalySummary?.total.toLocaleString() ?? '0'}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={[{ name: "Current Inspection", loss: anomalySummary?.total ?? 0 }]} 
              layout="vertical"
              margin={{ left: 10, right: 30 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#71717a", fontWeight: 'bold' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                formatter={(v) => `$${Number(v).toLocaleString()}`} 
                contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", fontSize: 11, borderRadius: '8px' }}
                cursor={{ fill: "rgba(255,255,255,0.03)" }} 
              />
              <Bar dataKey="loss" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

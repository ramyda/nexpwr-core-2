"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Calendar } from "lucide-react";

const MOCK_BAR = [
  { class: "C4", count: 12 }, { class: "C3", count: 28 }, { class: "C2", count: 45 }, { class: "C1", count: 18 },
];
const MOCK_LINE = [
  { month: "Oct", loss: 12.4 }, { month: "Nov", loss: 15.1 }, { month: "Dec", loss: 11.0 },
  { month: "Jan", loss: 18.7 }, { month: "Feb", loss: 13.2 }, { month: "Mar", loss: 22.5 },
];
const MOCK_PIE = [
  { name: "Hot Spot", value: 24 }, { name: "Diode", value: 18 }, { name: "PID", value: 12 },
  { name: "String", value: 31 }, { name: "Cell", value: 15 },
];
const PIE_COLORS = ["#16A34A", "#2563EB", "#D97706", "#DC2626", "#7C3AED"];
const BAR_COLORS: Record<string, string> = { C4: "#DC2626", C3: "#F59E0B", C2: "#3B82F6", C1: "#16A34A" };

export default function ClientInsightsPage() {
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Performance Insights</h1>
          <p className="text-[14px] text-[#888] mt-1">Analytics across your solar portfolio</p>
        </div>
        <button className="flex items-center gap-2 border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#444] hover:bg-zinc-50">
          <Calendar className="w-4 h-4" /> Last 6 months
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomalies by IEC Class */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#111] mb-1">Anomalies by IEC Class</h3>
          <p className="text-xs text-[#888] mb-5">Distribution across severity categories</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_BAR} barCategoryGap="40%">
              <XAxis dataKey="class" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ border: "1px solid #eaeaea", fontSize: 12 }} cursor={{ fill: "#f4f4f5" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {MOCK_BAR.map((e) => <Cell key={e.class} fill={BAR_COLORS[e.class]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DC Loss over time */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#111] mb-1">DC Loss Over Time</h3>
          <p className="text-xs text-[#888] mb-5">Estimated monthly DC generation loss (kWh)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_LINE}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ border: "1px solid #eaeaea", fontSize: 12 }} />
              <Line type="monotone" dataKey="loss" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Type Breakdown */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#111] mb-1">Anomaly Type Breakdown</h3>
          <p className="text-xs text-[#888] mb-5">By fault category</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={MOCK_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {MOCK_PIE.map((e, i) => <Cell key={e.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ border: "1px solid #eaeaea", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Loss summary */}
        <div className="border border-[#eaeaea] bg-white rounded-lg p-6">
          <h3 className="text-sm font-semibold text-[#111] mb-1">Estimated Financial Impact</h3>
          <p className="text-xs text-[#888] mb-5">Annual projected loss by site</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { site: "Alpha", loss: 18400 }, { site: "Beta", loss: 7200 }, { site: "Gamma", loss: 2300 }
            ]} barCategoryGap="40%">
              <XAxis dataKey="site" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ border: "1px solid #eaeaea", fontSize: 12 }} cursor={{ fill: "#f4f4f5" }} />
              <Bar dataKey="loss" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Building2, 
  TrendingDown,
  Zap,
  Activity,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  ComposedChart,
  PieChart, 
  Pie, 
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

// skeleton card...

// ---- Skeleton loader ----
function SkeletonCard() {
  return (
    <div className="h-[100px] rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse" />
  );
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"severity" | "status" | "iec">("severity");

  const {
    kpis, anomalySummary, inspectionsList, anomalyBreakdown, trendData,
    isLoading, fetchAll,
  } = useDashboardStore();

  useEffect(() => {
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive current tab data from live anomalySummary
  const tabLabels: Record<"severity" | "status" | "iec", string> = {
    severity: "Breakdown by severity levels",
    status: "Breakdown by inspection status",
    iec: "Breakdown by IEC 62446-3 Class of Action",
  };

  const currentTabItems =
    activeTab === "severity" ? anomalySummary?.severity
    : activeTab === "status" ? anomalySummary?.status
    : anomalySummary?.iec;

  const totalAnomalies = anomalySummary?.total ?? 0;

  // Format numbers nicely
  const fmt = (n: number, unit = "") =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k${unit}` : `${n.toFixed(1)}${unit}`;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Portfolio Overview</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back, {session?.user?.name || "Client"}. Here is your portfolio status.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total DC Capacity */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm overflow-hidden relative group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-900 dark:text-zinc-50">
                <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight mb-1">Total DC Capacity</span>
                {isLoading ? (
                  <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : (
                  <span className="text-3xl font-bold tracking-tight">
                    {kpis ? kpis.totalDcCapacityMw.toFixed(1) : "—"}
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium"> MWp</span>
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-indigo-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-indigo-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="text-zinc-400 dark:text-zinc-500">{kpis ? `${kpis.siteCount} active sites` : "Loading..."}</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Total AC Capacity */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm overflow-hidden relative group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-900 dark:text-zinc-50">
                <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight mb-1">Total AC Capacity</span>
                {isLoading ? (
                  <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : (
                  <span className="text-3xl font-bold tracking-tight">
                    {kpis ? kpis.totalAcCapacityMw.toFixed(1) : "—"}
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium"> MW</span>
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="text-zinc-400 dark:text-zinc-500">{kpis ? `${kpis.inspectionCount} inspections` : "Loading..."}</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Identified Power Loss */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm overflow-hidden relative group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-900 dark:text-zinc-50">
                <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight mb-1">Identified Power Loss</span>
                {isLoading ? (
                  <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : (
                  <span className="text-3xl font-bold tracking-tight">
                    {kpis ? kpis.totalPowerLossKwp.toFixed(1) : "—"}
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium"> kWp</span>
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="text-red-500 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {kpis ? kpis.totalAnomalyCount.toLocaleString() : "—"}
              </span>
              <span>total anomalies identified</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Est. Revenue Loss */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm overflow-hidden relative group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-900 dark:text-zinc-50">
                <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight mb-1">Est. Revenue Loss / yr</span>
                {isLoading ? (
                  <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
                ) : (
                  <span className="text-3xl font-bold tracking-tight">
                    ₹{kpis ? (kpis.totalRevenueLoss / 100000).toFixed(2) : "—"}
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 font-medium"> L</span>
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-orange-500/10 rounded-lg">
                <TrendingDown className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="text-zinc-500 flex items-center">Calculated via IEC 60891</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
      </div>

      {/* Anomalies Summary Row — LIVE DATA */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <CardHeader className="px-6 py-5 pb-0 flex flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Anomalies Breakdown</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Loading..." : `Total detected: ${totalAnomalies.toLocaleString()}`}
            </CardDescription>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="w-[320px]"
          >
            <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 p-1 h-10 rounded-lg relative">
              {(["status", "severity", "iec"] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="relative text-[11px] uppercase font-bold tracking-wider text-zinc-500 data-[state=active]:text-indigo-500 dark:data-[state=active]:text-blue-400 transition-all duration-300 h-full"
                >
                  {tab === "iec" ? "IEC CoA" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <div className="absolute -bottom-[5px] left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-in fade-in slide-in-from-bottom-1 duration-300" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-[11px] text-zinc-500 uppercase font-bold tracking-widest mb-4">
            {tabLabels[activeTab]}
          </div>
          {isLoading ? (
            <div className="h-3 rounded-full bg-zinc-800 animate-pulse" />
          ) : (
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-zinc-800/50 border border-zinc-800 shadow-inner">
              {currentTabItems?.map((item, i) => (
                <div
                  key={i}
                  className={`${item.color} h-full transition-all duration-700 ease-out`}
                  style={{ width: `${item.percentage}%` }}
                />
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-6">
            {currentTabItems?.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{item.label}</span>
                </div>
                <div className="pl-4">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.percentage}%</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-2 font-mono">({item.count.toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loss Chart & Anomaly Donut Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-zinc-100">Loss Recovery Trend</CardTitle>
                <CardDescription className="text-zinc-400">Power loss tracked against processed anomalies.</CardDescription>
              </div>
              <select className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500">
                <option>All Inspections</option>
                <option>O&M Tasks</option>
                <option>Warranty Claims</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}M`} />
                <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Bar yAxisId="left" dataKey="powerLoss" name="Power Loss (kWp)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="anomalies" name="Anomalies Processed" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart — LIVE DATA */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Anomaly Breakdown</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">Categorization by hardware issue.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col h-[350px]">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={anomalyBreakdown.length > 0 ? anomalyBreakdown : [{ name: "No data", value: 1, color: "#27272a" }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(anomalyBreakdown.length > 0 ? anomalyBreakdown : [{ name: "No data", value: 1, color: "#27272a" }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                        itemStyle={{ color: '#f4f4f5' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-2xl font-bold text-white">{fmt(totalAnomalies)}</span>
                    <span className="text-xs text-zinc-500">Total</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar pr-2 space-y-2">
                  {anomalyBreakdown.map((item, i) => {
                    const total = anomalyBreakdown.reduce((s, x) => s + x.value, 0) || 1;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-zinc-300 truncate">{item.name}</span>
                        </div>
                        <span className="text-zinc-500 font-mono ml-4">{((item.value / total) * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  {anomalyBreakdown.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center pt-4">No anomaly data yet.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inspections Table — LIVE DATA */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">Recent Inspections</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">List of all recently analyzed solar sites.</CardDescription>
          </div>
          <button className="text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors tracking-tight">
            View All
          </button>
        </CardHeader>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-black/40 hover:bg-zinc-100 dark:hover:bg-black/40 border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10 px-6">Site Name</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10">DC Capacity</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10">Power Loss</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10 w-[200px]">Anomalies (Crit/Mod/Min)</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10">Status</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold h-10 text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map((i) => (
                  <TableRow key={i} className="border-b border-zinc-800">
                    <TableCell className="px-6"><div className="h-4 bg-zinc-800 animate-pulse rounded w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-800 animate-pulse rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-800 animate-pulse rounded w-20" /></TableCell>
                    <TableCell><div className="h-2 bg-zinc-800 animate-pulse rounded-full w-full" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-800 animate-pulse rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-800 animate-pulse rounded w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : inspectionsList?.inspections?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-600 py-10 text-sm">
                    No inspections found. Add a site and start an inspection in the Admin panel.
                  </TableCell>
                </TableRow>
              ) : (
                inspectionsList?.inspections?.map((insp) => {
                  const total = (insp.criticalCount ?? 0) + (insp.moderateCount ?? 0) + (insp.minorCount ?? 0);
                  const critPct = total ? ((insp.criticalCount ?? 0) / total) * 100 : 0;
                  const modPct  = total ? ((insp.moderateCount ?? 0) / total) * 100 : 0;
                  const minPct  = total ? ((insp.minorCount ?? 0) / total) * 100 : 0;
                  return (
                    <TableRow key={insp.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <TableCell className="px-6 font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {insp.siteName}<span className="text-zinc-400 dark:text-zinc-500 text-[11px] ml-2 font-medium">{insp.siteLocation}</span>
                      </TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400 font-medium">{insp.dcCapacityMw?.toFixed(0) ?? "—"} MW</TableCell>
                      <TableCell className="text-red-400 font-bold">
                        {insp.totalPowerLossKwp != null ? `${insp.totalPowerLossKwp.toFixed(1)} kWp` : <span className="text-zinc-600 text-xs">Not calculated</span>}
                      </TableCell>
                      <TableCell>
                        {total > 0 ? (
                          <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-zinc-800">
                            <div className="bg-red-500 h-full" style={{ width: `${critPct}%` }} />
                            <div className="bg-yellow-500 h-full" style={{ width: `${modPct}%` }} />
                            <div className="bg-zinc-500 h-full" style={{ width: `${minPct}%` }} />
                          </div>
                        ) : <span className="text-zinc-600 text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-medium bg-black/40 text-[10px] tracking-tight">
                          {insp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-zinc-500 text-xs font-medium">
                        {new Date(insp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

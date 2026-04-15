"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Calendar,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
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
  Legend
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// MOCK DATA specific to a single site
const siteData = {
  id: "site-sadashivpeth", 
  name: "Renew Power - Sadashivpeth", 
  location: "Sadashivpeth, Maharashtra", 
  cod: "Oct 2021", 
  capacity: "45 MW",
  modules: "125,000",
  inverterType: "String",
};

const lossRecoveryData = [
  { date: "May", powerLoss: 145, anomalies: 40 },
  { date: "Jun", powerLoss: 180, anomalies: 52 },
  { date: "Jul", powerLoss: 120, anomalies: 38 },
  { date: "Aug", powerLoss: 210, anomalies: 60 },
  { date: "Sep", powerLoss: 190, anomalies: 55 },
  { date: "Oct", powerLoss: 130, anomalies: 35 },
];

const anomalyTypesData = [
  { name: "Single hotspot affected module", value: 45, color: "#ef4444" },
  { name: "Bypass diode activated module", value: 30, color: "#f97316" },
  { name: "Vegetation growth", value: 15, color: "#10b981" },
  { name: "Other", value: 10, color: "#64748b" },
];

const inspectionsData = [
  { id: 1, type: "Comprehensive O&M", date: "Oct 12, 2025", loss: "350 kWp", critical: 40, moderate: 40, minor: 20 },
  { id: 2, type: "Routine Drone Scan", date: "Apr 05, 2025", loss: "280 kWp", critical: 30, moderate: 50, minor: 20 },
  { id: 3, type: "Post-Monsoon Audit", date: "Nov 20, 2024", loss: "500 kWp", critical: 60, moderate: 30, minor: 10 },
];

export default function SingleSitePage() {
  const params = useParams();
  
  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-indigo-500/20">
            <span className="text-xl font-bold text-white tracking-wider">RP</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{siteData.name}</h1>
            <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {siteData.location}</span>
              <span className="flex items-center border-l border-zinc-800 pl-4"><Calendar className="w-3.5 h-3.5 mr-1" /> COD: {siteData.cod}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/client/compare?site=${params.id}`}>
            <Button variant="outline" className="bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
              <Layers className="w-4 h-4 mr-2" />
              Compare Inspections
            </Button>
          </Link>
          <Link href={`/client/map?site=${params.id}`}>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 font-bold">
              <Activity className="w-4 h-4 mr-2" />
              View Anomalies
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="bg-zinc-900 border-zinc-800 backdrop-blur-sm overflow-hidden relative group">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
               <div className="flex flex-col text-zinc-50">
                 <span className="text-[13px] font-medium text-zinc-400 mb-1">DC Capacity</span>
                 <span className="text-3xl font-bold tracking-tight">{siteData.capacity.split(' ')[0]} <span className="text-lg text-zinc-500 font-medium">{siteData.capacity.split(' ')[1]}</span></span>
               </div>
               <div className="p-2.5 bg-indigo-500/10 rounded-lg">
                 <Zap className="w-4 h-4 text-indigo-400" />
               </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
               <span className="text-zinc-500 font-medium flex items-center">{siteData.modules} Modules</span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Card 2 */}
        <Card className="bg-zinc-900 border-zinc-800 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-50">
                <span className="text-[13px] font-medium text-zinc-400 mb-1">Inverter Type</span>
                <span className="text-3xl font-bold tracking-tight">{siteData.inverterType}</span>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-medium">Standard Configuration</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-zinc-900 border-zinc-800 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-50">
                <span className="text-[13px] font-medium text-zinc-400 mb-1">Site Power Loss</span>
                <span className="text-3xl font-bold tracking-tight">1.2 <span className="text-lg text-zinc-500 font-medium">MWp</span></span>
              </div>
              <div className="p-2.5 bg-red-500/10 rounded-lg">
                <Activity className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-emerald-400 font-medium flex items-center"><ArrowUpRight className="w-3 h-3 mr-0.5" /> Improved 5%</span>
              <span>from last scan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-zinc-900 border-zinc-800 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col text-zinc-50">
                <span className="text-[13px] font-medium text-zinc-400 mb-1">Total Anomalies</span>
                <span className="text-3xl font-bold tracking-tight">1,405</span>
              </div>
              <div className="p-2.5 bg-orange-500/10 rounded-lg">
                <TrendingDown className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span>Detected in latest inspection</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies Summary Row */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader className="px-6 py-5 pb-0 flex flex-row items-center justify-between border-b border-zinc-800">
          <div className="space-y-1">
            <CardTitle className="text-base text-zinc-100">Site Severity Breakdown</CardTitle>
          </div>
          <Tabs defaultValue="severity" className="w-[300px]">
             <TabsList className="grid w-full grid-cols-3 bg-black border border-zinc-800">
               <TabsTrigger value="status" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Status</TabsTrigger>
               <TabsTrigger value="severity" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Severity</TabsTrigger>
               <TabsTrigger value="iec" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">IEC CoA</TabsTrigger>
             </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex w-full h-4 rounded-full overflow-hidden bg-zinc-800">
            <div className="bg-red-500 h-full" style={{ width: '25%' }} />
            <div className="bg-blue-500 h-full" style={{ width: '45%' }} />
            <div className="bg-zinc-500 h-full" style={{ width: '30%' }} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-zinc-300">Critical (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-zinc-300">Moderate (45%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">Minor (30%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inspections Table */}
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
           <CardHeader className="border-b border-zinc-800 px-6 py-5 flex flex-row items-center justify-between bg-black/40">
               <div>
                  <CardTitle className="text-base text-zinc-100">Historical Inspections</CardTitle>
               </div>
            </CardHeader>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent border-b border-zinc-800">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium h-10 px-6">Date</TableHead>
                    <TableHead className="text-zinc-400 font-medium h-10">Type</TableHead>
                    <TableHead className="text-zinc-400 font-medium h-10 w-[150px]">Severity Mix</TableHead>
                    <TableHead className="text-zinc-400 font-medium h-10 text-right pr-6">Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionsData.map((inspection) => (
                    <TableRow key={inspection.id} className="border-b border-zinc-800 hover:bg-white/[0.04] transition-colors">
                      <TableCell className="px-6 font-medium text-zinc-100">
                        {inspection.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-bold bg-black/40 text-[10px] tracking-tight">
                          {inspection.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-zinc-800">
                          <div className="bg-red-500 h-full" style={{ width: `${inspection.critical}%` }} />
                          <div className="bg-blue-500 h-full" style={{ width: `${inspection.moderate}%` }} />
                          <div className="bg-zinc-500 h-full" style={{ width: `${inspection.minor}%` }} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-red-400 font-bold text-xs">
                        {inspection.loss}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </Card>

        {/* Donut Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="border-b border-zinc-800 px-6 py-5 bg-black/40">
             <CardTitle className="text-base text-zinc-100">Site Defect Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col h-[280px]">
            <div className="h-[140px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={anomalyTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {anomalyTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#f4f4f5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-xl font-bold text-white">1.4k</span>
                <span className="text-[10px] text-zinc-500">Defects</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar pr-2 space-y-2">
              {anomalyTypesData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-zinc-500 font-mono ml-4">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

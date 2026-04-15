"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Download, 
  FileBarChart, 
  Thermometer, 
  FileSpreadsheet, 
  Map as MapIcon,
  Search,
  MoreVertical,
  Plus,
  Eye,
  Share2,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QUICK_DOWNLOADS = [
  { title: "Executive Summary", format: "PDF", icon: FileBarChart, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { title: "Thermal Analysis", format: "PDF", icon: Thermometer, color: "text-red-400", bg: "bg-red-500/10" },
  { title: "Defect Matrix", format: "CSV", icon: FileSpreadsheet, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { title: "Spatial Anomalies", format: "KML", icon: MapIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
];

export default function ClientReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/reports")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReports(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Malformed reports data received.");
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch reports:", err);
        setError("Network error occurred while fetching reports.");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Loading Reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Reports</h2>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
          Try Again
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reports & Export</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Access, generate, and distribute site analysis reports.</p>
        </div>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 gap-2 font-bold tracking-tight">
          <Plus className="w-4 h-4" /> Generate Custom Report
        </Button>
      </div>

      {/* Quick Downloads Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {QUICK_DOWNLOADS.map((item, i) => (
          <Card key={i} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">.{item.format}</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-indigo-500 transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports History Section */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-black/40">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Reports Library</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search reports by name or site..." 
              className="w-full h-9 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-transparent border-b border-zinc-200 dark:border-zinc-800">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10 px-6">Report Name</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10">Site</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10">Sections Included</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10">Creator</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10">Date Created</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-10 w-[80px] text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(reports) && reports.length > 0 ? (
                reports.map((report) => (
                  <TableRow key={report.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer">{report.name || 'Site Report'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 py-4 font-bold">{report.site?.name ?? 'Unknown Site'}</TableCell>
                    <TableCell className="text-zinc-500 text-xs py-4 max-w-[200px] truncate font-medium">
                      {report.status === 'READY' ? 'Full Analysis' : 'Generating...'}
                    </TableCell>
                    <TableCell className="py-4">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-tight ${report.status === 'READY' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {report.status === 'READY' ? 'AI System' : 'Processing'}
                       </span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs py-4 font-bold">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 w-40 p-2 shadow-xl rounded-xl">
                          <DropdownMenuItem className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white rounded-lg">
                            <Eye className="w-4 h-4 mr-2 text-zinc-400" /> View Online
                          </DropdownMenuItem>
                          {report.pdfUrl && (
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/5 hover:text-white">
                              <Download className="w-4 h-4 mr-2 text-zinc-400" /> Download PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 bg-black/20">
                    <div className="flex flex-col items-center gap-2">
                       <FileText className="w-8 h-8 text-zinc-800" />
                       <p className="text-zinc-500 text-sm font-medium">No reports generated for this organization.</p>
                       <p className="text-zinc-700 text-xs">Run a site inspection to populate this library.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

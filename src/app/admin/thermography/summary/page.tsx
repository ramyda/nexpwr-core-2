"use client";

import React, { useState, useEffect } from "react";
import { Play, RefreshCw } from "lucide-react";

interface Job {
  id: string;
  startedAt: string;
  timeTaken: number | null;
  status: string;
}

export default function SummaryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/thermography/summary/jobs");
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const runJob = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/thermography/summary/run", { method: "POST" });
      if (res.ok) { fetchJobs(); }
    } catch (e) { console.error(e); }
    finally { setRunning(false); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      running: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
      not_started: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.not_started}`}>
        {status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Drone Thermography Summary</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Background job runs for thermography data processing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchJobs} className="p-2 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={runJob} disabled={running} className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2">
            <Play className="w-4 h-4" /> {running ? "Starting..." : "Run job"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800">
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Started At</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Time Taken</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">Loading...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600 text-sm">No jobs found. Click &ldquo;Run job&rdquo; to start one.</td></tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-6 py-4 text-[13px] text-zinc-400 font-mono">{job.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 text-[13px] text-zinc-300">{new Date(job.startedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-[13px] text-zinc-400">{job.timeTaken ? `${job.timeTaken}s` : "—"}</td>
                  <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

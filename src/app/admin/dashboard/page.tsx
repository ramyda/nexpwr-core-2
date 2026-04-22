"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Activity, Clock, Rocket } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalSites: number;
  activeInspections: number;
  totalAnomalies: number;
  reportsGenerated: number;
  activeMissions: number;
  recentActivity: {
    id: string;
    clientId: string | null;
    clientName: string;
    action: string;
    type: string;
    timestamp: string;
  }[];
}

const KPICard = ({
  title,
  value,
  detail,
  pulse,
}: {
  title: string;
  value: string | number;
  detail: string;
  pulse?: boolean;
}) => (
  <div className="bg-white dark:bg-zinc-900/50 border border-[#eaeaea] dark:border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
    <div className="flex items-center gap-2">
      {pulse && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
      <span className="text-[13px] font-medium text-[#444] dark:text-zinc-400">{title}</span>
    </div>
    <span className="text-3xl font-semibold tracking-tight text-[#111] dark:text-zinc-50 mt-2 mb-1">{value}</span>
    <span className="text-xs text-[#888] dark:text-zinc-500">{detail}</span>
  </div>
);

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Dashboard stats error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back, {session?.user?.name?.split(' ')[0] || "Admin"}</h1>
        <p className="text-[14px] text-[#888] dark:text-zinc-500">Here is an overview of your portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Sites"
          value={loading ? "—" : stats?.totalSites ?? 0}
          detail="Active portfolio size"
        />
        <KPICard
          title="Active Inspections"
          value={loading ? "—" : stats?.activeInspections ?? 0}
          detail="Pending review or annotation"
        />
        <KPICard
          title="Total Anomalies"
          value={loading ? "—" : stats?.totalAnomalies ?? 0}
          detail="Detected across all sites"
        />
        <KPICard
          title="Reports Generated"
          value={loading ? "—" : stats?.reportsGenerated ?? 0}
          detail="In the last 30 days"
        />
        <KPICard
          title="Active Missions"
          value={loading ? "—" : stats?.activeMissions ?? 0}
          detail="In-progress thermography audits"
          pulse={!!stats?.activeMissions}
        />
      </div>

      <div className="flex gap-3 border-t border-b border-zinc-100 dark:border-zinc-800 py-6 my-10">
        <Link href="/admin/clients" className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors rounded-md px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> New Site
        </Link>
        <Link href="/admin/reports" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors rounded-md px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" /> Generate Report
        </Link>
        <Link href="/admin/thermography/sites" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors rounded-md px-5 py-2.5 text-[13px] font-semibold flex items-center gap-2">
          <Rocket className="w-4 h-4" /> Thermography Engine
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-medium tracking-tight mb-4 text-[#111] dark:text-zinc-100">Recent Activity</h2>
        <div className="border border-[#eaeaea] dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Loading activity...</div>
          ) : !stats?.recentActivity?.length ? (
            <div className="p-12 text-center text-[#888] text-sm">
              <Activity className="w-6 h-6 mx-auto mb-2 text-[#ccc] dark:text-zinc-700" />
              No recent activity found in your workspace.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stats.recentActivity.map((event) => (
                <button
                  key={event.id}
                  onClick={() => event.clientId && router.push(`/admin/clients/${event.clientId}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-left"
                >
                  <Activity className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{event.clientName}</span>
                  <span className="text-[13px] text-zinc-500 flex-1 truncate">· {event.action}</span>
                  <span className="text-[11px] text-zinc-400 flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(event.timestamp)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

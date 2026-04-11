"use client";

import { useSession } from "next-auth/react";
import { Plus, UploadCloud, FileText, Activity } from "lucide-react";
import Link from "next/link";

const KPICard = ({ title, value, detail }: { title: string, value: string | number, detail: string }) => (
  <div className="bg-white border border-[#eaeaea] rounded-lg p-5 flex flex-col justify-between">
    <span className="text-[13px] font-medium text-[#444] mb-2">{title}</span>
    <span className="text-3xl font-semibold tracking-tight text-[#111] mb-1">{value}</span>
    <span className="text-xs text-[#888]">{detail}</span>
  </div>
);

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back, {session?.user?.name?.split(' ')[0] || "Admin"}</h1>
        <p className="text-[14px] text-[#888]">Here is an overview of your portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sites" value="0" detail="Active portfolio size" />
        <KPICard title="Active Inspections" value="0" detail="Pending review or annotation" />
        <KPICard title="Total Anomalies" value="0" detail="Detected across all sites" />
        <KPICard title="Reports Generated" value="0" detail="In the last 30 days" />
      </div>

      <div className="flex gap-3 border-t border-b border-[#eaeaea] py-5 my-8">
        <button className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Site
        </button>
        <Link href="/admin/inspections/new" className="bg-white border border-[#eaeaea] text-[#111] hover:bg-zinc-50 transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
          <UploadCloud className="w-4 h-4" /> Upload Inspection
        </Link>
        <button className="bg-white border border-[#eaeaea] text-[#111] hover:bg-zinc-50 transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>

      <div>
        <h2 className="text-lg font-medium tracking-tight mb-4 text-[#111]">Recent Activity</h2>
        <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
           <div className="p-12 text-center text-[#888] text-sm">
             <Activity className="w-6 h-6 mx-auto mb-2 text-[#ccc]" />
             No recent activity found in your workspace.
           </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";

const KPICard = ({ title, value, detail }: { title: string, value: string | number, detail: string }) => (
  <div className="bg-white border border-[#eaeaea] rounded-lg p-5 flex flex-col justify-between">
    <span className="text-[13px] font-medium text-[#444] mb-2">{title}</span>
    <span className="text-3xl font-semibold tracking-tight text-[#111] mb-1">{value}</span>
    <span className="text-xs text-[#888]">{detail}</span>
  </div>
);

export default function ClientDashboard() {
  const { data: session } = useSession();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Portfolio Overview</h1>
        <p className="text-[14px] text-[#888]">Welcome back, {session?.user?.name || "Client"}. Here are your solar asset insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sites" value="0" detail="In your portfolio" />
        <KPICard title="Total Inspections" value="0" detail="Completed reviews" />
        <KPICard title="Total Anomalies" value="0" detail="Detected issues" />
        <KPICard title="Last Report Date" value="--" detail="Latest sync" />
      </div>

      <div>
        <h2 className="text-lg font-medium tracking-tight mb-4 text-[#111]">Recent Reports</h2>
        <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
           <div className="p-12 text-center text-[#888] text-sm">
             No reports have been published to your workspace yet.
           </div>
        </div>
      </div>
    </div>
  );
}

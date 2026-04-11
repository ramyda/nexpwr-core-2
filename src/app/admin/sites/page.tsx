"use client";

import Link from "next/link";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { useState } from "react";

// Mock data until Prisma hooks are wired
const MOCK_SITES = [
  { id: 1, name: "Alpha Solar Array", location: "Nevada, USA", capacity: 120, lastInspection: "2024-03-12", status: "Active" },
  { id: 2, name: "Beta Farm East", location: "Arizona, USA", capacity: 45, lastInspection: "2023-11-05", status: "Pending" },
  { id: 3, name: "Gamma Roofs", location: "Texas, USA", capacity: 5.5, lastInspection: "---", status: "Inactive" },
];

export default function SitesPage() {
  const [search, setSearch] = useState("");

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Active": return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium">Active</span>;
      case "Pending": return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium">Pending</span>;
      default: return <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-xs font-medium">Inactive</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Sites</h1>
          <p className="text-[14px] text-[#888] mt-1">Manage your solar portfolio</p>
        </div>
        <button className="bg-[#111] text-white hover:bg-[#333] transition-colors rounded-md px-4 py-2 text-[13px] font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <input 
            className="w-full bg-white border border-[#eaeaea] rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#111] transition-colors"
            placeholder="Search sites by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-white border border-[#eaeaea] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#111] transition-colors text-[#444]">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">Site Name</th>
              <th className="px-5 py-3 font-medium text-[#444]">Location</th>
              <th className="px-5 py-3 font-medium text-[#444]">Capacity (MW)</th>
              <th className="px-5 py-3 font-medium text-[#444]">Last Inspection</th>
              <th className="px-5 py-3 font-medium text-[#444]">Status</th>
              <th className="px-5 py-3 font-medium text-[#444] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {MOCK_SITES.map((site) => (
              <tr key={site.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                <td className="px-5 py-4 font-medium text-[#111]">{site.name}</td>
                <td className="px-5 py-4 text-[#666]">{site.location}</td>
                <td className="px-5 py-4 text-[#666] font-mono">{site.capacity.toFixed(2)}</td>
                <td className="px-5 py-4 text-[#666]">{site.lastInspection}</td>
                <td className="px-5 py-4"><StatusBadge status={site.status} /></td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1 text-[#888] hover:text-[#111] opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

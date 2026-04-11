"use client";
import { Map, ExternalLink } from "lucide-react";

const MOCK_SITES = [
  { id: 1, name: "Alpha Solar Array", location: "Nevada, USA", capacity: 120, status: "Active" },
  { id: 2, name: "Beta Farm East", location: "Arizona, USA", capacity: 45, status: "Active" },
  { id: 3, name: "Gamma Roofs", location: "Texas, USA", capacity: 5.5, status: "Pending" },
];

export default function ClientSitesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Your Sites</h1>
        <p className="text-[14px] text-[#888] mt-1">Solar assets linked to your account</p>
      </div>
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#eaeaea] bg-zinc-50/50">
              <th className="px-5 py-3 font-medium text-[#444]">Site Name</th>
              <th className="px-5 py-3 font-medium text-[#444]">Location</th>
              <th className="px-5 py-3 font-medium text-[#444]">Capacity (MW)</th>
              <th className="px-5 py-3 font-medium text-[#444]">Status</th>
              <th className="px-5 py-3 font-medium text-[#444] text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeaea]">
            {MOCK_SITES.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-5 py-4 font-medium text-[#111]">{s.name}</td>
                <td className="px-5 py-4 text-[#666]">{s.location}</td>
                <td className="px-5 py-4 font-mono text-[#444]">{s.capacity}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${s.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1.5 text-[#888] hover:text-[#111] opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-zinc-100 inline-flex">
                    <ExternalLink className="w-4 h-4" />
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

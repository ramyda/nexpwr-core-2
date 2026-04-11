"use client";
import { FileText, Download } from "lucide-react";

export default function ClientReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Reports</h1>
        <p className="text-[14px] text-[#888] mt-1">Published inspection reports shared with you</p>
      </div>
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="p-16 text-center">
          <FileText className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
          <p className="text-[#888] text-sm font-medium">No published reports yet</p>
          <p className="text-[#bbb] text-xs mt-1">Reports will appear here once your inspection team publishes them.</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Users, MapPin, Building2, PanelLeft } from "lucide-react";
import { useActiveClient } from "@/lib/context/ActiveClientContext";

interface Site {
  id: string;
  name: string;
  capacityMw: number;
}

interface Client {
  id: string;
  name: string;
  company: string;
  sites: Site[];
}

export function ClientSwitcher() {
  const { activeClient, activeSite, setActiveClient, setActiveSite, isLoading } = useActiveClient();
  const [isOpen, setIsOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch clients for switcher:", error);
      } finally {
        setFetchLoading(false);
      }
    }
    fetchClients();
  }, []);

  if (isLoading) return null;

  return (
    <div className="px-4 mb-6 relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-[#111111] border border-[#333333] rounded-lg hover:border-[#444444] transition-all group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-[#222222] flex items-center justify-center shrink-0 border border-[#333333]">
            {activeClient ? (
              <span className="text-[11px] font-bold text-emerald-500">
                {activeClient.company.substring(0, 2).toUpperCase()}
              </span>
            ) : (
              <Users className="w-4 h-4 text-[#888888]" />
            )}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] leading-none mb-1">
              {activeClient ? "Active Workspace" : "Select Client"}
            </span>
            <span className="text-[13px] font-medium text-[#ededed] truncate w-full text-left">
              {activeClient ? activeClient.company : "No Workspace"}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-4 right-4 top-full mt-2 bg-[#111111] border border-[#333333] rounded-xl shadow-2xl z-50 py-2 max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
            {fetchLoading ? (
              <div className="px-4 py-8 text-center text-[13px] text-[#888888]">Loading workspaces...</div>
            ) : clients.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-[#888888] mb-2">No clients found</p>
                <button className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-400">Add Client</button>
              </div>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="mb-1 last:mb-0">
                  <button
                    onClick={() => {
                      setActiveClient(client);
                      if (client.sites.length === 0) setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2 hover:bg-[#1a1a1a] transition-colors group ${
                      activeClient?.id === client.id ? "bg-[#1a1a1a]/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-[#222222] border border-[#333333] flex items-center justify-center text-[9px] font-bold text-[#888888]">
                         {client.company.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`text-[13px] ${activeClient?.id === client.id ? "text-white font-medium" : "text-[#888888]"}`}>
                        {client.company}
                      </span>
                    </div>
                    {client.sites.length > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#444444]" />}
                  </button>
                  
                  {activeClient?.id === client.id && client.sites.map((site) => (
                    <button
                      key={site.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSite(site);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 pl-12 pr-4 py-1.5 hover:bg-[#1a1a1a] transition-colors ${
                        activeSite?.id === site.id ? "text-emerald-500" : "text-[#666666] hover:text-[#888888]"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[12px] truncate">{site.name}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

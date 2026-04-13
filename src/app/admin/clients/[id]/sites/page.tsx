"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MapPin, Zap, Calendar, AlertTriangle, ChevronRight, Edit2, Phone, Mail, Globe } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { SlideOver } from "@/components/shared/SlideOver";
import { BackButton } from "@/components/shared/BackButton";
import { useActiveClient } from "@/lib/context/ActiveClientContext";

interface Site {
  id: string;
  name: string;
  location: string;
  capacityMw: number;
  isActive: boolean;
  inspections: {
    id: string;
    date: string;
    status: string;
    anomalies: {
      iecClass: string;
    }[];
  }[];
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  sites: Site[];
}

export default function ClientSitesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { setActiveSite } = useActiveClient();
  const { id } = React.use(params);
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setClient(data);
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSiteClick = (site: Site) => {
    setActiveSite({
      id: site.id,
      name: site.name,
      capacityMw: site.capacityMw
    });
    router.push(`/admin/clients/${id}/sites/${site.id}`);
  };

  const handleAddSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      clientId: id
    };

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSlideOverOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create site:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading client sites...</div>;
  if (!client) return <div className="p-8 text-center text-red-500">Client not found</div>;

  return (
    <div className="space-y-8">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">{client.company}</h1>
        <Breadcrumb items={[
          { label: "Clients", href: "/admin/clients" }, 
          { label: client.name }
        ]} />
      </div>

      {/* Client Info Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-xl font-bold text-white shadow-lg">
             {client.name.substring(0, 1).toUpperCase()}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1">
             <div className="flex flex-col">
               <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Contact Name</span>
               <span className="text-[14px] font-medium text-zinc-900">{client.name}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Email</span>
               <span className="text-[14px] font-medium text-zinc-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-zinc-400" /> {client.email}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Phone</span>
               <span className="text-[14px] font-medium text-zinc-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {client.phone || "---"}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">Company</span>
               <span className="text-[14px] font-medium text-zinc-900 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-zinc-400" /> {client.company}</span>
             </div>
          </div>
        </div>
        <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-md transition-all">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Sites</h2>
          <button 
            onClick={() => setIsSlideOverOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/10"
          >
            <Plus className="w-4 h-4" /> Add New Site
          </button>
        </div>

        {client.sites.length === 0 ? (
          <div className="bg-zinc-50/50 border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center">
            <MapPin className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-base font-medium text-zinc-900 mb-1">No sites for this client yet</h3>
            <p className="text-sm text-zinc-500 mb-6">Create a site workspace to start managing inspections.</p>
            <button 
              onClick={() => setIsSlideOverOpen(true)}
              className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              Add First Site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {client.sites.map((site) => {
              const lastInspection = site.inspections[0];
              const anomalies = lastInspection?.anomalies || [];
              const c4Count = anomalies.filter(a => a.iecClass === 'C4').length;

              return (
                <div key={site.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${site.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                        {site.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors mb-1">{site.name}</h3>
                    <p className="text-[13px] text-zinc-500 flex items-center gap-1.5 mb-6">
                      <MapPin className="w-3.5 h-3.5" /> {site.location}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                       <div className="flex flex-col">
                         <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Capacity</span>
                         <span className="text-[13px] font-medium text-zinc-900">{site.capacityMw} MW DC</span>
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Last Audit</span>
                         <span className="text-[13px] font-medium text-zinc-900 flex items-center gap-1.5 text-nowrap">
                           <Calendar className="w-3.5 h-3.5" /> {lastInspection ? new Date(lastInspection.date).toLocaleDateString() : "---"}
                         </span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 px-5 py-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-md ${c4Count > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         <AlertTriangle className="w-4 h-4" />
                       </div>
                       <span className="text-[13px] font-semibold text-zinc-700">
                         {anomalies.length} Anomalies
                       </span>
                    </div>
                    <Link 
                      href={`/admin/clients/${client.id}/sites/${site.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSiteClick(site);
                      }}
                      className="text-[12px] font-bold text-zinc-900 hover:underline flex items-center gap-1"
                    >
                      View Site <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title="Add New Site"
      >
        <form onSubmit={handleAddSite} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Site Name *</label>
            <input name="name" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" placeholder="e.g. Desert Rock Phase 1" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Location *</label>
            <input name="location" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" placeholder="e.g. Mojave, CA" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Capacity (MW) *</label>
              <input name="capacityMw" type="number" step="0.01" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Total Modules</label>
              <input name="modules" type="number" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
          </div>
          
          <div className="space-y-1.5">
             <label className="text-[13px] font-medium text-zinc-700">Mount Type</label>
             <select name="mountType" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900">
               <option value="Fixed Tilt">Fixed Tilt</option>
               <option value="Single Axis Tracker">Single Axis Tracker</option>
               <option value="Dual Axis Tracker">Dual Axis Tracker</option>
               <option value="Rooftop">Rooftop</option>
             </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">PPA Rate ($/kWh)</label>
              <input name="ppaRate" type="number" step="0.001" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-zinc-700">Performance Ratio</label>
              <input name="performanceRatio" type="number" step="0.01" defaultValue="0.80" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900" />
            </div>
          </div>

          <div className="pt-6 flex items-center gap-3">
             <button type="button" onClick={() => setIsSlideOverOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-[13px] font-medium hover:bg-zinc-50 transition-colors">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors">{isSubmitting ? "Creating..." : "Create Site"}</button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

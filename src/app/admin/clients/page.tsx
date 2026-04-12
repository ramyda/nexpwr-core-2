"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, Search, MoreHorizontal, ExternalLink, Mail, Phone, MapPin, AlertCircle } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { SlideOver } from "@/components/shared/SlideOver";
import { BackButton } from "@/components/shared/BackButton";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    sites: number;
  };
  sites: {
    inspections: {
      date: string;
    }[];
  }[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mockClients: Client[] = [
    { 
      id: 'mock-1', name: 'Test Client', company: 'Solar Co', email: 'test@solar.com', 
      phone: '+1 555-0123', isActive: true, createdAt: new Date().toISOString(),
      _count: { sites: 0 }, sites: [] 
    }
  ];

  const fetchClients = async () => {
    try {
      console.log("Fetching clients from /api/clients...");
      const res = await fetch("/api/clients");
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Clients API response:", data);
      
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.warn("API returned non-array data, falling back to mock data.");
        setClients(mockClients);
        setError("Warning: Backend returned malformed data.");
      }
    } catch (error: any) {
      console.error("Failed to fetch clients:", error);
      setError("Unable to connect to service. Showing demonstration data.");
      setClients(mockClients);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSlideOverOpen(false);
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to create client:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">Clients</h1>
          <Breadcrumb items={[
            { label: "Dashboard", href: "/admin/dashboard" }, 
            { label: "Clients" }
          ]} />
        </div>
        <button 
          onClick={() => setIsSlideOverOpen(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider text-center">Sites</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Last Inspection</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                      Loading clients...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                      <p className="text-sm font-medium text-zinc-900">{error}</p>
                      <button onClick={fetchClients} className="mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 underline">Try again</button>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-zinc-400" />
                      </div>
                      <h3 className="text-base font-medium text-zinc-900 mb-1">No clients yet</h3>
                      <p className="text-sm text-zinc-500 mb-6">Start by adding your first client workspace.</p>
                      <button 
                        onClick={() => setIsSlideOverOpen(true)}
                        className="bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
                      >
                        Add your first client
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const lastInspectionDate = client.sites
                    .flatMap(s => s.inspections)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

                  return (
                    <tr 
                      key={client.id} 
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/admin/clients/${client.id}/sites`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-600">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-zinc-900 group-hover:underline">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-zinc-600">{client.company}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-zinc-900 flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-400" /> {client.email}</span>
                          {client.phone && <span className="text-[11px] text-zinc-500 flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-400" /> {client.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-[11px] font-semibold">{client._count.sites}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-zinc-600">
                        {lastInspectionDate ? new Date(lastInspectionDate).toLocaleDateString() : "No data"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                          {client.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center justify-end gap-2">
                           <Link href={`/admin/clients/${client.id}/sites`} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors" title="View Sites"><ExternalLink className="w-4 h-4" /></Link>
                           <button className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title="Add New Client"
      >
        <form onSubmit={handleAddClient} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Full Name *</label>
            <input 
              name="name" 
              required 
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Company Name *</label>
            <input 
              name="company" 
              required 
              placeholder="e.g. Solar Solutions LLC"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Email Address *</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="e.g. j.smith@example.com"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Phone Number</label>
            <input 
              name="phone" 
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Address</label>
            <textarea 
              name="address" 
              rows={2}
              placeholder="Full business address"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Notes</label>
            <textarea 
              name="notes" 
              rows={3}
              placeholder="Any internal notes about this client..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 resize-none"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
             <button 
               type="button" 
               onClick={() => setIsSlideOverOpen(false)}
               className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-[13px] font-medium hover:bg-zinc-50 transition-colors"
             >
               Cancel
             </button>
             <button 
               type="submit" 
               disabled={isSubmitting}
               className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
             >
               {isSubmitting ? "Creating..." : "Create Client"}
             </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}

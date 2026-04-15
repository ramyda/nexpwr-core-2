"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Users, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle,
  Pencil,
  Shield,
  PauseCircle,
  Trash2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { SlideOver } from "@/components/shared/SlideOver";
import { BackButton } from "@/components/shared/BackButton";
import { useActiveClient } from "@/lib/context/ActiveClientContext";
import { useToast } from "@/components/shared/Toast";

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
  const router = useRouter();
  const { setActiveClient } = useActiveClient();
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  const handleClientClick = (client: Client) => {
    setActiveClient({
      id: client.id,
      name: client.name,
      company: client.company
    });
    router.push(`/admin/clients/${client.id}/sites`);
  };

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

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleManageAccess = (client: Client) => {
    router.push(`/admin/clients/${client.id}/access`);
  };

  const handleSuspend = async (client: Client) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !client.isActive }),
      });

      if (res.ok) {
        toast.success(`${client.name} ${client.isActive ? "suspended" : "resumed"} successfully.`);
        fetchClients();
        router.refresh();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while toggling status.");
    }
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Account deletion failed. Please try again.");
        return;
      }

      toast.success(`${selectedClient.name} has been permanently deleted.`);
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error("[DELETE CLIENT]", err);
      toast.error("Network error. Could not delete client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClient) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`${selectedClient.name} updated successfully.`);
        fetchClients();
        router.refresh();
        setIsEditDialogOpen(false);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast.error("Failed to update client details.");
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">Clients</h1>
          <Breadcrumb items={[
            { label: "Dashboard", href: "/admin/dashboard" }, 
            { label: "Clients" }
          ]} />
        </div>
        <button 
          onClick={() => setIsSlideOverOpen(true)}
          className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-4 py-2 rounded-md text-[13px] font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">Sites</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Last Inspection</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
                      <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-800">
                        <Users className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
                      </div>
                      <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">No clients yet</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Start by adding your first client workspace.</p>
                      <button 
                        onClick={() => setIsSlideOverOpen(true)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
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
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                      onClick={() => handleClientClick(client)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline">{client.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-zinc-600 dark:text-zinc-400">{client.company}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-400 dark:text-zinc-600" /> {client.email}</span>
                          {client.phone && <span className="text-[11px] text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-400 dark:text-zinc-600" /> {client.phone}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold">{client._count.sites}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-zinc-600 dark:text-zinc-400">
                        {lastInspectionDate ? new Date(lastInspectionDate).toLocaleDateString() : "No data"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${client.isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'}`}>
                          {client.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center justify-end gap-2">
                           <Link href={`/admin/clients/${client.id}/sites`} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors" title="View Sites"><ExternalLink className="w-4 h-4" /></Link>
                           
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <div className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors outline-none cursor-pointer">
                                 <MoreHorizontal className="w-4 h-4" />
                               </div>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="w-[180px]">
                               <DropdownMenuItem 
                                 className="cursor-pointer gap-2 text-[13px]" 
                                 onClick={() => handleEdit(client)}
                               >
                                 <Pencil className="w-3.5 h-3.5" /> Edit Client
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 className="cursor-pointer gap-2 text-[13px]" 
                                 onClick={() => handleManageAccess(client)}
                               >
                                 <Shield className="w-3.5 h-3.5" /> Manage Access
                               </DropdownMenuItem>
                               <DropdownMenuSeparator className="bg-zinc-100" />
                               <DropdownMenuItem 
                                 className="cursor-pointer gap-2 text-[13px]" 
                                 onClick={() => handleSuspend(client)}
                               >
                                 <PauseCircle className="w-3.5 h-3.5" /> Suspend Account
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 className="cursor-pointer gap-2 text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/20" 
                                 onClick={() => handleDeleteClick(client)}
                               >
                                 <Trash2 className="w-3.5 h-3.5" /> Delete Client
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
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
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Company Name *</label>
            <input 
              name="company" 
              required 
              placeholder="e.g. Solar Solutions LLC"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Email Address *</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="e.g. j.smith@example.com"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Phone Number</label>
            <input 
              name="phone" 
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-[13px] text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
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

      {/* Edit Client Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Edit Client</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Update the profile and contact details for {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</label>
                <input 
                  name="name" 
                  defaultValue={selectedClient.name}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Company</label>
                <input 
                  name="company" 
                  defaultValue={selectedClient.company}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
                <input 
                  name="email" 
                  defaultValue={selectedClient.email}
                  type="email"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Phone</label>
                <input 
                  name="phone" 
                  defaultValue={selectedClient.phone || ""}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900" 
                />
              </div>
              <DialogFooter className="pt-4 border-t border-zinc-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2 text-zinc-500">
              Are you sure you want to delete <strong>{selectedClient?.name}</strong>? This action will permanently remove all associated sites, inspections, and reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2 sm:gap-0 border-t border-zinc-100 mt-4">
            <button 
              type="button" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
            >
              Keep Client
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              {isSubmitting ? "Deleting..." : "Permanently Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

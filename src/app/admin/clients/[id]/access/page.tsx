"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { BackButton } from "@/components/shared/BackButton";
import { 
  Shield, 
  Users, 
  CreditCard, 
  UserPlus, 
  Link as LinkIcon, 
  CheckCircle2, 
  Clock, 
  Mail, 
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Copy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/components/shared/Toast";

interface Client {
  id: string;
  name: string;
  company: string;
  plan: string;
  isActive: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  lastLogin: string;
}

export default function ClientAccessPage({ params }: { params: { id: string } }) {
  const toast = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [generatedLink, setGeneratedLink] = useState("");

  // Mock Members
  const members: Member[] = [
    { id: "1", name: "Sarah Johnson", email: "s.johnson@example.com", role: "ADMIN", lastLogin: "2 hours ago" },
    { id: "2", name: "David Chen", email: "d.chen@example.com", role: "VIEWER", lastLogin: "1 day ago" },
    { id: "3", name: "Marcus Wright", email: "m.wright@example.com", role: "VIEWER", lastLogin: "3 days ago" },
  ];

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        const found = data.find((c: Client) => c.id === params.id);
        if (found) setClient(found);
      } catch (error) {
        console.error("Failed to fetch client context", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id]);

  const handleGenerateLink = () => {
    const mockHash = Math.random().toString(36).substring(7);
    const url = `https://nexpwr.com/invite/${mockHash}`;
    setGeneratedLink(url);
    toast.success("Secure invite link generated!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                {client ? client.company : "Client Dashboard"}
              </h1>
              {client && (
                <Badge variant={client.isActive ? "secondary" : "destructive"} className="px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider">
                  {client.isActive ? "Active Account" : "Suspended"}
                </Badge>
              )}
            </div>
            <Breadcrumb items={[
              { label: "Dashboard", href: "/admin/dashboard" }, 
              { label: "Clients", href: "/admin/clients" },
              { label: "Command Center" }
            ]} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-xs font-medium h-9 gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              <ExternalLink className="w-3.5 h-3.5" /> View Portal
            </Button>
            <Button className="text-xs font-medium h-9 gap-2 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="w-3.5 h-3.5" /> Invite User
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subscription & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <CreditCard className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Subscription Health</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400">Billing and plan management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Current Plan</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{client?.plan || "Pro"} Enterprise</span>
                </div>
                <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 px-2 py-0 text-[10px] uppercase tracking-tighter shadow-none">Active</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4 opacity-70" />
                    <span>Renewal Date</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Oct 24, 2026</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Users className="w-4 h-4 opacity-70" />
                    <span>User Limit</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Unlimited</span>
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-[13px] h-10 transition-colors">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <div className="p-1.5 bg-white dark:bg-zinc-950 rounded-md border border-amber-200 dark:border-amber-900/50 shadow-sm">
                   <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-amber-900 dark:text-amber-100">Security Audit</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-normal">
                    You have 2 administrators with no 2FA enabled. We recommend enforcing multi-factor authentication for this organization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Member Management */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-zinc-50 dark:border-zinc-800 mb-4 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Users className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Member Access</CardTitle>
                  <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">Manage individuals who can access this client's sites and reports.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest hidden sm:block">Filter by Role:</span>
                <select className="text-[11px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 outline-none font-medium text-zinc-900 dark:text-zinc-100">
                  <option>All Members</option>
                  <option>Admins</option>
                  <option>Viewers</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-950 border-y border-zinc-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Last Activity</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{member.name}</span>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 opacity-60" /> {member.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shadow-none font-bold uppercase tracking-tighter ${member.role === 'ADMIN' ? 'text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700' : 'text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-zinc-600 dark:text-zinc-400 font-medium">{member.lastLogin}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 border-none bg-white dark:bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="p-6 pb-0">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-50 flex items-center justify-center mb-6 shadow-lg shadow-zinc-200 dark:shadow-none">
              <UserPlus className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Invite New Member</DialogTitle>
              <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 pt-1">
                Grant access to this organization. They will receive an email with instructions to set up their account.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-800 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Assign Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setInviteRole("ADMIN")}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${inviteRole === "ADMIN" ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-zinc-900 dark:ring-zinc-50' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'}`}
                >
                  <Shield className={`w-5 h-5 ${inviteRole === "ADMIN" ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`} />
                  <div className="text-left">
                    <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">Admin</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Full site and user control.</div>
                  </div>
                </button>
                <button 
                  onClick={() => setInviteRole("VIEWER")}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${inviteRole === "VIEWER" ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-zinc-900 dark:ring-zinc-50' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'}`}
                >
                  <Users className={`w-5 h-5 ${inviteRole === "VIEWER" ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`} />
                  <div className="text-left">
                    <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50 leading-tight">Viewer</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Read-only view of reports.</div>
                  </div>
                </button>
              </div>
            </div>

            {generatedLink ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Secure link ready
                  </span>
                  <button onClick={() => setGeneratedLink("")} className="text-[10px] font-bold text-emerald-900 dark:text-emerald-400 opacity-50 hover:opacity-100 underline">Generate new</button>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-900/50 p-2 rounded-lg">
                  <code className="text-[11px] text-emerald-900 dark:text-emerald-300 truncate flex-1 font-mono">{generatedLink}</code>
                  <button 
                    onClick={() => copyToClipboard(generatedLink)}
                    className="p-1.5 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1 h-11 text-xs font-bold gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" onClick={handleGenerateLink}>
                  <LinkIcon className="w-4 h-4" /> Generate Link
                </Button>
                <Button className="flex-1 h-11 text-xs font-bold gap-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900">
                  <Mail className="w-4 h-4" /> Send Email
                </Button>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center flex items-center justify-center gap-1.5 leading-relaxed">
              <ChevronRight className="w-3 h-3" /> Invitations expire after 24 hours for security purposes.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

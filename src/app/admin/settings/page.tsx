"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Settings, User, Shield, Bell, Link2, Plus, 
  Copy, Check, Trash2, Loader2, X, Building2, 
  Users as UsersIcon, Globe, Mail, Phone, Sliders, Send
} from "lucide-react";
import { useToast } from "@/components/shared/Toast";

type Invite = {
  id: string; token: string; email: string | null; role: string;
  expiresAt: string; used: boolean; createdAt: string;
};

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CLIENT");
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Tab State
  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "company", label: "Company Branding", icon: Building2 },
    { id: "users", label: "User Management", icon: UsersIcon },
    { id: "defaults", label: "Inspection Defaults", icon: Sliders },
  ];

  const [settings, setSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadInvites = () =>
    fetch("/api/invites")
      .then(r => r.json())
      .then(d => { setInvites(Array.isArray(d) ? d : []); setLoadingInvites(false); })
      .catch(() => setLoadingInvites(false));

  const loadSettings = () => {
    setLoadingSettings(true);
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => { setSettings(d); setLoadingSettings(false); })
      .catch(() => setLoadingSettings(false));
  };

  useEffect(() => { loadInvites(); loadSettings(); }, []);

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setNewUrl(data.url);
    setCreating(false);
    setInviteEmail("");
    loadInvites();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    success("Invite link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async (keys: string[]) => {
    setSaving(keys[0]);
    const payload: any = {};
    keys.forEach(k => payload[k] = settings[k]);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (res.ok) {
        success("Settings updated successfully");
      } else {
        error("Failed to update settings");
      }
    } catch (err) {
      error("Something went wrong");
    } finally {
      setSaving(null);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc]">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 leading-none">Settings</h1>
        <p className="text-[14px] text-zinc-500 mt-2">Manage your account, workspace branding, and team access</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 p-8 pt-4 border-r border-zinc-100 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10" 
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Tab Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-white">
          <div className="max-w-[700px]">
            
            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border border-zinc-100 rounded-xl p-8 bg-zinc-50/30">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-xl font-bold text-white shadow-xl">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">{session?.user?.name || "Admin User"}</h3>
                      <p className="text-sm text-zinc-500 font-medium">Administrator • Since April 2024</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                      <input defaultValue={session?.user?.name || ""} className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                      <input defaultValue={session?.user?.email || ""} readOnly className="w-full px-4 py-2 border border-zinc-100 rounded-lg text-sm bg-zinc-50 text-zinc-400 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="pt-8 border-t border-zinc-100 mt-8 flex justify-end">
                    <button className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-zinc-900/10">Update Profile</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "company" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border border-zinc-100 rounded-xl p-8 bg-zinc-50/30">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Platform Branding
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Platform Display Name</label>
                      <input 
                        value={settings.company_name || "NexPwr Energy Intelligence"} 
                        onChange={(e) => handleSettingChange("company_name", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Support Email (Sends Reports)</label>
                      <input 
                        value={settings.support_email || "reports@nexpwr.ai"} 
                        onChange={(e) => handleSettingChange("support_email", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-zinc-900/5 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Report Header Logo</label>
                      <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center bg-white">
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mx-auto mb-3 font-bold text-emerald-400">NP</div>
                        <p className="text-xs text-zinc-500 font-medium">Click to upload SVG or Transparent PNG</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-zinc-100 mt-8 flex justify-end">
                    <button 
                      onClick={() => saveSettings(["company_name", "support_email"])}
                      disabled={saving !== null}
                      className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-zinc-900/10 disabled:opacity-50"
                    >
                      {saving === "company_name" ? "Saving..." : "Save Branding"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <UsersIcon className="w-3.5 h-3.5" /> Team Invites
                  </h3>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10"
                  >
                    <Plus className="w-3.5 h-3.5" /> Invite User
                  </button>
                </div>
                
                <div className="space-y-3">
                  {invites.length === 0 && !loadingInvites ? (
                    <div className="border-2 border-dashed border-zinc-100 rounded-xl p-12 text-center">
                       <Mail className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                       <p className="text-sm text-zinc-500">No pending invites. Start expanding your team!</p>
                    </div>
                  ) : (
                    invites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-xl shadow-sm group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs ${inv.role === "ADMIN" ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-50 text-zinc-500 border-zinc-100"}`}>
                            {inv.role.substring(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-zinc-900">{inv.email || "Open Link"}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${inv.used ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                {inv.used ? "Joined" : "Pending"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-medium">Expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyLink(`${baseUrl}/invite/${inv.token}`)}
                          className="p-2 text-zinc-300 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "defaults" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border border-zinc-100 rounded-xl p-8 bg-zinc-50/30">
                  <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" /> IEC Inspection Thresholds
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Default PPA Rate ($/kWh)</label>
                      <input 
                        type="number" 
                        value={settings.default_ppa_rate || "0.10"} 
                        step="0.001" 
                        onChange={(e) => handleSettingChange("default_ppa_rate", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Performance Ratio (PR)</label>
                      <input 
                        type="number" 
                        value={settings.default_pr || "0.82"} 
                        step="0.01" 
                        onChange={(e) => handleSettingChange("default_pr", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Min. Irradiance (W/m²)</label>
                      <input 
                        type="number" 
                        value={settings.min_irradiance || "600"} 
                        onChange={(e) => handleSettingChange("min_irradiance", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Emissivity Threshold</label>
                      <input 
                        type="number" 
                        value={settings.default_emissivity || "0.85"} 
                        step="0.01" 
                        onChange={(e) => handleSettingChange("default_emissivity", e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="pt-8 border-t border-zinc-100 mt-8 flex justify-end">
                    <button 
                      onClick={() => saveSettings(["default_ppa_rate", "default_pr", "min_irradiance", "default_emissivity"])}
                      disabled={saving !== null}
                      className="bg-zinc-900 text-white hover:bg-zinc-800 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest shadow-lg shadow-zinc-900/10 disabled:opacity-50"
                    >
                      {saving === "default_ppa_rate" ? "Updating..." : "Update Defaults"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" /> New Access Invite
              </h2>
              <button onClick={() => { setShowInviteModal(false); setNewUrl(""); }} className="text-zinc-300 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newUrl ? (
              <div className="space-y-6">
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Secure Invite Link</p>
                  <p className="text-sm font-mono text-zinc-900 break-all">{newUrl}</p>
                </div>
                <button
                  onClick={() => copyLink(newUrl)}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-900 text-white rounded-xl py-3 text-[13px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Secure Link"}
                </button>
              </div>
            ) : (
              <form onSubmit={createInvite} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                    placeholder="teammate@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Workspace Role</label>
                  <select
                    value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm bg-zinc-50 focus:bg-white transition-all outline-none cursor-pointer"
                  >
                    <option value="CLIENT">Client (Read-Only Workspace)</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                  </select>
                </div>
                <button type="submit" disabled={creating}
                  className="w-full bg-zinc-900 text-white rounded-xl py-3 text-[13px] font-bold uppercase tracking-widest hover:bg-zinc-800 flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-zinc-900/20 active:scale-95 transition-all">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Global Invite
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, User, Shield, Bell, Link2, Plus, Copy, Check, Trash2, Loader2, X } from "lucide-react";

type Invite = {
  id: string; token: string; email: string | null; role: string;
  expiresAt: string; used: boolean; createdAt: string;
};

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CLIENT");
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const loadInvites = () =>
    fetch("/api/invites")
      .then(r => r.json())
      .then(d => { setInvites(Array.isArray(d) ? d : []); setLoadingInvites(false); })
      .catch(() => setLoadingInvites(false));

  useEffect(() => { loadInvites(); }, []);

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
    setTimeout(() => setCopied(false), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8 max-w-[680px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Settings</h1>
        <p className="text-[14px] text-[#888] mt-1">Manage your account, workspace, and team access</p>
      </div>

      {/* Profile */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#eaeaea]">
          <User className="w-4 h-4 text-[#888]" />
          <h3 className="text-sm font-semibold text-[#111]">Profile</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <span className="text-lg font-semibold text-zinc-600">
                {session?.user?.name?.charAt(0) || "A"}
              </span>
            </div>
            <div>
              <p className="font-medium text-[#111]">{session?.user?.name || "Admin User"}</p>
              <p className="text-sm text-[#888]">{session?.user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Display Name</label>
              <input defaultValue={session?.user?.name || ""} className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Email</label>
              <input defaultValue={session?.user?.email || ""} readOnly className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#888] bg-zinc-50 cursor-not-allowed" />
            </div>
          </div>
          <div className="pt-2">
            <button className="bg-[#111] text-white hover:bg-[#333] rounded-md px-4 py-2 text-sm font-medium transition-colors">Save Changes</button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#eaeaea]">
          <Shield className="w-4 h-4 text-[#888]" />
          <h3 className="text-sm font-semibold text-[#111]">Security</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wide">New Password</label>
              <input type="password" placeholder="Enter new password" className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Confirm Password</label>
              <input type="password" placeholder="Repeat password" className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]" />
            </div>
          </div>
          <button className="border border-[#eaeaea] text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-sm font-medium transition-colors">
            Update Password
          </button>
        </div>
      </div>

      {/* Team Invites */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeaea]">
          <div className="flex items-center gap-3">
            <Link2 className="w-4 h-4 text-[#888]" />
            <h3 className="text-sm font-semibold text-[#111]">Invite Management</h3>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 bg-[#111] text-white hover:bg-[#333] rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Create Invite
          </button>
        </div>
        <div className="p-6">
          {loadingInvites ? (
            <div className="text-sm text-[#888] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading invites...</div>
          ) : invites.length === 0 ? (
            <div className="text-sm text-[#888] text-center py-6">
              <Link2 className="w-6 h-6 text-[#ccc] mx-auto mb-2" />
              No invites created yet. Click "Create Invite" to add a team member.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-zinc-50 border border-[#eaeaea] rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#111]">{inv.email || "Open invite"}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${inv.role === "ADMIN" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        {inv.role}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${inv.used ? "bg-emerald-100 text-emerald-700" : new Date(inv.expiresAt) < new Date() ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {inv.used ? "Used" : new Date(inv.expiresAt) < new Date() ? "Expired" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-[#bbb] mt-0.5 font-mono">{inv.token.slice(0, 24)}…</p>
                    <p className="text-xs text-[#bbb] mt-0.5">Expires {new Date(inv.expiresAt).toLocaleDateString("en-GB")}</p>
                  </div>
                  {!inv.used && new Date(inv.expiresAt) > new Date() && (
                    <button
                      onClick={() => copyLink(`${baseUrl}/invite/${inv.token}`)}
                      className="flex items-center gap-1.5 border border-[#eaeaea] text-[#111] hover:bg-zinc-100 rounded px-2.5 py-1.5 text-xs font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#eaeaea] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#111]">Create Invite Link</h2>
              <button onClick={() => { setShowInviteModal(false); setNewUrl(""); }} className="text-[#888] hover:text-[#111] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newUrl ? (
              <div className="space-y-4">
                <div className="bg-zinc-50 border border-[#eaeaea] rounded-lg p-4">
                  <p className="text-xs font-medium text-[#888] mb-2 uppercase tracking-wide">Invite Link (valid 7 days)</p>
                  <p className="text-sm font-mono text-[#111] break-all">{newUrl}</p>
                </div>
                <button
                  onClick={() => copyLink(newUrl)}
                  className="w-full flex items-center justify-center gap-2 bg-[#111] text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-[#333] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Link Copied!" : "Copy Invite Link"}
                </button>
                <button onClick={() => setNewUrl("")} className="w-full text-sm text-[#666] hover:text-[#111]">
                  Create Another
                </button>
              </div>
            ) : (
              <form onSubmit={createInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Email Address</label>
                  <input
                    type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]"
                    placeholder="colleague@company.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Role</label>
                  <select
                    value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]"
                  >
                    <option value="CLIENT">Client — Read-only access</option>
                    <option value="ADMIN">Admin — Full access</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 border border-[#eaeaea] rounded-md text-sm text-[#666] hover:bg-zinc-50">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="px-4 py-2 bg-[#111] text-white rounded-md text-sm font-semibold hover:bg-[#333] flex items-center gap-2 disabled:opacity-60">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

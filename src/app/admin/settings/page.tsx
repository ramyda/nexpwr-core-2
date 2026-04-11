"use client";
import { useSession } from "next-auth/react";
import { Settings, User, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-[640px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111]">Settings</h1>
        <p className="text-[14px] text-[#888] mt-1">Manage your account and workspace preferences</p>
      </div>

      {/* Profile */}
      <div className="border border-[#eaeaea] rounded-lg bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#eaeaea]">
          <User className="w-4 h-4 text-[#888]" />
          <h3 className="text-sm font-semibold text-[#111]">Profile</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Display Name</label>
            <input defaultValue={session?.user?.name || ""} className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111] bg-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Email</label>
            <input defaultValue={session?.user?.email || ""} readOnly className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#888] bg-zinc-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Role</label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-xs font-mono font-medium text-zinc-600">
                {(session?.user as any)?.role || "ADMIN"}
              </span>
            </div>
          </div>
          <div className="pt-2">
            <button className="bg-[#111] text-white hover:bg-[#333] rounded-md px-4 py-2 text-sm font-medium transition-colors">
              Save Changes
            </button>
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
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wide">New Password</label>
            <input type="password" placeholder="Enter new password" className="mt-1.5 block w-full border border-[#eaeaea] rounded-md px-3 py-2 text-sm text-[#111] focus:outline-none focus:border-[#111]" />
          </div>
          <div>
            <button className="border border-[#eaeaea] text-[#111] hover:bg-zinc-50 rounded-md px-4 py-2 text-sm font-medium transition-colors">
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

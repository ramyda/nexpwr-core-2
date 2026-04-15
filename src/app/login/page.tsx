"use client";

import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { NexpwrLogo } from "@/components/icons/NexpwrLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nexpwr.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setError("Incorrect email or password. Please try again.");
      } else if (res?.ok) {
        // Read session to decide where to route
        const session = await getSession();
        const role = (session?.user as any)?.role;
        router.push(role === "CLIENT" ? "/client/dashboard" : "/admin/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError("Connection error. Please try again in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-[400px] border border-zinc-900 bg-zinc-950 p-8 rounded-lg shadow-2xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <NexpwrLogo size={60} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 italic tracking-tight">Nexpwr</h1>
          <p className="text-sm text-zinc-500 mt-2">Energy intelligence for the solar enterprise.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Email Address</label>
            <input
              type="email"
              required
              disabled={loading}
              autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              placeholder="admin@nexpwr.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password + show/hide */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">
              Default: <span className="font-mono text-zinc-500">password123</span>
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-2.5 rounded-md text-sm transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="text-[11px] text-zinc-700 text-center mt-6">
          NexPwr by Elytrus Pvt. Ltd. · Invite-only access
        </p>
      </div>
    </div>
  );
}

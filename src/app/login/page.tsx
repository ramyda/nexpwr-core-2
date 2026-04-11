"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError("An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-[400px] border border-zinc-900 bg-zinc-950 p-8 rounded-lg shadow-2xl">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded bg-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="font-bold text-white tracking-widest text-sm">NP</span>
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center justify-center gap-2">
            Sign in to NexPwr
          </h1>
          <p className="text-sm text-zinc-500 mt-2">Enter your credentials to access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-500 text-xs text-center">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email Address</label>
            <input
              type="email"
              required
              disabled={loading}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="admin@nexpwr.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">Password</label>
            </div>
            <input
              type="password"
              required
              disabled={loading}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2.5 rounded-md text-sm transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

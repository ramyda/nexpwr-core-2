"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type InviteInfo = { email: string; role: string } | null;

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo>(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"accept" | "register" | "done">("accept");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setInfo(d); setLoading(false); })
      .catch(() => { setInvalid(true); setLoading(false); });
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      // Auto sign-in
      await signIn("credentials", { redirect: false, email: info!.email, password });
      setStep("done");
      setTimeout(() => router.push(info!.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
    </div>
  );

  if (invalid) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-[400px] border border-zinc-900 bg-zinc-950 p-8 rounded-lg text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">Invite Expired</h1>
        <p className="text-sm text-zinc-500">This invite link is invalid or has already been used. Contact your administrator for a new link.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-[420px] border border-zinc-900 bg-zinc-950 p-8 rounded-lg shadow-2xl">
        {step === "done" ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-100 mb-2">Welcome to NexPwr!</h2>
            <p className="text-sm text-zinc-500">Your account has been created. Redirecting you to your dashboard...</p>
          </div>
        ) : step === "accept" ? (
          <>
            <div className="text-center mb-8">
              <div className="w-10 h-10 rounded bg-emerald-600 flex items-center justify-center mx-auto mb-6">
                <span className="font-bold text-white text-sm">NP</span>
              </div>
              <h1 className="text-xl font-semibold text-zinc-100 mb-2">You've been invited to NexPwr</h1>
              <p className="text-sm text-zinc-400 mt-1">
                {info?.email ? `Invite for ${info.email}` : "Join your team on the platform."}
              </p>
              <span className="inline-block mt-3 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
                Role: {info?.role || "CLIENT"}
              </span>
            </div>
            <button
              onClick={() => setStep("register")}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-2.5 rounded-md text-sm transition-colors"
            >
              Accept Invite
            </button>
          </>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-10 h-10 rounded bg-emerald-600 flex items-center justify-center mx-auto mb-6">
                <span className="font-bold text-white text-sm">NP</span>
              </div>
              <h1 className="text-xl font-semibold text-zinc-100 text-center mb-1">Create your account</h1>
              <p className="text-sm text-zinc-500 text-center">{info?.email}</p>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-xs text-center">{error}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Full Name</label>
                <input
                  required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ramya Devi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Password</label>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Choose a strong password"
                  minLength={8}
                />
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-2.5 rounded-md text-sm transition-colors mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

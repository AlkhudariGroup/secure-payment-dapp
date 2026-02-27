"use client";

import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";

const STORAGE_KEY = "dr_dxb_app_unlocked";

export function AppGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Only show password gate when NEXT_PUBLIC_APP_PASSWORD is set (e.g. on Vercel). On your laptop with no env, app opens directly.
  const envPassword = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_APP_PASSWORD : undefined;
  const appPassword = envPassword ?? "";
  const hasPassword = !!(envPassword && envPassword.length > 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasPassword) {
      setUnlocked(true);
      return;
    }
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      setUnlocked(saved === "1");
    } catch {
      setUnlocked(false);
    }
  }, [hasPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password === appPassword) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
        setUnlocked(true);
      } catch {
        setUnlocked(true);
      }
    } else {
      setError("Wrong password.");
    }
  };

  if (!hasPassword) return <>{children}<Analytics /></>;
  if (unlocked === null || !mounted) return null;
  if (unlocked) return <>{children}<Analytics /></>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)",
        }}
      />
      <div className="animate-gate-fade-in animate-gate-glow relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-600 bg-slate-800/80 p-8 shadow-xl">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-wide text-slate-100">
          Crypto Wallet Generator
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Enter password to continue
        </p>
        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="app-gate-password" className="sr-only">Password</label>
          <input
            id="app-gate-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            aria-label="Password"
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3.5 text-slate-100 placeholder:text-slate-500 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-400 animate-gate-fade-in" style={{ animationDuration: "0.3s" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-500 active:scale-[0.99]"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}

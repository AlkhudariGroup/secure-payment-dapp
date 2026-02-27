"use client";

import { useWallet } from "@/hooks/useWallet";
import { NETWORKS } from "@/lib/networks";
import { formatWeiToEther } from "@/lib/format";
import Link from "next/link";

export type View = "create" | "history" | "send" | "vendor" | "secure";

export function Sidebar({
  view,
  onViewChange,
  onAddFromLinkClick,
  showAddFromLink,
}: {
  view: View;
  onViewChange: (v: View) => void;
  onAddFromLinkClick?: () => void;
  showAddFromLink?: boolean;
}) {
  const { address, network, chainId, switchNetwork, balanceWei, disconnect } = useWallet();
  const balanceFormatted = balanceWei && network ? formatWeiToEther(balanceWei) : null;

  return (
    <aside className="flex w-full flex-col border-l border-white/5 glass-panel md:w-72 md:flex-shrink-0 min-h-0 backdrop-blur-xl">
      <div className="flex flex-col gap-3 p-4">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gold/70">القائمة الرئيسية</p>
        <nav className="flex flex-row gap-2 md:flex-col">
          <button
            type="button"
            onClick={() => onViewChange("create")}
            className={`rounded-xl px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
              view === "create"
                ? "btn-primary shadow-lg scale-[1.02]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            ✨ إنشاء توكن جديد
          </button>
          <button
            type="button"
            onClick={() => onViewChange("secure")}
            className={`rounded-xl px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
              view === "secure"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg scale-[1.02]"
                : "text-emerald-400 hover:bg-emerald-900/20"
            }`}
          >
            🛡️ دفع آمن (Real USDT)
          </button>
          <button
            type="button"
            onClick={() => onViewChange("history")}
            className={`rounded-xl px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
              view === "history"
                ? "btn-primary shadow-lg scale-[1.02]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            📜 سجل النشرات
          </button>
          <button
            type="button"
            onClick={() => onViewChange("send")}
            className={`rounded-xl px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
              view === "send"
                ? "btn-primary shadow-lg scale-[1.02]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            💸 إرسال من العقد
          </button>
          <button
            type="button"
            onClick={() => onViewChange("vendor")}
            className={`rounded-xl px-4 py-3 text-start text-sm font-bold transition-all duration-300 ${
              view === "vendor"
                ? "btn-primary shadow-lg scale-[1.02]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            🏪 عقد البيع
          </button>
        </nav>

        {address && (
          <button
            type="button"
            onClick={disconnect}
            className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-900/40 hover:border-red-500/40 transition-all"
          >
            تسجيل خروج
          </button>
        )}

        <Link
          href="/tron-balance"
          className="mt-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
        >
          رصيد USDT (TRC-20)
        </Link>

        {showAddFromLink && onAddFromLinkClick && (
          <button
            type="button"
            onClick={onAddFromLinkClick}
            className="mt-2 rounded-xl border border-dashed border-gold/30 bg-gold/5 px-4 py-3 text-sm font-medium text-gold hover:bg-gold/10 transition-all"
          >
            + أضف توكن من الرابط
          </button>
        )}
      </div>

      {address && (
        <div className="mt-auto border-t border-slate-700/80 p-4 space-y-3">
          {network && (
            <select
              value={chainId ?? ""}
              onChange={(e) => switchNetwork(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {Object.entries(NETWORKS).map(([key, n]) => (
                <option key={key} value={n.chainId}>
                  {n.name}
                </option>
              ))}
            </select>
          )}
          <div className="rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">رصيد المحفظة</p>
            {balanceFormatted !== null && network && (
              <p className="text-lg font-bold text-indigo-400">
                {balanceFormatted} {network.symbol}
              </p>
            )}
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              {address.slice(0, 8)}…{address.slice(-6)}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

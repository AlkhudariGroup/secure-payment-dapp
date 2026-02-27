"use client";

import { useState, useCallback, useEffect } from "react";
import { getRestrictedReason } from "@/lib/restrictedNames";
import { NETWORKS } from "@/lib/networks";
import type { TokenParams, ContractType } from "@/types";

interface TokenFormProps {
  onSubmit: (params: TokenParams) => void;
  disabled: boolean;
  hasWallet?: boolean;
  /** When set, form fields are pre-filled (e.g. USDTZ preset). */
  initialValues?: Partial<TokenParams> | null;
}

const DEFAULT_DECIMALS = 18;

export function TokenForm({
  onSubmit,
  disabled,
  hasWallet = true,
  initialValues,
}: TokenFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "Tether USD Bridged ZED20");
  const [symbol, setSymbol] = useState(initialValues?.symbol ?? "USDT.z");
  const [totalSupply, setTotalSupply] = useState(initialValues?.totalSupply ?? "27500000000");
  const [decimals, setDecimals] = useState(initialValues?.decimals ?? DEFAULT_DECIMALS);
  const [networkKey, setNetworkKey] = useState<string>(initialValues?.networkKey ?? "ethereum");
  const [contractType, setContractType] = useState<ContractType>(initialValues?.contractType ?? "simple");
  const [receiverAddress, setReceiverAddress] = useState(initialValues?.receiverAddress ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!disabled) setSubmitting(false);
  }, [disabled]);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.name != null) setName(initialValues.name);
      if (initialValues.symbol != null) setSymbol(initialValues.symbol);
      if (initialValues.totalSupply != null) setTotalSupply(initialValues.totalSupply);
      if (initialValues.decimals != null) setDecimals(initialValues.decimals);
      if (initialValues.networkKey != null) setNetworkKey(initialValues.networkKey);
      if (initialValues.contractType != null) setContractType(initialValues.contractType);
      if (initialValues.receiverAddress != null) setReceiverAddress(initialValues.receiverAddress);
      setValidationError(null);
    }
  }, [initialValues]);

  const validate = useCallback((): boolean => {
    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();
    if (!trimmedName) {
      setValidationError("اسم التوكن مطلوب.");
      return false;
    }
    if (!trimmedSymbol) {
      setValidationError("رمز التوكن مطلوب.");
      return false;
    }
    const restricted = getRestrictedReason(trimmedSymbol, trimmedName);
    if (restricted) {
      setValidationError(restricted);
      return false;
    }
    const supply = parseFloat(totalSupply);
    if (Number.isNaN(supply) || supply <= 0) {
      setValidationError("إجمالي العرض يجب أن يكون رقماً موجباً.");
      return false;
    }
    if (decimals < 0 || decimals > 18) {
      setValidationError("الخانات العشرية بين 0 و 18.");
      return false;
    }
    const net = NETWORKS[networkKey];
    if (!net) {
      setValidationError("اختر شبكة صحيحة.");
      return false;
    }
    setValidationError(null);
    return true;
  }, [name, symbol, totalSupply, decimals, networkKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitting) return;
    if (!validate()) return;
    const net = NETWORKS[networkKey];
    if (!net) return;
    
    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    setSubmitting(true);
    onSubmit({
      name: name.trim(),
      symbol: symbol.trim(),
      totalSupply: totalSupply.trim(),
      decimals,
      networkKey,
      contractType,
      receiverAddress: receiverAddress.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-6 p-6 rounded-2xl glass-panel relative overflow-hidden transition-all duration-500 ${flash ? "ring-2 ring-gold shadow-[0_0_50px_rgba(212,175,55,0.3)]" : ""}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50" />
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">اسم التوكن (Name)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner"
            placeholder="مثال: Tether USD"
            disabled={disabled || submitting}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">الرمز (Symbol)</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner font-mono tracking-wider"
              placeholder="مثال: USDT"
              disabled={disabled || submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">الخانات العشرية</label>
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner font-mono"
              disabled={disabled || submitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">إجمالي العرض (Total Supply)</label>
          <input
            type="text"
            value={totalSupply}
            onChange={(e) => setTotalSupply(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner font-mono"
            placeholder="1000000"
            disabled={disabled || submitting}
          />
          <p className="text-xs text-slate-500 mt-1 text-left" dir="ltr">
            Output: {Number(totalSupply).toLocaleString()} {symbol || "TOKEN"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">الشبكة</label>
          <select
            value={networkKey}
            onChange={(e) => setNetworkKey(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner"
          >
            {Object.entries(NETWORKS).map(([key, n]) => (
              <option key={key} value={key} className="bg-slate-900">
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">نوع العقد</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setContractType("simple")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  contractType === "simple"
                    ? "bg-gold/20 border-gold text-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                بسيط (Simple)
              </button>
              <button
                type="button"
                onClick={() => setContractType("usdtz")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  contractType === "usdtz"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                محمي / قابل للاسترداد (Protected)
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              {contractType === "simple" && "توكن عادي (مثل Bitcoin): بمجرد الإرسال، لا يمكن التراجع عنه. المستلم يملك التوكن 100%."}
              {contractType === "usdtz" && "توكن آمن (Anti-Scam): يمكنك كمسؤول عكس المعاملة وسحب الأموال من المستلم في أي وقت (مثلاً إذا لم يرسل البضاعة)."}
            </p>
         </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">عنوان المستلم (اختياري)</label>
          <input
            type="text"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-slate-600 focus:border-gold focus:ring-1 focus:ring-gold transition-all shadow-inner font-mono"
            placeholder="0x... (اتركه فارغاً للإرسال لنفسك)"
          />
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-200 text-sm animate-pulse">
          ⚠️ {validationError}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="btn-primary w-full py-4 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:grayscale transition-all mt-2 relative overflow-hidden group"
      >
        <span className="relative z-10">{submitting ? "جاري النشر..." : "🚀 نشر التوكن الآن"}</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>
      
      {!hasWallet && (
        <p className="text-center text-xs text-slate-500">
          يجب توصيل المحفظة أولاً
        </p>
      )}
    </form>
  );
}

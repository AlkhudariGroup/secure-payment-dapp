"use client";

import { getDeploymentHistory, getVendorHistory, updateDeploymentLabel, clearAllHistory } from "@/lib/history";
import { getVerificationInfo } from "@/lib/verifyContract";
import type { DeploymentRecord } from "@/types";
import { useMemo, useState, useEffect } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { precompiledUsdtz } from "@/lib/precompiledUsdtz";

function ExplorerLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
    >
      {children}
    </a>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("ar", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Stablecoin symbols we treat as ~$1 for estimated value in app (wallet shows $0 until listed on DEX). */
const STABLECOIN_SYMBOLS = new Set(["USDT", "USDC", "BUSD", "DAI", "USDT.Z", "USDTZ"]);
function getEstimatedUsd(record: DeploymentRecord): string | null {
  const sym = (record.tokenSymbol ?? "").trim().toUpperCase();
  if (!STABLECOIN_SYMBOLS.has(sym)) return null;
  const supplyStr = record.totalSupply ?? "";
  const supply = parseFloat(supplyStr);
  if (Number.isNaN(supply) || supply <= 0) return null;
  const decimals = record.decimals ?? 18;
  const human = supply / Math.pow(10, decimals);
  if (human >= 1e9) return `≈ $${(human / 1e9).toFixed(2)}B USD`;
  if (human >= 1e6) return `≈ $${(human / 1e6).toFixed(2)}M USD`;
  if (human >= 1e3) return `≈ $${(human / 1e3).toFixed(2)}K USD`;
  return `≈ $${human.toFixed(2)} USD`;
}

/** Relative time in Arabic: "منذ دقيقة"، "منذ ٤ دقائق"، "منذ ساعة"، "منذ يوم"، إلخ */
function formatTimeAgo(ts: number, nowMs: number = Date.now()): string {
  const diffMs = nowMs - ts;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "منذ لحظات";
  if (diffMin === 1) return "منذ دقيقة";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHour === 1) return "منذ ساعة";
  if (diffHour < 24) return `منذ ${diffHour} ساعة`;
  if (diffDay === 1) return "منذ يوم";
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  return formatTime(ts);
}

export function DeploymentHistory({
  refreshTrigger = 0,
  onDuplicate,
}: {
  refreshTrigger?: number;
  onDuplicate?: (record: DeploymentRecord) => void;
}) {
  const [labelUpdateTrigger, setLabelUpdateTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const history = useMemo(
    () => (mounted ? getDeploymentHistory() : []),
    [mounted, refreshTrigger, labelUpdateTrigger]
  );
  const vendorCount = mounted ? getVendorHistory().length : 0;
  useEffect(() => setMounted(true), []);
  const [editingLabelFor, setEditingLabelFor] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedLinkFor, setCopiedLinkFor] = useState<string | null>(null);
  /** Optional price per unit to show to receiver in the share link (e.g. "1" for $1). */
  const [priceForLink, setPriceForLink] = useState<Record<string, string>>({});
  const [verifyOpenFor, setVerifyOpenFor] = useState<string | null>(null);
  const [manageOpenFor, setManageOpenFor] = useState<string | null>(null);
  const [refundAddress, setRefundAddress] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundStatus, setRefundStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [refundError, setRefundError] = useState<string | null>(null);

  const [copiedConstructorArgs, setCopiedConstructorArgs] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  function getShareLink(record: DeploymentRecord): string {
    if (typeof window === "undefined") return "";
    const base = window.location.origin + (window.location.pathname || "/");
    const chainId = record.networkKey === "bsc" ? 56 : 1;
    let url = `${base}?add=${encodeURIComponent(record.contractAddress)}&symbol=${encodeURIComponent(record.tokenSymbol)}&decimals=${record.decimals ?? 18}&chainId=${chainId}`;
    const price = priceForLink[record.contractAddress]?.trim();
    if (price !== undefined && price !== "") url += `&price=${encodeURIComponent(price)}`;
    return url;
  }

  // Refresh relative time every minute (only after mount to avoid hydration mismatch)
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [mounted]);

  return (
    <section className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <h2 className="mb-2 text-xl font-bold text-white relative z-10">
        📜 التوكنات المنشورة (History)
      </h2>
      <p className="mb-4 text-sm text-slate-400 relative z-10">
        سجل بجميع التوكنات التي قمت بإنشائها. يمكنك نسخ العقد، التحقق منه، أو مشاركته مع الآخرين.
      </p>

      {(history.length > 0 || vendorCount > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2 relative z-10">
          {!clearConfirm ? (
            <button
              type="button"
              onClick={() => setClearConfirm(true)}
              className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50 transition-colors"
            >
              🗑️ مسح السجل
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-950/50 p-1 rounded-lg border border-red-500/30">
              <span className="text-xs text-red-200 px-2">تأكيد المسح؟</span>
              <button
                type="button"
                onClick={() => {
                  clearAllHistory();
                  setClearConfirm(false);
                  setLabelUpdateTrigger((t) => t + 1);
                }}
                className="rounded px-2 py-1 text-xs font-bold bg-red-600 text-white hover:bg-red-500"
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => setClearConfirm(false)}
                className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs text-gold/80 relative z-10">
        <p className="font-bold text-gold mb-1">💡 لم تظهر العملات في المحفظة؟</p>
        <p>يجب إضافة التوكن يدوياً في MetaMask أو Trust Wallet باستخدام <strong>عنوان العقد (Contract Address)</strong> الموجود بالأسفل.</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-black/20 p-8 text-center text-sm text-slate-500 relative z-10">
          لا توجد توكنات منشورة بعد. ابدأ بإنشاء أول توكن لك! 🚀
        </div>
      ) : (
        <ul className="space-y-4 relative z-10">
          {history.slice(0, 10).map((record: DeploymentRecord, i: number) => {
            const estimatedUsd = getEstimatedUsd(record);
            const addressUrl = record.explorerUrl.includes("etherscan")
              ? record.explorerUrl.replace(/\/tx\/.*$/, "/address/" + record.contractAddress)
              : record.explorerUrl.replace(/\/tx\/.*$/, "/address/" + record.contractAddress);
            const explorerBase = record.explorerUrl.replace(/\/tx\/.*$/, "");
            const verification = getVerificationInfo(record, explorerBase);
            const showVerifyPanel = verifyOpenFor === record.contractAddress;
            return (
              <li
                key={`${record.contractAddress}-${record.timestamp}-${i}`}
                className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/40 p-4 transition-all hover:border-gold/30 hover:bg-black/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-white">
                        {record.tokenName} <span className="text-gold">({record.tokenSymbol})</span>
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5">
                        {record.networkName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{formatTimeAgo(record.timestamp)}</span>
                      {estimatedUsd && (
                        <span className="text-emerald-400 font-mono"> • {estimatedUsd}</span>
                      )}
                    </div>
                  </div>
                  
                  {editingLabelFor === record.contractAddress ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        placeholder="تسمية..."
                        className="w-32 rounded-lg border border-slate-600 bg-black/50 px-2 py-1 text-xs text-white focus:border-gold"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateDeploymentLabel(record.contractAddress, editLabelValue);
                          setEditingLabelFor(null);
                          setLabelUpdateTrigger((t) => t + 1);
                        }}
                        className="text-xs text-gold hover:underline"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLabelFor(record.contractAddress);
                        setEditLabelValue(record.label || "");
                      }}
                      className="text-xs text-slate-600 hover:text-gold transition-colors"
                    >
                      {record.label ? `🏷️ ${record.label}` : "+ إضافة تسمية"}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                   <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1 border border-white/5">
                     <code className="text-xs text-slate-300 font-mono px-2">
                       {record.contractAddress.slice(0, 6)}...{record.contractAddress.slice(-4)}
                     </code>
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(record.contractAddress);
                         setCopiedAddress(record.contractAddress);
                         setTimeout(() => setCopiedAddress(null), 2000);
                       }}
                       className="p-1 hover:text-gold text-slate-500 transition-colors"
                       title="نسخ العنوان"
                     >
                       {copiedAddress === record.contractAddress ? "✓" : "📋"}
                     </button>
                     <ExplorerLink url={addressUrl}>
                       <span className="text-xs px-2 hover:text-gold transition-colors">↗️</span>
                     </ExplorerLink>
                   </div>

                   <div className="flex-1" />
 
                    {record.contractType === "usdtz" && (
                      <button
                        onClick={() => {
                          setManageOpenFor(manageOpenFor === record.contractAddress ? null : record.contractAddress);
                          setVerifyOpenFor(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          manageOpenFor === record.contractAddress
                            ? "bg-red-500/20 border-red-500 text-red-300"
                            : "border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/50"
                        }`}
                      >
                        {manageOpenFor === record.contractAddress ? "إغلاق لوحة الحماية" : "🛡️ حماية / استرداد الأموال"}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setVerifyOpenFor(showVerifyPanel ? null : record.contractAddress);
                        setManageOpenFor(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        showVerifyPanel 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "border-white/10 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50"
                      }`}
                    >
                      {showVerifyPanel ? "إغلاق التحقق" : "🛡️ توثيق العقد"}
                    </button>

                   <a
                     href={getShareLink(record)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-xs font-bold hover:bg-gold/20 transition-all"
                   >
                     🔗 رابط المشاركة
                   </a>
                   
                   {onDuplicate && (
                     <button
                       onClick={() => onDuplicate(record)}
                       className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition-all"
                     >
                       🔄 تكرار
                     </button>
                   )}
                </div>
                 
                 {manageOpenFor === record.contractAddress && (
                   <div className="mt-4 w-full rounded-xl border border-red-500/30 bg-black/40 p-6 text-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500/50 to-transparent" />
                     
                     <p className="mb-3 font-bold text-red-400 flex items-center gap-2">
                       <span>🛡️</span> استرداد الأموال (Payment Protection / Refund)
                     </p>
                     
                     <div className="bg-red-950/20 p-4 rounded-lg border border-red-500/20 mb-4">
                       <p className="text-xs text-red-200 mb-2 leading-relaxed">
                         <strong>حماية ضد الاحتيال:</strong> بصفتك مالك العقد، يمكنك سحب التوكنات من المحفظة المستلمة وإعادتها إليك.
                         <br/>
                         هذا مفيد إذا لم يقم الطرف الآخر بتنفيذ الاتفاق (مثل عدم شحن البضاعة).
                       </p>
                       
                       <div className="space-y-3">
                         <div>
                           <label className="block text-xs font-medium text-slate-400 mb-1">عنوان المحفظة (المحتال / البائع)</label>
                           <input
                             type="text"
                             value={refundAddress}
                             onChange={(e) => setRefundAddress(e.target.value)}
                             placeholder="0x..."
                             className="w-full rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-medium text-slate-400 mb-1">المبلغ المراد استرداده</label>
                           <input
                             type="text"
                             value={refundAmount}
                             onChange={(e) => setRefundAmount(e.target.value)}
                             placeholder="مثال: 1000"
                             className="w-full rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                           />
                         </div>
                         
                         {refundError && <p className="text-xs text-red-400">{refundError}</p>}
                         {refundStatus === "success" && <p className="text-xs text-emerald-400 font-bold">تم استرداد الأموال بنجاح! عادت إلى محفظتك. ✓</p>}
                         
                         <button
                           onClick={async () => {
                             if (!refundAddress || !refundAmount) return;
                             setRefundStatus("processing");
                             setRefundError(null);
                             try {
                               if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
                               const provider = new BrowserProvider(window.ethereum as any);
                               const signer = await provider.getSigner();
                               const contract = new Contract(record.contractAddress, JSON.parse(precompiledUsdtz.abi), signer);
                               
                               const decimals = record.decimals || 18;
                               const amountWei = parseUnits(refundAmount, decimals);
                               
                               const tx = await contract.clawback(refundAddress, amountWei);
                               await tx.wait();
                               
                               setRefundStatus("success");
                               setTimeout(() => setRefundStatus("idle"), 3000);
                             } catch (err: any) {
                               console.error(err);
                               setRefundError(err?.message || "فشلت العملية");
                               setRefundStatus("error");
                             }
                           }}
                           disabled={refundStatus === "processing"}
                           className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 shadow-lg shadow-red-900/20"
                         >
                           {refundStatus === "processing" ? "جاري سحب الأموال..." : "🚨 تنفيذ الاسترداد (Force Refund)"}
                         </button>
                       </div>
                     </div>
                   </div>
                 )}

                 {showVerifyPanel && (
                  <div className="mt-4 w-full rounded-xl border border-emerald-500/30 bg-black/40 p-6 text-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                    
                    <p className="mb-3 font-bold text-emerald-400 flex items-center gap-2">
                      <span>🛡️</span> تحقق من العقد (Verify Contract)
                    </p>
                    
                    <ol className="mb-4 list-decimal list-inside space-y-2 text-xs text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
                      <li>اضغط «فتح صفحة التحقق» أدناه.</li>
                      <li>اختر <strong>Solidity (Single file)</strong>، المترجم <strong>{verification.compilerVersion}</strong>.</li>
                      <li>انسخ كود المصدر من الرابط «كود المصدر» أو من ملف <code className="text-gold">public/contracts/ERC20Template.sol</code>.</li>
                      <li>الصقه في الحقل في Etherscan/BscScan.</li>
                      <li>انسخ <strong>Constructor Arguments</strong> من الأسفل والصقه في الحقل المخصص.</li>
                      <li>اضغط <strong>Verify and Publish</strong>.</li>
                    </ol>
                    
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <a
                        href={verification.verifyPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary rounded-lg px-4 py-2 text-xs font-bold shadow-lg"
                      >
                        🚀 فتح صفحة التحقق
                      </a>
                      <a
                        href="/contracts/ERC20Template.sol"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-all"
                      >
                        📄 كود المصدر
                      </a>
                    </div>
                    
                    {verification.supported ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 block">Constructor Arguments (للنسخ):</label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded bg-black/60 border border-white/10 px-3 py-2 font-mono text-xs text-gold/80" title={verification.constructorArgumentsHex}>
                            {verification.constructorArgumentsHex.slice(0, 60)}…
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(verification.constructorArgumentsHex);
                              setCopiedConstructorArgs(record.contractAddress);
                              setTimeout(() => setCopiedConstructorArgs(null), 2000);
                            }}
                            className="rounded-lg bg-emerald-600/20 border border-emerald-500/50 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600/30 transition-all"
                          >
                            {copiedConstructorArgs === record.contractAddress ? "تم النسخ ✓" : "نسخ"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400 bg-amber-900/20 p-2 rounded border border-amber-500/20">
                        ⚠️ هذا العقد ({verification.contractName}) يتطلب كود مصدر خاص. يرجى التحقق من ملفات المشروع.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { NETWORKS, getExplorerAddressUrl } from "@/lib/networks";
import { getDeploymentHistory, getVendorHistory, addVendorDeployment } from "@/lib/history";
import { deployVendor } from "@/lib/deploy";
import { formatWeiToEther } from "@/lib/format";
import type { DeploymentRecord } from "@/types";
import type { VendorRecord } from "@/types";

function getNetworkKeyByChainId(chainId: number): string | undefined {
  return Object.entries(NETWORKS).find(([, n]) => n.chainId === chainId)?.[0];
}

export function VendorSection() {
  const { signer, address: walletAddress, network, switchNetwork, balanceWei } = useWallet();
  const [tokenSelect, setTokenSelect] = useState<string>("");
  const [tokensPerOneNative, setTokensPerOneNative] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVendor, setLastVendor] = useState<{ address: string; explorerUrl: string } | null>(null);

  const history = getDeploymentHistory();
  const vendorHistory = getVendorHistory();
  const networkKey = network ? getNetworkKeyByChainId(network.chainId) : undefined;
  const tokensOnNetwork = networkKey
    ? history.filter((r: DeploymentRecord) => (r.networkKey ?? (r.networkName?.toLowerCase().includes("bsc") ? "bsc" : "ethereum")) === networkKey)
    : [];
  const selectedRecord = tokenSelect ? tokensOnNetwork.find((r) => r.contractAddress === tokenSelect) : null;
  const decimals = selectedRecord?.decimals ?? 18;

  const handleDeployVendor = useCallback(async () => {
    if (!signer || !walletAddress || !network) {
      setError("اتصل بالمحفظة أولاً واختر الشبكة.");
      return;
    }
    if (!selectedRecord) {
      setError("اختر توكن من سجل النشرات (نفس الشبكة).");
      return;
    }
    const raw = tokensPerOneNative.trim();
    const num = parseFloat(raw);
    if (Number.isNaN(num) || num <= 0) {
      setError("أدخل عدد التوكنات مقابل 1 " + network.symbol + " (رقم موجب).");
      return;
    }
    const tokensPerEther = BigInt(Math.floor(num)) * BigInt(10 ** decimals);
    if (tokensPerEther <= BigInt(0)) {
      setError("القيمة صغيرة جداً.");
      return;
    }

    setError(null);
    setDeploying(true);
    setLastVendor(null);
    try {
      const targetNetwork = network;
      const result = await deployVendor(
        {
          tokenAddress: selectedRecord.contractAddress,
          tokensPerEther: tokensPerEther.toString(),
          ownerAddress: walletAddress,
        },
        signer,
        targetNetwork
      );

      if (!result.success) {
        setError(result.error ?? "فشل النشر.");
        return;
      }

      addVendorDeployment({
        vendorAddress: result.vendorAddress,
        tokenAddress: selectedRecord.contractAddress,
        tokenSymbol: selectedRecord.tokenSymbol,
        tokensPerEther: tokensPerEther.toString(),
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        chainId: targetNetwork.chainId,
        timestamp: Date.now(),
      });
      setLastVendor({ address: result.vendorAddress, explorerUrl: result.explorerUrl });
    } finally {
      setDeploying(false);
    }
  }, [signer, walletAddress, network, selectedRecord, tokensPerOneNative, decimals]);

  const copyVendorAddress = (addr: string) => {
    try {
      navigator.clipboard.writeText(addr);
    } catch {}
  };

  const explorers = Object.values(NETWORKS);

  return (
    <section className="w-full space-y-4">
      <div className="rounded-2xl border border-slate-600/60 bg-slate-800/40 p-6">
        <h2 className="mb-2 text-lg font-semibold text-indigo-300">عقد بيع التوكن مقابل {network?.symbol ?? "ETH/BNB"}</h2>
        <p className="mb-4 text-sm text-slate-400">
          انشر عقداً يسمح للآخرين بشراء توكنك مقابل {network?.symbol ?? "ETH/BNB"}. الأموال تذهب لمحفظتك. بعد النشر انقل التوكنات إلى عنوان العقد.
        </p>

        {!signer && (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
            اتصل بالمحفظة من الأعلى أولاً.
          </p>
        )}

        {signer && network && (
          <>
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-400">التوكن (من سجل النشرات — نفس الشبكة)</label>
              <select
                value={tokenSelect}
                onChange={(e) => setTokenSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">— اختر توكن —</option>
                {tokensOnNetwork.map((r) => (
                  <option key={r.contractAddress} value={r.contractAddress}>
                    {r.tokenSymbol} — {r.contractAddress.slice(0, 10)}…
                  </option>
                ))}
              </select>
              {tokensOnNetwork.length === 0 && (
                <p className="text-xs text-amber-400">لا توجد نشرات على هذه الشبكة. انشر توكن أولاً من «إنشاء توكن جديد» ثم اختره هنا.</p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <label htmlFor="vendor-tokens-per-one" className="block text-xs font-medium text-slate-400">
                عدد التوكنات مقابل 1 {network.symbol} (سعر الوحدة)
              </label>
              <input
                id="vendor-tokens-per-one"
                name="tokensPerOneNative"
                type="text"
                value={tokensPerOneNative}
                onChange={(e) => setTokensPerOneNative(e.target.value)}
                placeholder="مثال: 1000"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {lastVendor && (
              <div className="mt-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/15 p-4">
                <p className="font-semibold text-emerald-100">تم نشر عقد البيع ✓</p>
                <p className="mt-1 text-xs text-emerald-200/90">انقل التوكنات إلى عنوان العقد أدناه حتى يتمكن المشترون من الشراء.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="rounded bg-slate-900/80 px-2 py-1 font-mono text-sm text-indigo-300 break-all">
                    {lastVendor.address}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyVendorAddress(lastVendor.address)}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
                  >
                    نسخ
                  </button>
                  <a
                    href={getExplorerAddressUrl(network.blockExplorer, lastVendor.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-indigo-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    المستكشف
                  </a>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDeployVendor}
                disabled={deploying || !selectedRecord || !tokensPerOneNative.trim()}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deploying ? "جاري النشر…" : "نشر عقد البيع"}
              </button>
              {balanceWei != null && network && (
                <span className="text-xs text-slate-500">
                  الرصيد: {formatWeiToEther(balanceWei)} {network.symbol} (للغاز)
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {vendorHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-600/60 bg-slate-800/40 p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">عقود البيع السابقة</h3>
          <ul className="space-y-2">
            {vendorHistory.map((v: VendorRecord) => {
              const net = explorers.find((n) => n.chainId === v.chainId);
              return (
                <li
                  key={v.vendorAddress}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-indigo-300">{v.tokenSymbol}</span>
                  <span className="text-slate-500">—</span>
                  <code className="font-mono text-xs text-slate-400 truncate max-w-[140px]">{v.vendorAddress}</code>
                  <button
                    type="button"
                    onClick={() => copyVendorAddress(v.vendorAddress)}
                    className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600"
                  >
                    نسخ
                  </button>
                  {net && (
                    <a
                      href={getExplorerAddressUrl(net.blockExplorer, v.vendorAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      المستكشف
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            شارك عنوان العقد مع المشترين — يرسلون {network?.symbol ?? "ETH/BNB"} للعقد ويستلمون التوكن تلقائياً.
          </p>
        </div>
      )}
    </section>
  );
}

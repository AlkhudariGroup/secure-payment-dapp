"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchTronBalance, type TronBalanceResult } from "@/lib/tron-balance";
import { tronHexToBase58 } from "@/lib/tron-address";

export default function TronBalancePage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TronBalanceResult | null>(null);
  const [tronScanUrl, setTronScanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result || result.error) {
      setTronScanUrl(null);
      return;
    }
    const a = result.address.trim();
    if (a.startsWith("T")) {
      setTronScanUrl(`https://tronscan.org/#/address/${a}`);
      return;
    }
    let hex = a.startsWith("0x") || a.startsWith("0X") ? "41" + a.slice(2).toLowerCase() : a;
    if (!hex.startsWith("41")) hex = "41" + hex;
    tronHexToBase58(hex).then((base58) => {
      if (base58) setTronScanUrl(`https://tronscan.org/#/address/${base58}`);
      else setTronScanUrl(`https://tronscan.org/#/address/${hex}`);
    });
  }, [result]);

  const handleCheck = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setResult(null);
    setTronScanUrl(null);
    try {
      const r = await fetchTronBalance(address.trim());
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-[rgba(212,175,55,0.2)] bg-black">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-sm font-medium text-[#a0a0a0] hover:text-[#f4e4bc]"
          >
            ← DR DXB Server
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10">
        <h1
          className="mb-2 text-xl font-semibold"
          style={{ color: "#f4e4bc", textShadow: "0 0 20px rgba(212, 175, 55, 0.3)" }}
        >
          Check TRC-20 balance / التحقق من رصيد USDT على Tron
        </h1>
        <p className="mb-6 text-sm text-[#a0a0a0]">
          Enter your <strong>wallet address only</strong> (the one you sent USDT to). Do not enter your recovery phrase or private key anywhere.
          <span className="mt-2 block" dir="rtl">
            أدخل <strong>عنوان المحفظة فقط</strong> (الذي أرسلت إليه USDT). لا تدخل عبارة الاسترداد أو المفتاح الخاص أبداً.
          </span>
        </p>

        <div
          className="rounded-xl p-6"
          style={{
            border: "1px solid rgba(212, 175, 55, 0.2)",
            backgroundColor: "#050505",
            boxShadow: "0 0 24px rgba(212, 175, 55, 0.06)",
          }}
        >
          <label className="mb-2 block text-sm text-[#c4c4c4]">
            Wallet address / عنوان المحفظة (0x... or T...)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... or T..."
            className="input-gold w-full rounded-lg border border-[rgba(212,175,55,0.2)] bg-black px-4 py-3 font-mono text-sm text-[#e5e5e5] placeholder:text-[#666]"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={loading || !address.trim()}
            className="mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.4)",
              backgroundColor: "rgba(212, 175, 55, 0.1)",
              color: "#f4e4bc",
            }}
          >
            {loading ? "جاري التحقق… / Checking…" : "عرض الرصيد / Check balance"}
          </button>
        </div>

        {result && (
          <div
            className="mt-6 rounded-xl p-6"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.2)",
              backgroundColor: "#050505",
            }}
          >
            {result.error ? (
              <p className="text-sm text-red-400">{result.error}</p>
            ) : (
              <>
                <p className="mb-3 text-sm text-[#a0a0a0]">TRON (Tron network)</p>
                <p className="text-lg font-semibold text-[#f4e4bc]">
                  TRX: <span className="font-mono">{result.trxBalance ?? "0"}</span>
                </p>
                <p className="mt-2 text-lg font-semibold text-[#f4e4bc]">
                  USDT (TRC-20): <span className="font-mono">{result.usdtTrc20 ?? "0"}</span>
                </p>
                <p className="mt-4 text-sm text-[#888]">
                  To use this balance you need a Tron wallet (e.g. TronLink). Import your wallet there with your recovery phrase — never enter your phrase on any website.
                </p>
                <p className="mt-2 text-sm text-[#888]" dir="rtl">
                  لاستخدام هذا الرصيد تحتاج محفظة Tron (مثل TronLink). استورد محفظتك هناك بعبارة الاسترداد — ولا تدخل العبارة أبداً على أي موقع.
                </p>
                {tronScanUrl && (
                <a
                  href={tronScanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-[#d4af37] hover:underline"
                >
                  View on TronScan →
                </a>
              )}
              </>
            )}
          </div>
        )}

        <div
          className="mt-8 rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200"
          role="alert"
        >
          <strong>Security:</strong> This page only reads your public balance. We never ask for your recovery phrase or private key. Do not enter them on any website.
          <span className="mt-2 block" dir="rtl">
            <strong>الأمان:</strong> هذه الصفحة تقرأ رصيدك العام فقط. لا نطلب أبداً عبارة الاسترداد أو المفتاح الخاص. لا تدخلها على أي موقع.
          </span>
        </div>
      </main>
    </div>
  );
}

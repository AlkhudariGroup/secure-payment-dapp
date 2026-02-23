"use client";

import { useWallet } from "@/hooks/useWallet";
import { NETWORKS } from "@/lib/networks";

export function Header() {
  const { address, network, chainId, connect, switchNetwork, isConnecting, error } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="border-b border-[rgba(212,175,55,0.2)] bg-black">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-semibold tracking-tight"
            style={{
              color: "#f4e4bc",
              textShadow: "0 0 24px rgba(212, 175, 55, 0.4)",
            }}
          >
            DR DXB Server
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-xs font-medium"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.35)",
              backgroundColor: "rgba(212, 175, 55, 0.08)",
              color: "#d4af37",
            }}
          >
            Client-side
          </span>
        </div>

        <div className="flex items-center gap-3">
          {network && (
            <select
              value={chainId ?? ""}
              onChange={(e) => switchNetwork(Number(e.target.value))}
              className="rounded-lg border border-[rgba(212,175,55,0.2)] bg-black px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[rgba(212,175,55,0.3)]"
            >
              {Object.entries(NETWORKS).map(([key, n]) => (
                <option key={key} value={n.chainId}>
                  {n.name}
                </option>
              ))}
            </select>
          )}
          {address ? (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                border: "1px solid rgba(212, 175, 55, 0.2)",
                backgroundColor: "rgba(0,0,0,0.8)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "#d4af37" }}
              />
              <span className="font-mono text-sm text-[#c4c4c4]">{shortAddress}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                border: "1px solid rgba(212, 175, 55, 0.4)",
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                color: "#f4e4bc",
              }}
            >
              {isConnecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </header>
  );
}

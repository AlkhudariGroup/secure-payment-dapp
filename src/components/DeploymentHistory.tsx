"use client";

import { getDeploymentHistory } from "@/lib/history";
import type { DeploymentRecord } from "@/types";
import { useMemo } from "react";

const goldBorder = "1px solid rgba(212, 175, 55, 0.2)";
const goldText = "#d4af37";
const goldLight = "#f4e4bc";
const muted = "#888";

function ExplorerLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-sm hover:underline"
      style={{ color: goldText }}
    >
      {children}
    </a>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DeploymentHistory({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const history = useMemo(() => getDeploymentHistory(), [refreshTrigger]);

  return (
    <section
      className="rounded-xl p-5"
      style={{
        border: goldBorder,
        backgroundColor: "#050505",
        boxShadow: "0 0 20px rgba(212, 175, 55, 0.06)",
      }}
    >
      <h2
        className="mb-2 text-base font-semibold"
        style={{ color: goldLight, textShadow: "0 0 16px rgba(212, 175, 55, 0.25)" }}
      >
        Your Deployed Tokens
      </h2>
      <p className="mb-4 text-sm" style={{ color: muted }}>
        After deployment they appear here. To see balance in MetaMask: copy contract address then Import token.
      </p>
      {history.length === 0 ? (
        <div
          className="rounded-lg p-5 text-center text-sm"
          style={{
            border: "1px solid rgba(212, 175, 55, 0.1)",
            backgroundColor: "#0a0a0a",
            color: muted,
          }}
        >
          No deployments yet. Deploy a token using the form below.
        </div>
      ) : (
        <ul className="space-y-3">
          {history.slice(0, 10).map((record: DeploymentRecord, i: number) => {
            const addressUrl = record.explorerUrl.includes("etherscan")
              ? record.explorerUrl.replace(/\/tx\/.*$/, "/address/" + record.contractAddress)
              : record.explorerUrl.replace(/\/tx\/.*$/, "/address/" + record.contractAddress);
            return (
              <li
                key={`${record.contractAddress}-${record.timestamp}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 text-sm"
                style={{
                  border: "1px solid rgba(212, 175, 55, 0.12)",
                  backgroundColor: "#0a0a0a",
                }}
              >
                <div>
                  <span className="font-medium" style={{ color: "#e0e0e0" }}>
                    {record.tokenName} ({record.tokenSymbol})
                  </span>
                  <span className="ml-2" style={{ color: muted }}>· {record.networkName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ExplorerLink url={addressUrl}>
                    {record.contractAddress.slice(0, 8)}...{record.contractAddress.slice(-6)}
                  </ExplorerLink>
                  <span style={{ color: muted }}>{formatTime(record.timestamp)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

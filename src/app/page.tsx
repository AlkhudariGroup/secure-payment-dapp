"use client";

import { useState, useCallback } from "react";
import { BrowserProvider } from "ethers";
import { Header } from "@/components/Header";
import { TokenForm } from "@/components/TokenForm";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { DeploymentHistory } from "@/components/DeploymentHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useWallet } from "@/hooks/useWallet";
import { NETWORKS, getExplorerAddressUrl } from "@/lib/networks";
import { addDeployment } from "@/lib/history";
import type { TokenParams } from "@/types";

export default function Home() {
  const { signer, network, switchNetwork } = useWallet();
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    contractAddress: string;
    txHash: string;
    explorerTxUrl: string;
    explorerAddressUrl: string;
    tokenName: string;
    tokenSymbol: string;
  } | null>(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const handleDeploy = useCallback(
    async (params: TokenParams) => {
      setDeployError(null);
      if (typeof window === "undefined" || !window.ethereum) {
        setDeployError("Connect your wallet (MetaMask) first.");
        return;
      }
      const targetNetwork = NETWORKS[params.networkKey];
      if (!targetNetwork) {
        setDeployError("Invalid network.");
        return;
      }
      setDeploying(true);
      try {
        if (network?.chainId !== targetNetwork.chainId) {
          await switchNetwork(targetNetwork.chainId);
        }
        const provider = new BrowserProvider(window.ethereum);
        const currentSigner = await provider.getSigner();
        const { deployToken } = await import("@/lib/deploy");
        const result = await deployToken(params, currentSigner, targetNetwork);

        if (!result.success) {
          setDeployError(result.error ?? "Deployment failed.");
          return;
        }

        addDeployment({
          contractAddress: result.contractAddress,
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          tokenName: params.name,
          tokenSymbol: params.symbol,
          networkName: targetNetwork.name,
          timestamp: Date.now(),
        });
        setHistoryTrigger((t) => t + 1);
        setSuccessResult({
          contractAddress: result.contractAddress,
          txHash: result.txHash,
          explorerTxUrl: result.explorerUrl,
          explorerAddressUrl: getExplorerAddressUrl(targetNetwork.blockExplorer, result.contractAddress),
          tokenName: params.name,
          tokenSymbol: params.symbol,
        });
      } catch (e) {
        setDeployError(e instanceof Error ? e.message : "Deployment failed.");
      } finally {
        setDeploying(false);
      }
    },
    [network?.chainId, switchNetwork]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Header />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 text-center">
          <p className="text-[#a0a0a0]">
            Create and deploy a standard ERC-20 token from your browser. No Remix, no server signing.
          </p>
          <p className="mt-2 text-sm text-[rgba(212,175,55,0.85)]">
            This platform provides technical tools only and does not create investment products.
          </p>
        </div>

        <section className="mb-8">
          <DeploymentHistory refreshTrigger={historyTrigger} />
        </section>

        <section
          className="rounded-xl p-6"
          style={{
            border: "1px solid rgba(212, 175, 55, 0.2)",
            backgroundColor: "#050505",
            boxShadow: "0 0 24px rgba(212, 175, 55, 0.06)",
          }}
        >
          <h1
            className="mb-6 text-lg font-semibold"
            style={{ color: "#f4e4bc", textShadow: "0 0 20px rgba(212, 175, 55, 0.3)" }}
          >
            Create Token
          </h1>
          <TokenForm
            onSubmit={handleDeploy}
            disabled={deploying}
            hasWallet={!!signer}
          />
          {!signer && (
            <p
              className="mt-3 rounded-lg px-3 py-2 text-sm"
              style={{
                border: "1px solid rgba(212, 175, 55, 0.2)",
                backgroundColor: "rgba(212, 175, 55, 0.06)",
                color: "#f4e4bc",
              }}
            >
              Connect your wallet first: click &quot;Connect MetaMask&quot; above, then deploy.
            </p>
          )}
          {deployError && (
            <p className="mt-3 text-sm text-red-400">{deployError}</p>
          )}
          {deploying && (
            <p className="mt-3 text-sm text-[#888]">
              Loading compiler (first time may take 10–30s)… Then compiling and deploying. Do not close the browser. MetaMask may open for signing.
            </p>
          )}
        </section>
      </main>

      {successResult && (
        <SuccessAnimation
          contractAddress={successResult.contractAddress}
          txHash={successResult.txHash}
          explorerTxUrl={successResult.explorerTxUrl}
          explorerAddressUrl={successResult.explorerAddressUrl}
          tokenName={successResult.tokenName}
          tokenSymbol={successResult.tokenSymbol}
          onClose={() => setSuccessResult(null)}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}

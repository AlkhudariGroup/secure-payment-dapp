"use client";

interface SuccessAnimationProps {
  contractAddress: string;
  txHash: string;
  explorerTxUrl: string;
  explorerAddressUrl: string;
  tokenName: string;
  tokenSymbol: string;
  onClose: () => void;
}

export function SuccessAnimation({
  contractAddress,
  txHash,
  explorerTxUrl,
  explorerAddressUrl,
  tokenName,
  tokenSymbol,
  onClose,
}: SuccessAnimationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div
        className="animate-success-pop w-full max-w-md rounded-xl p-6"
        role="alert"
        style={{
          border: "1px solid rgba(212, 175, 55, 0.35)",
          backgroundColor: "#050505",
          boxShadow: "0 0 40px rgba(212, 175, 55, 0.12)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.4)",
              backgroundColor: "rgba(212, 175, 55, 0.1)",
            }}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#d4af37"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3
            className="text-lg font-semibold"
            style={{ color: "#f4e4bc", textShadow: "0 0 20px rgba(212, 175, 55, 0.3)" }}
          >
            Token Deployed
          </h3>
          <p className="mt-1 text-sm" style={{ color: "#888" }}>
            {tokenName} ({tokenSymbol})
          </p>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between gap-2">
            <span style={{ color: "#888" }}>Contract</span>
            <a
              href={explorerAddressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono hover:underline"
              style={{ color: "#d4af37" }}
            >
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
            </a>
          </div>
          <div className="flex justify-between gap-2">
            <span style={{ color: "#888" }}>Tx Hash</span>
            <a
              href={explorerTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono hover:underline"
              style={{ color: "#d4af37" }}
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href={explorerTxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.25)",
              backgroundColor: "rgba(212, 175, 55, 0.08)",
              color: "#f4e4bc",
            }}
          >
            View in Explorer
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg py-2.5 text-sm font-medium"
            style={{
              border: "1px solid rgba(212, 175, 55, 0.4)",
              backgroundColor: "rgba(212, 175, 55, 0.12)",
              color: "#f4e4bc",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

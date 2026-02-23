"use client";

import { useState, useCallback } from "react";
import { getRestrictedReason } from "@/lib/restrictedNames";
import { NETWORKS } from "@/lib/networks";
import type { TokenParams } from "@/types";

interface TokenFormProps {
  onSubmit: (params: TokenParams) => void;
  disabled: boolean;
  hasWallet?: boolean;
}

const DEFAULT_DECIMALS = 18;

export function TokenForm({
  onSubmit,
  disabled,
  hasWallet = true,
}: TokenFormProps) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [decimals, setDecimals] = useState(DEFAULT_DECIMALS);
  const [networkKey, setNetworkKey] = useState<string>("ethereum");
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();
    if (!trimmedName) {
      setValidationError("Token name is required.");
      return false;
    }
    if (!trimmedSymbol) {
      setValidationError("Token symbol is required.");
      return false;
    }
    const restricted = getRestrictedReason(trimmedSymbol, trimmedName);
    if (restricted) {
      setValidationError(restricted);
      return false;
    }
    const supply = parseFloat(totalSupply);
    if (Number.isNaN(supply) || supply <= 0) {
      setValidationError("Total supply must be a positive number.");
      return false;
    }
    if (decimals < 0 || decimals > 18) {
      setValidationError("Decimals must be between 0 and 18.");
      return false;
    }
    const net = NETWORKS[networkKey];
    if (!net) {
      setValidationError("Please select a valid network.");
      return false;
    }
    setValidationError(null);
    return true;
  }, [name, symbol, totalSupply, decimals, networkKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const net = NETWORKS[networkKey];
    if (!net) return;
    onSubmit({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      totalSupply: totalSupply.trim(),
      decimals,
      networkKey,
    });
  };

  const inputClass =
    "input-gold w-full rounded-lg border bg-black px-3 py-2.5 text-[#e5e5e5] placeholder-[#666]";
  const inputStyle = {
    borderColor: "rgba(212, 175, 55, 0.2)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="token-name" className="mb-1 block text-sm font-medium" style={{ color: "#d4af37" }}>
            Token Name
          </label>
          <input
            id="token-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setValidationError(null);
            }}
            placeholder="My Token"
            className={inputClass}
            style={inputStyle}
            maxLength={50}
          />
        </div>
        <div>
          <label htmlFor="token-symbol" className="mb-1 block text-sm font-medium" style={{ color: "#d4af37" }}>
            Symbol
          </label>
          <input
            id="token-symbol"
            type="text"
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value.toUpperCase());
              setValidationError(null);
            }}
            placeholder="MTK"
            className={`${inputClass} font-mono`}
            style={inputStyle}
            maxLength={10}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="total-supply" className="mb-1 block text-sm font-medium" style={{ color: "#d4af37" }}>
            Total Supply
          </label>
          <input
            id="total-supply"
            type="text"
            inputMode="decimal"
            value={totalSupply}
            onChange={(e) => {
              setTotalSupply(e.target.value);
              setValidationError(null);
            }}
            placeholder="1000000"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="decimals" className="mb-1 block text-sm font-medium" style={{ color: "#d4af37" }}>
            Decimals
          </label>
          <input
            id="decimals"
            type="number"
            min={0}
            max={18}
            value={decimals}
            onChange={(e) => setDecimals(parseInt(e.target.value, 10) || 0)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label htmlFor="network" className="mb-1 block text-sm font-medium" style={{ color: "#d4af37" }}>
          Network
        </label>
        <select
          id="network"
          value={networkKey}
          onChange={(e) => setNetworkKey(e.target.value)}
          className={`${inputClass} text-[#e5e5e5]`}
          style={inputStyle}
        >
          {Object.entries(NETWORKS).map(([key, n]) => (
            <option key={key} value={key}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {validationError && (
        <p className="text-sm text-red-400">{validationError}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:cursor-wait disabled:opacity-50"
          style={{
            border: "1px solid rgba(212, 175, 55, 0.5)",
            backgroundColor: "rgba(212, 175, 55, 0.12)",
            color: "#f4e4bc",
            boxShadow: "0 0 14px rgba(212, 175, 55, 0.15)",
          }}
        >
          {disabled ? "Deploying… Please wait" : "Deploy Token"}
        </button>
        {!hasWallet && (
          <span className="text-sm" style={{ color: "#888" }}>Connect wallet above first</span>
        )}
      </div>
    </form>
  );
}

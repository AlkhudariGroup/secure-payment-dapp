"use client";

import type { Signer } from "ethers";
import type { TokenParams } from "@/types";
import type { NetworkConfig } from "./networks";
import { compileToken } from "./compile";

/** Pad hex to 32 bytes (64 hex chars). */
function pad32(hex: string): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  return h.padStart(64, "0").slice(-64);
}

/** ABI-encode (string, string, uint8, uint256) by hand to avoid any ethers .apply bugs. */
function encodeConstructorArgs(name: string, symbol: string, decimals: number, totalSupplyRaw: string): string {
  const bytes1 = new TextEncoder().encode(name);
  const bytes2 = new TextEncoder().encode(symbol);
  const headSize = 4 * 32;
  const pad32bytes = (n: number) => Math.ceil(n / 32) * 32;
  const tail1Size = 32 + pad32bytes(bytes1.length);
  const tail2Size = 32 + pad32bytes(bytes2.length);
  const offset1 = headSize;
  const offset2 = headSize + tail1Size;
  let out = "";
  out += pad32(offset1.toString(16));
  out += pad32(offset2.toString(16));
  out += pad32(decimals.toString(16));
  out += pad32(BigInt(totalSupplyRaw).toString(16));
  out += pad32(bytes1.length.toString(16));
  const hex1 = Array.from(bytes1)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  out += hex1.padEnd(pad32bytes(bytes1.length) * 2, "0");
  out += pad32(bytes2.length.toString(16));
  const hex2 = Array.from(bytes2)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  out += hex2.padEnd(pad32bytes(bytes2.length) * 2, "0");
  return "0x" + out;
}

/** Build deploy tx data: bytecode + encoded constructor. No ethers ABI/ContractFactory. */
function buildDeployData(bytecode: string, name: string, symbol: string, decimals: number, totalSupplyRaw: string): string {
  const enc = encodeConstructorArgs(name, symbol, decimals, totalSupplyRaw);
  const bc = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  const encHex = enc.startsWith("0x") ? enc.slice(2) : enc;
  return "0x" + bc + encHex;
}

export interface DeployResult {
  contractAddress: string;
  txHash: string;
  explorerUrl: string;
  success: boolean;
  error?: string;
}

export type DeployStep = "compiling" | "confirm_wallet" | "deploying";

/**
 * Deploy ERC-20 token client-side.
 * Compiles in browser, then deploys via signer (MetaMask/WalletConnect).
 * No private keys or signing on server.
 */
export async function deployToken(
  params: TokenParams,
  signer: Signer,
  network: NetworkConfig,
  onStep?: (step: DeployStep) => void
): Promise<DeployResult> {
  const { totalSupply, decimals } = params;
  const supplyNum = parseFloat(String(totalSupply).trim());
  if (Number.isNaN(supplyNum) || supplyNum <= 0 || !Number.isFinite(supplyNum)) {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Invalid total supply.",
    };
  }
  const dec = Number(decimals);
  if (!Number.isInteger(dec) || dec < 0 || dec > 18) {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Decimals must be between 0 and 18.",
    };
  }
  let totalSupplyRaw: string;
  try {
    totalSupplyRaw = BigInt(Math.floor(supplyNum)).toString();
  } catch {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Total supply is too large.",
    };
  }

  const nameStr = String(params.name ?? "").trim();
  const symbolStr = String(params.symbol ?? "").trim();
  if (!nameStr || !symbolStr) {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Token name and symbol are required.",
    };
  }

  onStep?.("compiling");
  const compileResult = await compileToken(params);
  if (compileResult.errors?.length) {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: compileResult.errors.join("\n"),
    };
  }

  const abiRaw = compileResult.abi;
  const bytecodeRaw = compileResult.bytecode;
  if (!abiRaw || typeof abiRaw !== "string" || !bytecodeRaw || typeof bytecodeRaw !== "string") {
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Compilation did not return ABI or bytecode. Try again.",
    };
  }

  const bytecode = bytecodeRaw.startsWith("0x") ? bytecodeRaw : "0x" + bytecodeRaw;

  let deployData: string;
  try {
    deployData = buildDeployData(bytecode, nameStr, symbolStr, dec, totalSupplyRaw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: "Failed to encode deploy data. " + msg,
    };
  }

  try {
    onStep?.("confirm_wallet");
    onStep?.("deploying");
    const txResponse = await signer.sendTransaction({ data: deployData });
    const receipt = await txResponse.wait();
    const contractAddress = receipt?.contractAddress ?? "";

    if (!txResponse.hash) {
      return {
        contractAddress: "",
        txHash: "",
        explorerUrl: "",
        success: false,
        error: "No transaction hash returned.",
      };
    }

    return {
      contractAddress,
      txHash: txResponse.hash,
      explorerUrl: `${network.blockExplorer}/tx/${txResponse.hash}`,
      success: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      contractAddress: "",
      txHash: "",
      explorerUrl: "",
      success: false,
      error: message.includes("user rejected") || message.includes("denied")
        ? "You rejected the transaction in your wallet."
        : message,
    };
  }
}

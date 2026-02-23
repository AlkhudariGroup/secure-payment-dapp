"use client";

import type { TokenParams } from "@/types";
import { precompiled } from "./precompiled";

const CONTRACT_NAME = "ERC20Token";

export interface CompileResult {
  abi: string;
  bytecode: string;
  contractName: string;
  errors?: string[];
}

/**
 * Returns precompiled ABI and bytecode. No browser compiler — no CDN, no worker, no .apply errors.
 * Contract is compiled at build time via: node scripts/compile-contract.cjs
 */
export function compileToken(_params: TokenParams): Promise<CompileResult> {
  if (typeof window === "undefined") {
    return Promise.resolve({
      abi: precompiled.abi,
      bytecode: precompiled.bytecode,
      contractName: CONTRACT_NAME,
    });
  }
  return Promise.resolve({
    abi: precompiled.abi,
    bytecode: precompiled.bytecode,
    contractName: CONTRACT_NAME,
  });
}

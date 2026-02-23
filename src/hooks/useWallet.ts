"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { getNetworkByChainId, type NetworkConfig } from "@/lib/networks";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  network: NetworkConfig | undefined;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    network: undefined,
    signer: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({ ...s, error: "MetaMask not installed", isConnecting: false }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
        params: [],
      })) as string;
      const chainId = parseInt(chainIdHex, 16);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = getNetworkByChainId(chainId);
      setState({
        address: accounts[0] ?? null,
        chainId,
        network,
        signer,
        isConnecting: false,
        error: null,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setState((s) => ({
        ...s,
        address: null,
        chainId: null,
        network: undefined,
        signer: null,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      });
      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
        params: [],
      })) as string;
      const chainId = parseInt(chainIdHex, 16);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = getNetworkByChainId(chainId);
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      setState((s) => ({
        ...s,
        address: accounts[0] ?? s.address,
        chainId,
        network,
        signer,
        error: null,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, error: message }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ethereum = window.ethereum;
    if (!ethereum || typeof ethereum.on !== "function") return;
    try {
      const handleAccountsChanged = (accounts: unknown) => {
        try {
          const list = Array.isArray(accounts) ? accounts : [];
          setState((s) => ({
            ...s,
            address: (list[0] as string) ?? null,
            signer: null,
          }));
          if (list.length > 0) connect();
        } catch (e) {
          console.warn("accountsChanged handler error:", e);
        }
      };
      const handleChainChanged = () => {
        try {
          connect();
        } catch (e) {
          console.warn("chainChanged handler error:", e);
        }
      };
      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);
      return () => {
        try {
          if (typeof ethereum.removeListener === "function") {
            ethereum.removeListener("accountsChanged", handleAccountsChanged);
            ethereum.removeListener("chainChanged", handleChainChanged);
          }
        } catch (_) {}
      };
    } catch (e) {
      console.warn("useWallet effect setup error:", e);
    }
  }, [connect]);

  return { ...state, connect, switchNetwork };
}

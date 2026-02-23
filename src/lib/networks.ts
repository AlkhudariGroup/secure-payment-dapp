export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  symbol: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC_URL || "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    symbol: "ETH",
  },
  bsc: {
    chainId: 56,
    name: "BNB Smart Chain",
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
    blockExplorer: "https://bscscan.com",
    symbol: "BNB",
  },
};

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find((n) => n.chainId === chainId);
}

export function getExplorerTxUrl(explorer: string, txHash: string): string {
  return `${explorer}/tx/${txHash}`;
}

export function getExplorerAddressUrl(explorer: string, address: string): string {
  return `${explorer}/address/${address}`;
}

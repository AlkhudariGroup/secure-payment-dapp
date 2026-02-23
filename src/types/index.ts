export interface TokenParams {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  networkKey: string;
}

export interface CompilationResult {
  abi: string;
  bytecode: string;
  contractName: string;
}

export interface DeploymentRecord {
  contractAddress: string;
  txHash: string;
  explorerUrl: string;
  tokenName: string;
  tokenSymbol: string;
  networkName: string;
  timestamp: number;
}

export type DeploymentHistory = DeploymentRecord[];

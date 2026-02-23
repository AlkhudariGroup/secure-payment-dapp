/**
 * Blocked token names and symbols to prevent scam impersonation.
 * All comparisons are case-insensitive.
 */

const RESTRICTED_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "ETH",
  "BTC",
  "BNB",
  "BUSD",
  "DAI",
  "WBTC",
  "WETH",
  "XRP",
  "ADA",
  "SOL",
  "DOGE",
  "DOT",
  "MATIC",
  "AVAX",
  "LINK",
  "UNI",
  "SHIB",
  "PEPE",
  "DOGE",
  "FTM",
  "ATOM",
  "LTC",
  "BCH",
  "ETC",
  "XLM",
  "TRX",
  "NEAR",
  "APT",
  "ARB",
  "OP",
  "INJ",
  "SUI",
  "SEI",
  "TIA",
  "STETH",
  "RETH",
  "CBETH",
  "FRXETH",
]);

const RESTRICTED_NAMES = new Set([
  "tether",
  "usd tether",
  "usdt",
  "usd coin",
  "usdc",
  "ethereum",
  "bitcoin",
  "binance",
  "binance coin",
  "bnb",
  "binance usd",
  "busd",
  "dai",
  "wrapped bitcoin",
  "wbtc",
  "wrapped ether",
  "weth",
  "ripple",
  "cardano",
  "solana",
  "dogecoin",
  "polkadot",
  "polygon",
  "avalanche",
  "chainlink",
  "uniswap",
  "shiba inu",
  "pepe",
  "fantom",
  "cosmos",
  "litecoin",
  "bitcoin cash",
  "stellar",
  "tron",
  "near protocol",
  "aptos",
  "arbitrum",
  "optimism",
  "injective",
  "sui",
  "sei",
  "celestia",
  "lido staked ether",
  "rocket pool ether",
  "coinbase wrapped staked eth",
  "frax ether",
]);

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isRestrictedSymbol(symbol: string): boolean {
  return RESTRICTED_SYMBOLS.has(symbol.trim().toUpperCase());
}

export function isRestrictedName(name: string): boolean {
  const n = normalize(name);
  if (RESTRICTED_NAMES.has(n)) return true;
  // Also block if name contains a restricted name as a word
  for (const r of Array.from(RESTRICTED_NAMES)) {
    if (n === r || n.startsWith(r + " ") || n.endsWith(" " + r) || n.includes(" " + r + " "))
      return true;
  }
  return false;
}

export function getRestrictedReason(symbol: string, name: string): string | null {
  if (isRestrictedSymbol(symbol))
    return `Symbol "${symbol}" is reserved to prevent impersonation.`;
  if (isRestrictedName(name))
    return `Token name is reserved to prevent impersonation.`;
  return null;
}

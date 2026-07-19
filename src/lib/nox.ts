import { defineChain, type Address } from "viem";

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  testnet: true,
});

export const ethereumSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
});

export const NOX_COMPUTE: Address = "0xd464B198f06756a1d00be223634b85E0a731c229";
export const NOX_COMPUTE_DEPLOY_BLOCK = 250991603n;

export const VAULT_FACTORY: Address = "0xB9390D62E3272ef88b812B28bD0A57a4580937EE";

export const UPGRADER_ETH_SEPOLIA: Address = "0xdFbB1106b6Da2d4D932764dD64a0f86391bB1D03";

export type ConfidentialToken = {
  id: "cUSDC" | "cRLC";
  symbol: "cUSDC" | "cRLC";
  underlyingSymbol: "USDC" | "RLC";
  chainId: 421614 | 11155111;
  wrapper: Address;
  underlying: Address | null;
  fromBlock: bigint;
  decimals: number;
  accent: string;
  description: string;
};

export const TOKENS: readonly ConfidentialToken[] = [
  {
    id: "cUSDC",
    symbol: "cUSDC",
    underlyingSymbol: "USDC",
    chainId: 421614,
    wrapper: "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e",
    underlying: null,
    fromBlock: NOX_COMPUTE_DEPLOY_BLOCK,
    decimals: 6,
    accent: "#2775CA",
    description: "Confidential USD Coin — encrypted balances, public collateral.",
  },
  {
    id: "cRLC",
    symbol: "cRLC",
    underlyingSymbol: "RLC",
    chainId: 421614,
    wrapper: "0x92b23f4a59175415ced5cb37e64a1fc6a9d79af4",
    underlying: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963",
    fromBlock: NOX_COMPUTE_DEPLOY_BLOCK,
    decimals: 9,
    accent: "#FFD21F",
    description: "Confidential RLC — the iExec token, now private by default.",
  },
  {
    id: "cRLC",
    symbol: "cRLC",
    underlyingSymbol: "RLC",
    chainId: 11155111,
    wrapper: "0xCF220069B8D803047D9fe773e059A1E4981DAa68",
    underlying: "0x26A738b6D33EF4D94FF084D3552961b8f00639Cd",
    fromBlock: 8_000_000n,
    decimals: 9,
    accent: "#FFD21F",
    description: "Confidential RLC — the iExec token, now private by default.",
  },
  {
    id: "cUSDC",
    symbol: "cUSDC",
    underlyingSymbol: "USDC",
    chainId: 11155111,
    wrapper: "0x12b7025544088F35101245AF046Cb92E91D17D2C",
    underlying: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    fromBlock: 8_000_000n,
    decimals: 6,
    accent: "#2775CA",
    description: "Confidential USD Coin — encrypted balances, public collateral.",
  },
] as const;

export const NOX_OP_CATEGORIES = {
  token: ["Transfer", "Mint", "Burn"],
  arithmetic: ["Add", "Sub", "Mul", "Div", "SafeAdd", "SafeSub", "SafeMul", "SafeDiv"],
  comparison: ["Eq", "Ne", "Lt", "Le", "Gt", "Ge"],
  control: ["Select", "WrapAsPublicHandle"],
  acl: ["Allowed", "ViewerAdded", "MarkedAsPubliclyDecryptable"],
} as const;

export type OpCategory = keyof typeof NOX_OP_CATEGORIES;

export function opCategory(op: string): OpCategory | "other" {
  for (const [cat, ops] of Object.entries(NOX_OP_CATEGORIES)) {
    if ((ops as readonly string[]).includes(op)) return cat as OpCategory;
  }
  return "other";
}

/** Display label per operation category. */
export const CAT_LABEL: Record<string, string> = {
  arithmetic: "Arithmetic",
  comparison: "Comparison",
  token: "Token ops",
  control: "Control flow",
  acl: "ACL",
  other: "Other",
};

/**
 * Accent per operation category. Plain hex rather than CSS vars: several call
 * sites append an alpha suffix (`${CAT_COLOR[c]}40`), which only works on a
 * literal hex value.
 */
export const CAT_COLOR: Record<string, string> = {
  arithmetic: "#fcd15a",
  comparison: "#a78bfa",
  token: "#2fbf7f",
  control: "#fb923c",
  acl: "#38bdf8",
  other: "#8b8b96",
};

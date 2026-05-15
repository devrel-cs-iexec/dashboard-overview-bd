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

export const NOX_COMPUTE: Address = "0xd464B198f06756a1d00be223634b85E0a731c229";
export const NOX_COMPUTE_DEPLOY_BLOCK = 250991603n;

export const VAULT_FACTORY: Address = "0xB9390D62E3272ef88b812B28bD0A57a4580937EE";

export const SUBGRAPH_URL =
  "https://thegraph.arbitrum-sepolia-testnet.noxprotocol.io/api/subgraphs/id/BjQAX2HpmsSAzURJimKDhjZZnkSJtaczA8RPumggrStb";

export type ConfidentialToken = {
  id: "cUSDC" | "cRLC";
  symbol: "cUSDC" | "cRLC";
  underlyingSymbol: "USDC" | "RLC";
  wrapper: Address;
  underlying: Address | null;
  decimals: number;
  accent: string;
  description: string;
};

export const TOKENS: readonly ConfidentialToken[] = [
  {
    id: "cUSDC",
    symbol: "cUSDC",
    underlyingSymbol: "USDC",
    wrapper: "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e",
    underlying: null,
    decimals: 6,
    accent: "#2775CA",
    description: "Confidential USD Coin — encrypted balances, public collateral.",
  },
  {
    id: "cRLC",
    symbol: "cRLC",
    underlyingSymbol: "RLC",
    wrapper: "0x92b23f4a59175415ced5cb37e64a1fc6a9d79af4",
    underlying: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963",
    decimals: 9,
    accent: "#FFD21F",
    description: "Confidential RLC — the iExec token, now private by default.",
  },
] as const;

export const NOX_OP_CATEGORIES = {
  token: ["Transfer", "Mint", "Burn"],
  arithmetic: [
    "Add",
    "Sub",
    "Mul",
    "Div",
    "SafeAdd",
    "SafeSub",
    "SafeMul",
    "SafeDiv",
  ],
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

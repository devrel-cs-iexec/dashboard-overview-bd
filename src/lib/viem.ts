import { createPublicClient, http } from "viem";
import { arbitrumSepolia, ethereumSepolia } from "./nox";

const TRANSPORT_OPTS = {
  batch: { wait: 16 },
  retryCount: 2,
  retryDelay: 200,
} as const;

/**
 * Arbitrum Sepolia — the primary chain, and the one carrying the heavy
 * getLogs scans. Without ARB_SEPOLIA_RPC_URL this falls back to the public
 * rollup endpoint from the chain definition, which rate-limits those scans
 * into failure. Set the env var to point at a dedicated provider.
 */
export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.ARB_SEPOLIA_RPC_URL, TRANSPORT_OPTS),
});

export const ethSepoliaClient = createPublicClient({
  chain: ethereumSepolia,
  transport: http(process.env.ETH_SEPOLIA_RPC_URL, TRANSPORT_OPTS),
});

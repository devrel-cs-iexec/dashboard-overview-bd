import { createPublicClient, http } from "viem";
import { arbitrumSepolia, ethereumSepolia } from "./nox";

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(undefined, {
    batch: { wait: 16 },
    retryCount: 2,
    retryDelay: 200,
  }),
});

export const ethSepoliaClient = createPublicClient({
  chain: ethereumSepolia,
  transport: http(process.env.ETH_SEPOLIA_RPC_URL, {
    batch: { wait: 16 },
    retryCount: 2,
    retryDelay: 200,
  }),
});

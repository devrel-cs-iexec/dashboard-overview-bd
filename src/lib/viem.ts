import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "./nox";

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(undefined, {
    batch: { wait: 16 },
    retryCount: 2,
    retryDelay: 200,
  }),
});

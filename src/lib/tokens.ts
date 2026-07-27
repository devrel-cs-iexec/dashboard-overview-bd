import { TOKENS, type ConfidentialToken } from "./nox";
import { clientForChain, pool } from "./rpc";
import { wrapperAbi } from "./abi";
import { getIndexerTokens } from "./ponder";

/**
 * Plaintext underlyings the dashboard can both price (via CoinGecko) and style.
 * Keyed by lowercased address. A token whose `underlying()` resolves to one of
 * these is a wrapper we can compute USD shield/unshield figures for; anything
 * else (e.g. cvShares, cWETH — encrypted or unpriced) is left to /transfers.
 */
const KNOWN_UNDERLYINGS: Record<
  string,
  Pick<ConfidentialToken, "id" | "symbol" | "underlyingSymbol" | "decimals" | "accent">
> = {
  // USDC
  "0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d": {
    id: "cUSDC",
    symbol: "cUSDC",
    underlyingSymbol: "USDC",
    decimals: 6,
    accent: "#2775CA",
  },
  "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": {
    id: "cUSDC",
    symbol: "cUSDC",
    underlyingSymbol: "USDC",
    decimals: 6,
    accent: "#2775CA",
  },
  // RLC
  "0x9923ed3cbd90cd78b910c475f9a731a6e0b8c963": {
    id: "cRLC",
    symbol: "cRLC",
    underlyingSymbol: "RLC",
    decimals: 9,
    accent: "#FFD21F",
  },
  "0x26a738b6d33ef4d94ff084d3552961b8f00639cd": {
    id: "cRLC",
    symbol: "cRLC",
    underlyingSymbol: "RLC",
    decimals: 9,
    accent: "#FFD21F",
  },
};

const TTL_MS = 10 * 60_000;
let cache: { ts: number; tokens: ConfidentialToken[] } | null = null;

/**
 * The confidential tokens the TVS views should cover: the four the app ships
 * with, plus every other USDC/RLC wrapper the indexer has seen activity on.
 * The indexer's own `isWrapper`/`underlying` columns are unreliable (they read
 * as false/null across the board), so wrapper-hood is confirmed by calling
 * `underlying()` on-chain and matching it against the priceable set.
 *
 * Discovery is cached module-side; a failure falls back to the hardcoded list
 * so the TVS dashboard never goes empty.
 */
export async function getConfidentialTokens(): Promise<ConfidentialToken[]> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) return cache.tokens;
  try {
    const tokens = dedupe([...TOKENS, ...(await discoverWrappers())]);
    cache = { ts: now, tokens };
    return tokens;
  } catch {
    return cache?.tokens ?? [...TOKENS];
  }
}

async function discoverWrappers(): Promise<ConfidentialToken[]> {
  const candidates = await getIndexerTokens(100);
  if (candidates.length === 0) return [];

  const byChain = new Map<number, typeof candidates>();
  for (const c of candidates) {
    if (typeof c.chainId !== "number") continue;
    (byChain.get(c.chainId) ?? byChain.set(c.chainId, []).get(c.chainId)!).push(c);
  }

  const discovered: ConfidentialToken[] = [];
  for (const [chainId, toks] of byChain) {
    const client = clientForChain(chainId);
    const settled = await pool(
      toks,
      12,
      (t) =>
        client.readContract({
          address: t.address as `0x${string}`,
          abi: wrapperAbi,
          functionName: "underlying",
        }) as Promise<`0x${string}`>,
    );
    settled.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const underlying = String(r.value).toLowerCase();
      const known = KNOWN_UNDERLYINGS[underlying];
      if (!known) return;
      const t = toks[i];
      discovered.push({
        ...known,
        chainId: chainId as ConfidentialToken["chainId"],
        wrapper: t.address as `0x${string}`,
        underlying: underlying as `0x${string}`,
        fromBlock: BigInt(t.firstSeenBlock),
        description: t.name ?? known.symbol,
      });
    });
  }
  return discovered;
}

/** First occurrence of each (chain, wrapper) wins — hardcoded entries take priority. */
function dedupe(tokens: ConfidentialToken[]): ConfidentialToken[] {
  const seen = new Set<string>();
  const out: ConfidentialToken[] = [];
  for (const t of tokens) {
    const key = `${t.chainId}:${t.wrapper.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

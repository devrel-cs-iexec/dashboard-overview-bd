export type Prices = {
  /** USD price of 1 RLC */
  rlc: number;
  /** USD price of 1 USDC (~1) */
  usdc: number;
  /** Whether the values came from a live fetch (false = hard-coded fallback) */
  live: boolean;
};

const FALLBACK: Prices = { rlc: 0, usdc: 1, live: false };

/**
 * Pulls RLC + USDC spot prices from CoinGecko. 5-minute ISR cache so we stay
 * well under their 30 req/min free-tier limit even under traffic.
 */
export async function getPrices(): Promise<Prices> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=iexec-rlc,usd-coin&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return FALLBACK;
    const json = (await res.json()) as Record<string, { usd?: number }>;
    return {
      rlc: Number(json["iexec-rlc"]?.usd) || 0,
      usdc: Number(json["usd-coin"]?.usd) || 1,
      live: true,
    };
  } catch {
    return FALLBACK;
  }
}

export function priceFor(symbol: "USDC" | "RLC", prices: Prices): number {
  return symbol === "USDC" ? prices.usdc : prices.rlc;
}

import { ARB_SEPOLIA_ID, arbitrumSepolia, ethereumSepolia } from "./nox";

export function formatCompactNumber(value: number | bigint, decimals = 1): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  if (abs >= 1) return n.toFixed(decimals);
  if (n === 0) return "0";
  // Below 1, show enough decimals to carry two significant digits, then trim.
  // toPrecision was used here, but it emits exponent notation under ~1e-6
  // ("1.0e-7"), which is not something to render in a table cell.
  const places = Math.min(20, Math.max(2, Math.ceil(-Math.log10(abs)) + 1));
  return n
    .toFixed(places)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

export function formatTokenAmount(
  raw: bigint,
  decimals: number,
  displayDecimals = 2,
): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, displayDecimals);
  const wholeFormatted = whole.toLocaleString("en-US");
  const sign = negative ? "-" : "";
  return displayDecimals > 0
    ? `${sign}${wholeFormatted}.${fractionStr.padEnd(displayDecimals, "0")}`
    : `${sign}${wholeFormatted}`;
}

export function formatTokenCompact(raw: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = Number(raw / divisor);
  const frac = Number(raw % divisor) / Number(divisor);
  return formatCompactNumber(whole + frac, 2);
}

/** Explorer base URL, taken from the chain definitions rather than restated. */
function explorerBase(chainId: number): string {
  const chain = chainId === ARB_SEPOLIA_ID ? arbitrumSepolia : ethereumSepolia;
  return chain.blockExplorers.default.url;
}

export function explorerTx(chainId: number, txHash: string): string {
  return `${explorerBase(chainId)}/tx/${txHash}`;
}

export function explorerAddress(chainId: number, address: string): string {
  return `${explorerBase(chainId)}/address/${address}`;
}

export function explorerBlock(chainId: number, blockNumber: number | bigint): string {
  return `${explorerBase(chainId)}/block/${blockNumber.toString()}`;
}

export function shortAddress(address: string): string {
  if (!address?.startsWith("0x") || address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value)) return "—";
  if (opts?.compact === false) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  if (abs > 0) return `$${value.toFixed(4)}`;
  return "$0";
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function relativeTime(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const seconds = ts - Math.floor(Date.now() / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return RTF.format(Math.round(seconds), "second");
  if (abs < 3600) return RTF.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return RTF.format(Math.round(seconds / 3600), "hour");
  if (abs < 2_592_000) return RTF.format(Math.round(seconds / 86400), "day");
  // Without a year bucket a three-year-old event reads "36 months ago".
  if (abs < 31_536_000) return RTF.format(Math.round(seconds / 2_592_000), "month");
  return RTF.format(Math.round(seconds / 31_536_000), "year");
}

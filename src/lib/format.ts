export function formatCompactNumber(value: number | bigint, decimals = 1): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  if (abs >= 1) return n.toFixed(decimals === 0 ? 0 : Math.min(decimals, 2));
  return n.toPrecision(2);
}

export function formatTokenAmount(raw: bigint, decimals: number, displayDecimals = 2): string {
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

export function shortAddress(address: string): string {
  if (!address?.startsWith("0x") || address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
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
  return RTF.format(Math.round(seconds / 2_592_000), "month");
}

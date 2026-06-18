export function ChainBadge({ chainId }: { chainId: number }) {
  const isArb = chainId === 421614;
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
        isArb
          ? "border border-blue-500/30 bg-blue-500/10 text-blue-400"
          : "border border-purple-500/30 bg-purple-500/10 text-purple-400"
      }`}
    >
      {isArb ? "ARB" : "ETH"}
    </span>
  );
}

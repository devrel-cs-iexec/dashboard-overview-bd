import { explorerTx, explorerAddress, explorerBlock, shortAddress } from "@/lib/format";
import { ARB_SEPOLIA_ID } from "@/lib/nox";

type Kind = "tx" | "address" | "block";

const HREF: Record<Kind, (chainId: number, value: string) => string> = {
  tx: explorerTx,
  address: explorerAddress,
  block: (chainId, value) => explorerBlock(chainId, Number(value)),
};

const NOUN: Record<Kind, string> = {
  tx: "transaction",
  address: "address",
  block: "block",
};

/**
 * Link out to Arbiscan / Etherscan.
 *
 * The ↗ is decorative and hidden: read aloud it becomes "north east arrow".
 * The accessible name instead states the target and that it opens a new tab,
 * which nothing in the markup would otherwise convey.
 */
export function ExplorerLink({
  chainId,
  kind,
  value,
  label,
  className = "font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]",
}: {
  chainId: number;
  kind: Kind;
  value: string;
  /** Visible text. Defaults to a shortened form of `value`. */
  label?: string;
  className?: string;
}) {
  const explorer = chainId === ARB_SEPOLIA_ID ? "Arbiscan" : "Etherscan";
  return (
    <a
      href={HREF[kind](chainId, value)}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${NOUN[kind]} ${value} on ${explorer} (opens in a new tab)`}
      className={className}
    >
      {label ?? shortAddress(value)}
      <span aria-hidden> ↗</span>
    </a>
  );
}

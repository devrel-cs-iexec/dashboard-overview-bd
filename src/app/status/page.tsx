import { TopNav } from "@/components/TopNav";
import { FooterDark } from "@/components/FooterDark";
import { getMeta } from "@/lib/subgraph";
import { getPrices } from "@/lib/price";
import { publicClient } from "@/lib/viem";
import { NOX_COMPUTE, TOKENS, arbitrumSepolia } from "@/lib/nox";
import { relativeTime, shortAddress } from "@/lib/format";

export const revalidate = 30;

type Check = {
  name: string;
  detail: string;
  status: "ok" | "warn" | "down";
  meta?: { label: string; value: string }[];
};

export default async function StatusPage() {
  const checks = await Promise.all([
    checkRpc(),
    checkSubgraph(),
    checkPrices(),
    ...TOKENS.map((t) => checkWrapper(t.wrapper, t.symbol)),
  ]);

  const okCount = checks.filter((c) => c.status === "ok").length;
  const total = checks.length;
  const overall: Check["status"] =
    checks.some((c) => c.status === "down")
      ? "down"
      : checks.some((c) => c.status === "warn")
      ? "warn"
      : "ok";

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--color-page)] text-[var(--color-page-fg)]">
      <TopNav variant="transparent" />

      <section className="mx-auto w-full max-w-7xl px-6 pt-12 pb-6 lg:px-10 lg:pt-20 lg:pb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-lavender)]">
          System status
        </div>
        <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display max-w-3xl text-[36px] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[44px]">
            {overall === "ok"
              ? "All systems operational."
              : overall === "warn"
              ? "Partial degradation — some endpoints are slow."
              : "Service disruption — at least one dependency is down."}
          </h1>
          <OverallPill status={overall} ratio={`${okCount}/${total}`} />
        </div>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.55] text-[var(--color-page-muted)]">
          Real-time health probe of every dependency that powers Nox·Stats. Each
          check runs server-side on every request — no cache — so what you see
          is what answered just now.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {checks.map((c) => (
            <li key={c.name}>
              <CheckCard check={c} />
            </li>
          ))}
        </ul>
      </section>

      <FooterDark />
    </main>
  );
}

function CheckCard({ check }: { check: Check }) {
  return (
    <article className="card-light p-5">
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold tracking-tight">
          {check.name}
        </h3>
        <StatusBadge status={check.status} />
      </header>
      <p className="mt-2 text-[13px] leading-[1.55] text-[var(--color-page-muted)]">
        {check.detail}
      </p>
      {check.meta && check.meta.length > 0 ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-page-border)] pt-3 text-[12px]">
          {check.meta.map((m) => (
            <div key={m.label} className="flex flex-col">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-page-muted)]">
                {m.label}
              </dt>
              <dd className="font-mono text-[12px] text-[var(--color-page-fg)]">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

function StatusBadge({ status }: { status: Check["status"] }) {
  const map: Record<Check["status"], { label: string; dot: string; text: string; bg: string }> = {
    ok: {
      label: "Operational",
      dot: "var(--color-positive)",
      text: "#178255",
      bg: "rgba(47, 191, 127, 0.12)",
    },
    warn: {
      label: "Degraded",
      dot: "#e1a32a",
      text: "#a3700b",
      bg: "rgba(225, 163, 42, 0.12)",
    },
    down: {
      label: "Down",
      dot: "var(--color-negative)",
      text: "#a83434",
      bg: "rgba(255, 125, 125, 0.12)",
    },
  };
  const v = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
      style={{ background: v.bg, color: v.text }}
    >
      <span className="size-1.5 rounded-full" style={{ background: v.dot }} />
      {v.label}
    </span>
  );
}

function OverallPill({ status, ratio }: { status: Check["status"]; ratio: string }) {
  const tint =
    status === "ok"
      ? "var(--color-positive)"
      : status === "warn"
      ? "#e1a32a"
      : "var(--color-negative)";
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--color-page-border)] bg-[var(--color-page-2)] px-4 py-2">
      <span className="pulse-dot inline-block size-2 rounded-full" style={{ background: tint, color: tint }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-page-fg)]">
        {ratio} checks ok
      </span>
    </div>
  );
}

// ============ Checks ============

async function checkRpc(): Promise<Check> {
  const t0 = Date.now();
  try {
    const [chainId, blockNumber] = await Promise.all([
      publicClient.getChainId(),
      publicClient.getBlockNumber(),
    ]);
    const ms = Date.now() - t0;
    return {
      name: "Arbitrum Sepolia RPC",
      detail:
        "Pure-RPC source of truth for wrappers (inferredTotalSupply, UnwrapFinalized scans, block timestamps).",
      status: chainId === arbitrumSepolia.id ? (ms < 1500 ? "ok" : "warn") : "down",
      meta: [
        { label: "Chain", value: String(chainId) },
        { label: "Head block", value: blockNumber.toLocaleString() },
        { label: "Round-trip", value: `${ms} ms` },
        { label: "Endpoint", value: "sepolia-rollup.arbitrum.io" },
      ],
    };
  } catch (e) {
    return {
      name: "Arbitrum Sepolia RPC",
      detail: "RPC unreachable — wrapper TVL / wrap-event scan would fail.",
      status: "down",
      meta: [{ label: "Error", value: errorMessage(e) }],
    };
  }
}

async function checkSubgraph(): Promise<Check> {
  const t0 = Date.now();
  try {
    const meta = await getMeta();
    const ms = Date.now() - t0;
    const lag = meta.block.timestamp > 0
      ? Math.floor(Date.now() / 1000) - meta.block.timestamp
      : null;
    const syncing = meta.block.number === 0;
    return {
      name: "Ponder indexer",
      detail: "Local Ponder node at localhost:42069. Powers handles, roles, ops breakdown, confidential transfers.",
      status: syncing ? "warn" : lag !== null && lag > 300 ? "warn" : ms < 2000 ? "ok" : "warn",
      meta: [
        { label: "Head block", value: syncing ? "syncing…" : meta.block.number.toLocaleString() },
        { label: "Indexer lag", value: syncing ? "backfilling" : lag !== null && lag > 0 ? relativeTime(meta.block.timestamp) : "live" },
        { label: "Round-trip", value: `${ms} ms` },
        { label: "Endpoint", value: "localhost:42069/graphql" },
      ],
    };
  } catch (e) {
    return {
      name: "Ponder indexer",
      detail: "Ponder not running — start with `npm run dev` in the nox-subgraph-ERC repo.",
      status: "down",
      meta: [
        { label: "Endpoint", value: "localhost:42069/graphql" },
        { label: "Error", value: errorMessage(e) },
      ],
    };
  }
}

async function checkPrices(): Promise<Check> {
  const t0 = Date.now();
  try {
    const p = await getPrices();
    const ms = Date.now() - t0;
    return {
      name: "CoinGecko prices",
      detail: "Live RLC + USDC USD prices feed the TVL / TVS conversions across the dashboard.",
      status: p.live ? (ms < 1500 ? "ok" : "warn") : "warn",
      meta: [
        { label: "RLC", value: p.rlc ? `$${p.rlc.toFixed(4)}` : "—" },
        { label: "USDC", value: `$${p.usdc.toFixed(4)}` },
        { label: "Source", value: p.live ? "coingecko.com" : "fallback" },
        { label: "Round-trip", value: `${ms} ms` },
      ],
    };
  } catch (e) {
    return {
      name: "CoinGecko prices",
      detail: "Price feed errored. Dashboard falls back to USDC=$1, RLC=$0.",
      status: "warn",
      meta: [{ label: "Error", value: errorMessage(e) }],
    };
  }
}

async function checkWrapper(address: `0x${string}`, symbol: string): Promise<Check> {
  const t0 = Date.now();
  try {
    const code = await publicClient.getBytecode({ address });
    const ms = Date.now() - t0;
    const deployed = !!code && code !== "0x";
    return {
      name: `${symbol} wrapper`,
      detail: `ERC20→ERC-7984 wrapper at ${shortAddress(address)}. NoxCompute proxy: ${shortAddress(NOX_COMPUTE)}.`,
      status: deployed ? "ok" : "down",
      meta: [
        { label: "Address", value: shortAddress(address) },
        { label: "Bytecode", value: deployed ? "present" : "missing" },
        { label: "Round-trip", value: `${ms} ms` },
      ],
    };
  } catch (e) {
    return {
      name: `${symbol} wrapper`,
      detail: "RPC failed to confirm wrapper deployment.",
      status: "down",
      meta: [{ label: "Error", value: errorMessage(e) }],
    };
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message.slice(0, 140);
  return String(e).slice(0, 140);
}

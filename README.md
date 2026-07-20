# iexec-nox-dashboard

Real-time analytics for the [Nox Protocol](https://github.com/iExec-Nox) — confidential
DeFi infrastructure on Arbitrum and Ethereum Sepolia, built on TEEs and the ERC-7984
confidential token standard.

The app opens directly on the TVS dashboard; every other view is reachable from the
sidebar (or the drawer on mobile).

## What it shows

- **Total value shielded** — per token, across both chains, from shield/unshield flows
- **Confidential transfers** — ERC-7984 mints, burns and encrypted transfers
- **Compute operations** — every on-chain handle, by category and operator
- **Access control** — ADMIN/VIEWER grants, and which handles are publicly decryptable
- **Lookups** — by address, transaction, block, or handle ID

## Data sources

| Source | Used for | Configured by |
| --- | --- | --- |
| Arbitrum Sepolia RPC (`viem`) | `inferredTotalSupply()`, `underlying()`, `getLogs` scans, block timestamps | `ARB_SEPOLIA_RPC_URL` |
| Ethereum Sepolia RPC (`viem`) | the same, for ETH-side wrappers | `ETH_SEPOLIA_RPC_URL` |
| Ponder indexer (GraphQL) | handles, ACL roles, confidential transfers, token stats | `PONDER_URL` |
| CoinGecko | RLC and USDC spot prices | — |

Encrypted balances stay encrypted on-chain, so the wrapper reserve plus cumulative
`UnwrapFinalized` amounts is the only honest measure of TVS — that is what `lib/tvs.ts`
and `lib/data.ts` compute.

Both RPC variables are optional and fall back to the public endpoints in the chain
definitions, but those rate-limit the historical `getLogs` scans that back the TVS
figures. Point them at a dedicated provider for any real deployment.

`PONDER_URL` defaults to `http://localhost:42069/graphql`. When it is wrong or the
indexer is down, indexer-backed pages degrade rather than crash — `/status` will tell
you which dependency is failing.

## Stack

- Next.js 16 (App Router, Turbopack) with per-route ISR
- React 19, Tailwind v4 — no `tailwind.config`, the theme is inlined in `globals.css`
- `viem` for typed RPC, `graphql-request` for the indexer
- Mulish (body), Geist Mono (numerics), Anybody (display)

## Project layout

```
src/
  app/
    layout.tsx         shell: TopNav, Sidebar, MobileNav, LiveRefresh
    page.tsx           TVS dashboard (the site root)
    error.tsx          route-level error boundary
    loading.tsx        streamed skeleton
    not-found.tsx      404
    globals.css        theme tokens, surfaces, focus + skeleton styles
    <route>/page.tsx   one file per dashboard section
  components/
    Sidebar.tsx        desktop nav, active item from usePathname (client)
    MobileNav.tsx      drawer below lg (client)
    PageHeader.tsx     header strip + Live/Warn pills
    StatTiles.tsx      the KPI grid
    SearchForm.tsx     labelled lookup form
    TableControls.tsx  FilterLinks / TableSearch / TablePagination
    TvsTable.tsx       client, filters in useState
    EventsTable.tsx  AclTable.tsx   server, filters in searchParams
  lib/
    nav.ts             navigation, single source of truth
    nox.ts             chains, contracts, token registry, op categories
    viem.ts            RPC clients
    subgraph.ts        typed indexer queries
    ponder.ts          confidential-transfer queries
    tvs.ts             loadTvsEvents() — shield/unshield scan + cache
    data.ts            loadDashboard() — fans out, aggregates, normalizes
    table.ts           searchParams parsing, href building, pagination
    rpc.ts             chunked getLogs, chain selection, bounded concurrency
    format.ts          number / token / address / time helpers
```

## Running

```bash
pnpm install
cp .env.example .env.local   # then fill in the RPC URLs
pnpm dev
```

Then open <http://localhost:3000>. The first load takes a few seconds while the RPC and
indexer warm up; after that pages are served from the ISR cache and refresh in the
background while the tab is visible.

```bash
pnpm build && pnpm start   # production
pnpm lint
pnpm format
```

## Tests

```bash
pnpm test:e2e                      # all projects
pnpm test:e2e -- --project=desktop # one project
```

`e2e/run.mjs` starts `e2e/mock-backend.mjs`, builds against it, then runs
Playwright against that build. The mock stands in for both the Ponder indexer
and the Sepolia RPC endpoints, so the suite is offline, deterministic, and can
assert on table contents — and it keeps the historical `eth_getLogs` scan out of
the test server. The build runs against the mock too, since the static routes
are prerendered.

Covered: every route and its heading, the `/tvs` redirect, the 404, sidebar and
mobile-drawer navigation, URL-driven filtering (composition, page reset,
reload, shareability), pagination clamping and boundaries, and the
accessibility contract (labelled controls, scoped headers, captions, skip link,
landmark naming, heading order).

## Known limitations

- **`loadTvsEvents` is too heavy to run per request.** It scans from each token's
  deploy block to head over RPC on a cold cache. That is why `/` and `/wraps` stay on
  ISR while `/events` and `/acl` read filters from `searchParams` — reading
  searchParams makes a route dynamic, which moves that scan onto every request and
  takes the server down. The fix is to serve these events from the indexer, which
  already stores the block numbers and timestamps this scan re-derives over RPC.
- Because of the above, the TVS tables still filter client-side, so `/` and `/wraps`
  serialize the full event set (~315KB). `/events` and `/acl` do not.
- `scanHandles` and `scanRoles` cap at 12k / 8k rows. Truncation is now surfaced in the
  UI, but the cap itself remains.
- `lib/tvs.ts` keeps a module-level cache. It is per-process, so on a multi-instance
  deploy different users can see slightly different `partial` states, and it is never
  evicted.

## Roadmap

- Historical TVL/TVS chart
- Vault analytics on `ConfidentialERC7540Factory`
- Per-operator drilldown pages
- Serve shield/unshield events from the indexer, which would remove the RPC log scan
  and let `/` and `/wraps` filter server-side like the other tables

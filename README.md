# iexec-nox-dashboard

Real-time analytics for the [Nox Protocol](https://github.com/iExec-Nox) — confidential
DeFi infrastructure built on Arbitrum Sepolia using TEEs and the ERC-7984 confidential
token standard.

The dashboard answers three questions at a glance:

- **How much value is currently secured** in confidential token wrappers?
- **How many encrypted operations** has the protocol executed, and which primitives dominate?
- **Who is using it** — admins, viewers, and the live transaction feed.

## Live data sources

- **RPC** (`viem`) — `https://sepolia-rollup.arbitrum.io/rpc`, Arbitrum Sepolia public endpoint.
  Used for `inferredTotalSupply()` and `underlying()` calls on each ERC-7984 wrapper, which
  give us the *plaintext* USDC / RLC backing held by the wrapper (encrypted balances stay
  encrypted on-chain, so the wrapper reserve is the only honest measure of TVS).
- **Subgraph** — self-hosted by iExec at
  `https://thegraph.arbitrum-sepolia-testnet.noxprotocol.io/api/subgraphs/id/BjQAX2HpmsSAzURJimKDhjZZnkSJtaczA8RPumggrStb`.
  Provides `Handle` and `HandleRole` entities backing the operation breakdown, top operators,
  active wallets and live feed.

## Stack

- Next.js 16 (App Router, Turbopack, ISR `revalidate: 30`)
- React 19, Tailwind v4 (no `tailwind.config` — theme is inlined in `globals.css`)
- viem 2.x for typed RPC
- graphql-request for the subgraph
- framer-motion for entry animations
- Geist Sans / Mono + Space Grotesk for the display headings

## Project layout

```
src/
  app/
    page.tsx           server component, calls loadDashboard()
    layout.tsx         fonts + metadata
    globals.css        theme tokens, surfaces, grid texture
  components/
    Header.tsx         top nav + chain badge
    Hero.tsx           headline + KPI strip
    TokensSection.tsx  cUSDC / cRLC cards
    OpsSection.tsx     top operators + category tiles
    ActivitySection.tsx  live handle feed
    Footer.tsx
    Reveal.tsx         framer-motion entry wrapper (client)
  lib/
    nox.ts             chain + contract addresses + token registry + op categories
    viem.ts            public client
    abi.ts             ERC-20 and wrapper ABI slices
    subgraph.ts        typed queries
    format.ts          number / token / address / time helpers
    data.ts            loadDashboard() — fans out, aggregates, normalizes
```

## Running

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:3000>. First load takes a few seconds while it warms up the
RPC + subgraph; subsequent loads are served from ISR cache for 30 seconds.

## Roadmap

- Historical TVL chart (requires indexing `ERC20.Transfer` to wrapper + `UnwrapFinalized`)
- Vault analytics on `ConfidentialERC7540Factory` (0xB9390…)
- Per-operator drilldown pages
- WebSocket-pushed updates instead of ISR polling

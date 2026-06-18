/**
 * Data layer — all queries go to the local Ponder indexer (localhost:42069).
 * The Graph subgraph (SUBGRAPH_URL) is no longer used.
 *
 * Public types and function signatures are unchanged so all pages continue
 * to work without modification.
 */
import { GraphQLClient, gql } from "graphql-request";

const PONDER_URL = process.env.PONDER_URL ?? "http://localhost:42069/graphql";
const ARB_SEPOLIA = 421614; // used only for getMeta and block-inspector queries

const client = new GraphQLClient(PONDER_URL, {
  fetch: (input, init) =>
    fetch(input as RequestInfo, { ...init, next: { revalidate: 30 } }),
});

// ── Public types (unchanged) ──────────────────────────────────────────────────

export type HandleRow = {
  id: string;
  operator: string;
  /** unix seconds as string — matches old subgraph blockTimestamp field */
  blockTimestamp: string;
  transactionHash: string;
  isPubliclyDecryptable: boolean;
  blockNumber?: string;
  chainId: number;
};

export type HandleRoleRow = {
  id: string;
  account: string;
  role: "ADMIN" | "VIEWER";
  grantedBy: string;
  blockTimestamp: string;
  chainId: number;
};

export type SubgraphMeta = {
  block: { number: number; timestamp: number };
  hasIndexingErrors: boolean;
};

// ── Internal Ponder response types ────────────────────────────────────────────

type PonderHandle = {
  id: string;
  operator: string;
  caller: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  isPubliclyDecryptable: boolean;
  chainId: number;
};

type PonderGrant = {
  id: string;
  account: string;
  role: string;
  grantedBy: string;
  timestamp: string;
  transactionHash: string;
  chainId: number;
};

function toHandleRow(h: PonderHandle): HandleRow {
  return {
    id: h.id,
    operator: h.operator,
    blockTimestamp: h.timestamp,
    transactionHash: h.transactionHash,
    isPubliclyDecryptable: h.isPubliclyDecryptable,
    blockNumber: h.blockNumber,
    chainId: h.chainId,
  };
}

function toRoleRow(g: PonderGrant): HandleRoleRow {
  return {
    id: g.id,
    account: g.account,
    role: g.role as "ADMIN" | "VIEWER",
    grantedBy: g.grantedBy,
    blockTimestamp: g.timestamp,
    chainId: g.chainId,
  };
}

// ── getMeta ───────────────────────────────────────────────────────────────────

const META_QUERY = gql`
  query Meta($chainId: Int!) {
    fheHandles(
      where: { chainId: $chainId }
      orderBy: "blockNumber"
      orderDirection: "desc"
      limit: 1
    ) {
      items {
        blockNumber
        timestamp
      }
    }
  }
`;

export async function getMeta(): Promise<SubgraphMeta> {
  try {
    const res = await client.request<{
      fheHandles: { items: { blockNumber: string; timestamp: string }[] };
    }>(META_QUERY, { chainId: ARB_SEPOLIA });
    const latest = res.fheHandles.items[0];
    if (!latest) {
      return { block: { number: 0, timestamp: 0 }, hasIndexingErrors: false };
    }
    return {
      block: {
        number: Number(latest.blockNumber),
        timestamp: Number(latest.timestamp),
      },
      hasIndexingErrors: false,
    };
  } catch {
    return { block: { number: 0, timestamp: 0 }, hasIndexingErrors: false };
  }
}

// ── scanHandles ───────────────────────────────────────────────────────────────

const HANDLES_PAGE_QUERY = gql`
  query HandlesPage($limit: Int!, $after: String) {
    fheHandles(
      where: { isPubliclyDecryptable: true }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      after: $after
    ) {
      items {
        id
        operator
        caller
        timestamp
        blockNumber
        transactionHash
        isPubliclyDecryptable
        chainId
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const HANDLES_ALL_QUERY = gql`
  query HandlesAll($limit: Int!, $after: String) {
    fheHandles(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      after: $after
    ) {
      items {
        id
        operator
        caller
        timestamp
        blockNumber
        transactionHash
        isPubliclyDecryptable
        chainId
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function scanHandles(opts: {
  pageSize?: number;
  maxPages?: number;
  since?: number;
  publicOnly?: boolean;
}): Promise<HandleRow[]> {
  const pageSize = Math.min(opts.pageSize ?? 1000, 1000);
  const maxPages = opts.maxPages ?? 20;
  const out: HandleRow[] = [];
  let after: string | null = null;

  for (let i = 0; i < maxPages; i++) {
    type R = { fheHandles: { items: PonderHandle[]; pageInfo: { hasNextPage: boolean; endCursor: string } } };
    let res: R;
    try {
      if (opts.publicOnly) {
        res = await client.request<R>(HANDLES_PAGE_QUERY, { limit: pageSize, after });
      } else {
        res = await client.request<R>(HANDLES_ALL_QUERY, { limit: pageSize, after });
      }
    } catch {
      break;
    }

    const items = res.fheHandles.items;
    const filtered = opts.since
      ? items.filter((h) => Number(h.timestamp) >= opts.since!)
      : items;
    out.push(...filtered.map(toHandleRow));

    if (!res.fheHandles.pageInfo.hasNextPage) break;
    after = res.fheHandles.pageInfo.endCursor;
  }
  return out;
}

// ── scanRoles ─────────────────────────────────────────────────────────────────

const GRANTS_PAGE_QUERY = gql`
  query GrantsPage($limit: Int!, $after: String) {
    aclGrants(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      after: $after
    ) {
      items {
        id
        account
        role
        grantedBy
        timestamp
        transactionHash
        chainId
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function scanRoles(opts: {
  pageSize?: number;
  maxPages?: number;
}): Promise<HandleRoleRow[]> {
  const pageSize = Math.min(opts.pageSize ?? 1000, 1000);
  const maxPages = opts.maxPages ?? 10;
  const out: HandleRoleRow[] = [];
  let after: string | null = null;

  for (let i = 0; i < maxPages; i++) {
    type R = { aclGrants: { items: PonderGrant[]; pageInfo: { hasNextPage: boolean; endCursor: string } } };
    let res: R;
    try {
      res = await client.request<R>(GRANTS_PAGE_QUERY, { limit: pageSize, after });
    } catch {
      break;
    }
    out.push(...res.aclGrants.items.map(toRoleRow));
    if (!res.aclGrants.pageInfo.hasNextPage) break;
    after = res.aclGrants.pageInfo.endCursor;
  }
  return out;
}

// ── getHandlesByTx ────────────────────────────────────────────────────────────

const HANDLES_BY_TX_QUERY = gql`
  query HandlesByTx($txHash: String!) {
    fheHandles(
      where: { transactionHash: $txHash }
      limit: 1000
    ) {
      items {
        id
        operator
        caller
        timestamp
        blockNumber
        transactionHash
        isPubliclyDecryptable
        chainId
      }
    }
  }
`;

export async function getHandlesByTx(txHash: string): Promise<HandleRow[]> {
  try {
    const res = await client.request<{ fheHandles: { items: PonderHandle[] } }>(
      HANDLES_BY_TX_QUERY,
      { txHash: txHash.toLowerCase() },
    );
    return res.fheHandles.items.map(toHandleRow);
  } catch {
    return [];
  }
}

// ── getHandleById ─────────────────────────────────────────────────────────────

const HANDLE_BY_ID_QUERY = gql`
  query HandleById($id: String!) {
    fheHandle(id: $id) {
      id
      operator
      caller
      timestamp
      blockNumber
      transactionHash
      isPubliclyDecryptable
      chainId
    }
  }
`;

export async function getHandleById(id: string): Promise<HandleRow | null> {
  try {
    const res = await client.request<{ fheHandle: PonderHandle | null }>(
      HANDLE_BY_ID_QUERY,
      { id: id.toLowerCase() },
    );
    return res.fheHandle ? toHandleRow(res.fheHandle) : null;
  } catch {
    return null;
  }
}

// ── getHandlesByTimestampRange ────────────────────────────────────────────────

const HANDLES_BY_TS_QUERY = gql`
  query HandlesByTs($chainId: Int!, $gte: BigInt!, $lt: BigInt!, $limit: Int!) {
    fheHandles(
      where: { chainId: $chainId, timestamp_gte: $gte, timestamp_lt: $lt }
      orderBy: "timestamp"
      orderDirection: "asc"
      limit: $limit
    ) {
      items {
        id
        operator
        caller
        timestamp
        blockNumber
        transactionHash
        isPubliclyDecryptable
        chainId
      }
    }
  }
`;

export async function getHandlesByTimestampRange(
  gte: number,
  lt: number,
  limit = 500,
): Promise<HandleRow[]> {
  try {
    const res = await client.request<{ fheHandles: { items: PonderHandle[] } }>(
      HANDLES_BY_TS_QUERY,
      { chainId: ARB_SEPOLIA, gte: String(gte), lt: String(lt), limit },
    );
    return res.fheHandles.items.map(toHandleRow);
  } catch {
    return [];
  }
}

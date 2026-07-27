import { GraphQLClient, gql } from "graphql-request";

const PONDER_URL = process.env.PONDER_URL ?? "http://localhost:42069/graphql";

const client = new GraphQLClient(PONDER_URL, {
  fetch: (input, init) =>
    fetch(input as RequestInfo, { ...init, next: { revalidate: 30 } }),
});

export type PonderTokenStats = {
  address: string;
  holderCount: string;
  transferCount: string;
  mintCount: string;
  burnCount: string;
};

const TOKEN_STATS_QUERY = gql`
  query TokenStats($address: String!, $chainId: Int!) {
    tokens(where: { address: $address, chainId: $chainId }, limit: 1) {
      items {
        address
        holderCount
        transferCount
        mintCount
        burnCount
      }
    }
  }
`;

export async function getPonderTokenStats(
  address: string,
  chainId: number,
): Promise<PonderTokenStats | null> {
  try {
    const res = await client.request<{
      tokens: { items: PonderTokenStats[] };
    }>(TOKEN_STATS_QUERY, {
      address: address.toLowerCase(),
      chainId,
    });
    return res.tokens.items[0] ?? null;
  } catch {
    return null;
  }
}

export type PonderConfidentialTransfer = {
  id: string;
  token: string;
  from: string;
  to: string;
  kind: "MINT" | "BURN" | "TRANSFER";
  timestamp: string;
  transactionHash: string;
  logIndex: number;
  chainId: number;
};

const CONFIDENTIAL_TRANSFERS_QUERY = gql`
  query ConfidentialTransfers($limit: Int!, $after: String) {
    confidentialTransfers(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
      after: $after
    ) {
      items {
        id
        token
        from
        to
        kind
        timestamp
        transactionHash
        logIndex
        chainId
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

type ConfidentialTransfersResponse = {
  confidentialTransfers: {
    items: PonderConfidentialTransfer[];
    pageInfo: { hasNextPage: boolean; endCursor: string };
  };
};

export type ScanTransfersResult = {
  items: PonderConfidentialTransfer[];
  online: boolean;
};

export async function scanConfidentialTransfers(
  limit = 200,
): Promise<ScanTransfersResult> {
  try {
    const res: ConfidentialTransfersResponse = await client.request(
      CONFIDENTIAL_TRANSFERS_QUERY,
      {
        limit,
        after: null,
      },
    );
    return { items: res.confidentialTransfers.items, online: true };
  } catch {
    return { items: [], online: false };
  }
}

export type PonderUnwrap = {
  id: string;
  token: string;
  chainId: number;
  receiver: string;
  plaintextAmount: string | null;
  finalizedBlock: string | null;
  finalizedTimestamp: string | null;
  finalizedTx: string | null;
};

const FINALIZED_UNWRAPS_QUERY = gql`
  query FinalizedUnwraps($token: String!, $chainId: Int!, $limit: Int!, $after: String) {
    unwrapRequests(
      where: { token: $token, chainId: $chainId, status: "FINALIZED" }
      orderBy: "finalizedTimestamp"
      orderDirection: "desc"
      limit: $limit
      after: $after
    ) {
      items {
        id
        token
        chainId
        receiver
        plaintextAmount
        finalizedBlock
        finalizedTimestamp
        finalizedTx
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

type FinalizedUnwrapsResponse = {
  unwrapRequests: {
    items: PonderUnwrap[];
    pageInfo: { hasNextPage: boolean; endCursor: string };
  };
};

export type FinalizedUnwrapsResult = {
  items: PonderUnwrap[];
  /**
   * false when the indexer errored or a paginated scan hit its cap. The unwrap
   * sum is then a lower bound, not authoritative.
   */
  complete: boolean;
};

/**
 * Every finalized unwrap request for a wrapper, straight from the indexer.
 * Replaces the historical `UnwrapFinalized` RPC log scan: Ponder already stores
 * the receiver, plaintext amount and finalized block/timestamp/tx these events
 * carried, so there is nothing left for the RPC to re-derive.
 */
export async function getFinalizedUnwraps(
  token: string,
  chainId: number,
  { pageSize = 1000, maxPages = 20 }: { pageSize?: number; maxPages?: number } = {},
): Promise<FinalizedUnwrapsResult> {
  const items: PonderUnwrap[] = [];
  let after: string | null = null;
  try {
    for (let p = 0; p < maxPages; p++) {
      const res: FinalizedUnwrapsResponse = await client.request(
        FINALIZED_UNWRAPS_QUERY,
        { token: token.toLowerCase(), chainId, limit: pageSize, after },
      );
      items.push(...res.unwrapRequests.items);
      if (!res.unwrapRequests.pageInfo.hasNextPage) return { items, complete: true };
      after = res.unwrapRequests.pageInfo.endCursor;
    }
    return { items, complete: false };
  } catch {
    return { items, complete: false };
  }
}

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

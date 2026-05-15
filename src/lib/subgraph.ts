import { GraphQLClient, gql } from "graphql-request";
import { SUBGRAPH_URL } from "./nox";

const client = new GraphQLClient(SUBGRAPH_URL, {
  fetch: (input, init) =>
    fetch(input as RequestInfo, { ...init, next: { revalidate: 30 } }),
});

export type HandleRow = {
  id: string;
  operator: string;
  blockTimestamp: string;
  transactionHash: string;
  isPubliclyDecryptable: boolean;
};

export type HandleRoleRow = {
  id: string;
  account: string;
  role: "ADMIN" | "VIEWER";
  grantedBy: string;
  blockTimestamp: string;
};

export type SubgraphMeta = {
  block: { number: number; timestamp: number };
  hasIndexingErrors: boolean;
};

const META_QUERY = gql`
  query Meta {
    _meta {
      block {
        number
        timestamp
      }
      hasIndexingErrors
    }
  }
`;

export async function getMeta(): Promise<SubgraphMeta> {
  const res = await client.request<{ _meta: SubgraphMeta }>(META_QUERY);
  return res._meta;
}

const HANDLES_PAGE_QUERY = gql`
  query HandlesPage($first: Int!, $skip: Int!, $where: Handle_filter) {
    handles(first: $first, skip: $skip, where: $where) {
      id
      operator
      blockTimestamp
      isPubliclyDecryptable
    }
  }
`;

export async function scanHandles(opts: {
  pageSize?: number;
  maxPages?: number;
  since?: number;
}): Promise<HandleRow[]> {
  const pageSize = opts.pageSize ?? 1000;
  const maxPages = opts.maxPages ?? 20;
  const where = opts.since ? { blockTimestamp_gte: String(opts.since) } : undefined;
  const out: HandleRow[] = [];
  for (let i = 0; i < maxPages; i++) {
    const res = await client.request<{ handles: HandleRow[] }>(HANDLES_PAGE_QUERY, {
      first: pageSize,
      skip: i * pageSize,
      where,
    });
    out.push(...res.handles);
    if (res.handles.length < pageSize) break;
  }
  return out;
}

const ROLES_PAGE_QUERY = gql`
  query RolesPage($first: Int!, $skip: Int!) {
    handleRoles(first: $first, skip: $skip) {
      id
      account
      role
      grantedBy
      blockTimestamp
    }
  }
`;

export async function scanRoles(opts: {
  pageSize?: number;
  maxPages?: number;
}): Promise<HandleRoleRow[]> {
  const pageSize = opts.pageSize ?? 1000;
  const maxPages = opts.maxPages ?? 10;
  const out: HandleRoleRow[] = [];
  for (let i = 0; i < maxPages; i++) {
    const res = await client.request<{ handleRoles: HandleRoleRow[] }>(
      ROLES_PAGE_QUERY,
      { first: pageSize, skip: i * pageSize },
    );
    out.push(...res.handleRoles);
    if (res.handleRoles.length < pageSize) break;
  }
  return out;
}

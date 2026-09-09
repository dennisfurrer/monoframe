export type PayloadStoreName = "idb" | "session" | "memory";

export type CacheState = "fresh" | "stale" | "miss";

export type CacheEntryMeta = {
  key: string;
  version: string;
  store: PayloadStoreName;
  storedAt: number;
  // served without revalidating until freshUntil, then stale until staleUntil
  freshUntil: number;
  staleUntil: number;
  lastReadAt: number;
  bytes: number;
};

export type CacheResult<T> = {
  value: T;
  source: "cache" | "network";
  state: CacheState;
  meta: CacheEntryMeta | null;
  revalidating: boolean;
};

export type CacheStats = {
  entries: number;
  bytes: number;
  inFlight: number;
  store: PayloadStoreName | "pending";
};

export type CacheOptions = {
  namespace: string;
  version?: string;
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
  maxEntries?: number;
  maxBytes?: number;
  store?: PayloadStoreName | "auto";
  indexStorage?: "local" | "session";
  serveStaleOnError?: boolean;
  now?: () => number;
};

export type ReadOptions = {
  ttlMs?: number;
  staleWhileRevalidateMs?: number;
  force?: boolean;
};

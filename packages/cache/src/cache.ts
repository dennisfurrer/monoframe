import { createEntryIndex } from "./entry-index";
import { createSingleFlight } from "./single-flight";
import { estimateBytes } from "./storage";
import { resolveStore } from "./stores/resolve";
import type { PayloadStore } from "./stores/types";
import type {
  CacheEntryMeta,
  CacheOptions,
  CacheResult,
  CacheState,
  CacheStats,
  ReadOptions,
} from "./types";

const DEFAULT_TTL_MS = 5 * 60_000;
const DEFAULT_SWR_MS = 25 * 60_000;
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

export type Cache = {
  read<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: ReadOptions,
  ): Promise<CacheResult<T>>;
  fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: ReadOptions,
  ): Promise<T>;
  get<T>(key: string): Promise<CacheResult<T> | null>;
  peek(key: string): CacheState;
  set(
    key: string,
    value: unknown,
    options?: ReadOptions,
  ): Promise<CacheEntryMeta>;
  invalidate(key: string): Promise<void>;
  invalidatePrefix(prefix: string): Promise<void>;
  prune(): Promise<number>;
  clear(): Promise<void>;
  stats(): CacheStats;
  flush(): void;
};

export function createCache(options: CacheOptions): Cache {
  const version = options.version ?? "1";
  const defaultTtlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const defaultSwrMs = options.staleWhileRevalidateMs ?? DEFAULT_SWR_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const serveStaleOnError = options.serveStaleOnError ?? true;
  const now = options.now ?? (() => Date.now());

  const index = createEntryIndex({
    namespace: options.namespace,
    storage: options.indexStorage ?? "local",
  });
  const singleFlight = createSingleFlight();

  let storePromise: Promise<PayloadStore> | null = null;
  let resolvedStore: PayloadStore | null = null;

  function store(): Promise<PayloadStore> {
    storePromise ??= resolveStore(
      options.namespace,
      options.store ?? "auto",
    ).then((payloadStore) => {
      resolvedStore = payloadStore;
      return payloadStore;
    });

    return storePromise;
  }

  function liveMeta(key: string): CacheEntryMeta | undefined {
    const meta = index.get(key);
    if (meta === undefined) return undefined;

    if (meta.version !== version) {
      void drop(key);
      return undefined;
    }

    return meta;
  }

  function classify(meta: CacheEntryMeta | undefined, at: number): CacheState {
    if (meta === undefined) return "miss";
    if (at < meta.freshUntil) return "fresh";
    if (at < meta.staleUntil) return "stale";
    return "miss";
  }

  async function drop(key: string): Promise<void> {
    index.remove(key);
    const payloads = await store();
    await payloads.delete(key);
  }

  // Expired entries go first, then least recently read. Decided from the
  // index alone, so no payload is loaded to be thrown away.
  async function enforceLimits(at: number): Promise<void> {
    let totals = index.totals();
    if (totals.entries <= maxEntries && totals.bytes <= maxBytes) return;

    const candidates = index.values().sort((a, b) => {
      const aExpired = a.staleUntil <= at;
      const bExpired = b.staleUntil <= at;
      if (aExpired !== bExpired) return aExpired ? -1 : 1;
      return a.lastReadAt - b.lastReadAt;
    });

    for (const candidate of candidates) {
      if (totals.entries <= maxEntries && totals.bytes <= maxBytes) break;
      await drop(candidate.key);
      totals = index.totals();
    }
  }

  async function write(
    key: string,
    value: unknown,
    at: number,
    ttlMs: number,
    swrMs: number,
  ): Promise<CacheEntryMeta> {
    const payloads = await store();

    const meta: CacheEntryMeta = {
      key,
      version,
      store: payloads.name,
      storedAt: at,
      freshUntil: at + ttlMs,
      staleUntil: at + ttlMs + swrMs,
      lastReadAt: at,
      bytes: estimateBytes(value),
    };

    try {
      await payloads.set(key, value);
      index.put(meta);
    } catch {
      // a failed cache write must never fail the caller's request
      index.remove(key);
      await enforceLimits(at);
      return meta;
    }

    await enforceLimits(at);
    return meta;
  }

  function revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    swrMs: number,
  ): void {
    void singleFlight
      .run(key, fetcher)
      .then((value) => write(key, value, now(), ttlMs, swrMs))
      .catch(() => {
        // a failed refresh leaves the stale value in place
      });
  }

  async function read<T>(
    key: string,
    fetcher: () => Promise<T>,
    readOptions?: ReadOptions,
  ): Promise<CacheResult<T>> {
    const at = now();
    const ttlMs = readOptions?.ttlMs ?? defaultTtlMs;
    const swrMs = readOptions?.staleWhileRevalidateMs ?? defaultSwrMs;

    const meta = liveMeta(key);
    const state = readOptions?.force === true ? "miss" : classify(meta, at);
    const payloads = await store();

    if (meta !== undefined && state !== "miss") {
      const cached = await payloads.get(key);

      // An index hit without a payload means the tiers drifted apart, so
      // treat it as a miss.
      if (cached !== undefined) {
        index.touch(key, at);
        if (state === "stale") revalidate(key, fetcher, ttlMs, swrMs);

        return {
          value: cached as T,
          source: "cache",
          state,
          meta,
          revalidating: state === "stale",
        };
      }

      index.remove(key);
    }

    try {
      const value = await singleFlight.run(key, fetcher);
      const written = await write(key, value, now(), ttlMs, swrMs);

      return {
        value,
        source: "network",
        state: "miss",
        meta: written,
        revalidating: false,
      };
    } catch (error) {
      if (!serveStaleOnError || meta === undefined) throw error;

      const fallback = await payloads.get(key);
      if (fallback === undefined) throw error;

      return {
        value: fallback as T,
        source: "cache",
        state: "stale",
        meta,
        revalidating: false,
      };
    }
  }

  return {
    read,

    async fetch<T>(
      key: string,
      fetcher: () => Promise<T>,
      readOptions?: ReadOptions,
    ): Promise<T> {
      const result = await read(key, fetcher, readOptions);
      return result.value;
    },

    async get<T>(key: string): Promise<CacheResult<T> | null> {
      const at = now();
      const meta = liveMeta(key);
      const state = classify(meta, at);
      if (meta === undefined || state === "miss") return null;

      const payloads = await store();
      const cached = await payloads.get(key);
      if (cached === undefined) {
        index.remove(key);
        return null;
      }

      index.touch(key, at);
      return {
        value: cached as T,
        source: "cache",
        state,
        meta,
        revalidating: false,
      };
    },

    peek(key) {
      return classify(liveMeta(key), now());
    },

    set(key, value, writeOptions) {
      return write(
        key,
        value,
        now(),
        writeOptions?.ttlMs ?? defaultTtlMs,
        writeOptions?.staleWhileRevalidateMs ?? defaultSwrMs,
      );
    },

    invalidate(key) {
      return drop(key);
    },

    async invalidatePrefix(prefix) {
      const doomed = index
        .values()
        .filter((meta) => meta.key.startsWith(prefix));
      for (const meta of doomed) await drop(meta.key);
    },

    async prune() {
      const at = now();
      const doomed = index
        .values()
        .filter((meta) => meta.staleUntil <= at || meta.version !== version);

      for (const meta of doomed) await drop(meta.key);
      return doomed.length;
    },

    async clear() {
      index.clear();
      const payloads = await store();
      await payloads.clear();
    },

    stats() {
      const totals = index.totals();
      return {
        entries: totals.entries,
        bytes: totals.bytes,
        inFlight: singleFlight.size(),
        store: resolvedStore?.name ?? "pending",
      };
    },

    flush() {
      index.flush();
    },
  };
}

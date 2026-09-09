# @monoframe/cache

Browser-side cache for read-heavy API data that changes slowly.

Built for the case where a page pulls the same slow-moving data from a separate service - rewards, incentives, scoring, market lists - on every mount, route change and tab focus, and the thing you actually want to shrink is that service's request log. The data does not need to be live to the second, so most of those requests are waste.

No dependencies. No React coupling. Works under SSR (degrades to an in-memory store on the server).

## Two tiers, because there are two questions

| Tier        | Where                      | Holds                                                                | Why                                                                                                            |
| ----------- | -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Index**   | `localStorage`, one key    | key -> version, timestamps, byte size, which store holds the payload | Synchronous. "Do I need to hit the network?" is answered with zero async work and without opening IndexedDB.   |
| **Payload** | IndexedDB (with fallbacks) | the actual response bodies                                           | Async, megabytes of quota, structured clone - large arrays of objects go in and out without a JSON round-trip. |

Freshness checks, eviction and pruning read the index only. A payload is touched only when a value is actually going to be returned. That is the whole design: keep the cheap metadata somewhere synchronous and small, keep the expensive bytes somewhere async and large.

Payload store selection is `idb` -> `session` -> `memory`, resolved once on first use. A browser with IndexedDB blocked still gets a working cache, just a smaller one.

## Quick start

```ts
import { cacheKey, createCache } from "@monoframe/cache";

const cache = createCache({
  namespace: "rewards",
  version: "2026-09-09", // bump on response-shape changes
  ttlMs: 5 * 60_000, // serve without revalidating
  staleWhileRevalidateMs: 25 * 60_000, // serve stale + refetch in the background
});

const key = cacheKey("markets", { chain: 999, epoch: 12 });

const markets = await cache.fetch(key, () =>
  fetch("https://worker.example/markets?epoch=12").then((r) => r.json()),
);
```

`cacheKey` sorts params, so `{ chain, epoch }` and `{ epoch, chain }` are the same key. Long param sets collapse to a short hash.

Use `read` instead of `fetch` when the UI wants to know what it got:

```ts
const { value, source, state, revalidating } = await cache.read(
  key,
  fetchMarkets,
);
// source: "cache" | "network"   state: "fresh" | "stale" | "miss"
```

## Freshness model

```
storedAt ---- ttlMs ----> freshUntil ---- staleWhileRevalidateMs ----> staleUntil
         fresh: no network         stale: serve now, refetch in background         miss: await network
```

- **fresh** - returned straight from cache, no request.
- **stale** - returned immediately, one background refetch is kicked off. The user never waits.
- **miss** - awaits the fetcher. If the fetcher throws and a payload is still on disk, that value is served instead (`serveStaleOnError`, on by default).

Concurrent reads of the same key share one in-flight request, so ten components mounting at once produce one network call.

## API

| Method                       | Does                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `fetch(key, fetcher, opts?)` | Cached read, returns the value.                                      |
| `read(key, fetcher, opts?)`  | Cached read, returns `{ value, source, state, meta, revalidating }`. |
| `get(key)`                   | Reads cache only, never fetches. `null` on miss.                     |
| `peek(key)`                  | **Synchronous** `"fresh" \| "stale" \| "miss"`. Index only.          |
| `set(key, value, opts?)`     | Writes a value directly (e.g. seeding from an SSR payload).          |
| `invalidate(key)`            | Drops one entry from both tiers.                                     |
| `invalidatePrefix(prefix)`   | Drops everything under a key prefix, e.g. `"markets"`.               |
| `prune()`                    | Drops hard-expired and wrong-version entries. Returns the count.     |
| `clear()`                    | Empties the namespace.                                               |
| `stats()`                    | `{ entries, bytes, inFlight, store }`.                               |
| `flush()`                    | Persists the debounced index write immediately (e.g. on `pagehide`). |

Per-read options: `ttlMs`, `staleWhileRevalidateMs`, `force` (ignore the cached copy and refetch).

## Options

| Option                   | Default    | Notes                                                        |
| ------------------------ | ---------- | ------------------------------------------------------------ |
| `namespace`              | required   | Isolates keys, the index and the IndexedDB database.         |
| `version`                | `"1"`      | Stamped on every entry. A bump invalidates everything older. |
| `ttlMs`                  | 5 min      | Fresh window.                                                |
| `staleWhileRevalidateMs` | 25 min     | Stale window on top of the TTL.                              |
| `maxEntries`             | 200        | LRU eviction, decided from the index.                        |
| `maxBytes`               | 4 MB       | Approximate, from the size recorded at write time.           |
| `store`                  | `"auto"`   | `"auto" \| "idb" \| "session" \| "memory"`.                  |
| `indexStorage`           | `"local"`  | `"session"` scopes the whole cache to one tab.               |
| `serveStaleOnError`      | `true`     | Serve an expired payload when the fetcher throws.            |
| `now`                    | `Date.now` | Injectable clock.                                            |

## Behaviour worth knowing

- **Nothing here can break a read.** A failed cache write (quota, non-cloneable value, blocked storage) drops the entry and returns the network value anyway.
- **Eviction never loads payloads.** Hard-expired entries go first, then least-recently-read, all decided from index metadata.
- **Index writes are debounced** (250 ms) and merged with whatever another tab persisted, so two tabs writing different keys do not clobber each other. Call `flush()` on `pagehide` if you want the last reads recorded.
- **The tiers can drift** - another tab clears storage, the browser evicts under pressure. An index hit with a missing payload is treated as a miss, and the stale index entry is dropped.
- **Version bumps are the invalidation lever.** Change the response shape, bump `version`, every old entry is dead on read.

## Files

```
src/
├── cache.ts           # createCache: read/fetch/get/set/invalidate/prune
├── entry-index.ts     # the synchronous index (localStorage, debounced, cross-tab merge)
├── key.ts             # stable key building + FNV-1a hash
├── single-flight.ts   # in-flight request dedupe
├── storage.ts         # safe Web Storage access + byte estimation
└── stores/            # idb / session / memory payload stores + resolution
```

Not wired into `apps/web`, and not in the publish workflow yet.

## Not considered

Deliberately out of scope here. Listed because the next problem is usually one of these, not a longer TTL.

- **Pass-through / edge caching.** This cache only stops one browser from re-asking. Putting a cache in front of the worker (Cloudflare Cache API, KV) means one origin request serves every user - a much bigger cut to the request log than anything client-side.
- **HTTP-native caching.** `Cache-Control: max-age, stale-while-revalidate` plus `ETag` / `If-None-Match` gets most of this behaviour for free from the browser and CDN, and turns a revalidation into a 304 instead of a full payload. Worth doing at the worker before adding cache layers in the app.
- **Cross-tab single flight.** The index merges across tabs, but requests do not coordinate. `BroadcastChannel` + the Web Locks API would make five open tabs issue one request instead of five.
- **Stampede control.** When many clients share a TTL they expire together and arrive as a burst. TTL jitter on the client and request coalescing at the edge spread that out.
- **Push invalidation.** SSE or a WebSocket saying "epoch 12 scores changed" replaces TTL guessing with an actual event, so data is both fresher and cheaper.
- **Terminal-event races.** Different problem shape, same family: a transaction is sent from the browser wallet, the frontend polls an RPC for its receipt while a backend indexer independently watches blocks. Either side can see it first, and both need to stop. The pattern is a shared terminal marker rather than two timers - whoever confirms first writes it (the frontend POSTs the hash, the indexer writes the row), the other side reads it and stands down: polling ends, the indexer dedupes or validates against what was already stored, and a confirmation-depth rule guards against a reorg turning a "final" entry back into a pending one. A TTL cache has no concept of any of this; it needs an explicit protocol.
- **Also skipped.** Offline write queueing, encryption at rest for per-user payloads, and quota-pressure policies beyond LRU.

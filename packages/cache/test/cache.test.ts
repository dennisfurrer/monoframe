import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCache } from "../src/cache";
import type { Cache } from "../src/cache";
import { installWebStorage, removeWebStorage } from "./helpers";

const TTL = 1_000;
const SWR = 5_000;

let clock = 1_000_000;
let calls = 0;

function fetcher(value = "v"): () => Promise<string> {
  return () => {
    calls += 1;
    return Promise.resolve(`${value}-${calls}`);
  };
}

function build(
  overrides: Partial<Parameters<typeof createCache>[0]> = {},
): Cache {
  return createCache({
    namespace: `test-${Math.random().toString(36).slice(2)}`,
    version: "1",
    ttlMs: TTL,
    staleWhileRevalidateMs: SWR,
    store: "memory",
    now: () => clock,
    ...overrides,
  });
}

beforeEach(() => {
  clock = 1_000_000;
  calls = 0;
});

describe("read", () => {
  it("fetches on a cold miss", async () => {
    const cache = build();
    const result = await cache.read("k", fetcher());

    expect(result.source).toBe("network");
    expect(result.state).toBe("miss");
    expect(result.value).toBe("v-1");
    expect(result.meta?.key).toBe("k");
    expect(calls).toBe(1);
  });

  it("serves from cache inside the ttl without a request", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    clock += TTL - 1;
    const result = await cache.read("k", fetcher());

    expect(result.source).toBe("cache");
    expect(result.state).toBe("fresh");
    expect(result.value).toBe("v-1");
    expect(result.revalidating).toBe(false);
    expect(calls).toBe(1);
  });

  it("serves stale immediately and refreshes in the background", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    clock += TTL + 1;
    const result = await cache.read("k", fetcher());

    expect(result.source).toBe("cache");
    expect(result.state).toBe("stale");
    expect(result.revalidating).toBe(true);
    expect(result.value).toBe("v-1");

    // waitFor has to cover the write, not just the fetch: the refresh resolves
    // before the payload lands in the store.
    await vi.waitFor(() => {
      expect(calls).toBe(2);
      expect(cache.peek("k")).toBe("fresh");
    });

    expect((await cache.get<string>("k"))?.value).toBe("v-2");
  });

  it("treats an entry past the stale window as a miss", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    clock += TTL + SWR + 1;
    expect(cache.peek("k")).toBe("miss");

    const result = await cache.read("k", fetcher());
    expect(result.source).toBe("network");
    expect(result.value).toBe("v-2");
  });

  it("refetches when force is set, even on a fresh entry", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    const result = await cache.read("k", fetcher(), { force: true });

    expect(result.source).toBe("network");
    expect(calls).toBe(2);
  });

  it("honours per read ttl overrides", async () => {
    const cache = build();
    await cache.read("k", fetcher(), { ttlMs: 10, staleWhileRevalidateMs: 0 });

    clock += 11;
    expect(cache.peek("k")).toBe("miss");
  });

  it("collapses concurrent reads of one key into a single request", async () => {
    const cache = build();

    const results = await Promise.all([
      cache.read("k", fetcher()),
      cache.read("k", fetcher()),
      cache.read("k", fetcher()),
    ]);

    expect(calls).toBe(1);
    expect(results.map((result) => result.value)).toEqual([
      "v-1",
      "v-1",
      "v-1",
    ]);
  });

  it("returns the value directly from fetch", async () => {
    const cache = build();
    expect(await cache.fetch("k", fetcher())).toBe("v-1");
  });
});

describe("failures", () => {
  it("serves an expired payload when the fetcher throws", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    clock += TTL + SWR + 1;
    const result = await cache.read("k", () =>
      Promise.reject(new Error("network down")),
    );

    expect(result.source).toBe("cache");
    expect(result.state).toBe("stale");
    expect(result.value).toBe("v-1");
  });

  it("rethrows when serveStaleOnError is off", async () => {
    const cache = build({ serveStaleOnError: false });
    await cache.read("k", fetcher());

    clock += TTL + SWR + 1;
    await expect(
      cache.read("k", () => Promise.reject(new Error("network down"))),
    ).rejects.toThrow("network down");
  });

  it("rethrows when there is nothing cached to fall back to", async () => {
    const cache = build();

    await expect(
      cache.read("cold", () => Promise.reject(new Error("network down"))),
    ).rejects.toThrow("network down");
  });

  it("keeps the stale value when a background refresh fails", async () => {
    const cache = build();
    await cache.read("k", fetcher());

    clock += TTL + 1;
    const result = await cache.read("k", () =>
      Promise.reject(new Error("refresh failed")),
    );

    expect(result.value).toBe("v-1");
    expect(await cache.fetch("k", fetcher())).toBe("v-1");
  });
});

describe("get and peek", () => {
  it("get never reaches the network", async () => {
    const cache = build();
    expect(await cache.get("missing")).toBeNull();
    expect(calls).toBe(0);
  });

  it("get returns a cached entry with its state", async () => {
    const cache = build();
    await cache.set("k", { n: 1 });

    const result = await cache.get<{ n: number }>("k");
    expect(result?.value).toEqual({ n: 1 });
    expect(result?.state).toBe("fresh");
  });

  it("peek reports freshness synchronously", async () => {
    const cache = build();
    expect(cache.peek("k")).toBe("miss");

    await cache.set("k", "value");
    expect(cache.peek("k")).toBe("fresh");

    clock += TTL + 1;
    expect(cache.peek("k")).toBe("stale");

    clock += SWR;
    expect(cache.peek("k")).toBe("miss");
  });
});

describe("invalidation", () => {
  it("drops a single key", async () => {
    const cache = build();
    await cache.set("k", "value");
    await cache.invalidate("k");

    expect(cache.peek("k")).toBe("miss");
    expect(await cache.get("k")).toBeNull();
  });

  it("drops everything under a prefix", async () => {
    const cache = build();
    await cache.set("markets:1", "a");
    await cache.set("markets:2", "b");
    await cache.set("scores:1", "c");

    await cache.invalidatePrefix("markets:");

    expect(cache.peek("markets:1")).toBe("miss");
    expect(cache.peek("markets:2")).toBe("miss");
    expect(cache.peek("scores:1")).toBe("fresh");
  });

  it("clear empties the namespace", async () => {
    const cache = build();
    await cache.set("a", 1);
    await cache.set("b", 2);

    await cache.clear();

    expect(cache.stats().entries).toBe(0);
    expect(await cache.get("a")).toBeNull();
  });

  it("prune removes hard expired entries and reports the count", async () => {
    const cache = build();
    await cache.set("a", 1);
    await cache.set("b", 2);

    clock += TTL + SWR + 1;
    await cache.set("c", 3);

    expect(await cache.prune()).toBe(2);
    expect(cache.stats().entries).toBe(1);
    expect(cache.peek("c")).toBe("fresh");
  });

  it("a version bump invalidates entries written by the old version", async () => {
    const namespace = "shared-version-test";
    const first = build({ namespace, version: "1" });
    await first.set("k", "value");
    expect(first.peek("k")).toBe("fresh");

    const second = build({ namespace, version: "2" });
    expect(second.peek("k")).toBe("miss");
  });
});

describe("eviction", () => {
  it("evicts the least recently read entry past maxEntries", async () => {
    const cache = build({ maxEntries: 2 });

    await cache.set("a", "a");
    clock += 1;
    await cache.set("b", "b");
    clock += 1;
    await cache.read("a", fetcher());

    clock += 1;
    await cache.set("c", "c");

    expect(cache.stats().entries).toBe(2);
    expect(cache.peek("b")).toBe("miss");
    expect(cache.peek("a")).toBe("fresh");
    expect(cache.peek("c")).toBe("fresh");
  });

  it("evicts expired entries before live ones", async () => {
    const cache = build({ maxEntries: 2 });

    await cache.set("old", "old", { ttlMs: 1, staleWhileRevalidateMs: 0 });
    clock += 5;
    await cache.set("recent", "recent");
    await cache.set("newest", "newest");

    expect(cache.peek("old")).toBe("miss");
    expect(cache.peek("recent")).toBe("fresh");
    expect(cache.peek("newest")).toBe("fresh");
  });

  it("evicts on the byte budget", async () => {
    const cache = build({ maxBytes: 200 });

    await cache.set("a", "x".repeat(80));
    clock += 1;
    await cache.set("b", "y".repeat(80));

    expect(cache.stats().bytes).toBeLessThanOrEqual(200);
    expect(cache.stats().entries).toBeLessThan(2);
  });
});

describe("stats", () => {
  it("reports entries, bytes and the resolved store", async () => {
    const cache = build();
    expect(cache.stats().store).toBe("pending");

    await cache.set("a", { value: "hello" });
    const stats = cache.stats();

    expect(stats.entries).toBe(1);
    expect(stats.bytes).toBeGreaterThan(0);
    expect(stats.inFlight).toBe(0);
    expect(stats.store).toBe("memory");
  });
});

describe("index and payload drift", () => {
  beforeEach(() => {
    installWebStorage();
  });

  afterEach(() => {
    removeWebStorage();
  });

  it("treats an index hit with a missing payload as a miss", async () => {
    const namespace = "drift-test";
    const cache = build({ namespace, store: "session" });

    await cache.read("k", fetcher());
    expect(cache.peek("k")).toBe("fresh");

    sessionStorage.removeItem(`${namespace}:payload:k`);

    const result = await cache.read("k", fetcher());
    expect(result.source).toBe("network");
    expect(result.value).toBe("v-2");
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCache } from "../src/cache";
import type { CacheEntryMeta } from "../src/types";
import { installWebStorage, removeWebStorage } from "./helpers";

const NAMESPACE = "index-test";
const INDEX_KEY = `monoframe-cache:${NAMESPACE}:index`;

let clock = 2_000_000;

function build() {
  return createCache({
    namespace: NAMESPACE,
    version: "1",
    ttlMs: 60_000,
    staleWhileRevalidateMs: 60_000,
    store: "session",
    now: () => clock,
  });
}

function readIndex(): Record<string, CacheEntryMeta> {
  const raw = localStorage.getItem(INDEX_KEY);
  if (raw === null) return {};

  const parsed = JSON.parse(raw) as { entries: Record<string, CacheEntryMeta> };
  return parsed.entries;
}

function writeForeignEntry(key: string): void {
  const raw = localStorage.getItem(INDEX_KEY);
  const parsed =
    raw === null
      ? { v: 1, entries: {} as Record<string, CacheEntryMeta> }
      : (JSON.parse(raw) as {
          v: number;
          entries: Record<string, CacheEntryMeta>;
        });

  parsed.entries[key] = {
    key,
    version: "1",
    store: "session",
    storedAt: clock,
    freshUntil: clock + 60_000,
    staleUntil: clock + 120_000,
    lastReadAt: clock,
    bytes: 10,
  };

  localStorage.setItem(INDEX_KEY, JSON.stringify(parsed));
}

beforeEach(() => {
  clock = 2_000_000;
  installWebStorage();
});

afterEach(() => {
  removeWebStorage();
});

describe("entry index persistence", () => {
  it("survives a new cache instance over the same namespace", async () => {
    const first = build();
    await first.set("k", "value");
    first.flush();

    const second = build();
    expect(second.peek("k")).toBe("fresh");
    expect((await second.get<string>("k"))?.value).toBe("value");
  });

  it("writes nothing to storage until it is flushed or debounced", async () => {
    const cache = build();
    await cache.set("k", "value");

    expect(localStorage.getItem(INDEX_KEY)).toBeNull();

    cache.flush();
    expect(Object.keys(readIndex())).toEqual(["k"]);
  });

  it("keeps entries another tab persisted while this one was open", async () => {
    const cache = build();
    await cache.set("mine", "value");
    cache.flush();

    writeForeignEntry("theirs");

    await cache.set("mine-2", "value");
    cache.flush();

    expect(Object.keys(readIndex()).sort()).toEqual([
      "mine",
      "mine-2",
      "theirs",
    ]);
  });

  it("does not resurrect a key this tab deleted", async () => {
    const cache = build();
    await cache.set("doomed", "value");
    cache.flush();

    await cache.invalidate("doomed");
    cache.flush();

    expect(Object.keys(readIndex())).not.toContain("doomed");
    expect(cache.peek("doomed")).toBe("miss");
  });

  it("ignores a corrupted index instead of throwing", async () => {
    localStorage.setItem(INDEX_KEY, "{not json");

    const cache = build();
    expect(cache.peek("k")).toBe("miss");

    await cache.set("k", "value");
    expect(cache.peek("k")).toBe("fresh");
  });

  it("ignores an index written by a future format", () => {
    localStorage.setItem(INDEX_KEY, JSON.stringify({ v: 99, entries: {} }));

    const cache = build();
    expect(cache.peek("k")).toBe("miss");
  });

  it("clear removes the persisted index", async () => {
    const cache = build();
    await cache.set("k", "value");
    cache.flush();
    expect(localStorage.getItem(INDEX_KEY)).not.toBeNull();

    await cache.clear();
    expect(localStorage.getItem(INDEX_KEY)).toBeNull();
  });
});

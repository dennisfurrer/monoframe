import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "../src/stores/memory";
import { resolveStore } from "../src/stores/resolve";
import { createSessionStore } from "../src/stores/session";
import { getWebStorage } from "../src/storage";
import { installWebStorage, removeWebStorage } from "./helpers";

describe("memory store", () => {
  it("round trips values and clears", async () => {
    const store = createMemoryStore();

    expect(await store.get("k")).toBeUndefined();
    await store.set("k", { n: 1 });
    expect(await store.get("k")).toEqual({ n: 1 });

    await store.delete("k");
    expect(await store.get("k")).toBeUndefined();

    await store.set("a", 1);
    await store.clear();
    expect(await store.get("a")).toBeUndefined();
  });
});

describe("session store", () => {
  beforeEach(() => {
    installWebStorage();
  });

  afterEach(() => {
    removeWebStorage();
  });

  it("round trips json values", async () => {
    const store = createSessionStore("ns");
    expect(store).not.toBeNull();
    if (store === null) return;

    await store.set("k", { n: 1 });
    expect(await store.get("k")).toEqual({ n: 1 });
    expect(sessionStorage.getItem("ns:payload:k")).toBe('{"n":1}');
  });

  it("drops unparseable payloads instead of throwing", async () => {
    const store = createSessionStore("ns");
    if (store === null) throw new Error("store unavailable");

    sessionStorage.setItem("ns:payload:k", "{not json");
    expect(await store.get("k")).toBeUndefined();
    expect(sessionStorage.getItem("ns:payload:k")).toBeNull();
  });

  it("clear only removes its own namespace", async () => {
    const mine = createSessionStore("mine");
    const theirs = createSessionStore("theirs");
    if (mine === null || theirs === null) throw new Error("store unavailable");

    await mine.set("k", 1);
    await theirs.set("k", 2);

    await mine.clear();

    expect(await mine.get("k")).toBeUndefined();
    expect(await theirs.get("k")).toBe(2);
  });

  it("is unavailable when there is no sessionStorage", () => {
    removeWebStorage();
    expect(createSessionStore("ns")).toBeNull();
  });
});

describe("getWebStorage", () => {
  afterEach(() => {
    removeWebStorage();
  });

  it("returns null when storage is absent", () => {
    removeWebStorage();
    expect(getWebStorage("local")).toBeNull();
    expect(getWebStorage("session")).toBeNull();
  });

  it("returns null when storage throws on write", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        setItem() {
          throw new Error("blocked");
        },
        removeItem() {
          return undefined;
        },
      },
      configurable: true,
      writable: true,
    });

    expect(getWebStorage("local")).toBeNull();
  });
});

describe("resolveStore", () => {
  afterEach(() => {
    removeWebStorage();
  });

  it("falls back to memory when nothing is available", async () => {
    removeWebStorage();
    expect((await resolveStore("ns", "auto")).name).toBe("memory");
  });

  it("prefers sessionStorage over memory when IndexedDB is absent", async () => {
    installWebStorage();
    expect((await resolveStore("ns", "auto")).name).toBe("session");
  });

  it("honours an explicit memory preference", async () => {
    installWebStorage();
    expect((await resolveStore("ns", "memory")).name).toBe("memory");
  });

  it("falls back to memory when an explicit idb preference cannot be met", async () => {
    installWebStorage();
    expect((await resolveStore("ns", "idb")).name).toBe("memory");
  });
});

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createIdbStore } from "../src/stores/idb";
import { resolveStore } from "../src/stores/resolve";

describe("indexeddb store", () => {
  it("round trips values through structured clone", async () => {
    const store = await createIdbStore("idb-round-trip");
    expect(store).not.toBeNull();
    if (store === null) return;

    const value = {
      when: new Date("2026-01-01T00:00:00.000Z"),
      rows: [1, 2, 3],
    };

    await store.set("k", value);
    expect(await store.get("k")).toEqual(value);
  });

  it("keeps Date instances rather than stringifying them", async () => {
    const store = await createIdbStore("idb-dates");
    if (store === null) throw new Error("store unavailable");

    await store.set("k", { when: new Date("2026-01-01T00:00:00.000Z") });
    const read = (await store.get("k")) as { when: Date };

    expect(read.when).toBeInstanceOf(Date);
  });

  it("deletes and clears", async () => {
    const store = await createIdbStore("idb-delete");
    if (store === null) throw new Error("store unavailable");

    await store.set("a", 1);
    await store.set("b", 2);

    await store.delete("a");
    expect(await store.get("a")).toBeUndefined();
    expect(await store.get("b")).toBe(2);

    await store.clear();
    expect(await store.get("b")).toBeUndefined();
  });

  it("is chosen ahead of the other stores when available", async () => {
    expect((await resolveStore("idb-preferred", "auto")).name).toBe("idb");
  });

  it("keeps namespaces in separate databases", async () => {
    const first = await createIdbStore("idb-ns-one");
    const second = await createIdbStore("idb-ns-two");
    if (first === null || second === null) throw new Error("store unavailable");

    await first.set("k", "first");
    await second.set("k", "second");

    expect(await first.get("k")).toBe("first");
    expect(await second.get("k")).toBe("second");
  });
});

import { describe, expect, it } from "vitest";
import { cacheKey, hashString } from "../src/key";

describe("cacheKey", () => {
  it("ignores param order", () => {
    expect(cacheKey("markets", { chain: 1, epoch: 12 })).toBe(
      cacheKey("markets", { epoch: 12, chain: 1 }),
    );
  });

  it("returns the bare name when there are no params", () => {
    expect(cacheKey("markets")).toBe("markets");
    expect(cacheKey("markets", {})).toBe("markets");
  });

  it("separates different param values", () => {
    expect(cacheKey("markets", { epoch: 12 })).not.toBe(
      cacheKey("markets", { epoch: 13 }),
    );
  });

  it("drops undefined params so they do not split the key", () => {
    expect(cacheKey("markets", { epoch: 12, cursor: undefined })).toBe(
      cacheKey("markets", { epoch: 12 }),
    );
  });

  it("keeps short params readable", () => {
    expect(cacheKey("markets", { epoch: 12 })).toBe("markets#{epoch:12}");
  });

  it("collapses long param sets to a hash but keeps the name", () => {
    const key = cacheKey("markets", { filter: "x".repeat(200) });

    expect(key.startsWith("markets#")).toBe(true);
    expect(key.length).toBeLessThan(40);
  });

  it("handles nested objects and arrays deterministically", () => {
    const first = cacheKey("q", { where: { b: [1, 2], a: true } });
    const second = cacheKey("q", { where: { a: true, b: [1, 2] } });

    expect(first).toBe(second);
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("monoframe")).toBe(hashString("monoframe"));
  });

  it("separates different inputs", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("returns a compact base36 string", () => {
    expect(hashString("a".repeat(5000))).toMatch(/^[0-9a-z]+$/);
  });
});

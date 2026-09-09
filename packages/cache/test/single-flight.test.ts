import { describe, expect, it } from "vitest";
import { createSingleFlight } from "../src/single-flight";
import { deferred } from "./helpers";

describe("createSingleFlight", () => {
  it("shares one promise across concurrent calls for the same key", async () => {
    const singleFlight = createSingleFlight();
    const gate = deferred<number>();
    let calls = 0;

    const run = () =>
      singleFlight.run("k", () => {
        calls += 1;
        return gate.promise;
      });

    const results = Promise.all([run(), run(), run()]);
    expect(singleFlight.size()).toBe(1);
    expect(singleFlight.has("k")).toBe(true);

    gate.resolve(7);
    expect(await results).toEqual([7, 7, 7]);
    expect(calls).toBe(1);
  });

  it("keeps different keys independent", async () => {
    const singleFlight = createSingleFlight();
    let calls = 0;

    await Promise.all([
      singleFlight.run("a", () => {
        calls += 1;
        return Promise.resolve("a");
      }),
      singleFlight.run("b", () => {
        calls += 1;
        return Promise.resolve("b");
      }),
    ]);

    expect(calls).toBe(2);
  });

  it("releases the key once settled", async () => {
    const singleFlight = createSingleFlight();
    let calls = 0;

    const fetcher = () => {
      calls += 1;
      return Promise.resolve(calls);
    };

    expect(await singleFlight.run("k", fetcher)).toBe(1);
    expect(singleFlight.size()).toBe(0);
    expect(await singleFlight.run("k", fetcher)).toBe(2);
  });

  it("propagates a rejection to every caller and clears the key", async () => {
    const singleFlight = createSingleFlight();
    const failing = () => Promise.reject(new Error("boom"));

    const first = singleFlight.run("k", failing);
    const second = singleFlight.run("k", failing);

    await expect(first).rejects.toThrow("boom");
    await expect(second).rejects.toThrow("boom");
    expect(singleFlight.size()).toBe(0);
  });

  it("catches a fetcher that throws synchronously", async () => {
    const singleFlight = createSingleFlight();

    await expect(
      singleFlight.run("k", () => {
        throw new Error("sync boom");
      }),
    ).rejects.toThrow("sync boom");
    expect(singleFlight.size()).toBe(0);
  });
});

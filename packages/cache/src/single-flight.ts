export type SingleFlight = {
  run<T>(key: string, fn: () => Promise<T>): Promise<T>;
  has(key: string): boolean;
  size(): number;
};

export function createSingleFlight(): SingleFlight {
  const inFlight = new Map<string, Promise<unknown>>();

  return {
    run<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const existing = inFlight.get(key);
      if (existing !== undefined) return existing as Promise<T>;

      const promise = (async () => fn())().finally(() => {
        inFlight.delete(key);
      });

      inFlight.set(key, promise);
      return promise;
    },

    has(key) {
      return inFlight.has(key);
    },

    size() {
      return inFlight.size;
    },
  };
}

import type { PayloadStore } from "./types";

export function createMemoryStore(): PayloadStore {
  const values = new Map<string, unknown>();

  return {
    name: "memory",

    get(key) {
      return Promise.resolve(values.get(key));
    },

    set(key, value) {
      values.set(key, value);
      return Promise.resolve();
    },

    delete(key) {
      values.delete(key);
      return Promise.resolve();
    },

    clear() {
      values.clear();
      return Promise.resolve();
    },
  };
}

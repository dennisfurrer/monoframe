import { getWebStorage } from "../storage";
import type { PayloadStore } from "./types";

// Values must be JSON-serializable.
export function createSessionStore(namespace: string): PayloadStore | null {
  const storage = getWebStorage("session");
  if (storage === null) return null;

  const prefix = `${namespace}:payload:`;

  return {
    name: "session",

    get(key) {
      const raw = storage.getItem(prefix + key);
      if (raw === null) return Promise.resolve(undefined);

      try {
        return Promise.resolve(JSON.parse(raw) as unknown);
      } catch {
        storage.removeItem(prefix + key);
        return Promise.resolve(undefined);
      }
    },

    set(key, value) {
      storage.setItem(prefix + key, JSON.stringify(value));
      return Promise.resolve();
    },

    delete(key) {
      storage.removeItem(prefix + key);
      return Promise.resolve();
    },

    clear() {
      const doomed = Object.keys(storage).filter((key) =>
        key.startsWith(prefix),
      );
      for (const key of doomed) storage.removeItem(key);
      return Promise.resolve();
    },
  };
}

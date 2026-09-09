type StorageGlobals = {
  localStorage?: Storage;
  sessionStorage?: Storage;
};

const PROBE_KEY = "__monoframe_cache_probe__";

// Absent under SSR, and throws on access in some privacy modes.
export function getWebStorage(kind: "local" | "session"): Storage | null {
  const globals = globalThis as StorageGlobals;

  try {
    const storage =
      kind === "local" ? globals.localStorage : globals.sessionStorage;
    if (!storage) return null;

    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

export function estimateBytes(value: unknown): number {
  try {
    const json = JSON.stringify(value) as string | undefined;
    return json === undefined ? 0 : json.length * 2;
  } catch {
    return 0;
  }
}

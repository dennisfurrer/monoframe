import { getWebStorage } from "./storage";
import type { CacheEntryMeta } from "./types";

const INDEX_FILE_VERSION = 1;
const FLUSH_DELAY_MS = 250;

type IndexFile = {
  v: number;
  entries: Record<string, CacheEntryMeta>;
};

export type EntryIndex = {
  get(key: string): CacheEntryMeta | undefined;
  put(meta: CacheEntryMeta): void;
  touch(key: string, at: number): void;
  remove(key: string): void;
  values(): CacheEntryMeta[];
  totals(): { entries: number; bytes: number };
  clear(): void;
  flush(): void;
};

export type EntryIndexOptions = {
  namespace: string;
  storage: "local" | "session";
};

function isEntryMeta(value: unknown): value is CacheEntryMeta {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CacheEntryMeta>;

  return (
    typeof candidate.key === "string" &&
    typeof candidate.version === "string" &&
    typeof candidate.storedAt === "number" &&
    typeof candidate.freshUntil === "number" &&
    typeof candidate.staleUntil === "number"
  );
}

function readIndexFile(storage: Storage, storageKey: string): IndexFile | null {
  const raw = storage.getItem(storageKey);
  if (raw === null) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    const file = parsed as Partial<IndexFile>;
    if (file.v !== INDEX_FILE_VERSION) return null;

    const entries: unknown = file.entries;
    if (typeof entries !== "object" || entries === null) return null;

    return {
      v: INDEX_FILE_VERSION,
      entries: entries as Record<string, CacheEntryMeta>,
    };
  } catch {
    return null;
  }
}

export function createEntryIndex(options: EntryIndexOptions): EntryIndex {
  const storageKey = `monoframe-cache:${options.namespace}:index`;
  const entries = new Map<string, CacheEntryMeta>();
  const tombstones = new Set<string>();

  let loaded = false;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function storage(): Storage | null {
    return getWebStorage(options.storage);
  }

  function load(): void {
    if (loaded) return;
    loaded = true;

    const target = storage();
    if (target === null) return;

    const file = readIndexFile(target, storageKey);
    if (file === null) return;

    for (const [key, meta] of Object.entries(file.entries)) {
      if (isEntryMeta(meta)) entries.set(key, meta);
    }
  }

  function persist(): void {
    flushTimer = null;

    const target = storage();
    if (target === null) return;

    // Merge before writing so a tab that wrote other keys is not clobbered.
    const merged = new Map(entries);
    const persisted = readIndexFile(target, storageKey);

    if (persisted !== null) {
      for (const [key, meta] of Object.entries(persisted.entries)) {
        if (!isEntryMeta(meta)) continue;
        if (tombstones.has(key)) continue;

        const mine = merged.get(key);
        if (mine === undefined || meta.storedAt > mine.storedAt) {
          merged.set(key, meta);
        }
      }
    }

    for (const [key, meta] of merged) entries.set(key, meta);
    tombstones.clear();

    const file: IndexFile = {
      v: INDEX_FILE_VERSION,
      entries: Object.fromEntries(merged),
    };

    try {
      target.setItem(storageKey, JSON.stringify(file));
    } catch {
      // a full or blocked storage must not break the read path
    }
  }

  function schedule(): void {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(persist, FLUSH_DELAY_MS);
  }

  return {
    get(key) {
      load();
      return entries.get(key);
    },

    put(meta) {
      load();
      entries.set(meta.key, meta);
      tombstones.delete(meta.key);
      schedule();
    },

    touch(key, at) {
      load();
      const meta = entries.get(key);
      if (meta === undefined) return;

      entries.set(key, { ...meta, lastReadAt: at });
      schedule();
    },

    remove(key) {
      load();
      entries.delete(key);
      tombstones.add(key);
      schedule();
    },

    values() {
      load();
      return [...entries.values()];
    },

    totals() {
      load();
      let bytes = 0;
      for (const meta of entries.values()) bytes += meta.bytes;
      return { entries: entries.size, bytes };
    },

    clear() {
      load();
      entries.clear();
      tombstones.clear();
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      const target = storage();
      if (target === null) return;
      try {
        target.removeItem(storageKey);
      } catch {
        // already cleared in memory
      }
    },

    flush() {
      if (flushTimer !== null) clearTimeout(flushTimer);
      persist();
    },
  };
}

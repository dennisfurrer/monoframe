import type { PayloadStore } from "./types";

const STORE_NAME = "payloads";

type IdbGlobals = { indexedDB?: IDBFactory };

function fromRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed"));
    };
  });
}

function openDatabase(dbName: string): Promise<IDBDatabase | null> {
  const { indexedDB } = globalThis as IdbGlobals;
  if (!indexedDB) return Promise.resolve(null);

  return new Promise((resolve) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDB.open(dbName, 1);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    // a failed or blocked open is not fatal, the caller falls back
    request.onerror = () => {
      resolve(null);
    };
    request.onblocked = () => {
      resolve(null);
    };
  });
}

export async function createIdbStore(
  namespace: string,
): Promise<PayloadStore | null> {
  const opened = await openDatabase(`monoframe-cache:${namespace}`);
  if (opened === null) return null;

  const db: IDBDatabase = opened;

  function run<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let request: IDBRequest<T>;

      try {
        const transaction = db.transaction(STORE_NAME, mode);
        transaction.onabort = () => {
          reject(
            transaction.error ?? new Error("IndexedDB transaction aborted"),
          );
        };
        request = operation(transaction.objectStore(STORE_NAME));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      fromRequest(request).then(resolve, reject);
    });
  }

  return {
    name: "idb",

    get(key) {
      return run<unknown>("readonly", (store) => store.get(key));
    },

    async set(key, value) {
      await run("readwrite", (store) => store.put(value, key));
    },

    async delete(key) {
      await run("readwrite", (store) => store.delete(key));
    },

    async clear() {
      await run("readwrite", (store) => store.clear());
    },
  };
}

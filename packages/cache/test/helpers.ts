export class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

export function installWebStorage(): {
  local: MemoryStorage;
  session: MemoryStorage;
} {
  const local = new MemoryStorage();
  const session = new MemoryStorage();

  Object.defineProperty(globalThis, "localStorage", {
    value: local,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    value: session,
    configurable: true,
    writable: true,
  });

  return { local, session };
}

export function removeWebStorage(): void {
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "sessionStorage");
}

export function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;

  const promise = new Promise<T>((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });

  return { promise, resolve, reject };
}

export function counter() {
  let calls = 0;

  return {
    get calls() {
      return calls;
    },
    fetcher<T>(value: T): () => Promise<T> {
      return () => {
        calls += 1;
        return Promise.resolve(value);
      };
    },
    increment(): () => Promise<number> {
      return () => {
        calls += 1;
        return Promise.resolve(calls);
      };
    },
  };
}

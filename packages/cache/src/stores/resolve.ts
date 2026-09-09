import type { PayloadStoreName } from "../types";
import { createIdbStore } from "./idb";
import { createMemoryStore } from "./memory";
import { createSessionStore } from "./session";
import type { PayloadStore } from "./types";

export async function resolveStore(
  namespace: string,
  preference: PayloadStoreName | "auto",
): Promise<PayloadStore> {
  if (preference === "memory") return createMemoryStore();

  if (preference === "session") {
    return createSessionStore(namespace) ?? createMemoryStore();
  }

  const idb = await createIdbStore(namespace);
  if (idb !== null) return idb;
  if (preference === "idb") return createMemoryStore();

  return createSessionStore(namespace) ?? createMemoryStore();
}

import type { PayloadStoreName } from "../types";

export type PayloadStore = {
  readonly name: PayloadStoreName;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
};

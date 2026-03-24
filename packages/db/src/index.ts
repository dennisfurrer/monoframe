import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const db =
  globalForPrisma.__prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = db;
}

export * from "../generated/prisma";
export type { PrismaClient } from "../generated/prisma";

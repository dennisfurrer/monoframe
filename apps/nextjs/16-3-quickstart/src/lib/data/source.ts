import { fixtureOrganizations } from "./fixtures";
import type {
  DataSource,
  OrganizationMetadata,
  OrganizationRecord,
} from "./types";

// The example runs without Postgres so a clone, and CI, can build it. With
// DATABASE_URL set it reads the real database through @monoframe/db.
export function dataSource(): DataSource {
  return process.env.DATABASE_URL ? "postgres" : "fixtures";
}

async function client() {
  const { db } = await import("@monoframe/db");
  return db;
}

const defaultMetadata: OrganizationMetadata = {
  region: "unknown",
  tier: "free",
  seats: 0,
};

function toMetadata(value: unknown): OrganizationMetadata {
  if (typeof value !== "object" || value === null) return defaultMetadata;

  const raw = value as Partial<Record<keyof OrganizationMetadata, unknown>>;
  const tier = raw.tier;

  return {
    region:
      typeof raw.region === "string" ? raw.region : defaultMetadata.region,
    tier:
      tier === "free" || tier === "pro" || tier === "enterprise"
        ? tier
        : defaultMetadata.tier,
    seats: typeof raw.seats === "number" ? raw.seats : defaultMetadata.seats,
  };
}

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function toRecord(row: OrganizationRow): OrganizationRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    metadata: toMetadata(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listOrganizations(): Promise<OrganizationRecord[]> {
  if (dataSource() === "fixtures") return fixtureOrganizations;

  const db = await client();
  const rows = await db.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return rows.map(toRecord);
}

export async function findOrganization(
  slug: string,
): Promise<OrganizationRecord | null> {
  if (dataSource() === "fixtures") {
    return fixtureOrganizations.find((org) => org.slug === slug) ?? null;
  }

  const db = await client();
  const row = await db.organization.findFirst({
    where: { slug, deletedAt: null },
  });

  return row ? toRecord(row) : null;
}

export async function countOrganizations(): Promise<number> {
  if (dataSource() === "fixtures") return fixtureOrganizations.length;

  const db = await client();
  return db.organization.count({ where: { deletedAt: null } });
}

export async function renameOrganization(
  slug: string,
  name: string,
): Promise<void> {
  const db = await client();
  await db.organization.update({ where: { slug }, data: { name } });
}

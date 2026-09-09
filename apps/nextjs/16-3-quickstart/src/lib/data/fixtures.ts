import type { OrganizationRecord } from "./types";

const seededAt = new Date("2026-01-15T09:00:00.000Z");

export const fixtureOrganizations: OrganizationRecord[] = [
  {
    id: "fixture-northwind",
    name: "Northwind Labs",
    slug: "northwind-labs",
    metadata: { region: "eu-central", tier: "enterprise", seats: 240 },
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "fixture-atlas",
    name: "Atlas Systems",
    slug: "atlas-systems",
    metadata: { region: "us-east", tier: "pro", seats: 48 },
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "fixture-meridian",
    name: "Meridian Freight",
    slug: "meridian-freight",
    metadata: { region: "ap-south", tier: "pro", seats: 96 },
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "fixture-kestrel",
    name: "Kestrel Analytics",
    slug: "kestrel-analytics",
    metadata: { region: "us-west", tier: "free", seats: 6 },
    createdAt: seededAt,
    updatedAt: seededAt,
  },
  {
    id: "fixture-harbour",
    name: "Harbour Collective",
    slug: "harbour-collective",
    metadata: { region: "eu-west", tier: "free", seats: 12 },
    createdAt: seededAt,
    updatedAt: seededAt,
  },
];

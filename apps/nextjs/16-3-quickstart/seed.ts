import { db } from "@monoframe/db";

const organizations = [
  {
    name: "Northwind Labs",
    slug: "northwind-labs",
    metadata: { region: "eu-central", tier: "enterprise", seats: 240 },
  },
  {
    name: "Atlas Systems",
    slug: "atlas-systems",
    metadata: { region: "us-east", tier: "pro", seats: 48 },
  },
  {
    name: "Meridian Freight",
    slug: "meridian-freight",
    metadata: { region: "ap-south", tier: "pro", seats: 96 },
  },
  {
    name: "Kestrel Analytics",
    slug: "kestrel-analytics",
    metadata: { region: "us-west", tier: "free", seats: 6 },
  },
  {
    name: "Harbour Collective",
    slug: "harbour-collective",
    metadata: { region: "eu-west", tier: "free", seats: 12 },
  },
];

async function main() {
  for (const organization of organizations) {
    await db.organization.upsert({
      where: { slug: organization.slug },
      update: { name: organization.name, metadata: organization.metadata },
      create: organization,
    });
  }

  console.log(`seeded ${organizations.length} organizations`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void db.$disconnect();
  });

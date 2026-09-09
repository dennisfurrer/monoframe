import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { Badge } from "@monoframe/ui-atoms";
import { Card, EmptyState } from "@monoframe/ui-molecules";
import { Section } from "@/components/section";
import { DIRECTORY_TAG, getDirectory } from "@/lib/data/organizations";
import { dataSource } from "@/lib/data/source";

export default async function DirectoryPage() {
  "use cache";
  cacheLife("hours");
  cacheTag(DIRECTORY_TAG);

  const organizations = await getDirectory();
  const source = dataSource();

  return (
    <main className="flex flex-col gap-10">
      <Section
        title="Prerendered directory"
        description="The whole page is one cache entry on the hours profile, tagged organizations. It is filled at build, revalidated hourly in the background, and dropped immediately when a rename calls updateTag."
      >
        <div className="flex items-center gap-2">
          <Badge
            variant={source === "postgres" ? "success" : "warning"}
            size="sm"
          >
            {source}
          </Badge>
          <span className="text-sm text-text-muted">
            {organizations.length} organizations
          </span>
        </div>

        {organizations.length === 0 ? (
          <EmptyState
            title="No organizations"
            description="Run the seed script to populate the database."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {organizations.map((organization) => (
              <Card key={organization.id} variant="bordered" padding="md">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/directory/${organization.slug}`}
                      className="text-base font-semibold text-text-primary hover:text-accent"
                    >
                      {organization.name}
                    </Link>
                    <Badge
                      variant={
                        organization.metadata.tier === "enterprise"
                          ? "info"
                          : organization.metadata.tier === "pro"
                            ? "success"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {organization.metadata.tier}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-text-muted">Region</dt>
                      <dd className="text-text-secondary">
                        {organization.metadata.region}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-muted">Seats</dt>
                      <dd className="text-text-secondary">
                        {organization.metadata.seats}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

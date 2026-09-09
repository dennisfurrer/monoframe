import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@monoframe/ui-atoms";
import { Card } from "@monoframe/ui-molecules";
import { Section } from "@/components/section";
import { getDirectory, getOrganization } from "@/lib/data/organizations";
import { RenameForm } from "./rename-form";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const organizations = await getDirectory();
  return organizations.map((organization) => ({ slug: organization.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const organization = await getOrganization(slug);

  return { title: organization ? organization.name : "Organization not found" };
}

export default async function OrganizationPage({ params }: PageProps) {
  // params is a request API, so it is read here and passed into the cached
  // function as an argument rather than being read inside it.
  const { slug } = await params;
  const organization = await getOrganization(slug);

  if (!organization) notFound();

  return (
    <main className="flex flex-col gap-10">
      <Section
        title={organization.name}
        description="One cache entry on the days profile, tagged organizations and organization:slug. generateMetadata and this page call the same cached function, so the read happens once."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info" size="md">
            {organization.metadata.tier}
          </Badge>
          <Badge variant="neutral" size="md">
            {organization.metadata.region}
          </Badge>
          <Badge variant="neutral" size="md">
            {organization.metadata.seats} seats
          </Badge>
        </div>

        <Card variant="bordered" padding="md">
          <RenameForm slug={organization.slug} name={organization.name} />
        </Card>

        <p className="text-sm text-text-muted">
          Updated {organization.updatedAt.toISOString()}
        </p>

        <Link
          href="/directory"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Back to directory
        </Link>
      </Section>
    </main>
  );
}

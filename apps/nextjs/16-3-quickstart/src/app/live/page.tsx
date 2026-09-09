import { Suspense } from "react";
import { headers } from "next/headers";
import { Badge, Skeleton } from "@monoframe/ui-atoms";
import { Card } from "@monoframe/ui-molecules";
import { Section } from "@/components/section";
import { getLiveSnapshot } from "@/lib/live";

export default function LivePage() {
  return (
    <main className="flex flex-col gap-10">
      <Section
        title="Static shell, dynamic holes"
        description="This heading is prerendered. Everything inside a Suspense boundary is uncached, so it is a hole that streams in at request time. That split is what cacheComponents gives you by default."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <RequestSnapshot />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <DeduplicatedReads />
          </Suspense>
        </div>
      </Section>
    </main>
  );
}

async function RequestSnapshot() {
  const requestHeaders = await headers();
  const agent = requestHeaders.get("user-agent") ?? "unknown";

  return (
    <Card variant="bordered" padding="md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">
            dynamic
          </Badge>
          <span className="text-sm font-semibold text-text-primary">
            Request headers
          </span>
        </div>
        <p className="break-all text-sm text-text-secondary">{agent}</p>
        <p className="text-xs text-text-muted">
          headers() is a request API, so this subtree can never be part of the
          static shell.
        </p>
      </div>
    </Card>
  );
}

async function DeduplicatedReads() {
  const first = await getLiveSnapshot();
  const second = await getLiveSnapshot();

  return (
    <Card variant="bordered" padding="md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              first.resolvedAt === second.resolvedAt ? "success" : "danger"
            }
            size="sm"
          >
            {first.resolvedAt === second.resolvedAt ? "deduped" : "duplicated"}
          </Badge>
          <span className="text-sm font-semibold text-text-primary">
            React cache()
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          {first.organizations} organizations, resolved at {first.resolvedAt}
        </p>
        <p className="text-xs text-text-muted">
          Two calls, one timestamp. The second read never reached the database.
        </p>
      </div>
    </Card>
  );
}

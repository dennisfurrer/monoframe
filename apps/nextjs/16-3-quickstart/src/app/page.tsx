import Link from "next/link";
import { cacheLife } from "next/cache";
import { Badge } from "@monoframe/ui-atoms";
import { Card } from "@monoframe/ui-molecules";
import { Section } from "@/components/section";

const layers = [
  {
    name: "Browser",
    detail:
      "@monoframe/cache holds payloads in IndexedDB with a synchronous localStorage index. TTL, stale while revalidate, single flight.",
    route: "/client-cache",
  },
  {
    name: "HTTP",
    detail:
      "GET /api/metrics sends Cache-Control s-maxage and stale-while-revalidate, plus an ETag so a repeat request costs a 304.",
    route: "/client-cache",
  },
  {
    name: "Router",
    detail:
      "cacheLife stale times reach the client router through x-nextjs-stale-time, so prefetched links stay usable.",
    route: "/directory",
  },
  {
    name: "Cache Components",
    detail:
      "use cache with cacheLife and cacheTag fills the static shell at build. Everything else is dynamic by default.",
    route: "/directory",
  },
  {
    name: "On demand",
    detail:
      "updateTag gives read your writes inside a Server Action. revalidateTag with a profile handles the webhook path.",
    route: "/directory",
  },
  {
    name: "Request",
    detail:
      "React cache() dedupes a repeated read inside one render pass, so two components share one query.",
    route: "/live",
  },
  {
    name: "Database",
    detail:
      "Prisma through @monoframe/db, with seeded fixtures when DATABASE_URL is unset so the build never needs a server.",
    route: "/directory",
  },
];

export default async function OverviewPage() {
  "use cache";
  cacheLife("max");

  return (
    <main className="flex flex-col gap-10">
      <Section
        title="Seven caching layers, one request path"
        description="Each route below demonstrates one rendering pattern against the same data. This page is fully cached with the max profile, so it is prerendered at build and served from the static shell."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {layers.map((layer, index) => (
            <Card key={layer.name} variant="bordered" padding="md">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {index + 1}
                  </Badge>
                  <Link
                    href={layer.route}
                    className="text-base font-semibold text-text-primary hover:text-accent"
                  >
                    {layer.name}
                  </Link>
                </div>
                <p className="text-sm text-text-secondary">{layer.detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}

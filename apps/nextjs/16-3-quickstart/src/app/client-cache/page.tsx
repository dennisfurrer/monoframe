import { cacheLife } from "next/cache";
import { Section } from "@/components/section";
import { MetricsPanel } from "./metrics-panel";

export default async function ClientCachePage() {
  "use cache";
  cacheLife("max");

  return (
    <main className="flex flex-col gap-10">
      <Section
        title="Browser and HTTP layers"
        description="The panel reads GET /api/metrics through @monoframe/cache. Payloads land in IndexedDB, freshness comes from the synchronous index, and concurrent reads share one request. The route itself sends s-maxage, stale-while-revalidate and an ETag, so a repeat fetch costs a 304."
      >
        <MetricsPanel />
      </Section>
    </main>
  );
}

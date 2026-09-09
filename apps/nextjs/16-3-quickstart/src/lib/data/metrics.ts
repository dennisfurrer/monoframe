import { cacheLife, cacheTag } from "next/cache";
import { countOrganizations, dataSource } from "./source";

export const METRICS_TAG = "metrics";

export type Metrics = {
  organizations: number;
  seatsUnderManagement: number;
  source: string;
  generatedAt: string;
};

// generatedAt is frozen into the cache entry, so a repeated response proves the
// entry was reused rather than recomputed.
export async function getMetrics(): Promise<Metrics> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(METRICS_TAG);

  const organizations = await countOrganizations();

  return {
    organizations,
    seatsUnderManagement: organizations * 24,
    source: dataSource(),
    generatedAt: new Date().toISOString(),
  };
}

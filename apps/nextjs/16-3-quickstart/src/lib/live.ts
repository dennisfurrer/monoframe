import { cache } from "react";
import { connection } from "next/server";
import { countOrganizations } from "./data/source";

export type LiveSnapshot = {
  organizations: number;
  resolvedAt: string;
};

// React cache() dedupes within a single request. Two components calling this
// during one render share one database round trip and one timestamp.
export const getLiveSnapshot = cache(async (): Promise<LiveSnapshot> => {
  // Sitting inside Suspense does not make a subtree dynamic. connection() is
  // the dynamic access that turns this into a request time hole, and without
  // it the clock read below fails the prerender.
  await connection();

  const organizations = await countOrganizations();

  return {
    organizations,
    resolvedAt: new Date().toISOString(),
  };
});

import { revalidateTag } from "next/cache";
import { DIRECTORY_TAG } from "@/lib/data/organizations";
import { METRICS_TAG } from "@/lib/data/metrics";

export function POST(request: Request) {
  const expected = process.env.REVALIDATE_TOKEN;

  if (!expected || request.headers.get("x-revalidate-token") !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Next 16 requires a cacheLife profile here. Readers keep the stale entry
  // until the refresh lands, which is the difference from updateTag.
  revalidateTag(DIRECTORY_TAG, "max");
  revalidateTag(METRICS_TAG, "max");

  return Response.json({ revalidated: [DIRECTORY_TAG, METRICS_TAG] });
}

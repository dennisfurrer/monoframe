import { hashString } from "@monoframe/cache";
import { getMetrics } from "@/lib/data/metrics";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET(request: Request) {
  const metrics = await getMetrics();
  const etag = `"${hashString(JSON.stringify(metrics))}"`;
  const headers = { "Cache-Control": CACHE_CONTROL, ETag: etag };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return Response.json(metrics, { headers });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { cacheKey, createCache } from "@monoframe/cache";
import type { CacheResult, CacheState, CacheStats } from "@monoframe/cache";
import { Badge, Button, Spinner } from "@monoframe/ui-atoms";
import { Card } from "@monoframe/ui-molecules";

type Metrics = {
  organizations: number;
  seatsUnderManagement: number;
  source: string;
  generatedAt: string;
};

const cache = createCache({
  namespace: "quickstart-metrics",
  version: "1",
  ttlMs: 30_000,
  staleWhileRevalidateMs: 120_000,
  maxEntries: 50,
});

const METRICS_KEY = cacheKey("metrics", { scope: "global" });

async function fetchMetrics(): Promise<Metrics> {
  const response = await fetch("/api/metrics");
  if (!response.ok) {
    throw new Error(`metrics request failed with ${response.status}`);
  }
  return (await response.json()) as Metrics;
}

const stateVariants = {
  fresh: "success",
  stale: "warning",
  miss: "neutral",
} as const;

export function MetricsPanel() {
  const [result, setResult] = useState<CacheResult<Metrics> | null>(null);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [peeked, setPeeked] = useState<CacheState>("miss");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sync = useCallback(() => {
    setStats(cache.stats());
    setPeeked(cache.peek(METRICS_KEY));
  }, []);

  const load = useCallback(
    async (force: boolean) => {
      setPending(true);
      setError(null);
      try {
        setResult(await cache.read(METRICS_KEY, fetchMetrics, { force }));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setPending(false);
        sync();
      }
    },
    [sync],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="bordered" padding="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {result ? (
              <>
                <Badge
                  variant={result.source === "cache" ? "success" : "info"}
                  size="md"
                >
                  {result.source}
                </Badge>
                <Badge variant={stateVariants[result.state]} size="md">
                  {result.state}
                </Badge>
                {result.revalidating ? <Spinner size="sm" /> : null}
              </>
            ) : (
              <Badge variant="neutral" size="md">
                empty
              </Badge>
            )}
            <span className="text-sm text-text-muted">sync peek: {peeked}</span>
          </div>

          {error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Metric
                label="Organizations"
                value={result?.value.organizations}
              />
              <Metric
                label="Seats"
                value={result?.value.seatsUnderManagement}
              />
              <Metric label="Origin" value={result?.value.source} />
              <Metric label="Generated" value={result?.value.generatedAt} />
            </dl>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={pending}
              onClick={() => void load(false)}
            >
              Read
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load(true)}
            >
              Force refetch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void cache.invalidate(METRICS_KEY).then(sync)}
            >
              Invalidate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void cache.clear().then(sync)}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="flat" padding="md">
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Metric label="Entries" value={stats?.entries} />
          <Metric label="Bytes" value={stats?.bytes} />
          <Metric label="In flight" value={stats?.inFlight} />
          <Metric label="Store" value={stats?.store} />
        </dl>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-all text-text-secondary">{value ?? "-"}</dd>
    </div>
  );
}

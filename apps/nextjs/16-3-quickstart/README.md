# Next.js 16.3 quickstart

A full stack example on Next.js 16.3.4 that uses every package in this
monorepo, with caching wired at all seven layers a real app touches.

## Run it

```bash
docker compose up -d                                   # Postgres on 5433
cp .env.example ../../../.env                          # the db package reads the repo root .env
pnpm db:generate && pnpm db:push                       # from the repo root
pnpm --filter @monoframe/nextjs-16-3-quickstart db:seed
pnpm --filter @monoframe/nextjs-16-3-quickstart dev     # http://localhost:3001
```

Without `DATABASE_URL` the app falls back to seeded fixtures, so a clone builds
and runs with no database at all. The directory page shows which source is live.

## The seven layers

| Layer            | Where                                    | What it does                                                                       |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Browser          | `src/app/client-cache/metrics-panel.tsx` | `@monoframe/cache`: IndexedDB payloads, synchronous index, TTL, SWR, single flight |
| HTTP             | `src/app/api/metrics/route.ts`           | `s-maxage`, `stale-while-revalidate`, `ETag` and a 304 on `If-None-Match`          |
| Router           | every `cacheLife` call                   | `stale` reaches the client router as `x-nextjs-stale-time`, 30s minimum            |
| Cache Components | `src/lib/data/organizations.ts`          | `use cache` with `cacheLife` and `cacheTag` fills the static shell                 |
| On demand        | `src/lib/actions.ts`, `api/revalidate`   | `updateTag` for read your writes, `revalidateTag(tag, profile)` for webhooks       |
| Request          | `src/lib/live.ts`                        | React `cache()` dedupes a repeated read within one render pass                     |
| Database         | `src/lib/data/source.ts`                 | Prisma through `@monoframe/db`, fixtures when no database is configured            |

## The routes

- `/` fully cached on the `max` profile. Prerendered, served from the static shell.
- `/directory` one cache entry on `hours`, tagged `organizations`. The ISR path.
- `/directory/[slug]` cached on `days` and tagged per organization. `generateStaticParams` prerenders the known slugs, `generateMetadata` and the page share one cached read, and the rename form writes through Prisma then calls `updateTag`.
- `/live` static shell with two dynamic holes. One reads `headers()`, the other proves React `cache()` dedupe by showing one timestamp for two reads.
- `/client-cache` the browser tier, with live cache state, source, and store stats.

## Invalidating from outside

```bash
curl -X POST http://localhost:3001/api/revalidate \
  -H "x-revalidate-token: local-development-token"
```

## Notes

- `cacheLife` profiles used here are the built ins (`hours`, `days`, `max`) plus
  one inline profile in `src/lib/data/metrics.ts`. Custom named profiles are
  configured in `next.config.ts` and typed by `next typegen`, so they need a
  generation step before `tsc` sees them.
- Cache Components requires the Node.js runtime, and `use cache` is not
  supported in a static export.
- A cached scope cannot read `cookies()`, `headers()` or `searchParams`. The
  detail route shows the pattern: read `params` in the page, pass the slug into
  the cached function as an argument.

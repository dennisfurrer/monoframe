# Next.js templates

Full stack examples that use the monorepo packages as they are meant to be
used. Each directory is a complete, runnable app pinned to one Next.js version,
so a template can lean on that version's features without holding the others
back.

## Naming

Directories are named for the Next.js version they target.

- **Major** (`16-quickstart`): only features stable across the whole major line.
- **Minor** (`16-3-quickstart`): adds capabilities introduced in that minor.

A new directory is added when a version brings features worth a different
implementation, not on every release. Older directories stay as they are, which
is what makes them useful to fork.

| Template          | Next.js | Highlights                                                                       |
| ----------------- | ------- | -------------------------------------------------------------------------------- |
| `16-3-quickstart` | 16.3.4  | Cache Components, `use cache`, `updateTag`, PPR by default, seven caching layers |

## What changed in the 16.3 template

Against a Next.js 15 style app, this template drops the patterns that version 16
removed and adopts what replaced them.

- **Cache Components instead of ad hoc caching.** `cacheComponents: true`
  replaces `experimental.ppr`, `experimental.dynamicIO` and
  `experimental.useCache`, which are all removed. Data is dynamic by default and
  caching is opt in through `use cache`.
- **`cacheLife` and `cacheTag` are stable.** No more `unstable_` prefixes or
  aliased imports.
- **`revalidateTag` takes a profile.** `revalidateTag('tag')` is deprecated;
  it is now `revalidateTag('tag', 'max')`. `updateTag` is the new Server Action
  API for read your writes, and it is what the rename form uses.
- **Request APIs are async only.** `params`, `searchParams`, `cookies()`,
  `headers()` and `draftMode()` can no longer be read synchronously, and none of
  them can be read inside a `use cache` scope. Read them outside and pass values
  in as arguments.
- **Turbopack is the default.** No `--turbopack` flag in the scripts.
- **`next lint` is gone.** Linting runs through the ESLint CLI, which is what
  the shared `@monoframe/eslint-config` already provided.
- **`middleware` is now `proxy`,** on the Node runtime only. This template needs
  neither, so it ships neither.
- **Image defaults moved:** `minimumCacheTTL` is 4 hours, `qualities` defaults
  to `[75]`, and `16` left the default `imageSizes`.

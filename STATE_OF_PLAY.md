# State of play

Written 2026-09-09, after adding `packages/cache`.

## Overview

Monoframe is a well-built tooling skeleton with almost nothing running on top of
it. The parts that usually rot first are the cleanest here: the shared eslint,
prettier, tailwind and tsconfig packages, the pnpm catalog, the turbo task
graph. The parts that usually decide whether a skeleton survives contact with
real work are missing or unfinished: nothing is tested, the packages cannot be
consumed outside this repo in the state they currently publish in, and the
deploy workflow cannot succeed as written.

CI went green for the first time on the branch that added the cache package.
`packages/cache` now has a test suite behind it; nothing else in the repo does.

Short version: a good foundation that has not yet been asked to carry anything.

## Strengths

- **The tooling layer is real.** eslint, prettier, tailwind and tsconfig are
  workspace packages with single owners, and the catalog pins versions in one
  place. Changing the TypeScript target or a lint rule is a one file edit.
- **The type bar is high and the tree passes it.** `noUncheckedIndexedAccess`,
  type-checked lint including `no-unnecessary-condition` and
  `no-non-null-assertion`. That combination catches a class of bug most repos
  ship with.
- **The turbo graph is correct.** `db:generate` is a dependency of lint and
  typecheck, so a clean clone works without tribal knowledge.
- **Workspace-first consumption.** Apps read package source directly, so there
  is no publish-before-you-can-dev loop. `PACKAGES_CI.md` documents the intent.
- **Small surface, no accumulated mess.** Four packages, one app, no dead code.

## Weaknesses

- **Only one package is tested.** `packages/cache` has a vitest suite covering
  freshness transitions, single flight, eviction order, storage fallbacks and
  index drift. Everything else has zero test files: neither app has a smoke
  test, the UI packages have no render tests, and `apps/web` only passes the
  test job because of `--passWithNoTests`.
- **The publish path ships TypeScript source.** `ui-atoms`, `ui-molecules` and
  `cache` export `./src/index.ts` and define no `build` script, so the publish
  workflow's `pnpm build` step builds the web app and nothing else. An external
  consumer installs `.tsx` files and has to transpile `node_modules` to use
  them. There is no `files` field and no LICENSE.
- **Releasing mutates and then commits.** `publish-packages.yml` deletes
  `"private": true` from each package.json, publishes, then commits the result
  to main. After the first release those packages are permanently publishable by
  accident, the version commit lands only if every publish succeeded, and no tag
  is created, so no npm version maps back to a commit.
- **The deploy workflow cannot work.** It tars `apps/web/.next/standalone`, but
  `apps/web/next.config.ts` does not set `output: "standalone"`, so that
  directory never exists. The final step echoes instructions rather than
  triggering a deploy.
- **Minor drift.** `packages/db` depends on `@prisma/adapter-pg`, but the client
  is constructed with `datasourceUrl` and no adapter.

## Opportunities

- **The build pattern already exists elsewhere.** `@outcomexyz/rate-limit` uses
  tsup, a `dist` output, dual esm and cjs exports, a `files` allowlist, a
  license and `prepublishOnly`. Lifting that into a shared `tooling/tsup` config
  makes every package here publishable by inheritance.
- **The cache package is worth publishing on its own merit.** It is not tied to
  the data it was written for, and the two tier split it uses is a pattern most
  frontends reimplement badly.
- **One decision unblocks the package story.** `@monoframe/*` is a skeleton
  namespace, `@outcomexyz/*` is a real one. Picking the real scope turns this
  repo into a package source instead of a demo.
- **CI is cheap to speed up.** Three jobs each repeat install and generate with
  no remote cache. Turbo remote caching is one token away.

## Threats

- **Stack mismatch with the work it is meant to seed.** This skeleton assumes
  AWS and Postgres with Prisma. The production work it should be seeding runs on
  Cloudflare Pages, Workers and D1. A skeleton that does not match the stack
  gets bypassed on the first real project, and then rots unnoticed.
- **Two homes for shared code.** Packages live here under one scope and in
  `utility-packages` under another, with different build conventions. Whichever
  one is not canonical will drift, and the drift is silent.
- **The first real release is also the first test of the release path.** No
  tags, no release history, and the workflow has only ever been dry run.
- **Green CI still mostly means "it compiles".** One tested package does not
  make the signal trustworthy, and it reads as "it works".

## Recommended next steps

1. **Extend the test bar past one package.** `packages/cache` is covered, and
   the same vitest setup ports to the rest: render tests for the UI packages and
   a route smoke test per app. Until then CI cannot tell whether a component or
   a route broke.
2. **Decide the scope and adopt one build pattern.** If packages are for
   external consumption, copy the tsup setup from `rate-limit` into
   `tooling/tsup`, add `files` and a LICENSE, and publish under the real scope.
   If they are not for external consumption, delete `publish-packages.yml` and
   say so in the README.
3. **Fix or delete the deploy workflow.** Either set `output: "standalone"` and
   wire a real target, or remove it until there is one. A workflow that cannot
   succeed is worse than no workflow.
4. **Make releases reversible.** Bump and commit before publishing, tag each
   release, and replace the `private` field deletion with `publishConfig`.
5. **Answer the stack question.** If monoframe is the seed for Cloudflare based
   work, it needs a Workers and D1 variant of the db package and a wrangler
   deploy path. If it is a general reference, say that in the README so nobody
   reaches for it on a project it does not fit.

The first two are worth doing before anything else is built on this. Steps 3 and
4 are cleanup that gets more expensive the longer the workflows sit there
looking finished.

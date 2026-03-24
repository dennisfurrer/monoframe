# Monoframe

Production monorepo skeleton. TypeScript, Next.js, Prisma, Tailwind, Turborepo.

## Requirements

- Node.js >= 22.14
- pnpm >= 10.11 (pinned to 10.15.0)
- PostgreSQL (for `@monoframe/db`)

## Setup

```bash
cp .env.example .env        # configure DATABASE_URL
pnpm install                 # install all workspace deps
pnpm db:generate             # generate Prisma client
```

## Commands

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `pnpm dev`         | Start web app in dev mode (port 3000) |
| `pnpm build`       | Build all packages + apps             |
| `pnpm typecheck`   | TypeScript check across workspace     |
| `pnpm lint`        | Lint all packages                     |
| `pnpm lint:fix`    | Lint + auto-fix                       |
| `pnpm format`      | Check formatting                      |
| `pnpm format:fix`  | Fix formatting                        |
| `pnpm test`        | Run tests                             |
| `pnpm db:generate` | Generate Prisma client                |
| `pnpm db:migrate`  | Run Prisma migrations                 |
| `pnpm db:deploy`   | Deploy migrations to production       |

## Structure

```
monoframe/
├── apps/
│   └── web/                   # Next.js 16 app
├── packages/
│   ├── db/                    # Prisma ORM + schema
│   ├── ui-atoms/              # Atomic UI components
│   └── ui-molecules/          # Composite UI components
├── tooling/
│   ├── eslint/                # ESLint flat config (base, nextjs, react)
│   ├── prettier/              # Prettier + tailwind plugin
│   ├── tailwind/              # Tailwind base + web configs
│   └── typescript/            # Shared tsconfig
├── .github/workflows/         # CI, package publish, deploy
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## Tooling

| Tool             | Version | Purpose                                               |
| ---------------- | ------- | ----------------------------------------------------- |
| **Turborepo**    | 2.5+    | Task orchestration, caching, dependency graph         |
| **pnpm**         | 10.15   | Workspace package manager with catalog                |
| **TypeScript**   | 5.8+    | Strict mode, bundler resolution, shared configs       |
| **Next.js**      | 16.1    | App Router, Turbopack                                 |
| **Prisma**       | 6.14+   | ORM, migrations, type-safe client                     |
| **Tailwind CSS** | 3.4     | Utility-first CSS with CSS custom property theming    |
| **ESLint**       | 9       | Flat config, type-checked rules, import/turbo plugins |
| **Prettier**     | 3.5+    | Formatting with Tailwind class sorting                |

## Package graph

```
@monoframe/web
├── @monoframe/db
├── @monoframe/ui-atoms
└── @monoframe/ui-molecules
    └── @monoframe/ui-atoms
```

## CI/CD

Three GitHub Actions workflows:

- **ci.yml** - Runs on every PR and push to `main`. Lint, typecheck, build, test.
- **publish-packages.yml** - Manual dispatch. Choose patch/minor/major, optional dry run. Publishes `db`, `ui-atoms`, `ui-molecules` to npm. Requires `NPM_TOKEN` secret.
- **deploy-web.yml** - Triggers on push to `main` (scoped to relevant paths). Builds Next.js, packages standalone, uploads to S3. Uses OIDC for AWS auth. Requires `AWS_DEPLOY_ROLE_ARN` and `DEPLOY_BUCKET` secrets.

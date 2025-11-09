# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds App Router routes—`(public)` marketing, `(app)` authenticated dashboards, `api/` service handlers.
- `src/components` organizes UI by domain (`marketing`, `dashboard`, `shared`, `ui`, `i18n`); reuse primitives from `ui`.
- `src/lib` centralizes auth, database, payments, and AI; Prisma schema sits at `src/lib/database/prisma/schema.prisma`.
- `content` stores MDX docs with config in `content-collections.ts`; static files live in `public`.
- `scripts/` covers automation; deployment assets remain in the repo root and `deploys/`.

## Build, Test & Development Commands
- `bun install` once to pull dependencies and install Husky hooks.
- `bun dev` or `make dev` starts the Turbo dev server.
- `bun run build` compiles standalone output; `bun start` smoke-tests production bits.
- `bun lint`, `bun lint:fix`, `bun format`, `bun type-check` keep quality gates green.
- Database lifecycle: `bun db:generate`, `bun db:push`, `bun db:seed`.
- Docker: `make docker-build` to build the image, `make docker-run` to verify it locally.

## Coding Style & Naming Conventions
- TypeScript + React 19 with Tailwind; Biome enforces formatting, lint rules, and imports.
- Adopt `PascalCase` components, `camelCase` helpers, kebab-case folders.
- Co-locate feature logic within its folder; promote shared utilities into `src/lib`.
- Translation keys stay in `src/lib/i18n/translations`; run `bun run i18n:check` before shipping copy.

## Testing Guidelines
- Playwright drives regression (`bun run e2e` locally, `bun run e2e:ci` headless).
- Always run `bun lint` and `bun type-check` before pushing; Husky enforces failures.
- Seed data with `bun db:seed` or targeted scripts; fixtures must be idempotent.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `refactor(scope):`, `fix:`); keep imperative subjects under 75 characters.
- Group related changes per commit and rebase locally for a tidy history.
- PRs must include summary, linked issues, UI screenshots when relevant, config/migration notes, and recent `bun run build` + Playwright status.

## Configuration & Security Notes
- Copy `.env.local.example` to `.env.local`; never commit secrets.
- Maintain `DATABASE_URL`, `BETTER_AUTH_*`, mail keys, and update deploy scripts or Docker secrets when rotating credentials.

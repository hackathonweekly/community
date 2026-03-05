# Project Context

## Purpose
HackathonWeekly Community is a modern web platform for the HackathonWeekly ecosystem. It showcases community content, powers marketing pages, and delivers authenticated dashboards for hackers, sponsors, and organizers with built-in payments, submissions, and analytics.

## Tech Stack
- Next.js 15 App Router with React 19, TypeScript, Tailwind CSS, and Shadcn/ui + Radix primitives
- pnpm workspaces with Turborepo task pipeline, Biome for lint/format, and Playwright for E2E
- Prisma ORM targeting PostgreSQL (Neon-friendly) with Better Auth for social logins + magic links
- Payments via Stripe, WeChat Pay, and additional providers plus React Email, Umami/GA/Baidu analytics, and S3-compatible storage
- Content authored as MDX via `content-collections`, localization handled by next-intl

## Project Conventions

### Code Style
- TypeScript strict mode everywhere; prefer `interface` to `type`, camelCase variables/helpers, PascalCase components/classes, kebab-case files
- Follow Biome auto-formatting and lint rules; Husky enforces format/lint via pre-commit
- UI built with Tailwind utility-first classes (layout → spacing → color ordering) and `@apply` only for complex patterns; reuse primitives from `packages/ui/src/ui`
- Deterministic import ordering: React/Next, third-party, internal alias imports, then relatives; co-locate helper functions and child components in the same file

### Architecture Patterns
- Next.js App Router layouts split into `apps/web/apps/web/src/app/(public)` marketing routes, `(app)` authenticated dashboards, and `apps/web/apps/web/src/app/api` route handlers
- Feature UI lives under `packages/ui/src/{marketing|dashboard|shared|ui|i18n}`, while shared services sit in `packages/lib-server/src` (auth, database, payments, mail, storage, AI, etc.) and shared utilities live in `packages/lib-shared/src`
- Structured content (MDX) is sourced from `apps/web/content/` with schemas in `apps/web/content-collections.ts`; static assets stay in `apps/web/public/`
- Automation scripts live under `scripts/`, deployment manifests at the repo root / `deploys/`, and Prisma schema resides in `packages/lib-server/src/database/prisma/schema.prisma`
- Favor small, single-purpose abstractions; promote shared utilities into `packages/lib-shared/src` instead of duplicating logic

### Testing Strategy
- Unit tests (Jest + Testing Library) target core business logic with an 80%+ coverage goal
- Integration and API tests validate Prisma/database access and third-party integrations
- Critical flows receive Playwright E2E coverage (`pnpm run e2e`, `pnpm run e2e:ci`)
- Run `pnpm lint`, `pnpm format`, and `pnpm type-check` locally before commits; CI gates merges on lint, types, and tests
- Seed data via `pnpm db:seed` (idempotent scripts) to keep fixtures predictable

### Git Workflow
- Simplified Git Flow: `main` (production), `develop` (integration), feature branches (`feature/*`), releases (`release/*`), and hotfixes (`hotfix/*`)
- All commits follow Conventional Commits with optional scopes (auth, db, ui, etc.) and imperative <50 char subjects
- Open PRs against `develop` using the provided template, ensure all checks pass, and obtain at least one approval before merge
- Husky installs on `pnpm install`, so contributors automatically run formatting hooks pre-commit

## Domain Context
Platform centers around HackathonWeekly programs: coordinating hackathon announcements, community posts, submissions/voting, sponsors, and member dashboards. Experiences must support multilingual copy, global payment providers, and content workflows that mix marketing pages with gated dashboards.

## Important Constraints
- Never commit secrets; copy `apps/web/.env.example` to `apps/web/.env.local` and configure DATABASE_URL, auth, mail, and payment keys locally
- Preserve multilingual readiness (next-intl translations in `packages/lib-shared/src/i18n/translations/`) and run `pnpm run i18n:check` before shipping new copy
- All merges must pass linting, type-checking, unit/E2E suites, and adhere to the published Git workflow + review policy
- Database migrations go through Prisma (`pnpm db:generate`, `pnpm db:push`) and should remain backwards-compatible with production data
- Follow documented deployment scripts (Docker + Make targets) to keep release artifacts reproducible

## External Dependencies
- Better Auth for authentication (email magic links + social providers), optionally federated logins
- Prisma ORM against PostgreSQL/Neon databases, with storage integrations targeting S3-compatible services
- Payment processors: Stripe, WeChat Pay, and other configured providers via `packages/lib-server/src/payments`
- Email delivery via React Email templates and pluggable providers (e.g., Resend, AWS SES)
- Observability + analytics: Winston logging plus Umami, Google Analytics, and Baidu Tongji trackers
- Third-party AI/LLM helpers exposed via `packages/lib-server/src/ai`, plus any additional APIs referenced in `scripts/` or `packages/lib-server/src`

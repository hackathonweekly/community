# Repository Guidelines

## Project Structure & Module Organization
- `apps/web/` is the Next.js App Router app. Key areas: `src/app` (routes), `src/modules` (feature modules), `src/features` (domain features), `src/server` (Hono API logic), `content/` (MDX), and `public/` (static assets).
- `packages/` contains shared workspace packages: `config` (feature flags/settings), `lib` (Prisma schema, auth, i18n), and `ui` (shared components).
- `docs/` and `devdocs/` hold documentation; `scripts/` contains repo utilities; `openspec/` hosts specs and change docs.

## Build, Test, and Development Commands
Use `pnpm` (Node.js >= 20). From repo root:
- `pnpm dev` starts the dev server via Turbo (runs `apps/web`).
- `pnpm build` builds for production; `pnpm start` runs the production server.
- `pnpm lint` / `pnpm lint:fix` run Biome linting; `pnpm format` formats with Biome.
- `pnpm type-check` runs TypeScript checks.
- `pnpm e2e` / `pnpm e2e:ci` run Playwright end-to-end tests.
- `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`, `pnpm db:studio` manage Prisma workflows.

## Coding Style & Naming Conventions
- Indentation: tabs, size 4, LF line endings (see `.editorconfig`).
- TypeScript strict mode; prefer `interface` over `type`; avoid `enum` (use const objects).
- Naming: `camelCase` for variables/functions, `PascalCase` for components/types, `UPPER_SNAKE_CASE` for constants, `kebab-case` filenames.
- Tailwind-first styling; keep class order layout -> spacing -> color -> border -> effects.
- Import order: React/Next, third-party, internal aliases (`@/`, `@community/*`), then relative.

## Testing Guidelines
- Unit tests live under `**/__tests__/` and use `*.test.ts(x)` naming.
- Strategy: Jest + Testing Library for unit tests and Playwright for E2E; unit coverage target is 80%+ (see `DEVELOPMENT.md`).
- Run E2E with `pnpm e2e`. For new unit tests, follow patterns in existing `__tests__` folders.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `type(scope): description` (e.g., `feat(auth): add WeChat login`).
- Branch naming: `feature/...` or `fix/...`, branched from `develop`.
- PRs target `develop` (or `main` for hotfixes) and should include a clear summary, test checklist, linked issues, and UI screenshots when relevant.

## Configuration & Secrets
- Copy `apps/web/.env.example` to `apps/web/.env.local` and update values.
- Prisma schema: `packages/lib-server/src/database/prisma/schema.prisma`.

## UI
- When adding new components / UI, please read STYLE_GUIDE.md
- The project uses a single codebase for both desktop and mobile (responsive design via Tailwind breakpoints, no separate mobile app). Use `lg:hidden` for mobile-only components and `hidden lg:block` for desktop-only. Key mobile components: `TabBar` (bottom nav) and `MobileCategoryNav` (top category scroll nav).

## Agent-Specific Instructions
- If using AI assistance, read `CLAUDE.md`. For proposals/spec changes, start with `openspec/AGENTS.md`.

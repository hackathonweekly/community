# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
This project uses **bun** as the package manager (required Node.js >=20).

### Core Development Commands
```bash
# Development
bun dev                # Start development server with Turbo
bun run build          # Build for production, don't use it for debug
bun start              # Start production server

# Code Quality
bun lint               # Run Biome linter
bun lint:fix           # Run Biome linter with auto-fix
bun format             # Format code with Biome
bun type-check         # TypeScript type checking
bun type-check:components # Type check components only
bun type-check:modules    # Type check modules only
bun type-check:watch      # Watch mode type checking
bun check-config       # Validate configuration files

# Database Operations
bun db:generate        # Generate Prisma client
bun db:push            # Push schema to database (development)
bun db:migrate         # Run database migrations
bun db:studio          # Open Prisma Studio
bun db:seed            # Seed database with initial data

# Testing
bun e2e                # Run Playwright tests with UI
bun e2e:ci             # Run Playwright tests in CI mode

# Internationalization
bun i18n:check         # Check for missing translations

# Additional Tools
bun shadcn-ui          # Add shadcn/ui components
bun lint:fast          # Run oxlint for fast type checking
bun lint:all           # Run comprehensive linting (Biome + oxlint)
bun lint:unused        # Check for unused code with knip
```

## Project Architecture

### High-Level Structure
This is a **Next.js 15 App Router** application transformed from a monorepo structure. It serves as a community platform for HackathonWeekly with both marketing pages and application features (events, projects, organizations).

### Key Architectural Patterns

#### API Layer Architecture
- **Hono.js** framework for OpenAPI-compliant REST APIs in `src/server/`
- API routes in `src/app/api/` are minimal and delegate to `src/server/`
- **Business logic belongs in `src/server/`, NOT in `src/app/api/`**
- OpenAPI schema generation available at `/api/docs` and `/api/openapi`
- Better Auth handles all `/api/auth/*` endpoints automatically

#### Authentication & Authorization
- **Better Auth** with Prisma adapter
- Supports: email/password, WeChat OAuth, magic links, passkeys, 2FA, phone number (SMS)
- Organization-based access control with invitation system
- User level system with multiple tracks: membership, creator, mentor, contributor
- Custom plugins: `invitationOnlyPlugin` for invitation-based signup, `wechatOAuth` for WeChat login
- All auth endpoints available via Better Auth OpenAPI schema

#### Database Architecture
- **PostgreSQL** with **Prisma ORM**
- Schema location: `src/lib/database/prisma/schema.prisma`
- Key entities: User, Organization, Member, Project, Event, Purchase
- Advanced user profile system with skills, collaboration preferences, level tracking
- Support for event registration, ticketing, volunteer management
- Community features: projects showcase, comments, likes, bookmarks

#### Content Management
- **content-collections** for MDX-based content (docs, blog, legal pages)
- Content location: `content/` directory with collections defined in `content-collections.ts`
- Fumadocs integration for documentation with search and KaTeX math support
- Collections: `docs`, `docsMeta`, `posts`, `legal` with MDX compilation
- Internationalization support for content (en/zh variants)

#### Data Fetching & State Management
- **TanStack Query** for server state management and data fetching
- Client-side caching with intelligent background updates
- Optimistic updates and error handling

### Key Configuration Files

#### App Configuration (`src/config/index.ts`)
Centralized feature flags and settings:
- **i18n**: Locales (en, zh), default locale (zh), currency settings
- **organizations**: Enable/disable, user creation permissions, forbidden slugs
- **auth**: Signup, magic link, social login, passkeys, password login, 2FA, phone verification
- **payments**: Stripe and WeChat Pay for event ticketing (no subscription billing)
- **ui**: Themes, sidebar layout, public/app mode toggles
- **permissions**: Visitor-level permissions for comments, events, organizations
- **customerService**: AI chat, community service, feedback system

#### Authentication (`src/lib/auth/auth.ts`)
- Better Auth configuration with multiple auth methods
- WeChat OAuth with account linking for multi-platform support
- Phone number verification via Tencent SMS
- Organization invitation system with automatic seat management
- Custom user fields: locale, bio, skills, level system fields, WeChat fields
- Database hooks for auto-generating unique usernames with nanoid

#### Database Schema (`src/lib/database/prisma/schema.prisma`)
- User model with level system fields (membershipLevel, creatorLevel, mentorLevel, contributorLevel)
- Organization model with Better Auth integration
- Event system with registration, ticketing, volunteers, check-in
- Project showcase with team members, milestones, stages
- Identity verification fields for real-name events (realName, idCard)

### Internationalization (i18n)
- **next-intl** for internationalization with request-based locale detection
- Supported locales: English (en), Chinese (zh) - **Chinese is default**
- Translation files: `src/lib/i18n/translations/en.json` and `zh.json`
- Cookie-based locale persistence via `NEXT_LOCALE` cookie
- Locale detection from request headers in `src/modules/i18n/request.ts`
- Content collections support locale-specific MDX content

### Styling & UI
- **Tailwind CSS** with **shadcn/ui** components
- **Biome** for linting and formatting (configuration in `biome.json`)
- Theme support (light/dark) with next-themes
- Component library: Radix UI primitives

### File Organization Patterns

#### Route Structure
- `src/app/(public)/`: Marketing pages with locale routing
- `src/app/(app)/app/(account)/`: Protected user account routes
- `src/app/(app)/app/(organizations)/`: Organization management routes
- `src/app/(app)/auth/`: Authentication pages (login, signup, verify)
- `src/app/api/`: Minimal API routes delegating to `src/server/`

#### Server Structure (API Business Logic)
- `src/server/app.ts`: Main Hono app with all route mounting
- `src/server/routes/`: Feature-based route handlers
- `src/server/middleware/`: Auth, admin, CORS, rate limiting, error handling
- `src/server/lib/`: OpenAPI schema merging utilities

#### Component Structure
- `src/components/ui/`: Base UI components (shadcn/ui)
- Feature-specific components organized by route in `src/app/`
- Shared utilities in component files

#### Library Structure
- `src/lib/auth/`: Authentication configuration and utilities
- `src/lib/database/`: Prisma client, queries, and migrations
- `src/lib/mail/`: Email templates and providers with React Email
- `src/lib/payments/`: Payment provider integrations (Stripe, WeChat Pay)
- `src/lib/storage/`: S3-compatible file storage utilities
- `src/lib/ai/`: AI/LLM integrations with OpenAI
- `src/lib/sms/`: Tencent SMS integration for phone verification

#### Module Structure
- `src/modules/i18n/`: Internationalization module with request handling
- `src/modules/dashboard/`: Dashboard application module
- `src/modules/marketing/`: Marketing pages module
- `@analytics`: Analytics module (aliased in TypeScript paths)

### Development Guidelines

#### Code Style & Principles
- Use Biome for linting and formatting (not ESLint/Prettier)
- TypeScript strict mode - prefer interfaces over types, avoid enums (use maps/const objects instead)
- Functional and declarative programming patterns
- Server components by default, client components when needed (use "use client" directive)
- Structure: exported component, subcomponents, helpers, types
- unify public storage endpoint retrieval from `@/config`
- **TypeScript Path Aliases Available**:
  - `@/*` → `./src/*`
  - `@/config` → `./src/config`
  - `@/lib/*` → `./src/lib/*`
  - `@/components/*` → `./src/components/*`
  - `@/modules/*` → `./src/modules/*`
  - `@i18n` → `./src/modules/i18n`
  - `@analytics` → `./src/modules/analytics`
  - `@dashboard/*` → `./src/modules/dashboard/*`
  - `content-collections` → `./.content-collections/generated`

#### API Development
- **IMPORTANT: Put business logic in `src/server/`, NOT in `src/app/api/`**
- Use Hono.js with OpenAPI schema generation
- Apply middleware for auth, admin, rate limiting as needed
- Better Auth handles all `/api/auth/*` endpoints automatically

#### Database Operations
- Always run `bun db:generate` after schema changes
- Use `bun db:push` for development (skips migration files)
- Use `bun db:migrate` for production (creates migration files)
- Database queries can be organized in `src/lib/database/prisma/queries/` or colocated with route handlers

#### Content Management
- MDX files in `content/` directory with frontmatter
- Use content-collections for type-safe content access
- Provide both en and zh variants where applicable

#### Testing
- Playwright for E2E testing
- Use `bun e2e` for interactive UI mode during development
- Use `bun e2e:ci` for CI pipeline execution

### Environment Setup
- Copy `.env.local.example` to `.env.local`
- Configure `DATABASE_URL` (recommend Neon DB for PostgreSQL)
- Configure `BETTER_AUTH_SECRET` 
- Set up authentication providers (WeChat OAuth, SMS)
- Configure email provider (SMTP or service like Resend)
- Set up storage provider (S3-compatible like AWS S3, Cloudflare R2)

### Deployment Considerations
- Next.js standalone output mode enabled for smaller deployments
- Standalone deployment structure:
  ```
  .next/standalone/   # Main program
  .next/static/       # Must copy - static assets
  public/             # Must copy - public files
  ```
- Use `npm` (not `bun`) for production deployment due to standalone + bun compatibility issues
- Database migrations must run before deployment
- For server deployment: Use PM2 for process management (scripts included)
- For Vercel deployment: Push to GitHub and connect repository
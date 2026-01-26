# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev               # Start dev server on port 5173

# Build & Preview
bun run build             # Production build
bun run preview           # Preview production build

# Unit Testing (Vitest)
bun run test              # Run unit tests
bun run test:watch        # Run tests in watch mode
bun run test:coverage     # Run tests with coverage
bun run test:ui           # Open Vitest UI

# E2E Testing (Playwright)
bun run test:e2e          # Run e2e tests
bun run test:e2e:ui       # Open Playwright UI
bun run test:e2e:headed   # Run with browser visible
bun run test:e2e:debug    # Debug mode

# Linting & Formatting (Biome)
bun run lint              # Lint code
bun run format            # Format code
bun run check             # Run both lint and format checks

# Database (Drizzle + PostgreSQL)
bun run db:generate       # Generate migrations
bun run db:migrate        # Run migrations
bun run db:push           # Push schema directly
bun run db:studio         # Open Drizzle Studio

# Shadcn Components
bunx shadcn@latest add <component>  # Add new UI component
```

## Architecture

**Stack**: TanStack Start (React 19) + Vite 7 + Nitro + TypeScript

**Routing**: File-based routing via TanStack Router. Routes live in `src/routes/`. The route tree is auto-generated at `src/routeTree.gen.ts`.

**Data Fetching**: TanStack Query with SSR integration. Query client setup in `src/integrations/tanstack-query/`.

**Database**: Drizzle ORM with PostgreSQL (Supabase). Schema at `src/db/schema.ts`, connection at `src/db/index.ts`. Requires `DATABASE_URL` env var.

**Auth**: Better Auth configured in `src/lib/auth.ts`. Requires `BETTER_AUTH_SECRET` env var.

**Deployment**: Vercel (Nitro preset configured in `vite.config.ts`). Database hosted on Supabase.

**UI**: Shadcn (new-york style) + Tailwind CSS v4. Components in `src/components/ui/`. Uses `cn()` utility from `src/lib/utils.ts` for class merging.

**Path Aliases**: `@/*` maps to `./src/*`

**Testing**: Vitest for unit tests (`src/**/*.test.{ts,tsx}`), Playwright for e2e tests (`e2e/*.spec.ts`). Test setup in `src/test/setup.ts`.

## Code Style

- Biome enforces tabs for indentation and double quotes for strings
- `src/routeTree.gen.ts` and `src/styles.css` are excluded from linting

## Content Guidelines

- **语言**: 所有用户界面文案必须使用中文
- **目标客户**: 主要面向硬件设备（如小智AI等智能硬件），文案需考虑硬件集成场景

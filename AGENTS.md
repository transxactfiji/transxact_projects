# Transxact Projects – Agent Guide

## Setup
```bash
npm install          # install dependencies
cp .env.example .env # or create .env manually (see README)
npm run db:push      # sync SQLite schema
npm run db:seed:admin # create initial admin user
npm run dev          # http://localhost:3000
```

The DB file is specified by `DB_FILE_NAME` in `.env` (e.g., `file:transxact_project.db`). SQLite files are gitignored.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm run lint` | ESLint (next/core-web-vitals + TS) |
| `npm run db:push` | Push schema changes via drizzle-kit |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run db:seed:admin` | Upsert admin user (email hardcoded in `scripts/seed-admin.ts`) |

No separate `tsc` command – `next build` includes type-checking. No test framework exists.

## Architecture

- **Framework**: Next.js 16 App Router, React 19, Tailwind CSS v4, Drizzle ORM + libsql/SQLite
- **UI**: shadcn/ui (new-york style) components under `components/ui/` with `cn()` utility from `@/lib/utils`. Lucide icons for new components, react-icons `fi` for existing code.
- **Auth**: Email-based magic link (code sent to user email). JWT stored in cookie `transxact_project_auth_token`. Middleware (`proxy.ts`, exported as `proxy`) redirects unauthenticated users away from all non-API routes.
- **Layout**: Root layout wraps all routes in `AppFrame` (sidebar + topbar). Admin pages render inside this frame – do NOT add standalone wrappers like `min-h-screen` or outer `max-w-*` containers.
- **API**: Standard Next.js route handlers under `app/api/`. Auth via `getAdminUserIdFromRequest(request)` (admin routes) or `requireSessionUser()` (general routes) from `services/`.
- **DB**: Schema in `db/schema.ts`, connection in `db/connection.ts` with `ensureDbSchema()` – always call it before DB access. Auto-creates tables/columns/indexes on startup.
- **Services**: Server-side modules under `services/` use `"use server"` directive.

## Design system

Two CSS variable layers coexist in `globals.css`:
1. **shadcn/ui variables** (oklch) – `--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--destructive`, etc. Used by shadcn components.
2. **Legacy project variables** (hex) – `--brand`, `--success`, `--error`, `--surface`, `--text-primary`, etc. Used by custom CSS classes.

Dark mode via `data-theme="dark"` AND `.dark` class on `<html>` (both selectors in CSS).

### Shared CSS classes (legacy, prefer shadcn equivalents where possible)
- `card` / `card-header` / `card-controls` – content containers (shadcn alternative: `<Card>`)
- `data-table` / `table-wrap` – tables (shadcn alternative: `<Table>`)
- `workflow-stack` / `workflow-form` – page/section layout
- `form-stack` / `field-wrap` / `field-label` / `text-input` / `field-note` – forms (shadcn alternative: `<Input>`, `<Label>`)
- `filter-input` – search/select inputs
- `text-link` / `icon-with-label` / `button-row` – links and action groups
- `workflow-status-pill` – role/status badges (shadcn alternative: `<Badge>`)
- Use `cn(...classNames)` from `@/lib/utils` for conditional classes (replaces `cx()`)

### Reusable components
- `AppButton` (variant, startIcon, endIcon, isLoading, loadingLabel, fullWidth) – `@/app/ui/appButton` (wraps shadcn `<Button>`)
- `TextField` (label, id, hint, error) – `@/app/ui/textField` (wraps shadcn `<Input>` + `<Label>`)
- `InlineStatus` (tone: success|error|info, message) – `@/app/ui/inlineStatus` (wraps shadcn `<Alert>`)
- `Modal` – `@/app/ui/modal` (wraps shadcn `<Dialog>`)
- `Loading` / `Spinner` – `@/app/ui/loading` (uses lucide `<Loader2>`)
- shadcn primitives: `<Button>`, `<Input>`, `<Label>`, `<Alert>`, `<Dialog>`, `<Badge>`, `<Skeleton>`, `<Separator>` – `@/components/ui/*`
- `cn()` – `@/lib/utils`

## Migrations

Schema changes require `npm run db:push`. There's no separate migration generation step – drizzle-kit diffs the schema and applies directly.

## Notes

- `.env` not committed to git. App uses `dotenv/config` to load it.
- The Copilot instructions at `.github/copilot-instructions.md` are generic and should not override repo-specific context.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

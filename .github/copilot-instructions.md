# Copilot Project Rules (Simplified)

Follow these rules in order of priority.

## 1) Framework and Dependency Rules

- Prefer latest stable versions.
- Avoid deprecated libraries and APIs.
- Add only well-supported libraries with good docs.
- Follow official documentation for setup and usage.

## 2) Next.js Rules

- Use Server Components by default.
- Use Client Components only when browser-side interactivity is required.
- Keep server logic on the server.
- Use Server Actions for form submission and server-side interactions.

## 3) TypeScript Rules

- Use camelCase for variables/functions and PascalCase for
  types/classes/interfaces.
- Add explicit parameter and return types for functions.
- Prefer specific types over `any`.
- Use interfaces for object shapes.
- Use type aliases for unions/intersections and complex types.

## 4) Code Quality Rules

- Keep functions small and focused.
- Use clear, meaningful names.
- Remove unused code and dependencies.
- Refactor when readability or maintainability is poor.

## 5) Validation and Testing Rules

- Fix TypeScript and lint errors before finishing.
- Add or update tests for changed behavior.
- Prefer a test mix:
  - Unit tests for small logic
  - Integration tests for feature flows
  - End-to-end tests for critical user paths
- Run relevant tests before finalizing changes.

## 6) Delivery and Review Rules

- Treat a task as done only when code, tests, lint, and type checks pass.
- Keep pull requests small and focused on one change.
- Include a short PR summary: what changed, why, and risk level.
- Use consistent commit messages (for example, Conventional Commits).

## 7) CI and Release Safety Rules

- Require CI checks for lint, type checks, tests, and build before merge.
- Do not bypass failing checks except urgent hotfixes.
- For hotfix bypasses, create a follow-up issue before merge.

## 8) Reliability and Debuggability Rules

- Add structured logs for critical flows and production failures.
- Do not swallow errors; return safe user messages and useful internal context.
- Document expected failure modes for new external integrations.

## 9) Data and Migration Rules

- Every schema change must include a migration.
- Include rollback notes for non-trivial database changes.
- Include backfill notes when existing data needs transformation.

## 10) Security and Performance Rules

- Validate and sanitize all external input.
- Keep secrets out of source code and use environment variables.
- Document auth/authorization impact for endpoint or permission changes.
- Prevent major regressions by tracking basic performance budgets on critical
  routes.

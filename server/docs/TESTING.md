# Testing

This project uses **Vitest** for automated testing, running against a real, disposable Postgres instance (not mocks) so tests actually catch DB-level bugs — constraint violations, incorrect queries, stale field cleanup, etc.

## Prerequisites

- Docker installed and running

## One-time setup

1. Start the test database:
```bash
   docker compose -f docker-compose.test.yml up -d
```

2. Apply migrations to it:
```bash
   pnpm test:migrate
```

You only need to re-run `test:migrate` after adding new migrations (i.e. any time you run `pnpm db:generate` against the schema).

## Running tests

```bash
pnpm test        # run once
pnpm test:watch  # watch mode
```

Tests read `.env.test`, not `.env` — this points them at the Docker test database (`localhost:5433`) instead of production Supabase. **Never point `.env.test` at a real database.**

## How isolation works

- `tests/setup.ts` truncates `users` and `sessions` after every test, so each test starts from a clean slate regardless of execution order.
- `fileParallelism: false` in `vitest.config.ts` keeps test files running sequentially — since all tests share one DB, parallel files would cause flaky cross-contamination.
- Rate limiting is bypassed entirely when `NODE_ENV=test` (set in `.env.test`), since tests fire many requests in quick succession and aren't testing the rate limiter itself in these suites.

## What's covered

- `src/routes/auth.test.ts` — signup (success, duplicate email, weak password), signin (email, case-insensitive username, wrong password, nonexistent identifier)

## What's not covered yet

- Target routes (set/get/delete, the 24h lock, the motivation field)
- Signout / signout-all session revocation
- Rate limiter behavior itself (deliberately excluded from auth tests above)

## Adding new tests

Call the exported Hono `app` directly via `app.request(...)` — no real server/port needed. See `src/routes/auth.test.ts` for the pattern.
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

- `src/routes/auth.test.ts` — signup (success, duplicate email, weak password), signin (email, case-insensitive username, wrong password, nonexistent identifier), signout (single-session revocation), signout-all (bulk revocation)
- `src/routes/target.test.ts` — set (success, missing reason, duplicate active target, unauthenticated), get (populated, nulls), delete (blocked before 24h, succeeds and clears all fields after 24h, 404 with no target)
- `src/middleware/rate-limit.test.ts` — blocks requests over the limit, tracks limits independently per IP

## What's not covered yet

- End-to-end error-handler edge cases (malformed JSON body, unexpected server errors)
- Session expiry / sliding renewal logic in `lib/session.ts` directly (currently only exercised indirectly through route tests)

## Adding new tests

Call the exported Hono `app` directly via `app.request(...)` — no real server/port needed. See `src/routes/auth.test.ts` for the pattern.
# Architecture

## 1. Authentication Model

**Decision:** Authentication is session-cookie based, not JWT-based: `createSession()` generates a random 20-byte token, stores `sha256(token)` in the `sessions` table, and sends the raw token only in the `session` HTTP-only cookie.
**Why:** This makes sessions revocable by deleting rows from `sessions`, which the code does in `POST /api/auth/signout` and `POST /api/auth/signout-all`; a JWT would not be revoked that way without adding separate blacklist/rotation logic. `TODO: confirm rationale` for the original design choice.
**Where:** [`server/src/lib/session.ts`](./../src/lib/session.ts#L8-L25), [`server/src/lib/session.ts`](./../src/lib/session.ts#L56-L84), [`server/src/routes/auth.ts`](./../src/routes/auth.ts#L74-L96)

**Decision:** Session validation is server-side and DB-backed: `validateSessionToken()` hashes the cookie token, joins `sessions` to `users`, rejects missing or expired sessions with `{ session: null, user: null }`, and deletes expired rows when they are encountered.
**Why:** The request is re-checked against the database on every authenticated call through `requireAuth`, so invalidation and expiry are enforced centrally rather than trusting the client. `TODO: confirm rationale` for choosing DB lookup on every request instead of caching.
**Where:** [`server/src/lib/session.ts`](./../src/lib/session.ts#L28-L53), [`server/src/middleware/auth.ts`](./../src/middleware/auth.ts#L4-L13)

**Decision:** Passwords are hashed with Argon2id using `memoryCost: 19456`, `timeCost: 2`, and `parallelism: 1`.
**Why:** The code comments say these are "OWASP-recommended minimums for argon2id"; the implementation follows that comment exactly. `TODO: confirm rationale` for these specific numeric values beyond the comment.
**Where:** [`server/src/lib/password.ts`](./../src/lib/password.ts#L3-L13)

**Decision:** Password verification deliberately returns `false` instead of throwing when `argon2.verify()` fails or the hash is malformed, and signin uses a precomputed `DUMMY_PASSWORD_HASH` when no user is found.
**Why:** The inline comments state this keeps verification cost constant whether or not the user exists and avoids leaking whether an account exists through timing or error behavior.
**Where:** [`server/src/lib/password.ts`](./../src/lib/password.ts#L15-L26), [`server/src/routes/auth.ts`](./../src/routes/auth.ts#L49-L72)

## 2. Database Schema Decisions

**Decision:** `users.id` is a UUID primary key with `defaultRandom()`, not a serial integer.
**Why:** The schema chooses a generated UUID as the identifier; the code does not explain the rationale beyond the type itself, so the reason is `TODO: confirm rationale`.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L3-L12)

**Decision:** `users.passwordHash` is stored in a column named `password_hash`, not `password`.
**Why:** The naming matches the fact that the value is a hash produced by Argon2, not a plaintext password. `TODO: confirm rationale` for the naming choice beyond clarity.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L5-L7), [`server/src/lib/password.ts`](./../src/lib/password.ts#L11-L26)

**Decision:** `sessions.id` stores a SHA-256 hash of the raw session token.
**Why:** The comment in code states this directly, and it means the database never stores the bearer token itself. `TODO: confirm rationale` for whether the intent was token-at-rest protection, indexability, or both.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L14-L20), [`server/src/lib/session.ts`](./../src/lib/session.ts#L12-L25)

**Decision:** Timestamp columns use `withTimezone: true`.
**Why:** The schema stores `createdAt`, `expiresAt`, `targetAt`, and `targetSetAt` as timezone-aware timestamps, which matches the fact that the app compares them to `Date.now()` and serves countdown/lock timing across real elapsed time. `TODO: confirm rationale` for the database-level reason for timezone-aware storage.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L8-L18), [`server/src/routes/target.ts`](./../src/routes/target.ts#L26-L67), [`server/src/lib/session.ts`](./../src/lib/session.ts#L23-L53)

**Decision:** `sessions.userId` is a foreign key to `users.id` with `onDelete: cascade`, and there is an index on `sessions.userId`.
**Why:** Deleting a user automatically removes their sessions, and the index supports lookups by user during `invalidateAllUserSessions()`. `TODO: confirm rationale` for why this index was chosen in addition to the primary-key lookup on session id.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L14-L20), [`server/src/lib/session.ts`](./../src/lib/session.ts#L60-L61)

**Decision:** `users.targetAt`, `users.targetSetAt`, and `users.targetReason` live on the user row instead of a separate target table.
**Why:** The route code updates and reads these values directly from `users`, and the tests treat target state as a single-user property. `TODO: confirm rationale` for keeping target state denormalized on `users`.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L3-L12), [`server/src/routes/target.ts`](./../src/routes/target.ts#L18-L67)

## 3. The Target-Lock Feature

**Decision:** The lock duration is hard-coded as `24 * 60 * 60 * 1000` milliseconds, and deletion is blocked until that duration has elapsed since `targetSetAt`.
**Why:** The DELETE handler recomputes elapsed time on every request and throws `403` if the current time is still inside the lock window, so the client countdown is only UX and not enforcement.
**Where:** [`server/src/routes/target.ts`](./../src/routes/target.ts#L11-L12), [`server/src/routes/target.ts`](./../src/routes/target.ts#L46-L67)

**Decision:** The server re-checks the lock on every `DELETE /api/target` call by comparing `Date.now()` with `user.targetSetAt.getTime()`.
**Why:** This means the browser cannot bypass the lock by manipulating the UI; the actual enforcement happens in the handler, not in the frontend timer.
**Where:** [`server/src/routes/target.ts`](./../src/routes/target.ts#L46-L67)

**Decision:** The app stores both the target deadline (`targetAt`) and the moment the lock began (`targetSetAt`), plus an optional `targetReason`.
**Why:** The GET route returns all three values, and DELETE needs `targetSetAt` to decide whether the lock has expired.
**Where:** [`server/src/db/schema.ts`](./../src/db/schema.ts#L8-L11), [`server/src/routes/target.ts`](./../src/routes/target.ts#L37-L67)

## 4. Middleware Pipeline

**Decision:** The global middleware order is `cors('/api/*')`, then `requestLogger`, then `errorHandler` registration.
**Why:** That is the literal order in `src/index.ts`; CORS is applied before the logger, and the error handler is attached globally after both. `TODO: confirm rationale` for why the error handler is registered after request logging.
**Where:** [`server/src/index.ts`](./../src/index.ts#L25-L35)

**Decision:** `/api/target` has router-level middleware in this order: `rateLimit({ windowMs: 60_000, max: 20 })`, then `requireAuth`.
**Why:** Because rate limiting runs first, unauthenticated requests can still increment the per-IP counter before auth rejection. That is an observable consequence of the registration order, not an assumption.
**Where:** [`server/src/routes/target.ts`](./../src/routes/target.ts#L13-L16)

**Decision:** The rate limiter is an in-memory `Map<string, { count; resetAt }>` inside the middleware closure.
**Why:** Counts reset when the process restarts and are not shared across multiple server instances. The code does not use Redis, a DB table, or any external store. `TODO: confirm rationale` for choosing process-local state.
**Where:** [`server/src/middleware/rate-limit.ts`](./../src/middleware/rate-limit.ts#L1-L33)

**Decision:** Rate limiting is disabled entirely when `NODE_ENV === "test"`.
**Why:** The middleware returns `next()` immediately in test mode so the route tests can make repeated requests without being blocked.
**Where:** [`server/src/middleware/rate-limit.ts`](./../src/middleware/rate-limit.ts#L19-L23), [`server/src/middleware/rate-limit.test.ts`](./../src/middleware/rate-limit.test.ts#L1-L41)

**Decision:** `requireAuth` only succeeds if a `session` cookie exists and `validateSessionToken()` returns both a session and a user.
**Why:** Missing or invalid session tokens get a plain `401` response with `{ "error": "Unauthorized" }`; on success, the middleware stores `user` and `session` on the Hono context for downstream handlers.
**Where:** [`server/src/middleware/auth.ts`](./../src/middleware/auth.ts#L4-L13)

## 5. Error Handling

**Decision:** `AppError` is a custom `Error` subclass with a default status code of `400`.
**Why:** Route handlers throw `AppError` for expected business-rule failures like duplicate signup, duplicate active target, missing target, and blocked deletion.
**Where:** [`server/src/lib/errors.ts`](./../src/lib/errors.ts#L1-L6), [`server/src/routes/auth.ts`](./../src/routes/auth.ts#L30-L72), [`server/src/routes/target.ts`](./../src/routes/target.ts#L22-L67)

**Decision:** `errorHandler` maps `ZodError` to `400` with `{ error: "Validation failed", issues: [...] }`.
**Why:** Validation failures are normalized into a consistent response shape with flattened `path` and `message` fields.
**Where:** [`server/src/middleware/error-handler.ts`](./../src/middleware/error-handler.ts#L7-L16)

**Decision:** `errorHandler` maps `AppError` to `err.status` with `{ error: err.message }`.
**Why:** This lets route code choose exact business-rule status codes like `401`, `403`, `404`, and `409` without duplicating response formatting.
**Where:** [`server/src/middleware/error-handler.ts`](./../src/middleware/error-handler.ts#L18-L20), [`server/src/lib/errors.ts`](./../src/lib/errors.ts#L1-L6)

**Decision:** Any other thrown error is logged with `requestId` and stack trace, then returned as `500` with `{ error: "Internal server error" }`.
**Why:** Unhandled failures are intentionally collapsed into a generic response while preserving server-side diagnostics.
**Where:** [`server/src/middleware/error-handler.ts`](./../src/middleware/error-handler.ts#L22-L23), [`server/src/middleware/logger.ts`](./../src/middleware/logger.ts#L1-L17)

## 6. Known Limitations

**Decision:** Rate limiter state is process-local only.
**Why:** The `Map` lives in memory, so limits reset on restart and do not span multiple server instances.
**Where:** [`server/src/middleware/rate-limit.ts`](./../src/middleware/rate-limit.ts#L1-L33)

**Decision:** Signup grants a session immediately after inserting the user.
**Why:** There is no email verification step, approval workflow, or delayed activation in the signup path.
**Where:** [`server/src/routes/auth.ts`](./../src/routes/auth.ts#L20-L46)

**Decision:** The frontend countdown is not the source of truth for target deletion.
**Why:** The server independently checks `targetSetAt` on every DELETE call, so the UI timer is only informational.
**Where:** [`server/src/routes/target.ts`](./../src/routes/target.ts#L46-L67)

**Decision:** The app depends on a manually configured `DATABASE_URL` and does not include a local-dev Postgres service in the repo.
**Why:** The server only checks that `DATABASE_URL` exists; the only checked-in compose file is `docker-compose.test.yml`, which is for tests.
**Where:** [`server/src/index.ts`](./../src/index.ts#L16-L20), [`server/docker-compose.test.yml`](./../docker-compose.test.yml)

## Deliberately not done yet

- `TODO: confirm rationale` for why UUID primary keys were chosen for `users`
- `TODO: confirm rationale` for why `sessions.id` stores a SHA-256 hash instead of the raw token beyond the inline comment
- `TODO: confirm rationale` for using in-memory rate limiting instead of shared storage
- `TODO: confirm rationale` for storing target state directly on `users` instead of a separate table

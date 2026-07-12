# API

This server exposes three public health-style endpoints plus two authenticated route groups:

- **Health**: simple server and database checks
- **Auth**: signup, signin, signout, signout-all, and current-user lookup
- **Target**: authenticated target countdown management

## Health

These routes are mounted directly in `src/index.ts`, not under a router prefix.

### GET /

Auth required: no
Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `200` - plain text `Hello Hono!`

Notes:

- This is the root handler defined in `src/index.ts`.

### GET /api/health

Auth required: no
Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `200` - JSON:

```json
{ "status": "ok", "message": "Server is obviously connected" }
```

Notes:

- This is a simple application health check defined in `src/index.ts`.

### GET /api/db/health

Auth required: no
Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `200` - JSON:

```json
{ "status": "ok" }
```

- `503` - JSON:

```json
{ "status": "error" }
```

Notes:

- The handler executes `select 1` through `db.execute(sql\`select 1\`)`.
- Any thrown error from that DB check is caught and converted to `503`.

## Auth

Mounted with `app.route("/api/auth", authRoutes)` in `src/index.ts`.

### POST /api/auth/signup

Auth required: no
Rate limit: 5 requests / 60s per IP

Request body:

```json
{
  "username": "string — 3-32 chars, letters/numbers/underscore only",
  "email": "string — Zod email()",
  "password": "string — 8-128 chars"
}
```

Validation schema: `signupSchema` in `src/schemas/auth.ts`

- `username`: required string, min 3, max 32, regex `/^[a-zA-Z0-9_]+$/`
- `email`: required `z.email()`
- `password`: required string, min 8, max 128

Responses:

- `201` - JSON:

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "createdAt": "date-time"
  }
}
```

- `400` - validation failure from `ZodError`

```json
{
  "error": "Validation failed",
  "issues": [
    { "path": "fieldName", "message": "detail" }
  ]
}
```

- `409` - `An account with this email or username already exists`
- `429` - `Too many requests, please try again later.`

Cookies:

- Sets the `session` cookie via `setSessionCookie(...)`

Notes:

- The handler lowercases both `email` and `username` before checking for duplicates.
- A successful signup immediately creates a session and returns the new user record.
- The returned user object is the `returning(...)` projection from the insert, so it does not include `passwordHash`.
- Tests assert that a session cookie is present on success and that duplicate email returns `409`.

### POST /api/auth/signin

Auth required: no
Rate limit: 10 requests / 60s per IP

Request body:

```json
{
  "identifier": "string — required, email or username",
  "password": "string — required"
}
```

Validation schema: `signinSchema` in `src/schemas/auth.ts`

- `identifier`: required string, min 1, message `Email or username is required`
- `password`: required string, min 1, message `Password is required`

Responses:

- `200` - JSON:

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "targetAt": "date-time | null",
    "createdAt": "date-time"
  }
}
```

- `400` - validation failure from `ZodError`

```json
{
  "error": "Validation failed",
  "issues": [
    { "path": "fieldName", "message": "detail" }
  ]
}
```

- `401` - `Invalid email or password`
- `429` - `Too many requests, please try again later.`

Cookies:

- Sets the `session` cookie via `setSessionCookie(...)`

Notes:

- The handler lowercases `identifier` before looking up the user.
- Lookup matches either `email` or `username`.
- If no user is found, it still verifies against `DUMMY_PASSWORD_HASH` before returning `401`.
- Tests assert successful signin with email, successful signin with a differently cased username, and `401` for wrong or nonexistent credentials.

### POST /api/auth/signout

Auth required: no
Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `204` - no content

Cookies:

- Clears the `session` cookie via `clearSessionCookie(...)`

Notes:

- The handler reads the `session` cookie with `getSessionToken(c)`.
- If a token exists, it invalidates only that session with `invalidateSession(token)`.
- Tests assert that signout invalidates the current session but not other sessions for the same user.

### POST /api/auth/signout-all

Auth required: yes

What happens without auth:

- `401` - JSON `{ "error": "Unauthorized" }`

Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `204` - no content
- `401` - JSON `{ "error": "Unauthorized" }`

Cookies:

- Clears the `session` cookie via `clearSessionCookie(...)`

Notes:

- This route uses `requireAuth`.
- `requireAuth` reads the `session` cookie, validates it with `validateSessionToken(token)`, and returns `401` JSON `{ "error": "Unauthorized" }` if the cookie is missing or invalid.
- On success, the handler invalidates every session for the authenticated user with `invalidateAllUserSessions(user.id)`.
- Tests assert that all sessions for the user are invalidated.

### GET /api/auth/me

Auth required: yes

What happens without auth:

- `401` - JSON `{ "error": "Unauthorized" }`

Rate limit: none

Request body:

```json
TODO: verify
```

Responses:

- `200` - JSON:

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "createdAt": "date-time"
  }
}
```

- `401` - JSON `{ "error": "Unauthorized" }`

Cookies:

- Reads the `session` cookie indirectly through `requireAuth`

Notes:

- This route returns the user object that `requireAuth` placed into `c.get("user")`.

## Target

Mounted with `app.route("/api/target", targetRoutes)` in `src/index.ts`.

Middleware attached in `src/routes/target.ts`:

- `rateLimit({ windowMs: 60_000, max: 20 })`
- `requireAuth`

The rate limit is applied to all routes in this router.

### POST /api/target

Auth required: yes

What happens without auth:

- `401` - JSON `{ "error": "Unauthorized" }`

Rate limit: 20 requests / 60s per IP

Request body:

```json
{
  "days": "number — integer, positive, max 3650",
  "reason": "string — trimmed, min 1, max 500"
}
```

Validation schema: `setTargetSchema` in `src/schemas/target.ts`

- `days`: required `z.number().int().positive().max(3650)`
- `reason`: required `z.string().trim().min(1, "Please share your motivation").max(500)`

Responses:

- `200` - JSON:

```json
{
  "targetAt": "date-time",
  "targetReason": "string | null"
}
```

- `400` - validation failure from `ZodError`

```json
{
  "error": "Validation failed",
  "issues": [
    { "path": "fieldName", "message": "detail" }
  ]
}
```

- `401` - JSON `{ "error": "Unauthorized" }`
- `409` - `You already have an active target. Delete it before setting a new one.`
- `429` - `Too many requests, please try again later.`

Cookies:

- Reads the `session` cookie indirectly through `requireAuth`

Notes:

- The handler sets `targetAt`, `targetSetAt`, and `targetReason` in the `users` table.
- `targetReason` is stored as `null` only if the parsed value is absent, but the schema requires `reason`, so the request path expects a non-empty string.
- The target date is calculated as `now + days * 24 * 60 * 60 * 1000`.
- Tests assert success, missing-reason validation failure, duplicate-target `409`, and `401` for unauthenticated requests.

### GET /api/target

Auth required: yes

What happens without auth:

- `401` - JSON `{ "error": "Unauthorized" }`

Rate limit: 20 requests / 60s per IP

Request body:

```json
TODO: verify
```

Responses:

- `200` - JSON:

```json
{
  "targetAt": "date-time | null",
  "targetSetAt": "date-time | null",
  "targetReason": "string | null"
}
```

- `401` - JSON `{ "error": "Unauthorized" }`

Cookies:

- Reads the `session` cookie indirectly through `requireAuth`

Notes:

- This route returns the target fields from the authenticated user object loaded by `requireAuth`.
- Tests assert that it returns nulls when no target is set.

### DELETE /api/target

Auth required: yes

What happens without auth:

- `401` - JSON `{ "error": "Unauthorized" }`

Rate limit: 20 requests / 60s per IP

Request body:

```json
TODO: verify
```

Responses:

- `204` - no content
- `401` - JSON `{ "error": "Unauthorized" }`
- `403` - `You can't delete your target yet. Try again in X hour(s).`
- `404` - `No active target to delete.`

Cookies:

- Reads the `session` cookie indirectly through `requireAuth`

Notes:

- Deletion is blocked until 24 hours have passed since `targetSetAt`.
- The lock period is hard-coded as `24 * 60 * 60 * 1000` milliseconds in `src/routes/target.ts`.
- The error message uses `Math.ceil(...)`, so the remaining time is reported in whole hours.
- If the user has no `targetAt` or no `targetSetAt`, the route returns `404`.
- Tests assert the pre-24-hour `403`, post-24-hour `204`, field clearing, and `404` when there is no target.

## Middleware details

### `requireAuth`

Source: `src/middleware/auth.ts`

- Reads the `session` cookie from the request
- If the cookie is missing, returns `401` JSON `{ "error": "Unauthorized" }`
- If `validateSessionToken(token)` returns no session or no user, returns `401` JSON `{ "error": "Unauthorized" }`
- On success, sets `user` and `session` on the Hono context and calls `next()`

### `rateLimit`

Source: `src/middleware/rate-limit.ts`

- Tracks request counts in memory by client IP
- Uses `x-forwarded-for`, then `x-real-ip`, then `"unknown"`
- When the count exceeds `max` during the `windowMs` window, returns `429` JSON `{ "error": "Too many requests, please try again later." }`
- Also sets a `Retry-After` header in seconds
- In `NODE_ENV === "test"`, it bypasses rate limiting entirely

## Cross-check Notes

- Tests in `src/routes/auth.test.ts` confirm:
  - `POST /api/auth/signup` returns `201` and sets a `session` cookie
  - duplicate email returns `409`
  - weak password returns `400`
  - `POST /api/auth/signin` returns `200` for email and username login
  - bad credentials return `401`
  - `POST /api/auth/signout` invalidates only the current session
  - `POST /api/auth/signout-all` invalidates all sessions
- Tests in `src/routes/target.test.ts` confirm:
  - `POST /api/target` succeeds with `200`
  - missing reason returns `400`
  - second active target returns `409`
  - unauthenticated access returns `401`
  - `GET /api/target` returns stored fields or nulls
  - `DELETE /api/target` returns `403` before 24 hours, `204` after 24 hours, and `404` with no target
- Tests in `src/middleware/rate-limit.test.ts` confirm:
  - exceeding the limit returns `429`
  - `Retry-After` is present
  - limits are tracked per IP

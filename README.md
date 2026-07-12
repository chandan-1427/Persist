# Persist

Persist is a full-stack timer app for setting a long-lived target countdown and attaching a reason to it. The public landing page lets visitors sign up or sign in, while authenticated users can set a target for 1 to 3650 days, view the remaining time, and delete the target only after the 24-hour lock period has passed. Sessions are stored server-side in Postgres and authenticated with an HTTP-only cookie.

## Tech Stack

### Server

- `@hono/node-server`
- `argon2`
- `dotenv`
- `drizzle-orm`
- `hono`
- `postgres`
- `zod`

### Web

- `@fontsource/inter`
- `@hookform/resolvers`
- `@tailwindcss/vite`
- `react`
- `react-dom`
- `react-hook-form`
- `react-router-dom`
- `tailwindcss`
- `zod`

### Tooling

- `drizzle-kit`
- `dotenv-cli`
- `tsx`
- `typescript`
- `vitest`
- `@vitejs/plugin-react`
- `vite`
- `@eslint/js`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `typescript-eslint`

## Prerequisites

- Node.js version: TODO: verify. No `engines` field is present in either `package.json`.
- Package manager: `pnpm@9.15.0` for the server package. The web package does not declare `packageManager`.
- Docker: required for the test Postgres container because `server/docker-compose.test.yml` exists.

## Setup

1. Install dependencies in each workspace:

   ```bash
   cd server
   pnpm install
   cd ../web
   pnpm install
   ```

2. Configure the server environment by copying `server/.env.example` to `server/.env` and filling in the values.

3. Configure the web environment. `web/.env` currently contains `VITE_API_URL=http://localhost:3000`. TODO: verify whether a checked-in `web/.env.example` should be added.

4. Make sure a Postgres database is running and reachable at the `DATABASE_URL` you put in `server/.env`. The repo does not include a separate local-dev Postgres compose file; `server/docker-compose.test.yml` is only for the test database.

5. Run the server:

   ```bash
   cd server
   pnpm dev
   ```

6. Run the web app in a second terminal:

   ```bash
   cd web
   pnpm dev
   ```

7. If the database schema changes, regenerate or apply migrations from `server/` using the existing scripts:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

## Environment Variables

### `server/.env.example`

| Variable | Required | Source / Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Used by `src/index.ts`, `src/db/index.ts`, and `src/drizzle.config.ts`. |
| `CLIENT` | Yes | Allowed CORS origin for `/api/*`. Must match the frontend origin exactly. |
| `PORT` | Yes | Port the Hono server listens on. |
| `NODE_ENV` | Yes | Used for session cookie settings and the app startup check. Expected values in the file are `development`, `production`, or `test`. |

### `web/.env`

| Variable | Required | Source / Notes |
| --- | --- | --- |
| `VITE_API_URL` | Yes | API base URL used by `web/src/lib/api.ts` and `web/src/pages/LandingPage.tsx`. TODO: verify an example file exists for this workspace. |

## Available Scripts

### `server/package.json`

| Script | What it does |
| --- | --- |
| `dev` | Runs `tsx watch src/index.ts` for server development. |
| `build` | Compiles TypeScript with `tsc` and rewrites aliases with `tsc-alias`. |
| `start` | Runs the built server from `dist/index.js`. |
| `db:generate` | Runs `drizzle-kit generate --config=src/drizzle.config.ts`. |
| `db:migrate` | Runs `drizzle-kit migrate --config=src/drizzle.config.ts`. |
| `db:push` | Runs `drizzle-kit push --config=src/drizzle.config.ts`. |
| `db:studio` | Runs `drizzle-kit studio --config=src/drizzle.config.ts`. |
| `test:migrate` | Runs migrations against `.env.test` via `dotenv -e .env.test -- drizzle-kit migrate --config=src/drizzle.config.ts`. |
| `test` | Runs Vitest once against `.env.test` via `dotenv -e .env.test -- vitest run`. |
| `test:watch` | Runs Vitest in watch mode against `.env.test` via `dotenv -e .env.test -- vitest`. |

### `web/package.json`

| Script | What it does |
| --- | --- |
| `dev` | Starts the Vite dev server. |
| `build` | Type-checks with `tsc -b` and creates a production build with `vite build`. |
| `lint` | Runs ESLint over the workspace. |
| `preview` | Serves the built app with `vite preview`. |

## API Routes

### Public routes

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/` | Public |
| `GET` | `/api/health` | Public |
| `GET` | `/api/db/health` | Public |
| `POST` | `/api/auth/signup` | Public |
| `POST` | `/api/auth/signin` | Public |
| `POST` | `/api/auth/signout` | Public |

### Protected routes

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/auth/signout-all` | Requires auth (`requireAuth`) |
| `GET` | `/api/auth/me` | Requires auth (`requireAuth`) |
| `POST` | `/api/target` | Requires auth (`targetRoutes.use("*", requireAuth)`) |
| `GET` | `/api/target` | Requires auth (`targetRoutes.use("*", requireAuth)`) |
| `DELETE` | `/api/target` | Requires auth (`targetRoutes.use("*", requireAuth)`) |

## Database Schema

### `users`

| Column | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, defaults to a random UUID. |
| `username` | `varchar(32)` | Required, unique. |
| `email` | `varchar(255)` | Required, unique. |
| `password_hash` | `varchar(255)` | Required. |
| `target_at` | `timestamp with time zone` | Nullable. |
| `target_set_at` | `timestamp with time zone` | Nullable. |
| `target_reason` | `varchar(500)` | Nullable. |
| `created_at` | `timestamp with time zone` | Required, defaults to now. |

### `sessions`

| Column | Type | Constraints / Notes |
| --- | --- | --- |
| `id` | `text` | Primary key, stores the SHA-256 hash of the raw session token. |
| `user_id` | `uuid` | Required, foreign key to `users.id` with `onDelete: cascade`. |
| `expires_at` | `timestamp with time zone` | Required. |
| `created_at` | `timestamp with time zone` | Required, defaults to now. |

## Testing

See [`server/docs/TESTING.md`](./server/docs/TESTING.md) for the actual test workflow, including the disposable Postgres container, `.env.test`, and the current coverage notes.

## Deployment

`server/Dockerfile` uses a two-stage build:

1. `builder`
   - Based on `node:20-alpine`
   - Enables Corepack and activates `pnpm@9.15.0`
   - Installs dependencies with `pnpm install --frozen-lockfile`
   - Copies the source and runs `pnpm build`

2. `runner`
   - Based on `node:20-alpine`
   - Enables Corepack and activates `pnpm@9.15.0`
   - Sets `NODE_ENV=production`
   - Installs production dependencies only with `pnpm install --prod --frozen-lockfile`
   - Copies `dist/` from the build stage
   - Exposes port `3000` and starts `node dist/index.js`

`server/docker-compose.yml` builds that image, publishes `3000:3000`, and loads environment variables from `server/.env`.

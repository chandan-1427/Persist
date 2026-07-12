# Changelog

This changelog is derived from the repository's git history and grouped by the actual feature progression in the commits. There are no version tags in the history, so this uses topical sections instead of invented releases.

## Bootstrap and database wiring

- **What:** Created the initial server and web package manifests and the first Hono entrypoint.
- **Commit:** `b310f2c`

- **What:** Connected the server to Supabase/Postgres through Drizzle and added the first schema and Drizzle config.
- **Commit:** `9ab8197`

- **What:** Added an early environment-variable guard in the server bootstrap so startup fails when required values are missing.
- **Commit:** `f50f4a9`

- **What:** Added the root and database health routes and corrected the server DB check route.
- **Commit:** `0361f32`

- **What:** Added the Vercel routing mapping for the web app.
- **Commit:** `2d15823`

## Authentication system

- **What:** Added session-based authentication, password hashing, auth middleware, request logging, error handling, and auth route handlers.
- **Commit:** `cd96b53`

- **What:** Wired signup, signin, and `/me` flows into the auth routes and added Hono context types for user/session state.
- **Commit:** `904b552`

- **What:** Made signup store usernames in lowercase before saving and duplicate checks.
- **Commit:** `7d6ffdf`

- **What:** Made signin normalize the identifier to lowercase before lookup.
- **Commit:** `318c90d`

- **What:** Updated session cookies so production uses the correct `sameSite` settings.
- **Commit:** `9b3d1b6`

- **What:** Added the `signout-all` route on the server.
- **Commit:** `ccdabdb`

- **What:** Added the client wiring for `signout-all` in the web app.
- **Commit:** `c63f715`

- **What:** Adjusted server import paths to use the `@` alias. (commit message unclear: `test: new alias import for server test1`)
- **Commit:** `9843b4c`

- **What:** Updated server package metadata during the alias-import work. (commit message unclear: `test: new alias import for server test2`)
- **Commit:** `bc7e9dc`

- **What:** Switched server code imports to the `@` alias throughout the backend. (commit message unclear: `feat: use alias for server code import`)
- **Commit:** `675d9cd`

## Target-lock feature

- **What:** Added the target countdown feature on the server, including target storage and target routes.
- **Commit:** `5d02958`

- **What:** Added a shared target schema on the client so the timer form matched the server rules.
- **Commit:** `6d8fdb1`

- **What:** Wired the target reason through the client timer UI and API calls.
- **Commit:** `1c8e054`

- **What:** Added rate limiting to the target routes and removed a redundant database lookup.
- **Commit:** `2c83ea7`

- **What:** Added the `reason` field to the server target schema and route handling.
- **Commit:** `ecf13f8`

- **What:** Wired the target routes into the client end to end.
- **Commit:** `36e92b5`

## Client layout and UI polish

- **What:** Added the sidebar layout for the authenticated UI.
- **Commit:** `d001d5e`

- **What:** Added the title tooltip for the sign-out-all button.
- **Commit:** `7a57328`

## Testing

- **What:** Added Vitest plus Docker-based Postgres test setup and auth route tests.
- **Commit:** `26114af`

- **What:** Added target route tests covering set, get, delete, and the 24-hour lock.
- **Commit:** `4f727f7`

- **What:** Added tests for signout, signout-all, and rate limiting.
- **Commit:** `206485f`

## Documentation

- **What:** Created the root README and added `.env.example` files.
- **Commit:** `713f4ed`

- **What:** Wrote `server/docs/API.md`.
- **Commit:** `1b48347`

- **What:** Wrote `server/docs/ARCHITECTURE.md`.
- **Commit:** `e5e5776`

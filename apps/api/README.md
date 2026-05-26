# Points Exchange API

Fastify server that exposes versioned REST routes under `/api/v1`. It validates Supabase JWTs for protected routes, reads catalog data with the anon client, and runs recommendation logic from `@points-exchange/recommendations`.

## Run locally

```bash
# From repo root
cp apps/api/.env.example apps/api/.env
npm run dev:api
```

Production-style start (no watch):

```bash
npm run start --workspace=api
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `3000` |
| `HOST` | No | Default `0.0.0.0` |
| `SUPABASE_URL` | Yes* | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Yes* | Publishable (or legacy `SUPABASE_ANON_KEY`) |

\*Required for all routes that talk to Postgres or auth. Without them, protected routes return `503 service_unavailable`.

## Authentication

Protected routes expect:

```http
Authorization: Bearer <supabase_access_token>
```

The API calls `supabase.auth.getUser(token)` and attaches `userId` and `accessToken` to the request. Obtain the token from the mobile app (or any Supabase Auth client) after sign-in.

**Public routes** (no bearer token): `GET /health`, `GET /api/v1/reward-programs`, `GET /api/v1/valuation-catalog`, and the legacy in-memory `GET/POST/DELETE /api/v1/programs`.

## Base URL

All v1 routes are prefixed with `/api/v1`. Example:

```text
http://localhost:3000/api/v1/profile
```

## Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | `{ "ok": true }` |

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/profile` | Yes | Current user profile (`goal_preference`, `custom_goal_code`, display name) |
| `PATCH` | `/api/v1/profile` | Yes | Update profile (validated with `updateUserProfileInputSchema`) |

### Reward programs (catalog)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/reward-programs` | No | Active programs from `reward_programs` (Chase UR, Amex MR, etc.) |

### Reward accounts (user balances)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/reward-accounts` | Yes | List balances for the signed-in user |
| `POST` | `/api/v1/reward-accounts` | Yes | Create balance for a `programCode` |
| `PUT` | `/api/v1/reward-accounts/sync` | Yes | Replace/sync multiple accounts in one request |
| `PATCH` | `/api/v1/reward-accounts/:id` | Yes | Update balance on one account |
| `DELETE` | `/api/v1/reward-accounts/:id` | Yes | Remove an account (`204`) |

### Recommendations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/recommendations/dashboard` | Yes | Dashboard summary: ranked strategies, points breakdown, top cards |
| `GET` | `/api/v1/recommendations/:id` | Yes | Detail for one strategy id (e.g. `MOST_EFFECTIVE`) — offers, steps, transfer path |

Strategy ids are canonical values such as `MOST_EFFECTIVE`, `LEAST_HASSLE`, `LIMITED_TIME`, `TRAVEL_PORTAL`, `SIMPLE_CASH`. Legacy ids (`BEST_VALUE`, `EASIEST`, …) are normalized in the engine.

Both routes load `ValuationCatalog` from Supabase and user balances + goal from the user-scoped Supabase client, then call `getDashboardForUser` / `getRecommendationDetailForUser` in `lib/recommendations-service.ts`.

### Valuation catalog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/valuation-catalog` | No | Full catalog JSON (rules, offers, products, transfer graph, goal targets) |

Useful for debugging or a future admin tool. The mobile app normally uses recommendation responses rather than fetching the raw catalog.

### Saved offers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/saved-offers` | Yes | User’s bookmarked offers |
| `POST` | `/api/v1/saved-offers` | Yes | Save offer (`offerKey`, `recommendationId` = **strategy id**) |
| `DELETE` | `/api/v1/saved-offers/:id` | Yes | Remove bookmark (`204`) |

### Linked accounts (mock)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/linked-accounts` | Yes | Mock connection status (`featureStatus: mock_preview`) |
| `POST` | `/api/v1/linked-accounts/mock-connect` | Yes | Simulate OAuth; returns preview balances |
| `POST` | `/api/v1/linked-accounts/mock-connect/apply` | Yes | Hint payload to sync via `reward-accounts` (in-memory store) |

Real issuer OAuth is not implemented; connections are stored in process memory per user id.

### Legacy manual programs (in-memory)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/programs` | No | Ephemeral manual entries (not Postgres) |
| `POST` | `/api/v1/programs` | No | Add manual program |
| `DELETE` | `/api/v1/programs/:id` | No | Delete manual program |

Prefer `reward-accounts` + Supabase for current product flows.

## Error shape

Validation and domain errors typically return:

```json
{
  "error": "validation_failed",
  "message": "Human-readable summary",
  "details": {}
}
```

Common `error` codes: `unauthorized`, `not_found`, `validation_failed`, `internal_error`, `service_unavailable`, `program_not_found`, `account_exists`.

## Project structure

```text
apps/api/src/
  index.ts              # Fastify bootstrap, route registration
  load-env.ts           # Loads apps/api/.env
  lib/
    auth.ts             # Bearer JWT → userId
    supabase.ts         # Anon + user-scoped clients
    valuation-catalog.ts  # Supabase → ValuationCatalog
    recommendations-service.ts  # Engine wrappers
    profiles.ts, reward-accounts.ts, saved-offers.ts
  routes/               # One file per route group
```

## Related docs

- Valuation math and strategies: [packages/recommendations/README.md](../../packages/recommendations/README.md)
- Database tables feeding the catalog: [supabase/README.md](../../supabase/README.md)

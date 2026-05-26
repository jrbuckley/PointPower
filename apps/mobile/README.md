# Points Exchange Mobile

Expo Router app (React Native) for signing in, entering reward balances, viewing goal-based recommendations, browsing offers, and saving favorites.

## Run locally

```bash
# From repo root — API and Supabase should already be configured
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

Then open the project in **Expo Go**, press `i` for iOS simulator, `a` for Android, or `w` for web.

Workspace scripts:

```bash
npm run start --workspace=mobile   # same as dev:mobile
npm run ios --workspace=mobile
npm run android --workspace=mobile
```

## Environment

Copy `apps/mobile/.env.example` to `apps/mobile/.env`:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Same as API `SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as API publishable/anon key |
| `EXPO_PUBLIC_API_URL` | API base URL, no trailing slash |

**Simulator:** `http://localhost:3000`  
**Physical device:** use your computer’s LAN IP, e.g. `http://192.168.1.169:3000`, so the phone can reach the API.

The app treats the backend as configured only when both Supabase and `EXPO_PUBLIC_API_URL` are set (`isApiConfigured()` in `src/lib/apiClient.ts`).

## Auth and API calls

- **Auth:** `@supabase/supabase-js` in `src/lib/supabase.ts` (email/password or your configured providers).
- **API:** `apiFetch()` attaches `Authorization: Bearer <session.access_token>` to every request to `EXPO_PUBLIC_API_URL`.
- **Account deletion:** uses Supabase RPC `delete_own_account` and `account_deletion_feedback` directly (not the Fastify API).

## Main screens (Expo Router)

| Route | Purpose |
|-------|---------|
| `(auth)/` | Sign-in / sign-up |
| `(tabs)/` | Dashboard, goals, balances |
| `recommendation/[id]` | Strategy detail, transfer path hero, offers |
| Settings / profile flows | Goal preference, custom goals, account |

Data hooks such as `useDashboardData` call `/api/v1/recommendations/dashboard` when the API is configured; otherwise the app may fall back to local/mock behavior depending on the screen.

## Project structure

```text
apps/mobile/src/
  app/                  # Expo Router file-based routes
  components/           # UI (dashboard, recommendation, goals)
  hooks/                # React Query / data fetching
  lib/
    apiClient.ts        # Authenticated fetch to Fastify API
    supabase.ts
  store/                # Zustand (e.g. auth)
  types/models.ts       # View models aligned with API responses
```

## Development tips

1. Start **API** (`npm run dev:api`) before testing authenticated flows.
2. After changing `@points-exchange/shared` or `@points-exchange/recommendations`, rebuild from root: `npm run build:shared && npm run build:recommendations` (or re-run `npm install`).
3. If recommendations look stale, confirm Supabase seeds were applied (`supabase db push`) and restart the API so it reloads catalog data.

## Related docs

- API endpoints: [apps/api/README.md](../api/README.md)
- Recommendation engine: [packages/recommendations/README.md](../../packages/recommendations/README.md)

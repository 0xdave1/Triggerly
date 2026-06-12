# Triggerly

Triggerly is a privacy-first AI Trigger Agent. It includes an Expo React Native app at the repo root and a NestJS/PostgreSQL backend in `backend/`.

The product intentionally does not include covert recording, always-on listening, hidden location tracking, autonomous payments, automatic private-message reading, or automatic email sending.

Core promise: Say it once. Triggerly remembers when it matters.

## Repo Structure

```text
Triggerly/
  src/                 Expo Router mobile/web app
  backend/             NestJS API, Prisma, PostgreSQL
  app.json             Expo app config
  package.json         Expo app scripts
  vercel.json          Vercel static web export config
  render.yaml          Render backend blueprint
```

This is a two-app repo, not a `mobile/` + `web/` + `backend/` monorepo. The mobile/frontend app lives at the root.

## Local Development

Install and run the Expo app:

```bash
npm install
npm run start
```

Run checks:

```bash
npm run typecheck
npm run test
npm run build:web
```

Run the backend:

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run prisma:migrate
npm run start:dev
```

## Backend Env

Create `backend/.env` from `backend/.env.example`.

Required:

```text
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
ENABLE_SWAGGER=false
```

Optional:

```text
AI_PROVIDER=heuristic
OPENAI_API_KEY=
REDIS_URL=
PUSH_PROVIDER=expo
EXPO_ACCESS_TOKEN=
SENTRY_DSN=
```

Do not wrap Render dashboard env values in quotes. Use `DATABASE_URL=postgresql://...`, not `DATABASE_URL="postgresql://..."`.

## Mobile Env

Create `.env` from `.env.example` at the repo root:

```text
EXPO_PUBLIC_API_URL=https://your-render-backend.onrender.com
EXPO_PUBLIC_APP_NAME=Triggerly
```

Only public Expo values should use `EXPO_PUBLIC_`. Do not place secrets in frontend env variables.

For local backend development:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4000 npm run start
```

On Android emulators, use your host alias:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 npm run start
```

Restart Expo after changing env values.

## Render Backend Deployment

Render is for the NestJS backend only.

Blueprint config is in `render.yaml`.

Manual Render settings:

- Root Directory: `backend`
- Build Command: `npm install && npx prisma generate && npm run build`
- Start Command: `npx prisma migrate deploy && npm run start:prod`
- Health Check Path: `/health`

Required Render env vars:

```text
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=use_a_32_plus_character_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:8081
ENABLE_SWAGGER=false
AI_PROVIDER=heuristic
```

The backend reads `process.env.PORT`, binds to `0.0.0.0`, exposes `GET /health`, and runs Prisma migrations during the Render start command.

## Vercel Frontend Deployment

There is no separate Next.js web app. Vercel can host the Expo web export from the repo root.

Vercel settings:

- Root Directory: repo root
- Build Command: `npm run build:web`
- Output Directory: `dist`

Required Vercel env vars:

```text
EXPO_PUBLIC_API_URL=https://your-render-backend.onrender.com
EXPO_PUBLIC_APP_NAME=Triggerly
```

`vercel.json` rewrites routes to `index.html` so Expo Router pages work on refresh.

## Expo/EAS Mobile Notes

Android and iOS builds should be produced through Expo/EAS later. Do not deploy the mobile app to Render.

## Trigger Behavior

- Time entry is interpreted as Nigeria time (`Africa/Lagos`) by default. Examples: `2026-05-27 18:00`, `tomorrow 6pm`, `6pm`.
- On Vercel web, time reminders can alert only while Triggerly is open. Background notifications require Android/iOS builds with Expo notifications.
- Location triggers are saved, but production background geofencing is not active yet. Triggerly shows this limitation at save time instead of pretending the geofence is fully armed.

## AI Trigger Assistant Architecture

Triggerly is organized around product capability modules rather than one giant reminder surface:

- Intent capture: `trigger-intent` parses typed or spoken user intent and requires confirmation.
- Trigger engine: reminders plus time, location, and habit trigger models are the first operational trigger set.
- Memory engine: `memory` stores user-approved facts, people, places, prices, debts, promises, and routines in PostgreSQL through Prisma.
- Live context engine: `live-context` defines weather, exchange-rate, and travel context checks. Providers are intentionally not configured yet and return `provider_not_configured`.
- Action engine: `action-prompts` prepares user-approved actions only. It does not send money, send email, scrape messages, or execute sensitive actions automatically.
- Privacy engine: settings and privacy modules keep capability boundaries explicit.

Mobile assistant surfaces:

- `/` AI Command Home with `PARSE_INTENT`, active queue, today's brief, live context cards, and memory highlights.
- `/triggers/confirm` AI Intent Confirmation. It calls `POST /ai/parse-intent`; backend-unavailable mode falls back to a local deterministic parser and still requires confirmation.
- `/triggers` Trigger Dashboard grouped by time, location, habits, live context placeholders, and action prompts.
- `/live-context` Weather, exchange-rate, and manual price memory surface. Provider placeholders show "Live provider not configured yet."
- `/memory` User-approved memory vault.
- `/actions` AI PA pending action prompt surface. Payments/messages/email remain confirmation-only.
- `/voice` Voice settings, device voice selection, privacy-safe reading controls, and foreground preview using Expo Speech.
- `/briefing` Local daily briefing from reminders, memory, habits, and pending review state.
- `/settings` Privacy Control Center with backend-backed capability toggles.

## Visual Design

Triggerly uses a quiet privacy-product interface rather than a simulated terminal:

- near-black background with a restrained static signal texture
- large white editorial headings and plain-language labels
- pale mint primary actions with no neon glow
- thin dividers and open sections instead of stacked dashboard cards
- compact system labels only where status or privacy context matters
- one primary intention field on Home, followed by clear feature destinations

The existing `Terminal*` component names are retained internally for compatibility, but their presentation is intentionally simple, readable, and mobile-first.

Backend AI brain endpoints:

- `POST /ai/parse-intent`
- `GET /privacy/settings`
- `PATCH /privacy/settings`
- `POST /triggers/confirm`
- `GET /memory`
- `POST /memory`
- `POST /memory/confirm-from-intent`
- `GET /memory/:id`
- `PATCH /memory/:id`
- `DELETE /memory/:id`
- `POST /memory/:id/archive`
- `GET /live-context/weather`
- `POST /live-context/weather-triggers`
- `GET /live-context/exchange-rate`
- `POST /live-context/exchange-rate-triggers`
- `POST /live-context/price-logs`
- `GET /live-context/price-logs`
- `GET /live-context/price-logs/:itemName/history`
- `POST /live-context/price-triggers`
- `GET /live-context/triggers`
- `PATCH /live-context/triggers/:id`
- `DELETE /live-context/triggers/:id`
- `POST /action-prompts`
- `POST /action-prompts/:id/confirm`
- `POST /action-prompts/:id/cancel`
- `GET /voice/settings`
- `PATCH /voice/settings`
- `POST /voice/generate-script`
- `POST /voice/preview-script`

Optional provider env vars:

```text
AI_PROVIDER=heuristic
OPENAI_API_KEY=
WEATHER_PROVIDER=
WEATHER_API_KEY=
EXCHANGE_RATE_PROVIDER=
EXCHANGE_RATE_API_KEY=
```

Live context notes:

- Weather and exchange providers are isolated behind provider services. If provider env keys are absent, responses return `provider_not_configured` and the API does not crash.
- `LiveContextTrigger`, `PriceLog`, `WeatherProviderCache`, and `ExchangeRateCache` are persisted with Prisma.
- Periodic live-context checking is prepared through `CheckLiveContextTriggersJob`, but scheduling remains pending unless Redis/BullMQ is configured.
- Privacy settings block weather triggers, exchange-rate triggers, travel context, and price memory where applicable.

Voice engine notes:

- Voice notifications are off by default and can be disabled independently.
- Triggerly speaks only after the user opens a notification; the push notification still works when speech is disabled or unavailable.
- `readFullReminder`, `readLocationContext`, and `readLiveContext` prevent sensitive details from being spoken aloud.
- Voice style adjusts script tone and Expo Speech pitch/rate. Available voices depend on the operating system.
- iOS and Android do not guarantee arbitrary text-to-speech while the app is backgrounded, so Triggerly does not promise background voice playback.

Memory engine notes:

- Memory is confirmation-first. AI parsing can suggest `memoryCandidate`, `priceCandidate`, debt, promise, and price-log records, but `POST /ai/parse-intent` never creates memory by itself.
- Confirmed AI memory is saved through `POST /memory/confirm-from-intent`; manual entries use `POST /memory`.
- Memory supports `person`, `place`, `price`, `debt`, `promise`, `preference`, `routine`, `travel`, `document`, and `general`.
- Memory records are soft-managed with `ACTIVE`, `ARCHIVED`, and `DELETED` states. Deleted memory is hidden from normal reads.
- `MemoryEvent` records created, updated, archived, deleted, and used-in-trigger events.
- Keyword search is available now. Semantic search/pgvector is intentionally deferred until the database supports it and the privacy model is stable.
- Privacy settings can block memory creation globally, price memory, and contact/person memory.

Phases:

1. Stabilize deployment, auth, privacy, reminders, time/location/habit triggers, AI parser placeholder, and mobile core flow.
2. Add assistant experience: voice settings/scripts, confirmation screen, errand grouping, daily briefing scaffold.
3. Add live context placeholders and then real weather, exchange rate, travel, and price providers.
4. Add contact memory, email/message drafts, payment reminders, and open-app prompts with confirmation.
5. Add pgvector, memory search, smart suggestions, and contextual briefings.

Correct Expo scripts:

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "build:web": "expo export -p web"
}
```

Expo Router requires `"main": "expo-router/entry"` in the root `package.json`. Do not run `node expo-router/entry` on Render.

## Prisma

Prisma schema: `backend/prisma/schema.prisma`

Migrations:

- `backend/prisma/migrations/0001_init`
- `backend/prisma/migrations/0002_ai_trigger_agent`
- `backend/prisma/migrations/0003_ai_brain`
- `backend/prisma/migrations/0004_live_context_triggers`
- `backend/prisma/migrations/0005_memory_engine`

Production commands:

```bash
npx prisma generate
npx prisma migrate deploy
```

## CORS

Backend CORS uses `CORS_ORIGINS` as a comma-separated allowlist. Browser origins not in the allowlist are rejected in production. Requests without an `Origin` header are allowed for mobile apps and server-to-server usage.

Do not use wildcard CORS with credentials in production.

## Common Deployment Errors

Error: `npm ci requires package-lock.json`

Fix:

- commit `package-lock.json`, or
- use `npm install` in Render build command.

Error: Render says no open ports

Fix:

- read `process.env.PORT`,
- listen on `0.0.0.0`,
- expose `/health`.

Error: Prisma cannot connect

Fix:

- confirm `DATABASE_URL`,
- use Render internal DB URL for Render service,
- do not wrap env value in quotes in Render dashboard,
- run `prisma migrate deploy`.

Error: CORS blocked

Fix:

- add the Vercel URL to `CORS_ORIGINS`,
- do not use wildcard with credentials.

Error: Mobile cannot reach backend

Fix:

- set `EXPO_PUBLIC_API_URL`,
- use the deployed Render backend URL,
- restart Expo after env changes.

Error: Render tries to run `expo-router/entry`

Fix:

- deploy the backend with Root Directory `backend`,
- deploy the Expo web export to Vercel with `npm run build:web`,
- do not deploy the root Expo app as a Render Node service.

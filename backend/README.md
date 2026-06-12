# Triggerly Backend

NestJS + PostgreSQL + Prisma backend for Triggerly, a privacy-first reminder assistant.

## Install

```bash
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run prisma:migrate
npm run start:dev
```

## Required Environment

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`
- `NODE_ENV`
- `CORS_ORIGINS`
- `AI_PROVIDER=freemodel`
- `AI_BASE_URL=https://api.freemodel.dev`
- `OPENAI_API_KEY` required when FreeModel is selected
- `AI_MODEL=gpt-5.5`
- `AI_REASONING_EFFORT=xhigh`
- `AI_DISABLE_RESPONSE_STORAGE=true`
- `REDIS_URL` optional
- `ENABLE_SWAGGER` optional

## Render Deployment

Root Directory:

```text
backend
```

Build Command:

```bash
npm install && npx prisma generate && npm run build
```

Start Command:

```bash
npx prisma migrate deploy && npm run start:prod
```

Health Check Path:

```text
/health
```

Required Render env values:

```text
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=use_a_32_plus_character_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:8081
ENABLE_SWAGGER=false
AI_PROVIDER=freemodel
AI_BASE_URL=https://api.freemodel.dev
OPENAI_API_KEY=your_freemodel_key
AI_MODEL=gpt-5.5
AI_REASONING_EFFORT=xhigh
AI_DISABLE_RESPONSE_STORAGE=true
```

Use raw env values in the Render dashboard. Do not wrap `DATABASE_URL` or other values in quotes.
Keep `OPENAI_API_KEY` only in Render/backend environment variables. It must never
be exposed through Expo or other public frontend variables.

## API Overview

- `POST /auth/register`
- `POST /auth/login`
- `GET /me`
- `GET /reminders`
- `POST /reminders`
- `GET /reminders/:id`
- `PATCH /reminders/:id`
- `DELETE /reminders/:id`
- `POST /reminders/:id/complete`
- `POST /reminders/:id/snooze`
- `POST /reminders/:id/events`
- `GET /habits`
- `POST /habits`
- `PATCH /habits/:id/complete`
- `POST /devices`
- `PATCH /devices/:id`
- `GET /privacy/export`
- `DELETE /privacy/delete-account`
- `POST /chat/messages`
- `GET /chat/conversations`
- `GET /chat/conversations/:id`
- `DELETE /chat/conversations/:id`
- `GET /agent-runs/:id`
- `POST /agent-runs/:id/confirm`
- `POST /agent-runs/:id/reject`
- `POST /agent-runs/:id/items/:itemId/confirm`
- `POST /agent-runs/:id/items/:itemId/reject`
- `POST /agent-runs/:id/items/:itemId/edit`
- `POST /ai/parse-intent`
- `POST /ai/parse-reminder`
- `POST /ai/parse-trigger`
- `GET /voice-settings`
- `PATCH /voice-settings`
- `GET /voice/settings`
- `PATCH /voice/settings`
- `POST /voice/generate-script`
- `POST /voice/preview-script`
- `GET /contact-memories`
- `POST /contact-memories`
- `GET /contact-memories/:id`
- `PATCH /contact-memories/:id`
- `DELETE /contact-memories/:id`
- `POST /action-prompts`
- `POST /action-prompts/:id/confirm`
- `POST /action-prompts/:id/cancel`

Swagger is enabled only in development by default, or when `ENABLE_SWAGGER=true`.

## Privacy Boundaries

The backend stores only user-created reminders, triggers, habits, events, and explicitly registered devices. It does not include covert recording, always-on microphone capture, passive message ingestion, autonomous payments, hidden tracking, or surveillance endpoints.

The AI endpoints only return suggestions with `requiresConfirmation: true`; they never create reminders automatically.

## AI Trigger Engine

`POST /ai/parse-trigger` uses a deterministic `AiTriggerParserService` for MVP. It detects time, location arrival/departure, habits, contacts, errand-style location tasks, and action prompts such as payment-app openings or email drafting. Parse results are stored in `IntentParseLog` for product debugging and improvement.

The parser never executes actions, sends messages, sends money, or reads private messages.

Chat plans use the provider-neutral `AiProvider` interface. With
`AI_PROVIDER=freemodel`, Triggerly calls FreeModel's OpenAI-compatible Responses
API from the backend. The response is JSON-parsed and Zod-validated. Provider
errors or invalid plans fall back to the deterministic provider, so reminders can
still be planned without exposing a provider key to the mobile app.

Run a provider smoke check without printing secrets:

```bash
npm run smoke:ai
```

The smoke command uses FreeModel when both `AI_PROVIDER=freemodel` and
`OPENAI_API_KEY` are present; otherwise it verifies the deterministic fallback.

## Confirmation Model

Action prompts are created with `PENDING_CONFIRMATION`. Confirming an action prompt only marks it `CONFIRMED`; MVP backend code does not call payment, email, maps, phone, or URL providers.

Sensitive action payloads are annotated with `confirmation_required_no_auto_execute`.

Chat uses the same boundary. `POST /chat/messages` may create a conversation, message, agent run, and proposed plan, but it does not create the planned records. Only the agent confirmation endpoints execute approved plan items. Rejected items create no reminder, memory, live alert, or action prompt.

Agent data is persisted in:

- `Conversation`
- `ChatMessage`
- `AgentRun`
- `ToolExecution`
- `UserApproval`

All plan, input, output, and edited-payload JSON is converted with the shared Prisma JSON helpers.

## Voice Settings And Scripts

Users can configure voice preferences through:

- `GET /voice-settings`
- `PATCH /voice-settings`
- `GET /voice/settings`
- `PATCH /voice/settings`

Voice scripts can be generated with `POST /voice/generate-script`, and preview samples with `POST /voice/preview-script`. Scripts support location arrival/departure, time reminders, habit nudges, weather, exchange-rate alerts, daily briefings, errand groups, and confirmation-first action prompts.

The backend stores text settings/scripts only. It does not store raw audio or implement background listening. Mobile text-to-speech occurs after the user opens a notification when voice is enabled; background speech is not guaranteed by mobile operating systems.

## MVP Limitations

- Chat planning is synchronous. FreeModel is used when configured, with a deterministic fallback. Streaming and background agent workers are deferred.
- The local mobile parser can show an offline plan, but confirmation requires the backend so synced records are not silently forked.
- Location plans can be proposed before coordinates are selected; production geofencing still requires native mobile setup and user permission.
- Notification delivery is abstracted and queue-ready, but push provider delivery is a placeholder.
- Location geofencing is persisted for clients/native workers to act on; the backend does not poll device GPS.
- Account deletion is a safe placeholder that requires an explicit confirmation string and soft-deletes user reminders/devices.
- `CUSTOM` habit frequency is treated as days for MVP.
- Voice delivery prepares scripts/settings only; actual TTS playback remains a mobile-platform concern.
- Contact memory is explicitly user-created placeholder data; there is no automatic contacts ingestion.

## Production Next Steps

- Add refresh tokens and token revocation.
- Add managed push provider integration.
- Add production Redis and BullMQ workers.
- Add audit logging without sensitive request bodies.
- Add full e2e tests against a disposable PostgreSQL database.

# Triggerly Backend

NestJS + PostgreSQL + Prisma backend for Triggerly, a privacy-first reminder assistant.

## Install

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
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
- `REDIS_URL` optional
- `ENABLE_SWAGGER` optional
- `AI_PROVIDER` optional
- `OPENAI_API_KEY` optional and unused by the MVP heuristic parser

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
- `POST /ai/parse-reminder`
- `POST /ai/parse-trigger`
- `GET /voice-settings`
- `PATCH /voice-settings`
- `POST /voice/generate-script`
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

## Confirmation Model

Action prompts are created with `PENDING_CONFIRMATION`. Confirming an action prompt only marks it `CONFIRMED`; MVP backend code does not call payment, email, maps, phone, or URL providers.

Sensitive action payloads are annotated with `confirmation_required_no_auto_execute`.

## Voice Settings And Scripts

Users can configure voice preferences through:

- `GET /voice-settings`
- `PATCH /voice-settings`

Voice scripts can be generated with `POST /voice/generate-script`. Scripts support location arrival, location departure, time reminders, habit nudges, errand groups, payment reminders, email draft reminders, and contact reminders.

The backend does not store raw audio and does not implement background listening.

## MVP Limitations

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

# Triggerly

Triggerly is a privacy-first, location-aware AI reminder assistant MVP built with Expo, React Native, and TypeScript.

## Run

```bash
npm install
npm run start
```

Useful checks:

```bash
npm run typecheck
npm run test
```

## Backend API Connection

Set the backend URL before starting Expo:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 npm run start
```

On Android emulators, use your host alias instead:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npm run start
```

The mobile app stores the JWT with Expo SecureStore. Authenticated reminder reads/writes call the backend first, then fall back to local storage when the server is unavailable. The local mock layer remains in place so reminders still work during backend outages or early development.

Connected endpoints:

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
- `POST /ai/parse-reminder`

## Permissions

- Notifications are requested from onboarding or settings so time reminders can schedule local alerts.
- Location is requested only when creating or editing a location reminder, or when tapping "Use current location" in the location picker.
- Microphone permission is not requested in this MVP. If voice input is added later, it must only record after an explicit tap.

## Privacy Boundaries

Triggerly does not include covert recording, always-on microphone access, silent background audio capture, autonomous payments, automatic reading of private messages, hidden tracking, or surveillance behavior.

## MVP Limitations

- Data is stored locally through the mock API layer using Expo SecureStore. This is simple and private for an MVP, but larger datasets should move to SQLite or a backend-backed encrypted store.
- Location reminders save clean trigger data and include a foreground development check. Production background geofencing is intentionally marked as TODO in `src/features/location/geofence.ts`.
- Location search is a clean placeholder with manual place names and current coordinates rather than a full map search.
- Notification action behavior varies by platform. The app registers categories for mark done, snooze, and open, but platform support should be verified during native QA.
- The AI parser is a local heuristic. Users always confirm fields before saving.

## Terminal Design System

Triggerly uses a dark terminal-inspired interface without copying any reference site directly. The design system lives in `src/styles/theme.ts` and `src/components/ui`.

- Background: flat near-black terminal surfaces with a thin desktop-style chrome bar.
- Accent colors: neon green for armed/ready states, cyan for location/context, amber for pending/snoozed, red for destructive actions.
- Typography: monospace-first labels with command-line and snake_case language.
- Panels: simple black cards with thin borders, compact radii, and row dividers. The MVP intentionally avoids green shadow/glow haze.
- Motion: lightweight React Native Animated effects for typed header text, scanline motion, blinking command cursor, card fade/slide-in, button press scale, and subtle status changes. Reduced-motion settings are respected where practical.
- Privacy language: the UI says `user-defined triggers only`, `no background listening`, and `location used only for reminders you create`.

## AI Trigger Engine

Triggerly now includes a local deterministic AI Trigger Engine in `src/features/aiTrigger/parser.ts`.

It turns typed intentions into structured trigger suggestions:

- `time`
- `location_arrival`
- `location_departure`
- `habit`
- `contact`
- `errand_group`
- `action_prompt`

Every parsed intent sets `requiresConfirmation: true`. The app routes quick input to `triggers/confirm`, where the user can edit the task, trigger type, location/time/contact fields, delivery mode, and voice script before tapping `ARM_TRIGGER`.

The parser is intentionally isolated so a future LLM-backed parser can replace it without rewriting screens.

## Voice Notifications

Voice support is represented by:

- `src/features/voice/scripts.ts`
- `src/features/voice/settings.ts`
- `src/features/voice/speech.ts`

The current TTS layer is a placeholder. It is ready for `expo-speech`, but the app does not pretend background voice notification playback is guaranteed. Mobile OS behavior varies, so voice preview and notification-open playback should be validated per platform.

Voice settings are user-selected in `privacy.config` under `voice.config`. Triggerly does not request microphone permission automatically and does not support always-on listening.

## Action Safety

Action prompts can prepare intent for future integrations such as `draft_email`, `open_payment_app`, `call_contact`, `open_maps`, and `open_url`.

Rules:

- The AI may suggest an action.
- The user must confirm before anything continues.
- Triggerly does not automatically send emails.
- Triggerly does not automatically move money.
- Triggerly does not read private messages.

## Backend Connection Points

The screens call `src/features/reminders/api.ts`, which currently uses local storage. Later, `src/lib/apiClient.ts` can be wired to:

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
- `POST /ai/parse-reminder`

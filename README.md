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

- Background: near-black surfaces with subtle green/cyan glow.
- Accent colors: neon green for armed/ready states, cyan for location/context, amber for pending/snoozed, red for destructive actions.
- Typography: monospace-first labels with command-line and snake_case language.
- Panels: terminal cards with translucent dark surfaces, thin glowing borders, and row dividers.
- Motion: lightweight React Native Animated effects for typed header text, scanline motion, blinking command cursor, card fade/slide-in, button press scale, status flicker, and active count glow. Reduced-motion settings are respected where practical.
- Privacy language: the UI says `user-defined triggers only`, `no background listening`, and `location used only for reminders you create`.

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

# MeetNow

A production-grade video calling app built with Expo (SDK 57), React Native, and Agora.

## Features

- **Real-time video & audio calling** powered by Agora SDK
- **Incoming call handling** with push notifications
- **Friend management** — add, remove, accept/decline requests
- **Call history** with filtering (All / Missed)
- **Profile editing** — update your display name
- **Settings** — notifications, haptics, clear history, sign out
- **Light & dark theme** with system preference
- **Haptic feedback** on all interactions
- **Call quality indicators** — real-time network quality
- **Search** — find people by name or email
- **Responsive** — works on iOS, Android, and Web

## Requirements

- Node 20+
- Expo Go or a development build
- Agora App ID (free tier available)

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Agora credentials
npm start
```

### Agora Setup

1. Create a free account at [console.agora.io](https://console.agora.io)
2. Create a new project
3. Copy the App ID to `.env`
4. Generate a temporary token for testing (or mint tokens server-side in production)

## Environment Variables

All configuration lives in `.env`, which is **gitignored** — never commit it.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_AGORA_APP_ID` | Agora App ID from console.agora.io |
| `EXPO_PUBLIC_AGORA_TOKEN` | Short-lived token for local development |

> **Security note.** The `EXPO_PUBLIC_` prefix means Metro inlines the value into
> the JavaScript bundle, so it is readable by anyone with the app. Only
> short-lived, client-safe values belong here. In production, mint tokens
> server-side and never ship them in the bundle.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start on a specific platform |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Architecture

```
src/
  app/
    _layout.tsx        Root stack, providers, and the auth gate
    (auth)/            Signed-out only: sign-in, sign-up
    (tabs)/            Signed-in only: Call, Contacts, Settings
    call/[id].tsx      Active call screen with Agora video
    incoming-call.tsx   Incoming call screen with accept/decline
    profile.tsx        Profile editing screen
  components/          Shared UI (Avatar, VideoView, CallQuality, Skeleton, …)
  providers/           AuthProvider (session), SocialProvider (friends + history)
  services/            Backend contract + Agora call service + notifications
  config/env.ts        Typed access to the environment
  constants/           Theme tokens (colors, spacing, fonts, insets)
```

### Data Layer

Every screen talks to a `Backend` (see `src/services/types.ts`) and never to
storage directly. `src/services/index.ts` decides which implementation to use:

```ts
export const backend: Backend = localBackend;
```

`localBackend` is a complete, persisted, on-device implementation — real async
calls, real validation, real error messages, real friend-request state. It keeps
the whole product usable before an API exists. **To go to production, implement
the same `Backend` interface against your server and change that one line.**

### Call SDK

The call screen uses Agora for real-time video and audio. The call lifecycle:
1. **Connecting** — joining the Agora channel
2. **Connected** — video/audio streams active, duration timer running
3. **Ended** — call recorded to history, user returned to previous screen

Call controls: mute/unmute audio, enable/disable camera, switch camera, speaker toggle.

## Production Checklist

- [ ] Implement token minting server-side (never ship tokens in the bundle)
- [ ] Point `src/services/index.ts` at a real backend
- [ ] Configure push notifications with a provider (FCM/APNs)
- [ ] Replace the demo directory seeded in `src/services/local-backend.ts`
- [ ] Set real `bundleIdentifier` / `package` in `app.json`
- [ ] Replace app icons and splash screen with your own artwork
- [ ] Add crash reporting (Sentry, Bugsnag, etc.)
- [ ] Add analytics (optional)
- [ ] Set up EAS Build for CI/CD

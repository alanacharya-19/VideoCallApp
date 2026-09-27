# MeetNow

A video calling app built with Expo (SDK 57) and expo-router. Native tabs on iOS
and Android, an equivalent bar on web.

## Requirements

- Node 20+
- [Expo CLI](https://docs.expo.dev/get-started/set-up-your-environment/) — `npm install` is enough, everything runs through `npx expo`

## Setup

```bash
npm install
cp .env.example .env   # then fill in your credentials
npm start
```

## Environment variables

All configuration lives in `.env`, which is **gitignored** — never commit it.
Read them in code through `src/config/env.ts` rather than touching
`process.env` directly.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_CALL_APP_ID` | App ID issued by the video call provider |
| `EXPO_PUBLIC_CALL_TEMP_TOKEN` | Short-lived token for local development |

> **Security note.** The `EXPO_PUBLIC_` prefix means Metro inlines the value into
> the JavaScript bundle, so it is readable by anyone with the app. Only
> short-lived, client-safe values belong here. An App Certificate, API secret, or
> private key must live on your server (or in EAS secrets) and be used to mint
> short-lived tokens at runtime — never ship it in `.env`.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start on a specific platform |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project layout

```
src/
  app/            Routes (expo-router). index.tsx = Call tab, explore.tsx = Contacts tab
  components/     Shared UI: Avatar, SearchBar, ScreenHeader, SectionHeader, IconButton…
  config/env.ts   Typed access to the environment
  constants/      Theme tokens (colors, spacing, fonts, insets)
  hooks/          Theme + color scheme helpers
```

## Conventions

- Colors, spacing, and fonts come from `src/constants/theme.ts` — no hardcoded
  values in components, so light and dark mode stay in sync.
- `ThemedView` is for themed surfaces; plain `View` is for layout.
- Interactive elements need an `accessibilityRole` and `accessibilityLabel`.

## Before shipping

- Replace the Expo-branded app icon (`assets/images/icon.png`, `assets/expo.icon`)
  and the Android adaptive icon assets with your own artwork.
- Set real `bundleIdentifier` / `package` in `app.json`.
- Remove the placeholder data in `src/app/index.tsx` and `src/app/explore.tsx` and
  wire them to your backend.

# Architecture Overview

## Project Structure

- `apps/mobile`: Contains the React Native mobile application.
- `apps/api`: Contains the Next.js backend API.
- `packages/shared`: Contains shared types and utilities.

## Mobile App

The mobile app is built using React Native and Expo. It includes components for creating, editing, and deleting alarms.

### Android exact-alarm firing (issue #10)

Native module: `apps/mobile/modules/android-alarm` (`dawnlock-android-alarm`).

| Piece | Role |
|-------|------|
| `AndroidAlarmModule.kt` | Expo module API → `AlarmManager.setExactAndAllowWhileIdle` |
| `AlarmReceiver` | BroadcastReceiver that starts ringing FGS + full-screen activity |
| `AlarmRingingService` | Foreground service (mediaPlayback) with full-screen intent notification |
| `AlarmRingingActivity` | Lock-screen full-screen ringing UI |
| `BootReceiver` | Reschedules persisted alarms after `BOOT_COMPLETED` |
| `AlarmStore` | SharedPreferences store of scheduled alarms for reboot restore |
| `src/alarms/*` | JS helpers: next trigger time + schedule/cancel wrappers |

Permissions (manifest + config plugin): `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE(_MEDIA_PLAYBACK)`, `USE_FULL_SCREEN_INTENT`, `WAKE_LOCK`, `VIBRATE`, `POST_NOTIFICATIONS`.

Requires a **dev client / prebuild** build (not Expo Go) so the local Expo module is linked.

## Backend API

The backend is built using Next.js and provides API routes for managing alarms.

## Shared Types

Shared types are located in the `packages/shared` directory and are used across the mobile app and backend.
# DawnLock Architecture

## Monorepo layout (issue #17 foundation)

```
dawnlock/
├── apps/
│   ├── mobile/          # Expo (React Native) client — iOS + Android
│   └── api/             # Next.js App Router backend
├── packages/
│   └── shared/          # Shared TypeScript types + pure utilities
├── package.json         # npm workspaces root
├── tsconfig.base.json   # Shared TS compiler defaults
└── ARCHITECTURE.md
```

## Workspaces

| Package            | Name               | Role                                      |
|--------------------|--------------------|-------------------------------------------|
| `apps/mobile`      | `@dawnlock/mobile` | Expo app; consumes `@dawnlock/shared`     |
| `apps/api`         | `@dawnlock/api`    | Next.js API + health smoke route          |
| `packages/shared`  | `@dawnlock/shared` | Types (`Alarm`, `Mission`) + pure helpers |

Root `package.json` uses **npm workspaces** (`apps/*`, `packages/*`). Node ≥ 20.

## Conventions

- **Language:** TypeScript strict (`tsconfig.base.json`).
- **Shared code:** Only pure types/utilities in `packages/shared`. No React Native or Next imports there.
- **API:** App Router under `apps/api/src/app`. Health smoke: `GET /api/health`.
- **Mobile:** Expo entry via `apps/mobile/index.js` → `App.tsx`. Feature screens land in later issues.
- **No feature work here:** Alarm scheduling, missions, auth, payments, etc. belong to later backlog items (R1–R42). This scaffold is intentionally a vertical smoke slice only.

## Smoke verification

```bash
npm install
npm run typecheck -w @dawnlock/shared
npm run test -w @dawnlock/shared
npm run typecheck -w @dawnlock/api
npm run typecheck -w @dawnlock/mobile
```

## Product context (from README)

DawnLock is a cross-platform alarm-accountability app: alarms dismiss only after a completed mission (photo object, math, steps, …). This document describes **repo structure only**; product requirements live in the README and later issues.

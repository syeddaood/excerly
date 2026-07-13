# Overview

DawnLock is a cross-platform (iOS + Android) alarm-accountability app. Alarms cannot be dismissed until the user completes a "mission" (photograph a registered object, solve math problems, or speak an affirmation). Mission verification runs on-device with machine learning models — no cloud AI/LLM API calls for verification. The app tracks daily win/loss streaks, locks wake-up goals so they can't be changed after the fact, and gates premium features behind a subscription.

This document is the authoritative specification. Every numbered requirement (R1–R42) must be implemented as real, working code — no stubs or placeholders. If a requirement is ambiguous, choose the most standard interpretation and record the assumption.

## Tech Stack (Fixed — Do Not Substitute)

- **Mobile app**: React Native + Expo (custom dev build / prebuild — NOT Expo Go), TypeScript, Expo Router.
- **On-device ML**: Google ML Kit image labeling for photo missions; platform speech recognition (iOS Speech framework / Android SpeechRecognizer) for voice missions. TensorFlow Lite is acceptable as a fallback if ML Kit integration blocks.
- **Backend**: Next.js (App Router) API routes, TypeScript, Prisma + PostgreSQL, Auth.js v5 (credentials + Google/Apple sign-in), Redis + BullMQ for scheduled jobs. Monorepo layout: apps/mobile, apps/api (or match repo's existing layout if present), packages/shared for shared types.
- **Payments**: RevenueCat SDK for subscriptions (iOS + Android).
- **Tests**: Vitest for backend/shared logic; Jest + React Native Testing Library for mobile components; mission verifier logic must be unit-testable with mocked ML outputs.

## Requirements

### A. Alarm Core (The Make-or-Break Section)

- **R1**. Users can create, edit, and delete alarms with: time, repeat days (Mon–Sun toggles), label, sound, and an assigned mission type.
- **R2**. Android: alarms fire exactly on time using AlarmManager.setExactAndAllowWhileIdle with a full-screen intent that launches the ringing screen even when the phone is locked, backed by a foreground service so the OS can't kill the ringing.
- **R3**. Android: request SCHEDULE_EXACT_ALARM and POST_NOTIFICATIONS permissions with an explanatory pre-prompt screen; detect battery-optimization restrictions and show a one-time guided prompt to whitelist the app (with OEM-specific help text for Samsung and Xiaomi).
- **R4**. iOS: implement alarms as a chain of local notifications (minimum 30 notifications at ~2-second intervals per alarm) that continue until the app is opened; tapping any notification opens directly into the ringing/mission screen.
- **R5**. The ringing screen shows current time, alarm label, and a single button: "Start mission". There is NO dismiss and NO snooze control anywhere on this screen.
- **R6**. Volume/hardware buttons and app backgrounding must not silence a ringing alarm on Android; on iOS, document the platform limitation in code comments and mitigate via the notification chain (R4).
- **R7**. If the app is killed and restarted while an alarm should be ringing (within its active window), the app reopens into the ringing/mission screen, not the home screen.
- **R8**. All alarm state is stored locally (SQLite or MMKV) so alarms work fully offline; server sync is additive, never required for an alarm to fire.

### B. Missions (On-device ML)

- **R9**. Mission framework: a common interface Mission { start(): void; onResult(success: boolean): void; maxAttempts?: number } so new mission types can be added without touching the alarm flow.
- **R10**. Math mission: N problems (configurable 1–5) at three difficulty levels (single-digit add/subtract; two-digit multiply; mixed three-operand). Wrong answer regenerates a new problem. Alarm keeps ringing until all N are solved.
- **R11**. Photo-object mission — registration: during alarm setup the user photographs their target object (e.g., toothbrush, coffee machine); the app runs ML Kit image labeling on it and stores the top label set (with confidences) locally as the "object fingerprint".
- **R12**. Photo-object mission — wake time: user must photograph the same object; verification passes when the new photo's labels overlap the stored fingerprint above a tuned threshold. Verification is fully on-device and works offline. Include a debug/dev screen showing raw labels + confidences for tuning.
- **R13**. Photo mission fairness: after 5 consecutive failed attempts, show the registered object's setup photo as a hint (prevents the "it never recognizes my plunger" rage-quit); after 10, offer a fallback math mission at maximum difficulty — the alarm never becomes unwinnable.
- **R14**. Voice-affirmation mission: user records a chosen phrase at setup; at wake time, on-device speech-to-text transcribes their speech and passes on a fuzzy match (normalized Levenshtein similarity ≥ 0.8), tolerating minor mishears. Works offline where the platform's on-device recognition allows; otherwise degrade to R10 math fallback with a clear message.
- **R15**. Completing a mission stops the alarm/notification chain, records the wake event locally with timestamp, and shows a success screen with today's streak status.

### C. Streaks, Goals, and the Lock Rule

- **R16**. Each day with an active alarm is a WIN (mission completed before target time + grace period of 10 minutes) or LOSS (missed/completed late). No retroactive edits, no late submissions.
- **R17**. Goal lock: an alarm's time and enabled/disabled state become immutable within 4 hours of its next fire time. The UI disables editing with a countdown ("Locked — fires in 2h 13m"); the enforcement is also validated server-side on sync (reject edits whose client timestamp falls inside the lock window).
- **R18**. Streak engine: current streak, longest streak, and a scrollable history strip (calendar heat-strip of wins/losses) on the home screen. Streak logic lives in packages/shared with full unit-test coverage including timezone-change and DST cases.
- **R19**. Server-side daily job (BullMQ, per-user timezone aware) finalizes yesterday's win/loss for synced users and resets streaks on a loss.
- **R20**. Personalization model (genuine ML, on-device or server, implementer's choice): logistic regression (or equivalent simple model) over the user's history — day of week, alarm time, recent success rate — producing an oversleep-risk score shown as a "risk meter" when setting an alarm, with a suggested adjustment ("You miss 7:00 AM Mondays 60% of the time — try 7:20"). Must retrain/update incrementally as new wake events arrive. No cloud LLM calls.

### D. Accounts and Sync

- **R21**. Auth: email+password (bcrypt) and Sign in with Apple + Google via Auth.js v5. The app is fully usable anonymously (local-only); signing in enables sync and leaderboard.
- **R22**. Sync API: authenticated REST endpoints to push wake events/alarm configs and pull streak state; conflict rule is server-wins for finalized days, client-wins for future alarm configs (except inside the lock window, per R17).
- **R23**. Prisma schema: User, Alarm, WakeEvent, StreakSnapshot, Subscription — with a migration, seed script, and indexes on (userId, date).
- **R24**. Privacy: mission photos and audio never leave the device — only pass/fail results and label metadata sync. State this in a PRIVACY.md and enforce it in code (no photo/audio upload paths anywhere).

### E. Monetization

- **R25**. Free tier: 1 active alarm, math missions only, 7-day streak history.
- **R26**. Premium (RevenueCat subscription, monthly + annual): unlimited alarms, photo + voice missions, full history, personalization risk meter, custom sounds.
- **R27**. Paywall placement: shown when a free user taps a premium feature — NEVER as a blocking wall after onboarding setup (this is the #1 complaint against the competitor; onboarding must complete fully and land the user on a working free alarm before any paywall is shown).
- **R28**. Restore purchases, subscription status caching for offline, and a Subscription row synced from RevenueCat webhooks to the backend.

### F. App Shell and UX

- **R29**. Screens: Onboarding (permissions walkthrough), Home (next alarm + streak strip + risk meter), Alarm editor, Mission picker + registration flows, Ringing screen, Mission screens (math/photo/voice), Success screen, History, Settings, Paywall, Auth.
- **R30**. Onboarding explains—in order—notification permission, exact-alarm permission (Android), battery whitelist (Android), microphone/camera (deferred until a mission needs them). Each permission screen states why before the system prompt.
- **R31**. Dark mode support; the Ringing screen is high-contrast and readable at arm's length, half-asleep.
- **R32**. All times displayed and computed in the user's current timezone; alarm scheduling recomputes on timezone change.

### G. Quality Gates

- **R33**. TypeScript strict mode everywhere; typecheck script at repo root that covers all workspaces.
- **R34**. Unit tests: streak engine (R18) including DST/timezone edges; goal-lock enforcement (R17) client and server; mission verifiers with mocked ML/speech outputs (R12, R14); math generator difficulty bounds (R10).
- **R35**. Backend integration tests for sync endpoints (R22) including the lock-window rejection case.
- **R36**. A README.md with: dev-build setup for iOS + Android (including why Expo Go won't work), running the backend with Docker Compose (Postgres + Redis), and the manual alarm-reliability test checklist (locked phone, killed app, DND on, battery saver on).
- **R37**. CI script (GitHub Actions) running typecheck + all tests on push.

### H. Explicit Non-goals (Do Not Build)

- **R38**. No cloud AI/LLM calls anywhere in mission verification or personalization.
- **R39**. No social feed; leaderboard is out of scope for v1 (schema may anticipate it, no UI).
- **R40**. No sleep-tracking, sleep-stage detection, or health-data integration in v1.
- **R41**. No web version of the mobile app; the Next.js app is API-only plus a minimal landing page.
- **R42**. No admin dashboard in v1.

## Build Order (Respect This Sequencing)

1. Monorepo scaffold + backend skeleton + shared package (R23, R33).
2. Alarm core on both platforms (R1–R8) — validate on real devices before proceeding.
3. Math mission end-to-end (R9, R10, R15).
4. Streaks + goal lock, local first (R16–R18), then sync + daily job (R19, R21–R22).
5. Photo mission with ML Kit (R11–R13), then voice (R14).
6. Personalization model (R20).
7. Paywall + RevenueCat (R25–R28).
8. Polish, onboarding, quality gates (R29–R37).

## Additional Information

- **Development Setup**: Ensure you have the latest version of Node.js and Yarn installed. Follow the setup instructions in the `dev-setup.md` file for environment configuration.
- **Testing**: Run `yarn test` to execute all unit tests. For integration tests, use `yarn test:integration`.
- **Contribution Guidelines**: Please refer to `CONTRIBUTING.md` for guidelines on contributing to this project.

This README provides a comprehensive overview of the DawnLock app, its requirements, and development guidelines. For further details, refer to the respective sections and linked documents.
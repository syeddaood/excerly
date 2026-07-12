Project instructions for the coding agent. Read this file fully before making any change in this repository. Every task, issue, and PR in this repo must comply with these instructions.

What we are building

A production-grade mobile alarm application for iOS and Android. The app wakes the user with an alarm that cannot be dismissed without completing a physical task ("mission"), then enforces a 30-minute post-wake focus window in which the user follows a short ritual and is shielded from distracting apps.

Reliability is the #1 priority. An alarm app that fails to ring has no other features worth building. When any trade-off arises, choose the option that makes the alarm more reliable.

Tech stack (do not deviate)


UI: React Native + TypeScript (new architecture / TurboModules preferred)
Native modules (mandatory): alarm scheduling, background execution, mission sensors, and app-shielding are implemented natively and bridged to RN:

Android: Kotlin — AlarmManager, foreground services, UsageStatsManager
iOS: Swift — UNNotificationRequest, FamilyControls, ManagedSettingsStore, DeviceActivityCenter



Never implement alarm or enforcement logic in JavaScript. No JS timers, no react-native-background-timer, no community alarm packages on the alarm path — they do not survive Doze, force-quit, or reboot. The JS layer contains zero alarm-scheduling logic.
State: Zustand or Redux Toolkit (pick one on first use and stay consistent)
Persistence: Room (Android) / Core Data or SwiftData (iOS) inside the native modules; MMKV allowed for app settings. No backend in v1 — all data on-device.


Core user flow


Night before: user sets wake time, picks a mission type, and enters ONE priority task for tomorrow. Within 4 hours of the wake time the alarm locks — no editing, no deleting.
Alarm fires: full-screen, escalating sound, no snooze button exists anywhere.
Mission: alarm continues until the mission is completed. Mission types (each must require leaving the bed):

QR code scan of a code the user physically placed in the home (bathroom mirror, coffee machine) — build first
Step-count threshold (e.g. 30 steps via pedometer)
Photograph of a pre-registered object, verified by on-device image classification
Math problems — fallback only; completable in bed, so deprioritize in the UI



Focus window (30 min, configurable 10–60): single minimal ritual screen:

Minute 0–2: show last night's priority task
Minute 2–end: chosen ritual (journal prompt / stretch sequence / walk with live step count)
Distracting apps are shielded for the duration; leaving the app breaks the streak and is logged



Completion: streak increments; show sleep duration and accumulated sleep debt.


Non-negotiable requirements

Emergency access


An always-visible emergency exit breaks the focus window immediately — a single confirmation at most. It is logged but never requires justification.
Phone dialer, emergency services, and Messages remain reachable at all times. Never attempt to circumvent OS protections for these.


Sleep health guardrails


Each wake time is paired with a bedtime commitment; the streak counts only if both are met.
Show a running sleep-debt figure.
Users can bank and spend "rest days" without breaking their streak.
If the configured schedule yields under 6 hours of sleep: show a hard warning and refuse streak credit for that night.
The streak mechanic must never punish a user for sleeping.


Privacy


All mission verification (image classification, step counting) runs on-device. No photos or biometric data ever leave the phone.
iOS FamilyActivityPicker tokens are opaque by design — never attempt to de-anonymize which apps a user shields.
Wake/sleep history is stored locally. Any future sync feature must be opt-in and encrypted.


Platform implementation rules

Android (always build Android features first)

Alarm reliability, in this order, before any other Android work:


AlarmManager.setExactAndAllowWhileIdle() with SCHEDULE_EXACT_ALARM (or USE_EXACT_ALARM where eligible)
Foreground service with a persistent notification for the alarm and the focus window
Full-screen intent notification so the alarm surfaces over the lock screen
Explicit handling of Doze and App Standby
OEM battery killers (Samsung, Xiaomi, Oppo, Vivo, Huawei): onboarding flow that detects the manufacturer, deep-links to the correct autostart / battery-optimization exemption screen, and verifies the exemption is granted before the first alarm can be set
Re-register all alarms on BOOT_COMPLETED


Focus window enforcement:


Foreground service polls UsageStatsManager (PACKAGE_USAGE_STATS) for the frontmost package; on a blocked package, raise a full-screen overlay activity via SYSTEM_ALERT_WINDOW
AccessibilityService only with a defensible declared purpose (Google Play policy risk); if in doubt, ship without it
Never use Device Admin / Device Owner — that is enterprise MDM, not viable for consumer installs


iOS


The Family Controls entitlement must be requested from Apple before iOS shield work begins. It is not auto-granted and the timeline is unpredictable. Track its status in docs/ios-entitlement.md.
Alarm: UNNotificationRequest with time-sensitive/critical interruption level and a custom sound. Be honest in the UI about iOS limits — a silenced iPhone cannot be force-rung the way Android can. Evaluate AlarmKit when targeting recent iOS versions.
Shield: FamilyControls (authorization) + ManagedSettingsStore (shields) + DeviceActivityCenter with a DeviceActivitySchedule scoped to the focus window, cleared after. Phone, Messages, and Settings always remain accessible — design around this, never against it.
Entitlement-denied fallback: soft enforcement — the app stays foreground during the window; backgrounding (scenePhase) breaks the streak. The product must still be good in this mode; treat the shield as an enhancement, not the core value.


Build order

Work through these milestones strictly in order. One milestone = one PR. Do not start a milestone until the previous one is complete and its acceptance criteria pass.


Android alarm reliability — native Kotlin module + RN bridge. Exact-time fire, over the lock screen, with default battery optimization, after reboot, in Doze.
Permission onboarding flow — manufacturer detection, deep links, exemption verification, drop-off instrumentation per step.
Missions — QR scan first, then step count, then photo classification, then math fallback.
Focus window + ritual screens — soft enforcement only (backgrounding breaks streak).
Android hard enforcement — UsageStats polling + overlay.
iOS parity for milestones 1–4 — notification alarm, missions, soft-enforced window.
iOS shield — only if the Family Controls entitlement is granted.


Acceptance criteria (definition of done)


Alarm fires within 2 seconds of the set time on a cold-booted Samsung device with battery optimization at defaults — 10/10 trials (flag for manual device testing; do not mark complete on emulator results alone)
Alarm cannot be silenced without mission completion; force-quitting the app does not silence it
Alarms cannot be edited or deleted within 4 hours of their fire time
Emergency exit reachable within one tap from any screen during the focus window
No photo, image, or biometric data leaves the device
Under-6-hours schedules trigger a warning and earn no streak
Uninstalling during a focus window is possible (do not fight it) but logs a broken streak on reinstall
All alarm/enforcement logic lives in native modules; the JS layer contains zero alarm-scheduling logic


What NOT to do


Never claim the app "locks the phone" — neither OS permits this for consumer apps. All copy describes it as a shield and a ritual.
Never use AccessibilityService as a general-purpose blocker without a declared purpose.
Never build mission features before the alarm is reliable.
Never let the streak punish sleeping.
Never put alarm logic in JavaScript.


Working conventions for the agent


Keep PRs scoped to one milestone; reference this file's milestone number in the PR title (e.g. [M1] Android exact alarm module).
When a requirement here conflicts with a task description in an issue, this file wins — flag the conflict in the PR instead of silently choosing.
Anything requiring real-device verification (OEM battery behavior, Doze, reboot) must be listed under a "Manual testing required" section in the PR description.
Maintain docs/battery-onboarding-report.md (manufacturers tested, working deep links, drop-off per permission step) and docs/ios-entitlement.md (Family Controls request status and Apple's reasoning if denied).

# excerly
Build Prompt: Mission-Based Alarm App with Enforced Morning Focus Window

Paste this into your coding agent (Claude Code, Cursor, etc.). Adjust the bracketed choices before running.


Role & Objective

You are building a production-grade mobile alarm application for iOS and Android. The app wakes the user with an alarm that cannot be dismissed without completing a physical task ("mission"), then enforces a 30-minute post-wake window in which the user is guided through a focus ritual and prevented from using distracting apps.

Build for reliability first. An alarm app that fails to ring has no other features worth discussing.


Core User Flow


Night before: User sets a wake time, chooses a mission type, and enters one priority task for tomorrow morning. Once the user is within 4 hours of their wake time, the alarm settings lock — no editing, no deleting the alarm.
Alarm fires: Full-screen, sound escalates, no snooze button exists.
Mission: Alarm continues until the mission is completed. Mission types must require physical movement away from the bed:

Scan a QR code the user has physically placed somewhere in the home (bathroom mirror, coffee machine)
Step count threshold (e.g. 30 steps detected by pedometer)
Photograph a pre-registered object, verified by on-device image classification
Fallback: math problems (weakest option — completable in bed; offer but deprioritize)



Focus window (30 min, configurable 10–60): App presents a single, minimal ritual screen:

Minute 0–2: display the priority task the user entered last night
Minute 2–end: chosen ritual — journal prompt, stretch sequence, walk with live step count
Distracting apps are shielded/blocked for the duration
Leaving the app breaks the streak and is logged



Completion: Streak increments. Show sleep duration and accumulated sleep debt.



Non-Negotiable Requirements

Emergency access

An always-visible emergency exit must break the focus window immediately, with no friction beyond a single confirmation. It is logged but does not require justification. Phone dialer, emergency services, and Messages must remain reachable at all times. Do not attempt to circumvent OS protections for these. A user who feels trapped will uninstall.

Sleep health guardrails

Do not gamify sleep deprivation. Implement:


A bedtime commitment paired to each wake time. The streak counts only if both are met.
A visible running sleep-debt figure.
"Rest days" the user can bank and spend without breaking their streak.
A hard warning (and refusal to lock in the streak) if the configured schedule yields under 6 hours of sleep.


Privacy


All mission verification (image classification, step counts) runs on-device. No photos leave the phone.
On iOS, app-selection tokens from FamilyActivityPicker are opaque by design. Do not attempt to de-anonymize which apps a user shields.
Store wake/sleep history locally. If syncing, make it opt-in and encrypted.



Platform Implementation

Android (build this first)

Alarm reliability — solve before anything else:


AlarmManager.setExactAndAllowWhileIdle() with the SCHEDULE_EXACT_ALARM permission (USE_EXACT_ALARM where eligible).
Foreground service with a persistent notification for the alarm and the focus window.
Full-screen intent notification so the alarm surfaces over the lock screen.
Handle Doze and App Standby explicitly.
OEM battery killers: Samsung, Xiaomi, Oppo, Vivo, and Huawei aggressively terminate background services. Implement an onboarding flow that detects the manufacturer and deep-links the user to the correct autostart / battery-optimization exemption screen. Verify the exemption is granted before allowing the user to set their first alarm.
Re-register all alarms on BOOT_COMPLETED.


Focus window enforcement:


Foreground service polls UsageStatsManager (requires PACKAGE_USAGE_STATS) to detect the frontmost package.
On detecting a blocked package, raise a full-screen overlay activity via SYSTEM_ALERT_WINDOW.
Consider AccessibilityService for more reliable detection, but be aware Google Play restricts non-accessibility use of this API. Declare purpose carefully or ship without it.
Do not use Device Admin / Device Owner. That is an enterprise MDM provisioning flow, not viable for consumer install.


iOS

Entitlement (apply on day one, before writing iOS code):


Request the Family Controls entitlement from Apple. It is not granted automatically. Approval timeline is unpredictable.


Alarm:


iOS gives no background execution guarantee for alarms. Use UNNotificationRequest with a critical or time-sensitive interruption level and a custom sound. Be honest in the UI about the limits — you cannot force-ring a silenced phone the way Android can.
Investigate AlarmKit (iOS 26+) if targeting recent OS versions.


Focus window enforcement:


FamilyControls for authorization, ManagedSettingsStore to apply shields, DeviceActivityCenter with a DeviceActivitySchedule to scope the shield to the 30-minute window and clear it after.
Shield app categories and specific apps selected by the user via FamilyActivityPicker.
The shield cannot cover the whole OS. Phone, Messages, and Settings remain accessible. Design around this, not against it.


Fallback if the entitlement is denied:


Soft enforcement: the app stays foreground during the window; backgrounding is detected via scenePhase / applicationDidEnterBackground and breaks the streak. The product must still be good in this mode. Treat the shield as an enhancement, not the core value.



Architecture


Shared: [Kotlin Multiplatform / React Native / Flutter / fully native per platform — pick one and justify]
Alarm scheduling, mission verification, and focus-window enforcement must be native on both platforms. Cross-platform frameworks are unreliable for exact alarms and background execution. If using a cross-platform UI layer, isolate these subsystems behind a native module boundary.
Local persistence: Room (Android) / SwiftData or Core Data (iOS).
No backend required for v1. Streaks, history, and settings live on-device.



Build Order


Android alarm reliability. Alarm fires at the exact time, over the lock screen, on a Samsung device with battery optimization at defaults, after a reboot, in Doze. Do not proceed until this is bulletproof on real hardware.
Permission onboarding flow. Measure drop-off. This is where you lose half your users.
Missions (QR scan first — simplest and most effective).
Focus window with ritual screens. Soft enforcement only.
Android hard enforcement (overlay).
iOS, mirroring 1–4.
iOS shield, if and only if the entitlement is granted.



Acceptance Criteria


Alarm fires within 2 seconds of the set time on a cold-booted Samsung device with battery optimization enabled, 10 out of 10 trials.
Alarm cannot be silenced without mission completion. Force-quitting the app does not silence it.
The user cannot edit or delete an alarm within 4 hours of its fire time.
The emergency exit is reachable within one tap from any screen during the focus window.
No photo, image, or biometric data leaves the device.
A user configuring under 6 hours of sleep is warned and cannot earn a streak for that night.
Uninstalling during a focus window is possible (do not fight this) but logs a broken streak on reinstall.



What Not To Do


Do not claim the app "locks the phone." It does not. Neither OS permits this for consumer apps. Market it as a shield and a ritual.
Do not use AccessibilityService as a general-purpose blocker on Android without a defensible declared purpose. Play will pull the app.
Do not build the mission system before the alarm is reliable.
Do not let the streak mechanic punish a user for sleeping.



Deliverables


A working Android app meeting build steps 1–5.
A working iOS app meeting build steps 6–7.
A written report on the OEM battery-optimization onboarding: which manufacturers were tested, which deep links work, and the measured drop-off at each permission step.
Documentation of the Family Controls entitlement request status and, if denied, the reasoning.

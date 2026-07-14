/**
 * Expo config plugin for dawnlock-android-alarm.
 *
 * Ensures Android permissions required for exact alarms, boot reschedule,
 * full-screen intent, and the ringing foreground service are present in the
 * final AndroidManifest after `expo prebuild`.
 *
 * The module's own AndroidManifest.xml already declares receivers/services;
 * this plugin is the permissions safety net for managed workflow merges.
 */

const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const PERMISSIONS = [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.WAKE_LOCK",
  "android.permission.VIBRATE",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.USE_FULL_SCREEN_INTENT",
];

function ensurePermission(androidManifest, name) {
  const manifest = androidManifest.manifest;
  if (!manifest["uses-permission"]) {
    manifest["uses-permission"] = [];
  }
  const exists = manifest["uses-permission"].some(
    (p) => p.$?.["android:name"] === name
  );
  if (!exists) {
    manifest["uses-permission"].push({ $: { "android:name": name } });
  }
  return androidManifest;
}

const withDawnLockAndroidAlarm = (config) => {
  return withAndroidManifest(config, (config) => {
    for (const permission of PERMISSIONS) {
      ensurePermission(config.modResults, permission);
    }
    return config;
  });
};

module.exports = withDawnLockAndroidAlarm;

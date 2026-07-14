/**
 * Expo config plugin for dawnlock-android-alarm.
 *
 * Ensures Android permissions required for exact alarms, boot reschedule,
 * full-screen intent, and the ringing foreground service are present in the
 * app AndroidManifest after prebuild. Component registration (receivers /
 * service / activity) is declared in the module's own AndroidManifest and
 * merged automatically by the Expo modules autolinking pipeline.
 *
 * Requires a custom dev client (`npx expo run:android`) — not Expo Go.
 */

const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const REQUIRED_PERMISSIONS = [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.USE_FULL_SCREEN_INTENT",
  "android.permission.WAKE_LOCK",
  "android.permission.VIBRATE",
  "android.permission.POST_NOTIFICATIONS",
];

/**
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
function withDawnlockAndroidAlarm(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    for (const permission of REQUIRED_PERMISSIONS) {
      AndroidConfig.Permissions.ensurePermission(manifest, permission);
    }
    return config;
  });
  return config;
}

module.exports = withDawnlockAndroidAlarm;

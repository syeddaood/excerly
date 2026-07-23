/**
 * Expo config plugin for dawnlock-image-labeling.
 *
 * Ensures CAMERA permission is present for photo-object mission registration.
 */

const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const REQUIRED_PERMISSIONS = [
  "android.permission.CAMERA",
];

/**
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
function withDawnlockImageLabeling(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    for (const permission of REQUIRED_PERMISSIONS) {
      AndroidConfig.Permissions.ensurePermission(manifest, permission);
    }
    return config;
  });
  return config;
}

module.exports = withDawnlockImageLabeling;

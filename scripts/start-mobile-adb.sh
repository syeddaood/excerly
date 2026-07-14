#!/usr/bin/env bash
set -euo pipefail

# Android over USB: bypasses Wi-Fi/LAN issues by forwarding the device port to Metro.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools:"
  echo "  brew install android-platform-tools"
  echo "Then enable USB debugging on your phone and reconnect."
  exit 1
fi

echo "Checking connected Android devices..."
adb devices

if ! adb get-state >/dev/null 2>&1; then
  echo "No authorized Android device detected."
  echo "Enable Developer options -> USB debugging, connect USB, and accept the prompt on your phone."
  exit 1
fi

adb reverse tcp:8081 tcp:8081
echo "Port forward active: phone localhost:8081 -> Mac localhost:8081"
echo "In Expo Go on Android, enter: exp://127.0.0.1:8081"

export REACT_NATIVE_PACKAGER_HOSTNAME="127.0.0.1"
cd "$ROOT/apps/mobile"
exec npx expo start --localhost "$@"

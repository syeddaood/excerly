#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

if [ -z "$IP" ]; then
  echo "Could not detect LAN IP. Set REACT_NATIVE_PACKAGER_HOSTNAME manually."
else
  export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
  echo "LAN IP: $IP"
  echo "Expo Go URL: exp://${IP}:8081"
fi

cd "$ROOT/apps/mobile"
exec npx expo start --tunnel "$@"

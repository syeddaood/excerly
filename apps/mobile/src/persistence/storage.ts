import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

export const STORAGE_KEYS = {
  alarms: "alarms.v1",
  wakeEvents: "wakeEvents.v1",
  activeRing: "activeRing.v1",
} as const;

/** AsyncStorage-backed zustand persist adapter (works in Expo Go and dev builds). */
export const asyncStorage: StateStorage = {
  getItem: async (name) => (await AsyncStorage.getItem(name)) ?? null,
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

/** Simple string key-value helpers for ring session state. */
export const kvStorage = {
  getString(key: string): string | undefined {
    // Sync read not available; ring store uses direct AsyncStorage calls instead.
    return undefined;
  },
  async getStringAsync(key: string): Promise<string | undefined> {
    const v = await AsyncStorage.getItem(key);
    return v ?? undefined;
  },
  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

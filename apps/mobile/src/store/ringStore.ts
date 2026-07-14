import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Alarm } from "@dawnlock/shared";
import { STORAGE_KEYS } from "../persistence/storage";

export type ActiveRingSession = {
  alarmId: string;
  firedAt: number;
  label: string;
};

type RingState = {
  session: ActiveRingSession | null;
  missionStarted: boolean;
  startSession: (alarm: Alarm) => void;
  clearSession: () => void;
  setMissionStarted: (started: boolean) => void;
  loadSession: () => Promise<void>;
};

async function readSession(): Promise<ActiveRingSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.activeRing);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveRingSession;
  } catch {
    return null;
  }
}

async function writeSession(session: ActiveRingSession | null): Promise<void> {
  if (session) {
    await AsyncStorage.setItem(STORAGE_KEYS.activeRing, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.activeRing);
  }
}

export const useRingStore = create<RingState>((set) => ({
  session: null,
  missionStarted: false,

  loadSession: async () => {
    const session = await readSession();
    if (session) {
      set({ session });
    }
  },

  startSession: (alarm) => {
    const session: ActiveRingSession = {
      alarmId: alarm.id,
      firedAt: Date.now(),
      label: alarm.label,
    };
    void writeSession(session);
    set({ session, missionStarted: false });
  },

  clearSession: () => {
    void writeSession(null);
    set({ session: null, missionStarted: false });
  },

  setMissionStarted: (started) => set({ missionStarted: started }),
}));

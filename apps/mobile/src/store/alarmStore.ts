import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type Alarm,
  type WakeEvent,
  createDefaultAlarm,
  nextTriggerAtMillis,
} from "@dawnlock/shared";
import { asyncStorage, STORAGE_KEYS } from "../persistence/storage";
import { syncNativeAlarms } from "../alarms/engine";

type AlarmState = {
  alarms: Alarm[];
  wakeEvents: WakeEvent[];
  addAlarm: (partial?: Partial<Alarm>) => Alarm;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  recordWakeEvent: (event: WakeEvent) => void;
  getNextEnabledAlarm: (now?: Date) => Alarm | null;
};

function touch(alarm: Alarm, patch: Partial<Alarm>): Alarm {
  return { ...alarm, ...patch, updatedAt: Date.now() };
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      wakeEvents: [],

      addAlarm: (partial) => {
        const alarm = createDefaultAlarm(partial);
        set((state) => ({ alarms: [...state.alarms, alarm] }));
        syncNativeAlarms(get().alarms);
        return alarm;
      },

      updateAlarm: (id, patch) => {
        set((state) => ({
          alarms: state.alarms.map((a) => (a.id === id ? touch(a, patch) : a)),
        }));
        syncNativeAlarms(get().alarms);
      },

      deleteAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
        }));
        syncNativeAlarms(get().alarms);
      },

      toggleAlarm: (id) => {
        const alarm = get().alarms.find((a) => a.id === id);
        if (!alarm) return;
        get().updateAlarm(id, { enabled: !alarm.enabled });
      },

      recordWakeEvent: (event) => {
        set((state) => ({
          wakeEvents: [event, ...state.wakeEvents].slice(0, 200),
        }));
      },

      getNextEnabledAlarm: (now = new Date()) => {
        const enabled = get().alarms.filter((a) => a.enabled);
        if (enabled.length === 0) return null;
        let best: Alarm | null = null;
        let bestAt = Infinity;
        for (const alarm of enabled) {
          const at = nextTriggerAtMillis(
            alarm.time,
            alarm.repeatDays,
            now,
            alarm.armedRandomOffsetMinutes
          );
          if (at < bestAt) {
            bestAt = at;
            best = alarm;
          }
        }
        return best;
      },
    }),
    {
      name: STORAGE_KEYS.alarms,
      storage: createJSONStorage(() => asyncStorage),
      onRehydrateStorage: () => () => {
        syncNativeAlarms(useAlarmStore.getState().alarms);
      },
    }
  )
);

export function selectNextEnabledAlarm(state: AlarmState): Alarm | null {
  return state.getNextEnabledAlarm();
}

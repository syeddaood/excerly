export interface Alarm {
  id: string;
  time: string;
  repeatDays: string[];
  label: string;
  sound: string;
  missionType: string;
}

import { NativeModules } from 'react-native';

const { AlarmModule } = NativeModules;

export default {
  setExactAndAllowWhileIdle: (triggerAtMillis: number): Promise<boolean> => {
    return AlarmModule.setExactAndAllowWhileIdle(triggerAtMillis);
  },
};

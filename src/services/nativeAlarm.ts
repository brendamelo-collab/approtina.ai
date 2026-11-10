// Bridge to the native Android alarm (only inside the Rotina.ai Android app).
// The Android app loads this same website; its native layer exposes the "RotinaAlarm" plugin.

export interface NativeAlarm {
  key: string; // unique per occurrence: kind:id@YYYY-MM-DDTHH:MM
  id: string;
  type: 'rotina' | 'agenda' | 'medicamento';
  heading: string;
  title: string;
  subtitle?: string;
  spoken: string;
  timeLabel: string;
  at: number; // epoch ms
  sound?: string; // alarm sound chosen in Configurações (see utils/alarmSounds.ts)
  voice?: string; // Android voice name ('' = phone default)
  rate?: number; // speech speed
  pitch?: number; // speech pitch
}

export interface NativeVoice {
  name: string;
  locale: string;
  network: boolean;
  quality: number;
}

export interface NativeAlarmAction {
  key: string;
  id: string;
  type: string;
  action: 'fez' | 'adiar';
  minutes: number;
  at: number;
}

export interface NativeAlarmStatus {
  notifications: boolean;
  exactAlarm: boolean;
  fullScreen: boolean;
  overlay: boolean;
  battery: boolean;
}

const cap = () => (typeof window !== 'undefined' ? (window as any).Capacitor : undefined);

export const isNativeAlarmAvailable = (): boolean => {
  const c = cap();
  try {
    return !!c && typeof c.isNativePlatform === 'function' && c.isNativePlatform() && c.getPlatform?.() === 'android';
  } catch {
    return false;
  }
};

const call = async <T = any>(method: string, options: Record<string, any> = {}): Promise<T> => {
  const c = cap();
  if (!isNativeAlarmAvailable()) throw new Error('native alarm unavailable');
  if (typeof c.nativePromise === 'function') return c.nativePromise('RotinaAlarm', method, options);
  const plugin = c.Plugins?.RotinaAlarm || c.registerPlugin?.('RotinaAlarm');
  return plugin[method](options);
};

export const nativeAlarm = {
  setAlarms: (alarms: NativeAlarm[]) => call('setAlarms', { alarms }),
  takePendingActions: async (): Promise<NativeAlarmAction[]> => {
    const res = await call<{ actions?: NativeAlarmAction[] }>('takePendingActions');
    return res?.actions || [];
  },
  getStatus: () => call<NativeAlarmStatus>('getStatus'),
  openSetting: (which: keyof NativeAlarmStatus) => call('openSetting', { which }),
  testAlarm: (seconds = 10, options: Record<string, any> = {}) => call('testAlarm', { seconds, ...options }),
  // Available only in APKs built after the sound/voice settings were added
  getVoices: async (): Promise<NativeVoice[]> => {
    const res = await call<{ voices?: NativeVoice[] }>('getVoices');
    return res?.voices || [];
  },
  previewSound: (sound: string) => call('previewSound', { sound }),
  previewVoice: (options: { voice?: string; rate?: number; pitch?: number; text?: string }) => call('previewVoice', options)
};

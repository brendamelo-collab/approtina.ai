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
  testAlarm: (seconds = 10) => call('testAlarm', { seconds })
};

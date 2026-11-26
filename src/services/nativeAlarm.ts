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
  repeats?: number; // how many times the sound plays before the voice (0 = original)
  mode?: 'ambos' | 'alarme' | 'voz'; // som + voz, só som ou só voz
  voiceRepeats?: number; // quantas vezes a voz fala em cada rodada
  durationSec?: number; // 0 = como antes (10 min), -1 = até desligar, -2 = uma rodada, >0 = segundos
  accent?: string; // palette colors for the alarm screen
  accentDark?: string;
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
  action: 'fez' | 'adiar' | 'naofez';
  minutes: number;
  at: number;
}

export interface NativeAlarmStatus {
  notifications: boolean;
  exactAlarm: boolean;
  fullScreen: boolean;
  overlay: boolean;
  battery: boolean;
  lockscreen?: boolean; // canal do alarme urgente e visível na tela bloqueada (APKs novos)
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
  /** Silenciar alarmes: até quando (ms); 0 = tocando normalmente. */
  getMute: async (): Promise<number> => {
    const res = await call<{ until?: number }>('getMute');
    return Number(res?.until) || 0;
  },
  setMute: (until: number) => call('setMute', { until }),
  previewVoice: (options: { voice?: string; rate?: number; pitch?: number; text?: string }) => call('previewVoice', options),

  // ---- Atualização do app (APKs com o atualizador)
  getAppInfo: () => call<NativeAppInfo>('getAppInfo'),
  checkUpdate: (url: string) => call<PublishedVersion>('checkUpdate', { url }),
  downloadUpdate: (url: string) => call('downloadUpdate', { url }),
  installUpdate: () => call<{ started?: boolean; needsPermission?: boolean }>('installUpdate'),
  openInstallPermission: () => call('openInstallPermission'),
  onUpdateProgress: async (cb: (p: { percent: number; received: number; total: number }) => void): Promise<() => void> => {
    const c = cap();
    const plugin = c?.Plugins?.RotinaAlarm || c?.registerPlugin?.('RotinaAlarm');
    if (!plugin?.addListener) return () => undefined;
    const handle = await plugin.addListener('updateProgress', cb);
    return () => {
      try {
        handle?.remove?.();
      } catch {
        // já removido
      }
    };
  }
};

export interface NativeAppInfo {
  versionCode: number;
  versionName: string;
  signature: string; // SHA-256 do certificado (AA:BB:...)
  canInstall: boolean;
  updater: number;
}

/** android-version.json publicado junto com cada APK novo. */
export interface PublishedVersion {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  signature: string;
  size?: number;
  publishedAt?: string;
}

export const APK_URL = 'https://github.com/brendamelo-collab/approtina.ai/releases/download/android-latest/rotina-ai.apk';
export const VERSION_URL = 'https://github.com/brendamelo-collab/approtina.ai/releases/download/android-latest/android-version.json';

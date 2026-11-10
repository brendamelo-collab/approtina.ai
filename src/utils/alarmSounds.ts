// Sons de alarme e voz dos lembretes (Configurações > Sons e voz).
// As notas abaixo são as mesmas do app Android (android-app/.../SoundSynth.java),
// para que a prévia no site soe igual ao alarme do celular.
import { isNativeAlarmAvailable, nativeAlarm } from '../services/nativeAlarm';

export type AlarmSoundId = 'padrao' | 'sino' | 'marimba' | 'harpa' | 'digital' | 'pulso' | 'celular';

export const ALARM_SOUNDS: { id: AlarmSoundId; label: string; description: string }[] = [
  { id: 'padrao', label: 'Padrão do Rotina.ai', description: 'O som que o app já usava' },
  { id: 'sino', label: 'Sino suave', description: 'Duas badaladas calmas' },
  { id: 'marimba', label: 'Marimba', description: 'Notas alegres e leves' },
  { id: 'harpa', label: 'Harpa', description: 'Acorde que sobe devagar' },
  { id: 'digital', label: 'Despertador digital', description: 'Bipes clássicos de relógio' },
  { id: 'pulso', label: 'Alerta forte', description: 'Bipes rápidos, difíceis de ignorar' },
  { id: 'celular', label: 'Alarme do celular', description: 'O toque de alarme do seu Android' }
];

// [frequência inicial, frequência final, início (s), duração (s), onda (0 seno, 1 triângulo, 2 quadrada, 3 serra), volume, 1 = dedilhado / 0 = contínuo]
type Note = [number, number, number, number, number, number, number];

const repeat = (notes: Note[], times: number[]): Note[] =>
  times.flatMap((t0) => notes.map((n) => [n[0], n[1], n[2] + t0, n[3], n[4], n[5], n[6]] as Note));
const beeps = (f: number, dur: number, step: number, count: number, wave: number, vol: number): Note[] =>
  Array.from({ length: count }, (_, i) => [f, f, i * step, dur, wave, vol, 0] as Note);

const SPECS: Record<string, Note[]> = {
  sino: [
    [880, 880, 0, 1.6, 0, 0.45, 1], [1760, 1760, 0, 1.0, 0, 0.12, 1], [2640, 2640, 0, 0.6, 0, 0.05, 1],
    [660, 660, 1.7, 1.8, 0, 0.45, 1], [1320, 1320, 1.7, 1.1, 0, 0.12, 1]
  ],
  marimba: repeat(
    [[523.25, 523.25, 0, 0.45, 1, 0.5, 1], [659.25, 659.25, 0.16, 0.45, 1, 0.5, 1], [783.99, 783.99, 0.32, 0.45, 1, 0.5, 1], [1046.5, 1046.5, 0.48, 0.6, 1, 0.5, 1]],
    [0, 1.2]
  ),
  harpa: [
    [440, 440, 0, 1.4, 0, 0.32, 1], [554.37, 554.37, 0.11, 1.4, 0, 0.32, 1], [659.25, 659.25, 0.22, 1.4, 0, 0.32, 1],
    [880, 880, 0.33, 1.4, 0, 0.32, 1], [1108.73, 1108.73, 0.44, 1.4, 0, 0.3, 1], [1318.51, 1318.51, 0.55, 1.6, 0, 0.28, 1]
  ],
  digital: repeat(beeps(988, 0.1, 0.18, 4, 2, 0.18), [0, 1.2]),
  pulso: repeat(beeps(1175, 0.07, 0.13, 6, 3, 0.16), [0, 1.1]),
  // "padrao" no site: o sininho que o app já tocava
  suave: [[587.33, 880, 0, 1.2, 0, 0.3, 1], [587.33, 880, 1.5, 1.2, 0, 0.3, 1]]
};

let ctx: AudioContext | null = null;
const audio = (): AudioContext | null => {
  try {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    if (!ctx) ctx = new C();
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
};

const WAVES: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

/** Toca um ciclo do som no navegador. Retorna a duração em ms. */
export function playWebSound(id: string): number {
  const notes = SPECS[id === 'padrao' || id === 'celular' ? (id === 'celular' ? 'digital' : 'suave') : id] || SPECS.suave;
  const ac = audio();
  if (!ac) return 0;
  const t0 = ac.currentTime + 0.02;
  let end = 0;
  for (const [f0, f1, start, dur, wave, vol, pluck] of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = WAVES[wave] || 'sine';
    const s = t0 + start;
    osc.frequency.setValueAtTime(f0, s);
    if (f1 !== f0) osc.frequency.linearRampToValueAtTime(f1, s + dur);
    gain.gain.setValueAtTime(0.0001, s);
    gain.gain.linearRampToValueAtTime(vol * 0.6, s + 0.005);
    if (pluck) gain.gain.exponentialRampToValueAtTime(0.0008, s + dur);
    else {
      gain.gain.setValueAtTime(vol * 0.6, Math.max(s + 0.006, s + dur - 0.01));
      gain.gain.linearRampToValueAtTime(0.0001, s + dur);
    }
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(s);
    osc.stop(s + dur + 0.02);
    end = Math.max(end, start + dur);
  }
  return Math.round(end * 1000);
}

/** Prévia do som: no app Android usa o alarme nativo (se o app instalado já tiver essa função). */
export async function previewAlarmSound(id: AlarmSoundId): Promise<'native' | 'web'> {
  if (isNativeAlarmAvailable()) {
    try {
      await nativeAlarm.previewSound(id);
      return 'native';
    } catch {
      // APK antigo sem a prévia: toca no navegador
    }
  }
  playWebSound(id);
  return 'web';
}

// ---------- Voz ----------

export interface VoiceSettings {
  voiceName?: string; // voz do navegador
  nativeVoiceName?: string; // voz do Android
  voiceRate?: number;
  voicePitch?: number;
}

export const VOICE_RATES = [
  { value: 0.8, label: 'Devagar' },
  { value: 0.95, label: 'Normal' },
  { value: 1.1, label: 'Rápida' }
];
export const VOICE_PITCHES = [
  { value: 0.85, label: 'Grave' },
  { value: 1, label: 'Natural' },
  { value: 1.2, label: 'Aguda' }
];

export const SAMPLE_SENTENCE = 'Olá! Esta é a voz dos seus lembretes. Está na hora de tomar água.';

/** Vozes em português do navegador (podem demorar a carregar na primeira vez). */
export function listWebVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve([]);
    const pick = () => window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('pt'));
    const now = pick();
    if (now.length) return resolve(now);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(pick());
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', finish, { once: true } as any);
    setTimeout(finish, 1500);
  });
}

/** Fala o texto com a voz escolhida. No app Android usa a voz do celular. */
export function speakText(text: string, settings: VoiceSettings = {}): void {
  const rate = settings.voiceRate ?? 0.95;
  const pitch = settings.voicePitch ?? 1;
  const hasWebVoice = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (isNativeAlarmAvailable() && (!hasWebVoice || settings.nativeVoiceName)) {
    nativeAlarm.previewVoice({ text, voice: settings.nativeVoiceName || '', rate, pitch }).catch(() => speakWeb(text, settings));
    return;
  }
  speakWeb(text, settings);
}

function speakWeb(text: string, settings: VoiceSettings) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = settings.voiceRate ?? 0.95;
    u.pitch = settings.voicePitch ?? 1;
    if (settings.voiceName) {
      const v = window.speechSynthesis.getVoices().find((x) => x.name === settings.voiceName);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
    }
    window.speechSynthesis.speak(u);
  } catch {
    // navegador sem voz
  }
}

// Configurações > Sons e voz: como cada aviso toca (tipo, toques, repetições da voz e duração).
// Uma regra só, usada pelo alarme do app aberto (AlarmBalloonModal) e pelo alarme do Android.
import type { NotificationPreferences } from '../types';

export type AlertMode = 'ambos' | 'alarme' | 'voz';

export const ALERT_MODES: { id: AlertMode; label: string; hint: string }[] = [
  { id: 'ambos', label: 'Alarme e voz', hint: 'Toca o som e depois fala o lembrete' },
  { id: 'alarme', label: 'Só alarme', hint: 'Só o som, sem falar' },
  { id: 'voz', label: 'Só voz', hint: 'Só fala o lembrete, sem bipes' }
];

/** Durações: 0 = como sempre foi (10 min e adia sozinho), -1 = até desligar, -2 = uma rodada. */
export const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: -2, label: 'Uma vez só' },
  { value: 30, label: '30 segundos' },
  { value: 60, label: '1 minuto' },
  { value: 120, label: '2 minutos' },
  { value: 300, label: '5 minutos' },
  { value: 0, label: '10 minutos (padrão)' },
  { value: -1, label: 'Até eu desligar' }
];

export const BEEP_MIN = 1;
export const BEEP_MAX = 20;
export const VOICE_REPEAT_MAX = 10;

/** Tipo de aviso salvo; contas antigas seguem o que já tinham ("Só a voz" no som, voz desligada). */
export const alertModeOf = (p: Partial<NotificationPreferences> | undefined): AlertMode => {
  if (p?.alertMode === 'ambos' || p?.alertMode === 'alarme' || p?.alertMode === 'voz') return p.alertMode;
  if (p?.alarmSound === 'nenhum') return 'voz';
  if (p?.voiceAlerts === false) return 'alarme';
  return 'ambos';
};

export const voiceRepeatsOf = (p: Partial<NotificationPreferences> | undefined) =>
  Math.max(1, Math.min(VOICE_REPEAT_MAX, Math.round(Number(p?.voiceRepeats) || 1)));

export const durationOf = (p: Partial<NotificationPreferences> | undefined) => {
  const d = Number(p?.alarmDurationSec);
  return Number.isFinite(d) ? d : 0;
};

/** Quantos toques: 0 = padrão do som (3 bipes no som padrão do app aberto, 6 no Android). */
export const beepsOf = (p: Partial<NotificationPreferences> | undefined) => Math.max(0, Math.min(BEEP_MAX, Math.round(Number(p?.alarmRepeats) || 0)));

/** Campos enviados ao alarme do Android junto com cada aviso. */
export const alertStyleFrom = (p: Partial<NotificationPreferences> | undefined) => ({
  mode: alertModeOf(p),
  voiceRepeats: voiceRepeatsOf(p),
  durationSec: durationOf(p)
});

/** Duração em ms para o alarme do app aberto: null = até responder; 0 = só uma rodada. */
export const durationMsForWeb = (p: Partial<NotificationPreferences> | undefined): number | null => {
  const d = durationOf(p);
  if (d === -1) return null;
  if (d === -2) return 0;
  if (d === 0) return 60 * 1000; // como era no app aberto: repete por cerca de 1 minuto
  return d * 1000;
};

export const durationLabel = (sec: number) => DURATION_OPTIONS.find((o) => o.value === sec)?.label || `${sec} s`;

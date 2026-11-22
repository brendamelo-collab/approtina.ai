import { useEffect, useState } from 'react';

// Silenciar alarmes: enquanto estiver silenciado, os lembretes continuam aparecendo,
// mas sem som, sem voz e sem vibração. Vale para o app aberto e para o alarme do Android.

/** "Até eu reativar" (data bem distante; o mesmo valor é usado no app Android). */
export const MUTE_FOREVER = 4102444800000; // 01/01/2100

/** Opções rápidas (tela do alarme e Configurações); as mesmas do alarme do Android. */
export const MUTE_OPTIONS: { id: string; label: string; minutes: number | null }[] = [
  { id: '60', label: '1 hora', minutes: 60 },
  { id: '120', label: '2 horas', minutes: 120 },
  { id: '180', label: '3 horas', minutes: 180 },
  { id: 'dia', label: 'Resto do dia', minutes: -2 },
  { id: 'sempre', label: 'Até eu reativar', minutes: null }
];

/** Opções do botão SILENCIAR ROTINAS (horas). */
export const MUTE_HOURS = [1, 2, 3, 4];

/** Fim do dia de hoje (23:59:59). */
export const endOfToday = (now = Date.now()) => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 0);
  return d.getTime();
};

/** Próxima vez que o relógio marcar HH:MM (hoje, ou amanhã se já passou). */
export const untilClock = (hhmm: string, now = Date.now()) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h || 0, m || 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
};

/** Data e hora escolhidas (YYYY-MM-DD + HH:MM, horário do aparelho). */
export const untilDateTime = (date: string, hhmm: string) => {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, m || 0, 0, 0).getTime();
};

export const muteUntilFor = (minutes: number | null, now = Date.now()) =>
  minutes === null ? MUTE_FOREVER : minutes === -2 ? endOfToday(now) : now + minutes * 60 * 1000;

export const isMuted = (until: number | undefined, now = Date.now()) => !!until && until > now;

/** "até 15:30", "até amanhã às 07:00" ou "até você reativar". */
export function muteLabel(until: number | undefined, now = Date.now()): string {
  if (!until) return '';
  if (until >= MUTE_FOREVER) return 'até você reativar';
  const d = new Date(until);
  const hhmm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now);
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
  if (d.toDateString() === today.toDateString()) return `até ${hhmm}`;
  if (d.toDateString() === tomorrow.toDateString()) return `até amanhã às ${hhmm}`;
  return `até ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hhmm}`;
}

// ---- Atualiza a tela sozinha quando o silêncio termina

/** true enquanto silenciado; volta a false no instante em que o tempo acaba (sem precisar recarregar). */
export function useMuted(until: number | undefined): boolean {
  const [, setTick] = useState(0);
  const active = isMuted(until);
  useEffect(() => {
    if (!active || !until || until >= MUTE_FOREVER) return;
    const ms = Math.min(until - Date.now() + 250, 2147483000);
    const t = setTimeout(() => setTick((n) => n + 1), Math.max(250, ms));
    return () => clearTimeout(t);
  }, [active, until]);
  return active;
}

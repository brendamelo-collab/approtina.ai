// Silenciar alarmes: enquanto estiver silenciado, os lembretes continuam aparecendo,
// mas sem som, sem voz e sem vibração. Vale para o app aberto e para o alarme do Android.

/** "Até eu reativar" (data bem distante; o mesmo valor é usado no app Android). */
export const MUTE_FOREVER = 4102444800000; // 01/01/2100

export const MUTE_OPTIONS: { id: string; label: string; minutes: number | null }[] = [
  { id: '30', label: '30 minutos', minutes: 30 },
  { id: '60', label: '1 hora', minutes: 60 },
  { id: '120', label: '2 horas', minutes: 120 },
  { id: '240', label: '4 horas', minutes: 240 },
  { id: 'sempre', label: 'Até eu reativar', minutes: null }
];

export const muteUntilFor = (minutes: number | null, now = Date.now()) =>
  minutes === null ? MUTE_FOREVER : now + minutes * 60 * 1000;

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

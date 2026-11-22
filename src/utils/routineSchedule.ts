// Regras compartilhadas das rotinas com voz: em que dia acontecem e o que a voz fala.
// Usadas pela rotina diária, pelo alarme do app aberto, pelo alarme do Android e pelo calendário,
// para que um cadastro só precise existir uma vez.
import { DailyChronologicalStep, PersonalRoutine, UserProfile } from '../types';

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const occursOnWeekday = (days: number[] | undefined, weekday: number) => !days || days.length === 0 || days.includes(weekday);

export const stepOccursOn = (s: DailyChronologicalStep, weekday: number) => occursOnWeekday(s.daysOfWeek, weekday);

export const personalOccursOn = (p: PersonalRoutine, weekday: number) => occursOnWeekday(p.daysOfWeek, weekday);

/** "Todos os dias", "Dias úteis", "Seg, Qua e Sex"... */
export function daysLabel(days?: number[]): string {
  if (!days || days.length === 0 || days.length === 7) return 'Todos os dias';
  const set = new Set(days);
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Dias úteis';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Fins de semana';
  const names = WEEKDAY_ORDER.filter((d) => set.has(d)).map((d) => WEEKDAY_SHORT[d]);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

const lower = (t: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const strip = (t: string) => t.replace(/^[^\p{L}\p{N}]+/u, '').trim();

/** Fala de uma etapa da rotina diária. */
export function spokenForStep(s: DailyChronologicalStep, name?: string): string {
  if (s.spokenText && s.spokenText.trim()) return s.spokenText.trim();
  return `${name ? `${name}, ` : ''}está na hora de: ${strip(s.title)}.`;
}

/** Fala de uma rotina pessoal: "Brenda, hoje é dia de fazer esfoliação durante o banho." */
export function spokenForPersonal(p: PersonalRoutine, profiles: UserProfile[]): string {
  if (p.spokenText && p.spokenText.trim()) return p.spokenText.trim();
  const who = profiles.find((x) => x.id === p.profileId)?.name;
  const what = `${lower(strip(p.title))}${p.context ? ` ${p.context.trim()}` : ''}`;
  return `${who ? `${who}, ` : ''}hoje é dia de ${what}.`;
}

export const profileName = (profiles: UserProfile[], id: string) => profiles.find((x) => x.id === id)?.name || 'Família';

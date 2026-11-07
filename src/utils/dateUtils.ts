// Date helpers based on the device's real local date (no fixed demo dates)

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as YYYY-MM-DD */
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today's local date as YYYY-MM-DD */
export const todayISO = () => toISODate(new Date());

/** Parses YYYY-MM-DD as a local date (noon, to avoid timezone edge cases) */
export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10));
  return new Date(y, (m || 1) - 1, d || 1, 12);
};

/** Adds days to a YYYY-MM-DD date */
export const shiftISODate = (iso: string, days: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

/** Current local time as HH:MM */
export const nowHHMM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

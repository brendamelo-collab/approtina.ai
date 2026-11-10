// Estatísticas dos relatórios calculadas SOMENTE com o que a pessoa registrou.
// Regras:
//  - "Não se aplica", "Não lembro" e perguntas sem resposta nunca contam como negativas nem entram no denominador.
//  - Atividade sem marcação é "sem registro", nunca "não feita".
//  - Adiado continua adiado (não conta como feito).
//  - Sem dados suficientes = null (as telas mostram "Sem dados suficientes"), nunca um número inventado.
import {
  ActivityLog,
  ActivityStatus,
  AgendaItem,
  DailyChronologicalStep,
  FactorOption,
  GoalItem,
  HealthMedication,
  MoodOption,
  MoodRecord,
  QuestionItem,
  QuestionResponse,
  RecurringTaskItem,
  RoutineTask,
  TaskExecutionRecord
} from '../types';
import { parseISODate, shiftISODate, toISODate } from './dateUtils';
import { agendaOccursOn } from './routineCalculations';

export type PeriodKind = 'dia' | 'semana' | 'mes' | 'ano' | 'personalizado';
export type Granularity = 'dia' | 'semana' | 'mes';

export interface ReportPeriod {
  kind: PeriodKind;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  label: string;
  prevLabel: string;
  days: number;
  granularity: Granularity;
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEK_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const shortDate = (iso: string) => {
  const d = parseISODate(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const daysBetween = (from: string, to: string) =>
  Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86400000) + 1;

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  if (!from || !to || from > to) return out;
  let d = from;
  while (d <= to && out.length < 1200) {
    out.push(d);
    d = shiftISODate(d, 1);
  }
  return out;
}

const weekStart = (iso: string) => {
  const wd = parseISODate(iso).getDay(); // 0 = domingo
  return shiftISODate(iso, -((wd + 6) % 7)); // semana começa na segunda
};

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
const monthEnd = (iso: string) => {
  const d = parseISODate(monthStart(iso));
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const granularityFor = (days: number): Granularity => (days <= 31 ? 'dia' : days <= 120 ? 'semana' : 'mes');

/** Período do relatório e o período anterior equivalente (para comparar). */
export function buildPeriod(kind: PeriodKind, anchor: string, custom?: { from: string; to: string }): ReportPeriod {
  let from = anchor;
  let to = anchor;
  let prevFrom: string;
  let prevTo: string;
  let label = '';
  let prevLabel = '';
  if (kind === 'dia') {
    prevFrom = prevTo = shiftISODate(anchor, -1);
    const d = parseISODate(anchor);
    label = `${WEEK_SHORT[d.getDay()]}, ${shortDate(anchor)}`;
    prevLabel = 'dia anterior';
  } else if (kind === 'semana') {
    from = weekStart(anchor);
    to = shiftISODate(from, 6);
    prevFrom = shiftISODate(from, -7);
    prevTo = shiftISODate(from, -1);
    label = `${shortDate(from)} a ${shortDate(to)}`;
    prevLabel = 'semana anterior';
  } else if (kind === 'mes') {
    from = monthStart(anchor);
    to = monthEnd(anchor);
    const p = parseISODate(from);
    prevFrom = toISODate(new Date(p.getFullYear(), p.getMonth() - 1, 1));
    prevTo = shiftISODate(from, -1);
    label = `${MONTHS[p.getMonth()]} de ${p.getFullYear()}`;
    prevLabel = 'mês anterior';
  } else if (kind === 'ano') {
    const y = anchor.slice(0, 4);
    from = `${y}-01-01`;
    to = `${y}-12-31`;
    prevFrom = `${Number(y) - 1}-01-01`;
    prevTo = `${Number(y) - 1}-12-31`;
    label = y;
    prevLabel = 'ano anterior';
  } else {
    from = custom?.from || anchor;
    to = custom?.to || anchor;
    if (from > to) [from, to] = [to, from];
    const n = daysBetween(from, to);
    prevTo = shiftISODate(from, -1);
    prevFrom = shiftISODate(prevTo, -(n - 1));
    label = `${shortDate(from)} a ${shortDate(to)}`;
    prevLabel = `${n} dias anteriores`;
  }
  const days = daysBetween(from, to);
  return { kind, from, to, prevFrom, prevTo, label, prevLabel, days, granularity: granularityFor(days) };
}

export interface Bucket {
  key: string;
  from: string;
  to: string;
  label: string;
}

/** Divide o período em pontos do gráfico (dias, semanas ou meses). */
export function bucketsFor(from: string, to: string, granularity: Granularity): Bucket[] {
  const out: Bucket[] = [];
  if (granularity === 'dia') {
    eachDay(from, to).forEach((d) => {
      const wd = parseISODate(d).getDay();
      out.push({ key: d, from: d, to: d, label: daysBetween(from, to) <= 7 ? WEEK_SHORT[wd] : shortDate(d).slice(0, 2) });
    });
  } else if (granularity === 'semana') {
    let s = weekStart(from);
    while (s <= to) {
      const e = shiftISODate(s, 6);
      out.push({ key: s, from: s < from ? from : s, to: e > to ? to : e, label: shortDate(s < from ? from : s) });
      s = shiftISODate(s, 7);
    }
  } else {
    let m = monthStart(from);
    while (m <= to) {
      const e = monthEnd(m);
      const d = parseISODate(m);
      out.push({ key: m, from: m < from ? from : m, to: e > to ? to : e, label: MONTHS_SHORT[d.getMonth()] });
      m = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }
  return out;
}

export const pct = (part: number, total: number): number | null => (total > 0 ? Math.round((part / total) * 100) : null);

export interface Delta {
  current: number | null;
  previous: number | null;
  diff: number | null; // pontos percentuais ou unidades
}
export const delta = (current: number | null, previous: number | null): Delta => ({
  current,
  previous,
  diff: current === null || previous === null ? null : current - previous
});

// ------------------------------------------------------------------
// MEU MAPA
// ------------------------------------------------------------------

export function isQuestionDue(q: QuestionItem, date: string): boolean {
  const wd = parseISODate(date).getDay();
  switch (q.frequency) {
    case 'dias_uteis':
      return wd >= 1 && wd <= 5;
    case 'fins_de_semana':
      return wd === 0 || wd === 6;
    case 'personalizado':
      return !q.activeDays || q.activeDays.length === 0 || q.activeDays.includes(wd);
    default:
      return true;
  }
}

export const isGoodHabit = (q: QuestionItem) => (q.habitType || (q.positiveIf === 'nao' ? 'ruim' : 'bom')) === 'bom';

export interface AnswerCounts {
  positivo: number;
  negativo: number;
  naoSeAplica: number;
  naoLembro: number;
  semResposta: number; // dias previstos sem resposta (só até hoje)
  validas: number; // positivo + negativo
  pctPositivo: number | null;
  pctNegativo: number | null;
}

const emptyCounts = (): AnswerCounts => ({ positivo: 0, negativo: 0, naoSeAplica: 0, naoLembro: 0, semResposta: 0, validas: 0, pctPositivo: null, pctNegativo: null });

const finish = (c: AnswerCounts): AnswerCounts => {
  c.validas = c.positivo + c.negativo;
  c.pctPositivo = pct(c.positivo, c.validas);
  c.pctNegativo = pct(c.negativo, c.validas);
  return c;
};

export function countAnswers(questions: QuestionItem[], responses: QuestionResponse[], from: string, to: string, today: string): AnswerCounts {
  const ids = new Set(questions.map((q) => q.id));
  const c = emptyCounts();
  const answered = new Set<string>();
  responses.forEach((r) => {
    if (!ids.has(r.questionId) || r.date < from || r.date > to) return;
    answered.add(`${r.questionId}@${r.date}`);
    if (r.value === 'positivo') c.positivo++;
    else if (r.value === 'negativo') c.negativo++;
    else if (r.value === 'nao_se_aplica') c.naoSeAplica++;
    else if (r.value === 'nao_lembro') c.naoLembro++;
  });
  const end = to < today ? to : today;
  eachDay(from, end).forEach((d) => {
    questions.forEach((q) => {
      if (isQuestionDue(q, d) && !answered.has(`${q.id}@${d}`)) c.semResposta++;
    });
  });
  return finish(c);
}

export interface QuestionReport {
  question: QuestionItem;
  good: boolean;
  counts: AnswerCounts;
  previous: AnswerCounts;
  /** Bons hábitos: dias em que cumpriu. Comportamentos a evitar: vezes em que aconteceu. */
  occurrences: number;
  previousOccurrences: number;
  daysAnswered: number;
  series: (number | null)[]; // % positivo por ponto do gráfico
}

export function questionReports(
  questions: QuestionItem[],
  responses: QuestionResponse[],
  period: ReportPeriod,
  buckets: Bucket[],
  today: string
): QuestionReport[] {
  return questions.map((q) => {
    const counts = countAnswers([q], responses, period.from, period.to, today);
    const previous = countAnswers([q], responses, period.prevFrom, period.prevTo, today);
    const good = isGoodHabit(q);
    return {
      question: q,
      good,
      counts,
      previous,
      occurrences: good ? counts.positivo : counts.negativo,
      previousOccurrences: good ? previous.positivo : previous.negativo,
      daysAnswered: counts.positivo + counts.negativo + counts.naoSeAplica + counts.naoLembro,
      series: buckets.map((b) => countAnswers([q], responses, b.from, b.to, today).pctPositivo)
    };
  });
}

export const answerSeries = (questions: QuestionItem[], responses: QuestionResponse[], buckets: Bucket[], today: string) =>
  buckets.map((b) => countAnswers(questions, responses, b.from, b.to, today));

// ------------------------------------------------------------------
// HUMOR E FATORES
// ------------------------------------------------------------------

export interface MoodReport {
  total: number;
  daysWithMood: number;
  byMood: { option: MoodOption; count: number; pct: number }[];
  average: number | null; // 1 (mais difícil) a 5 (muito bem), pelo nível do estado escolhido
  previousAverage: number | null;
  series: (number | null)[];
}

const moodLevel = (r: MoodRecord, options: MoodOption[]) => {
  const o = options.find((m) => m.id === r.mood) || options.find((m) => m.label === r.label);
  return o ? o.intensity : null;
};

const avgMood = (records: MoodRecord[], options: MoodOption[]): number | null => {
  const levels = records.map((r) => moodLevel(r, options)).filter((x): x is number => typeof x === 'number');
  return levels.length ? Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10 : null;
};

export function moodReport(records: MoodRecord[], options: MoodOption[], period: ReportPeriod, buckets: Bucket[]): MoodReport {
  const inRange = (r: MoodRecord, f: string, t: string) => r.date >= f && r.date <= t;
  const cur = records.filter((r) => inRange(r, period.from, period.to));
  const prev = records.filter((r) => inRange(r, period.prevFrom, period.prevTo));
  const byMood = options
    .map((o) => ({ option: o, count: cur.filter((r) => r.mood === o.id || (!options.some((x) => x.id === r.mood) && r.label === o.label)).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((x) => ({ ...x, pct: Math.round((x.count / cur.length) * 100) }));
  return {
    total: cur.length,
    daysWithMood: new Set(cur.map((r) => r.date)).size,
    byMood,
    average: avgMood(cur, options),
    previousAverage: avgMood(prev, options),
    series: buckets.map((b) => avgMood(records.filter((r) => inRange(r, b.from, b.to)), options))
  };
}

export interface FactorReport {
  factor: FactorOption;
  days: number;
  previousDays: number;
  pctDays: number | null; // % dos dias com algum fator marcado
}

/** Converte marcações antigas feitas pelo nome do fator para o id. */
const factorIdsOf = (list: string[], factors: FactorOption[]) =>
  Array.from(new Set(list.map((x) => factors.find((f) => f.id === x || f.label === x)?.id).filter((x): x is string => !!x)));

export function factorReport(dayFactors: Record<string, string[]>, factors: FactorOption[], period: ReportPeriod) {
  const count = (from: string, to: string) => {
    const per: Record<string, number> = {};
    let daysMarked = 0;
    Object.entries(dayFactors || {}).forEach(([date, list]) => {
      if (date < from || date > to) return;
      const ids = factorIdsOf(list || [], factors);
      if (ids.length) daysMarked++;
      ids.forEach((id) => (per[id] = (per[id] || 0) + 1));
    });
    return { per, daysMarked };
  };
  const cur = count(period.from, period.to);
  const prev = count(period.prevFrom, period.prevTo);
  const rows: FactorReport[] = factors
    .map((f) => ({ factor: f, days: cur.per[f.id] || 0, previousDays: prev.per[f.id] || 0, pctDays: pct(cur.per[f.id] || 0, cur.daysMarked) }))
    .filter((r) => r.days > 0 || r.previousDays > 0)
    .sort((a, b) => b.days - a.days || b.previousDays - a.previousDays);
  return { rows, daysMarked: cur.daysMarked, previousDaysMarked: prev.daysMarked };
}

// ------------------------------------------------------------------
// ROTINAS, MEDICAMENTOS E AGENDA (a partir do histórico diário)
// ------------------------------------------------------------------

export interface DoneCounts {
  previstas: number; // dias/vezes previstos dentro do período acompanhado
  feitas: number;
  adiadas: number;
  vistas: number; // aviso visto, sem confirmar
  naoFeitas: number; // marcadas como não feitas
  semRegistro: number; // previstas sem nenhuma marcação
  pct: number | null; // feitas / previstas
}

const emptyDone = (): DoneCounts => ({ previstas: 0, feitas: 0, adiadas: 0, vistas: 0, naoFeitas: 0, semRegistro: 0, pct: null });

/** Primeiro e último dia que podem ser contados (o histórico começou em `since`; dias futuros não contam). */
export const trackedRange = (from: string, to: string, since: string | undefined, today: string) => {
  const start = since && since > from ? since : from;
  const end = to < today ? to : today;
  return { start, end, valid: start <= end };
};

const scheduledOn = (daysOfWeek: number[] | undefined, date: string) =>
  !daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.includes(parseISODate(date).getDay());

function countDone(
  dates: string[],
  isScheduled: (d: string) => boolean,
  statusOn: (d: string) => ActivityStatus | undefined
): DoneCounts {
  const c = emptyDone();
  dates.forEach((d) => {
    if (!isScheduled(d)) return;
    c.previstas++;
    const st = statusOn(d);
    if (st === 'fez') c.feitas++;
    else if (st === 'adiado') c.adiadas++;
    else if (st === 'viu') c.vistas++;
    else if (st === 'nao_fez') c.naoFeitas++;
    else c.semRegistro++;
  });
  // Sem nenhuma marcação no período = sem dados (não é 0% de cumprimento)
  c.pct = c.previstas - c.semRegistro > 0 ? pct(c.feitas, c.previstas) : null;
  return c;
}

export interface ItemReport<T> {
  item: T;
  counts: DoneCounts;
  previous: DoneCounts;
  series: (number | null)[];
}

const mergeDone = (list: DoneCounts[]): DoneCounts => {
  const c = emptyDone();
  list.forEach((x) => {
    c.previstas += x.previstas;
    c.feitas += x.feitas;
    c.adiadas += x.adiadas;
    c.vistas += x.vistas;
    c.naoFeitas += x.naoFeitas;
    c.semRegistro += x.semRegistro;
  });
  // Sem nenhuma marcação no período = sem dados (não é 0% de cumprimento)
  c.pct = c.previstas - c.semRegistro > 0 ? pct(c.feitas, c.previstas) : null;
  return c;
};

function reportItems<T extends { id: string }>(
  items: T[],
  log: ActivityLog,
  period: ReportPeriod,
  buckets: Bucket[],
  today: string,
  isScheduled: (item: T, d: string) => boolean,
  statusOf: (item: T, d: string) => ActivityStatus | undefined
) {
  const range = (f: string, t: string) => {
    const r = trackedRange(f, t, log.since, today);
    return r.valid ? eachDay(r.start, r.end) : [];
  };
  const cur = range(period.from, period.to);
  const prev = range(period.prevFrom, period.prevTo);
  const bucketDays = buckets.map((b) => range(b.from, b.to));
  const rows: ItemReport<T>[] = items.map((item) => ({
    item,
    counts: countDone(cur, (d) => isScheduled(item, d), (d) => statusOf(item, d)),
    previous: countDone(prev, (d) => isScheduled(item, d), (d) => statusOf(item, d)),
    series: bucketDays.map((ds) => countDone(ds, (d) => isScheduled(item, d), (d) => statusOf(item, d)).pct)
  }));
  const total = mergeDone(rows.map((r) => r.counts));
  const previousTotal = mergeDone(rows.map((r) => r.previous));
  const series = bucketDays.map((ds) => mergeDone(items.map((item) => countDone(ds, (d) => isScheduled(item, d), (d) => statusOf(item, d)))).pct);
  return { rows, total, previousTotal, series, trackedDays: cur.length };
}

export function routineReport(
  tasks: RoutineTask[],
  steps: DailyChronologicalStep[],
  log: ActivityLog,
  period: ReportPeriod,
  buckets: Bucket[],
  today: string
) {
  const day = (d: string) => (log.days || {})[d] || {};
  const routines = reportItems(tasks, log, period, buckets, today, (t, d) => scheduledOn(t.daysOfWeek, d), (t, d) => day(d).r?.[t.id]);
  const chrono = reportItems(steps, log, period, buckets, today, () => true, (s, d) => day(d).s?.[s.id]);
  const byPeriod = (['manha', 'tarde', 'noite', 'especiais'] as const).map((p) => ({
    period: p,
    counts: mergeDone(routines.rows.filter((r) => r.item.period === p).map((r) => r.counts))
  }));
  return { routines, chrono, byPeriod, total: mergeDone([routines.total, chrono.total]), previousTotal: mergeDone([routines.previousTotal, chrono.previousTotal]) };
}

export function medicationReport(meds: HealthMedication[], log: ActivityLog, period: ReportPeriod, buckets: Bucket[], today: string) {
  const day = (d: string) => (log.days || {})[d] || {};
  const r = reportItems(meds, log, period, buckets, today, () => true, (m, d) => day(d).m?.[m.id]?.st);
  const byMember: Record<string, DoneCounts> = {};
  const members = Array.from(new Set(meds.map((m) => m.memberName || 'Sem nome')));
  members.forEach((name) => (byMember[name] = mergeDone(r.rows.filter((x) => (x.item.memberName || 'Sem nome') === name).map((x) => x.counts))));
  return { ...r, byMember };
}

export function agendaReport(items: AgendaItem[], log: ActivityLog, period: ReportPeriod, today: string) {
  const end = period.to < today ? period.to : today;
  const days = eachDay(period.from, end);
  let previstos = 0;
  let realizados = 0;
  const done = (item: AgendaItem, d: string) =>
    (log.days || {})[d]?.a?.[item.id] === 'fez' || (!item.isRecurring && item.date === d && !!item.completed);
  days.forEach((d) =>
    items.forEach((item) => {
      if (!agendaOccursOn(item, d)) return;
      previstos++;
      if (done(item, d)) realizados++;
    })
  );
  const upcoming = eachDay(period.to < today ? period.to : today, period.to).slice(1).reduce((n, d) => n + items.filter((i) => agendaOccursOn(i, d)).length, 0);
  return { previstos, realizados, semRegistro: previstos - realizados, pct: pct(realizados, previstos), futuros: upcoming };
}

export function recurringReport(tasks: RecurringTaskItem[], history: TaskExecutionRecord[], period: ReportPeriod, buckets: Bucket[]) {
  const dateOf = (h: TaskExecutionRecord) => (h.completedAt || '').slice(0, 10);
  const inRange = (h: TaskExecutionRecord, f: string, t: string) => {
    const d = dateOf(h);
    return d >= f && d <= t;
  };
  const rows = tasks
    .map((t) => ({
      task: t,
      count: history.filter((h) => h.taskId === t.id && inRange(h, period.from, period.to)).length,
      previous: history.filter((h) => h.taskId === t.id && inRange(h, period.prevFrom, period.prevTo)).length,
      last: history.filter((h) => h.taskId === t.id).map(dateOf).sort().pop() || null
    }))
    .sort((a, b) => b.count - a.count);
  return {
    rows,
    total: rows.reduce((n, r) => n + r.count, 0),
    previousTotal: rows.reduce((n, r) => n + r.previous, 0),
    series: buckets.map((b) => history.filter((h) => inRange(h, b.from, b.to)).length)
  };
}

export function goalReport(goals: GoalItem[]) {
  const done = goals.filter((g) => g.status === 'concluida' || g.progressPercent >= 100);
  const active = goals.filter((g) => !(g.status === 'concluida' || g.progressPercent >= 100));
  return {
    total: goals.length,
    concluidas: done.length,
    emAndamento: active.length,
    mediaProgresso: active.length ? Math.round(active.reduce((n, g) => n + (g.progressPercent || 0), 0) / active.length) : null,
    active,
    done
  };
}

// ------------------------------------------------------------------
// MEDIÇÕES DE SAÚDE (anotações com medidas: peso, pressão, glicose...)
// ------------------------------------------------------------------

/** Aceita "2026-11-03" ou "03/11/2026". */
export const noteDateISO = (date: string): string | null => {
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const m = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};

const num = (s: string) => Number(s.replace(',', '.'));

/** Séries por medida, só com valores numéricos registrados. "12/8" vira duas séries (1º e 2º valor). */
export function healthMetricSeries(notes: { date: string; metrics?: { label: string; value: string }[] }[]) {
  const series: Record<string, { iso: string; label: string; value: number }[]> = {};
  const units: Record<string, string> = {};
  notes.forEach((n) => {
    const iso = noteDateISO(n.date);
    if (!iso) return;
    (n.metrics || []).forEach((m) => {
      const label = (m.label || '').trim();
      if (!label) return;
      const pair = m.value.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
      const add = (key: string, v: number) => {
        if (!Number.isFinite(v)) return;
        (series[key] = series[key] || []).push({ iso, label: shortDate(iso), value: v });
      };
      if (pair) {
        add(`${label} (1º valor)`, num(pair[1]));
        add(`${label} (2º valor)`, num(pair[2]));
        return;
      }
      const single = m.value.match(/-?\d+(?:[.,]\d+)?/);
      if (!single) return;
      add(label, num(single[0]));
      const unit = m.value.replace(single[0], '').trim();
      if (unit && unit.length <= 6) units[label] = ` ${unit}`;
    });
  });
  return Object.entries(series).map(([label, pts]) => {
    const sorted = pts.sort((a, b) => a.iso.localeCompare(b.iso));
    const first = sorted[0]?.value ?? null;
    const last = sorted[sorted.length - 1]?.value ?? null;
    return { label, unit: units[label] || '', points: sorted, first, last, change: first !== null && last !== null && sorted.length > 1 ? last - first : null };
  });
}

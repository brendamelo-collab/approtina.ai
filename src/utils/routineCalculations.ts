import {
  RoutineTask,
  PeriodKey,
  HealthMedication,
  GoalItem,
  MoodEntry,
  QuestionResponse,
  QuestionItem,
  QuestionResponseValue,
  AgendaItem,
  LifeArea,
  MonthlyReviewData
} from '../types';

export interface PerformanceMetrics {
  totalQuestions: number;
  totalResponses: number;
  positivoCount: number;
  negativoCount: number;
  naoSeAplicaCount: number;
  naoLembroCount: number;
  neutralCount: number;
  evaluatedCount: number;
  positivePercentage: number;
  hasEvaluatedAnswers: boolean;
}

/**
 * REGRA MATEMÁTICA MANDATÓRIA:
 * As opções 'Não se aplica' e 'Não lembro / Não registrei' NUNCA podem ser contabilizadas
 * como respostas negativas nem contam no denominador para o cálculo do percentual de desempenho.
 * A ausência de registro não é um fracasso.
 */
export function calculatePerformanceMetrics(
  responses: QuestionResponse[],
  relevantQuestions?: QuestionItem[]
): PerformanceMetrics {
  const qMap = relevantQuestions ? new Set(relevantQuestions.map((q) => q.id)) : null;
  const filtered = qMap
    ? responses.filter((r) => qMap.has(r.questionId))
    : responses;

  let positivoCount = 0;
  let negativoCount = 0;
  let naoSeAplicaCount = 0;
  let naoLembroCount = 0;

  for (const r of filtered) {
    if (r.value === 'positivo') positivoCount++;
    else if (r.value === 'negativo') negativoCount++;
    else if (r.value === 'nao_se_aplica') naoSeAplicaCount++;
    else if (r.value === 'nao_lembro') naoLembroCount++;
  }

  const evaluatedCount = positivoCount + negativoCount;
  const hasEvaluatedAnswers = evaluatedCount > 0;
  // Sem respostas válidas não existe percentual: as telas mostram "Sem respostas"
  const positivePercentage = hasEvaluatedAnswers ? Math.round((positivoCount / evaluatedCount) * 100) : 0;

  return {
    totalQuestions: relevantQuestions ? relevantQuestions.length : filtered.length,
    totalResponses: filtered.length,
    positivoCount,
    negativoCount,
    naoSeAplicaCount,
    naoLembroCount,
    neutralCount: naoSeAplicaCount + naoLembroCount,
    evaluatedCount,
    positivePercentage,
    hasEvaluatedAnswers
  };
}

export function resolveResponseValue(
  choice: 'sim' | 'nao' | 'nao_se_aplica' | 'nao_lembro',
  positiveIf: 'sim' | 'nao' | 'positivo'
): QuestionResponseValue {
  if (choice === 'nao_se_aplica') return 'nao_se_aplica';
  if (choice === 'nao_lembro') return 'nao_lembro';

  if (choice === 'sim') {
    return positiveIf === 'nao' ? 'negativo' : 'positivo';
  } else {
    // choice === 'nao'
    return positiveIf === 'nao' ? 'positivo' : 'negativo';
  }
}

export function calculateAreaPerformance(
  areaId: string,
  responses: QuestionResponse[],
  questions: QuestionItem[]
): PerformanceMetrics {
  const areaQuestions = questions.filter((q) => q.areaId === areaId);
  return calculatePerformanceMetrics(responses, areaQuestions);
}

export interface QuestionStats {
  questionId: string;
  title: string;
  habitType: 'bom' | 'ruim';
  totalDays: number;
  totalOccurrences: number; // For good habits = positive count, for bad habits = negative occurrences
  positiveCount: number;
  negativeCount: number;
  naoSeAplicaCount: number;
  naoLembroCount: number;
  evaluatedCount: number;
  successRate: number; // percentage of positive among evaluated
  badgeText: string; // e.g. "26/30 Positivo" or "2x Ocorreu"
  summaryLabel: string;
}

export function calculateQuestionStats(
  question: QuestionItem,
  responses: QuestionResponse[],
  totalDays: number = 30
): QuestionStats {
  const qResponses = responses.filter((r) => r.questionId === question.id);
  const metrics = calculatePerformanceMetrics(qResponses, [question]);

  const isGood = (question.habitType || (question.positiveIf === 'sim' ? 'bom' : 'ruim')) === 'bom';

  // Somente respostas reais (sem números de exemplo)
  const positivoCount = metrics.positivoCount;
  const negativoCount = metrics.negativoCount;
  const naoSeAplicaCount = metrics.naoSeAplicaCount;
  const naoLembroCount = metrics.naoLembroCount;
  const evaluatedCount = positivoCount + negativoCount;
  const successRate = evaluatedCount > 0 ? Math.round((positivoCount / evaluatedCount) * 100) : 0;

  const totalOccurrences = isGood ? positivoCount : negativoCount;
  const badgeText = isGood
    ? `${positivoCount}/${totalDays} Positivo`
    : `${negativoCount}x Ocorreu`;

  const summaryLabel = isGood
    ? `Hábito mantido em ${positivoCount} de ${totalDays} dias (${successRate}% de sucesso)`
    : `Comportamento evitado em ${positivoCount} de ${totalDays} dias (${successRate}% de controle)`;

  return {
    questionId: question.id,
    title: question.title,
    habitType: isGood ? 'bom' : 'ruim',
    totalDays,
    totalOccurrences,
    positiveCount: positivoCount,
    negativeCount: negativoCount,
    naoSeAplicaCount,
    naoLembroCount,
    evaluatedCount,
    successRate,
    badgeText,
    summaryLabel
  };
}

export interface FactorFrequency {
  factor: string;
  count: number;
  percentage: number;
}

export function calculateFactorFrequencies(
  dayFactors: Record<string, string[]> | Record<string, string[]>,
  totalDaysSample: number = 25
): FactorFrequency[] {
  // Somente fatores marcados de verdade (sem números de exemplo)
  const counts: Record<string, number> = {};

  // Merge any actual day factors
  Object.values(dayFactors).forEach((factorsList) => {
    factorsList.forEach((f) => {
      counts[f] = (counts[f] || 0) + 1;
    });
  });

  const total = Object.values(dayFactors).filter((l) => l && l.length > 0).length || totalDaysSample || 1;

  return Object.entries(counts)
    .map(([factor, count]) => ({
      factor,
      count,
      percentage: Math.min(100, Math.round((count / total) * 100))
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export function calculateRoutineProgress(
  tasks: RoutineTask[],
  period?: PeriodKey
): { total: number; completed: number; percent: number } {
  const filtered = period ? tasks.filter((t) => t.period === period) : tasks;
  const total = filtered.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0 };
  const completed = filtered.filter((t) => t.completed).length;
  const percent = Math.round((completed / total) * 100);
  return { total, completed, percent };
}

export function calculateHealthCompliance(
  items: HealthMedication[]
): { total: number; confirmed: number; percent: number } {
  const total = items.length;
  if (total === 0) return { total: 0, confirmed: 0, percent: 0 };
  const confirmed = items.filter((item) => item.confirmed).length;
  const percent = Math.round((confirmed / total) * 100);
  return { total, confirmed, percent };
}

export function calculateGoalSummary(
  goals: GoalItem[]
): { total: number; completed: number; active: number; averageProgress: number } {
  const total = goals.length;
  if (total === 0) return { total: 0, completed: 0, active: 0, averageProgress: 0 };
  const completed = goals.filter((g) => g.status === 'concluida' || g.progressPercent >= 100).length;
  const active = total - completed;
  const sumProgress = goals.reduce((acc, g) => acc + g.progressPercent, 0);
  const averageProgress = Math.round(sumProgress / total);
  return { total, completed, active, averageProgress };
}

export function calculateMoodMetrics(
  entries: MoodEntry[]
): { positivePercent: number; count: number } {
  if (!entries || entries.length === 0) {
    return { positivePercent: 0, count: 0 }; // sem registros
  }
  const sum = entries.reduce((acc, e) => acc + e.positiveScore, 0);
  const positivePercent = Math.round(sum / entries.length);
  return { positivePercent, count: entries.length };
}

export function generateMonthlyReview(params: {
  periodLabel: string;
  responses: QuestionResponse[];
  questions: QuestionItem[];
  lifeAreas: LifeArea[];
  routineTasks: RoutineTask[];
  agendaItems: AgendaItem[];
  healthItems: HealthMedication[];
  goals: GoalItem[];
}): MonthlyReviewData {
  // Retrato só com dados reais; o que não tem registro fica em zero (as telas indicam "sem dados")
  const { periodLabel, responses, questions, lifeAreas, routineTasks, agendaItems, healthItems, goals } = params;
  const mapMetrics = calculatePerformanceMetrics(responses, questions);
  let topAreaName = '';
  let topAreaScore = 0;
  lifeAreas.forEach((area) => {
    const areaPerf = calculateAreaPerformance(area.id, responses, questions);
    if (areaPerf.hasEvaluatedAnswers && areaPerf.positivePercentage > topAreaScore) {
      topAreaName = area.name;
      topAreaScore = areaPerf.positivePercentage;
    }
  });
  const routineSummary = calculateRoutineProgress(routineTasks);
  const healthSummary = calculateHealthCompliance(healthItems);
  const goalsSummary = calculateGoalSummary(goals);
  const completedEvents = agendaItems.filter((e) => e.completed).length;
  return {
    period: periodLabel,
    positiveRate: mapMetrics.positivePercentage,
    mapSummary: {
      evaluatedCount: mapMetrics.evaluatedCount,
      positiveCount: mapMetrics.positivoCount,
      negativeCount: mapMetrics.negativoCount,
      topArea: topAreaName,
      topAreaScore
    },
    routineRegularity: {
      totalTasks: routineSummary.total,
      completedTasks: routineSummary.completed,
      completionRate: routineSummary.percent,
      bestPeriod: ''
    },
    agendaSummary: {
      totalEvents: agendaItems.length,
      completedEvents,
      complianceRate: agendaItems.length ? Math.round((completedEvents / agendaItems.length) * 100) : 0
    },
    healthCompliance: {
      totalDoses: healthSummary.total,
      confirmedDoses: healthSummary.confirmed,
      complianceRate: healthSummary.percent
    },
    goalsSummary: {
      totalGoals: goals.length,
      completedGoals: goalsSummary.completed,
      activeGoals: goalsSummary.active,
      completedNames: goals.filter((g) => g.status === 'concluida' || g.progressPercent >= 100).map((g) => g.title)
    },
    pendingTasks: [],
    patternsDetected: [],
    warmAnalysisText: '',
    suggestionsNextMonth: []
  };
}

export function formatBrazilianDate(isoDateString: string): string {
  try {
    const parts = isoDateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);

      const weekdays = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'
      ];
      const months = [
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

      return `${weekdays[date.getDay()]}, ${day} de ${months[month]}`;
    }
  } catch {
    // fallback
  }
  return isoDateString;
}

const isoToDayNumber = (iso: string) => {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10));
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
};

/** True when an agenda item (single or recurring) happens on the given YYYY-MM-DD date */
export function agendaOccursOn(item: AgendaItem, dateStr: string): boolean {
  if (!item.date || !dateStr) return false;
  if (item.date === dateStr) return true;
  if (!item.isRecurring) return false;
  if (dateStr < item.date) return false;
  if (item.recurrenceEndDate && dateStr > item.recurrenceEndDate) return false;
  const diff = isoToDayNumber(dateStr) - isoToDayNumber(item.date);
  switch (item.recurrenceType) {
    case 'diario':
      return true;
    case 'quinzenal':
      return diff % 14 === 0;
    case 'mensal':
      return item.date.slice(8) === dateStr.slice(8);
    case 'personalizado': {
      const interval = item.recurrenceIntervalDays || 7;
      return interval > 0 && diff % interval === 0;
    }
    case 'semanal':
    default:
      return diff % 7 === 0;
  }
}

export function filterAgendaByDate(items: AgendaItem[], dateStr: string): AgendaItem[] {
  if (!dateStr) return items;
  return items.filter((item) => agendaOccursOn(item, dateStr));
}

export function calculateDayRoutineProgress(
  tasks: RoutineTask[],
  dayIndex: number // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
): { total: number; completed: number; percent: number } {
  const dayTasks = tasks.filter((t) => {
    if (!t.daysOfWeek || t.daysOfWeek.length === 0) return true; // applies to all days
    return t.daysOfWeek.includes(dayIndex);
  });
  return calculateRoutineProgress(dayTasks);
}



import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoutineProgress,
  calculateHealthCompliance,
  calculateGoalSummary,
  calculateMoodMetrics,
  formatBrazilianDate,
  calculatePerformanceMetrics,
  calculateAreaPerformance,
  resolveResponseValue,
  calculateQuestionStats,
  calculateFactorFrequencies,
  generateMonthlyReview,
  filterAgendaByDate,
  calculateDayRoutineProgress
} from './routineCalculations';
import {
  RoutineTask,
  HealthMedication,
  GoalItem,
  MoodEntry,
  QuestionResponse,
  QuestionItem,
  AgendaItem
} from '../types';

test('calculateRoutineProgress calculates percentage and totals correctly', () => {
  const tasks: RoutineTask[] = [
    { id: '1', title: 'Skincare', period: 'manha', completed: true },
    { id: '2', title: 'Arrumar cama', period: 'manha', completed: false },
    { id: '3', title: 'Café da manhã', period: 'manha', completed: true },
    { id: '4', title: 'Almoço', period: 'tarde', completed: true },
  ];

  const overall = calculateRoutineProgress(tasks);
  assert.equal(overall.total, 4);
  assert.equal(overall.completed, 3);
  assert.equal(overall.percent, 75);

  const manhaOnly = calculateRoutineProgress(tasks, 'manha');
  assert.equal(manhaOnly.total, 3);
  assert.equal(manhaOnly.completed, 2);
  assert.equal(manhaOnly.percent, 67);
});

test('calculateHealthCompliance handles empty and completed doses', () => {
  assert.equal(calculateHealthCompliance([]).percent, 0);

  const meds: HealthMedication[] = [
    {
      id: 'm1',
      name: 'Ômega 3',
      dosage: '1 cápsula',
      frequency: 'Diário',
      memberId: '1',
      memberName: 'Brenda',
      time: '09:00',
      confirmed: true,
      category: 'suplemento'
    },
    {
      id: 'm2',
      name: 'Ferro',
      dosage: '1 comprimido',
      frequency: '2x por semana',
      memberId: '1',
      memberName: 'Brenda',
      time: '12:00',
      confirmed: true,
      category: 'medicamento'
    }
  ];

  const res = calculateHealthCompliance(meds);
  assert.equal(res.total, 2);
  assert.equal(res.confirmed, 2);
  assert.equal(res.percent, 100);
});

test('calculateGoalSummary computes averages and active goals', () => {
  const goals: GoalItem[] = [
    {
      id: 'g1',
      title: 'Pintar o quarto',
      category: 'Casa',
      categoryId: 'casa',
      deadlineType: 'contagem_dias',
      progressPercent: 40,
      totalSteps: 3,
      completedSteps: 1,
      steps: [],
      status: 'em_andamento'
    },
    {
      id: 'g2',
      title: 'Comprar roupas das crianças',
      category: 'Família',
      categoryId: 'familia',
      deadlineType: 'contagem_dias',
      progressPercent: 100,
      totalSteps: 1,
      completedSteps: 1,
      steps: [],
      status: 'concluida'
    }
  ];

  const summary = calculateGoalSummary(goals);
  assert.equal(summary.total, 2);
  assert.equal(summary.completed, 1);
  assert.equal(summary.active, 1);
  assert.equal(summary.averageProgress, 70);
});

test('calculateMoodMetrics handles entries and empty fallback', () => {
  assert.equal(calculateMoodMetrics([]).positivePercent, 0);

  const entries: MoodEntry[] = [
    {
      id: '1',
      date: '2026-11-16',
      value: 'bem',
      label: 'Bem',
      factors: ['Família'],
      positiveScore: 80,
      timestamp: '10:00'
    },
    {
      id: '2',
      date: '2026-11-15',
      value: 'otimo',
      label: 'Ótimo',
      factors: ['Sono bom'],
      positiveScore: 90,
      timestamp: '10:00'
    }
  ];

  const res = calculateMoodMetrics(entries);
  assert.equal(res.positivePercent, 85);
  assert.equal(res.count, 2);
});

test('formatBrazilianDate formats date string properly', () => {
  const formatted = formatBrazilianDate('2026-11-16');
  // Day 16 of Nov 2026 is formatted as Saturday
  assert.ok(formatted.includes('16 de Novembro'));
});

test('Meu Mapa MANDATORY RULE: nao_se_aplica and nao_lembro NEVER count as negative or in denominator', () => {
  const responses: QuestionResponse[] = [
    { id: '1', questionId: 'q1', date: '2026-11-16', value: 'positivo', updatedAt: '' },
    { id: '2', questionId: 'q2', date: '2026-11-16', value: 'positivo', updatedAt: '' },
    { id: '3', questionId: 'q3', date: '2026-11-16', value: 'positivo', updatedAt: '' },
    { id: '4', questionId: 'q4', date: '2026-11-16', value: 'negativo', updatedAt: '' },
    // 3 "Não se aplica" and 2 "Não lembro"
    { id: '5', questionId: 'q5', date: '2026-11-16', value: 'nao_se_aplica', updatedAt: '' },
    { id: '6', questionId: 'q6', date: '2026-11-16', value: 'nao_se_aplica', updatedAt: '' },
    { id: '7', questionId: 'q7', date: '2026-11-16', value: 'nao_se_aplica', updatedAt: '' },
    { id: '8', questionId: 'q8', date: '2026-11-16', value: 'nao_lembro', updatedAt: '' },
    { id: '9', questionId: 'q9', date: '2026-11-16', value: 'nao_lembro', updatedAt: '' }
  ];

  const metrics = calculatePerformanceMetrics(responses);

  // Total evaluated is strictly 3 positive + 1 negative = 4
  assert.equal(metrics.positivoCount, 3);
  assert.equal(metrics.negativoCount, 1);
  assert.equal(metrics.evaluatedCount, 4);
  assert.equal(metrics.naoSeAplicaCount, 3);
  assert.equal(metrics.naoLembroCount, 2);

  // Exact 3/4 = 75%
  assert.equal(metrics.positivePercentage, 75);
  assert.equal(metrics.hasEvaluatedAnswers, true);
});

test('Meu Mapa: handles when all questions are nao_se_aplica or unrecorded without failing', () => {
  const responses: QuestionResponse[] = [
    { id: '1', questionId: 'q1', date: '2026-11-16', value: 'nao_se_aplica', updatedAt: '' },
    { id: '2', questionId: 'q2', date: '2026-11-16', value: 'nao_lembro', updatedAt: '' }
  ];

  const metrics = calculatePerformanceMetrics(responses);
  assert.equal(metrics.evaluatedCount, 0);
  assert.equal(metrics.hasEvaluatedAnswers, false);
  // Absense of evaluated answers is not a penalty
  assert.equal(metrics.positivePercentage, 0); // sem respostas válidas = sem percentual;
});

test('calculateAreaPerformance filters questions by area correctly', () => {
  const questions: QuestionItem[] = [
    {
      id: 'q1',
      groupId: 'g1',
      areaId: 'area-mat',
      title: 'Paciência',
      habitType: 'bom',
      positiveIf: 'sim',
      positiveLabel: 'Sim',
      negativeLabel: 'Não',
      frequency: 'todos_os_dias'
    },
    {
      id: 'q2',
      groupId: 'g2',
      areaId: 'area-casa',
      title: 'Casa em ordem',
      habitType: 'bom',
      positiveIf: 'sim',
      positiveLabel: 'Sim',
      negativeLabel: 'Não',
      frequency: 'todos_os_dias'
    }
  ];

  const responses: QuestionResponse[] = [
    { id: 'r1', questionId: 'q1', date: '2026-11-16', value: 'positivo', updatedAt: '' },
    { id: 'r2', questionId: 'q2', date: '2026-11-16', value: 'negativo', updatedAt: '' }
  ];

  const matMetrics = calculateAreaPerformance('area-mat', responses, questions);
  assert.equal(matMetrics.positivoCount, 1);
  assert.equal(matMetrics.negativoCount, 0);
  assert.equal(matMetrics.positivePercentage, 100);

  const casaMetrics = calculateAreaPerformance('area-casa', responses, questions);
  assert.equal(casaMetrics.positivoCount, 0);
  assert.equal(casaMetrics.negativoCount, 1);
  assert.equal(casaMetrics.positivePercentage, 0);
});

test('resolveResponseValue handles good habit vs habit to avoid correctly', () => {
  // Good habit: "Fui paciente?" (positiveIf = 'sim')
  assert.equal(resolveResponseValue('sim', 'sim'), 'positivo');
  assert.equal(resolveResponseValue('nao', 'sim'), 'negativo');
  assert.equal(resolveResponseValue('nao_se_aplica', 'sim'), 'nao_se_aplica');
  assert.equal(resolveResponseValue('nao_lembro', 'sim'), 'nao_lembro');

  // Habit to avoid: "Gritei com as crianças?" (positiveIf = 'nao')
  assert.equal(resolveResponseValue('sim', 'nao'), 'negativo'); // Sim = Negativo (Ruim)
  assert.equal(resolveResponseValue('nao', 'nao'), 'positivo'); // Não = Positivo (Bom)
  assert.equal(resolveResponseValue('nao_se_aplica', 'nao'), 'nao_se_aplica');
  assert.equal(resolveResponseValue('nao_lembro', 'nao'), 'nao_lembro');
});

test('calculateQuestionStats computes badges and success rate without neutral penalty', () => {
  const q: QuestionItem = {
    id: 'q-test',
    groupId: 'g1',
    areaId: 'a1',
    title: 'Gritei com as crianças?',
    habitType: 'ruim',
    positiveIf: 'nao',
    positiveLabel: 'Não (Bom)',
    negativeLabel: 'Sim (Ruim)',
    frequency: 'todos_os_dias'
  };

  const responses: QuestionResponse[] = [
    { id: '1', questionId: 'q-test', date: '2026-11-01', value: 'negativo', updatedAt: '' }, // screamed
    { id: '2', questionId: 'q-test', date: '2026-11-02', value: 'negativo', updatedAt: '' }, // screamed
    { id: '3', questionId: 'q-test', date: '2026-11-03', value: 'positivo', updatedAt: '' }, // didn't scream
    { id: '4', questionId: 'q-test', date: '2026-11-04', value: 'nao_se_aplica', updatedAt: '' },
    { id: '5', questionId: 'q-test', date: '2026-11-05', value: 'nao_lembro', updatedAt: '' }
  ];

  const stats = calculateQuestionStats(q, responses, 30);
  assert.equal(stats.positiveCount, 1);
  assert.equal(stats.negativeCount, 2);
  assert.equal(stats.evaluatedCount, 3);
  assert.equal(stats.badgeText, '2x Ocorreu');
  assert.equal(stats.successRate, 33);
});

test('calculateFactorFrequencies sorts factors by frequency', () => {
  const factors = calculateFactorFrequencies({
    '2026-11-01': ['Cansaço físico', 'Sobrecarga'],
    '2026-11-02': ['Cansaço físico']
  });
  assert.ok(factors.length > 0);
  assert.ok(factors[0].percentage >= factors[factors.length - 1].percentage);
});

test('generateMonthlyReview generates all 7 pillars with empathetic reflection', () => {
  const review = generateMonthlyReview({
    periodLabel: 'Novembro de 2026',
    responses: [
      { id: '1', questionId: 'q1', date: '2026-11-16', value: 'positivo', updatedAt: '' },
      { id: '2', questionId: 'q2', date: '2026-11-16', value: 'nao_se_aplica', updatedAt: '' }
    ],
    questions: [
      {
        id: 'q1',
        groupId: 'g1',
        areaId: 'area-mat',
        title: 'Tempo de qualidade',
        habitType: 'bom',
        positiveIf: 'sim',
        positiveLabel: 'Sim',
        negativeLabel: 'Não',
        frequency: 'todos_os_dias'
      }
    ],
    lifeAreas: [{ id: 'area-mat', name: 'Maternidade', order: 1 }],
    routineTasks: [{ id: 'r1', title: 'Banho', period: 'noite', completed: true }],
    agendaItems: [{ id: 'a1', title: 'Futebol', date: '2026-11-17', time: '17:00', displayDay: 'Terça', isRecurring: true, completed: true, category: 'esporte', icon: '⚽' }],
    healthItems: [{ id: 'h1', name: 'Ômega 3', dosage: '1', frequency: 'diário', memberId: '1', memberName: 'Brenda', time: '09:00', confirmed: true, category: 'suplemento' }],
    goals: [
      {
        id: 'g1',
        title: 'Pintar o quarto',
        category: 'Casa',
        categoryId: 'casa',
        deadlineType: 'contagem_dias',
        progressPercent: 100,
        totalSteps: 2,
        completedSteps: 2,
        status: 'concluida',
        steps: []
      }
    ]
  });

  assert.equal(review.period, 'Novembro de 2026');
  assert.equal(review.positiveRate, 100);
  assert.equal(review.goalsSummary.completedGoals, 1);
  assert.equal(review.mapSummary.topArea, 'Maternidade');
  // nada inventado: sem padrões ou textos fictícios
  assert.equal(review.patternsDetected.length, 0);
});

test('filterAgendaByDate filters events matching date string', () => {
  const events: AgendaItem[] = [
    { id: '1', title: 'Futebol', date: '2026-11-17', time: '17:00', displayDay: 'Terça', isRecurring: true, completed: false, category: 'esporte', icon: '⚽' },
    { id: '2', title: 'Aniversário', date: '2026-11-20', time: '19:00', displayDay: 'Sexta', isRecurring: false, completed: false, category: 'familia', icon: '🎂' }
  ];
  assert.equal(filterAgendaByDate(events, '2026-11-17').length, 1);
  assert.equal(filterAgendaByDate(events, '2026-11-17')[0].title, 'Futebol');
  assert.equal(filterAgendaByDate(events, '2026-11-20').length, 1);
  assert.equal(filterAgendaByDate(events, '2026-11-25').length, 0);
});

test('calculateDayRoutineProgress filters tasks active for specific day', () => {
  const tasks: RoutineTask[] = [
    { id: '1', title: 'Todos os dias', period: 'manha', completed: true },
    { id: '2', title: 'Seg, Qua e Sex', period: 'especiais', completed: false, daysOfWeek: [1, 3, 5] },
    { id: '3', title: 'Domingo', period: 'especiais', completed: true, daysOfWeek: [0] }
  ];

  // Monday (1)
  const monday = calculateDayRoutineProgress(tasks, 1);
  assert.equal(monday.total, 2); // tasks 1 and 2
  assert.equal(monday.completed, 1);
  assert.equal(monday.percent, 50);

  // Sunday (0)
  const sunday = calculateDayRoutineProgress(tasks, 0);
  assert.equal(sunday.total, 2); // tasks 1 and 3
  assert.equal(sunday.completed, 2);
  assert.equal(sunday.percent, 100);
});




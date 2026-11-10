import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPeriod, bucketsFor, countAnswers, routineReport, medicationReport, healthMetricSeries } from './reportStats';
import { ActivityLog, QuestionItem, QuestionResponse, RoutineTask, HealthMedication } from '../types';

const q = (id: string, habitType: 'bom' | 'ruim'): QuestionItem =>
  ({ id, groupId: 'g', areaId: 'a', title: id, habitType, positiveIf: habitType === 'bom' ? 'sim' : 'nao', positiveLabel: 'S', negativeLabel: 'N', frequency: 'todos_os_dias' }) as QuestionItem;
const r = (questionId: string, date: string, value: QuestionResponse['value']): QuestionResponse => ({ id: `${questionId}${date}`, questionId, date, value, updatedAt: '' });

test('Meu Mapa: 7 positivas de 10 válidas = 70%; neutras e sem resposta fora do denominador', () => {
  const days = Array.from({ length: 10 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
  const resp = days.map((d, i) => r('q1', d, i < 7 ? 'positivo' : 'negativo'));
  resp.push(r('q1', '2026-10-11', 'nao_se_aplica'), r('q1', '2026-10-12', 'nao_lembro'));
  // 13 a 15: sem resposta
  const c = countAnswers([q('q1', 'bom')], resp, '2026-10-01', '2026-10-15', '2026-11-09');
  assert.equal(c.validas, 10);
  assert.equal(c.pctPositivo, 70);
  assert.equal(c.negativo, 3);
  assert.equal(c.semResposta, 3);
});

test('Sem respostas = null (sem dados), nunca 0% nem 100%', () => {
  const c = countAnswers([q('q1', 'bom')], [], '2026-10-01', '2026-10-05', '2026-11-09');
  assert.equal(c.pctPositivo, null);
});

test('Rotinas: sem marcação não é feito nem não feito; adiado continua adiado; dias antes do histórico não contam', () => {
  const tasks = [{ id: 't1', title: 'Banho', period: 'noite', completed: false }] as RoutineTask[];
  const log: ActivityLog = {
    since: '2026-10-03',
    days: {
      '2026-10-01': { r: { t1: 'fez' } }, // antes do início do histórico: ignorado
      '2026-10-03': { r: { t1: 'fez' } },
      '2026-10-04': { r: { t1: 'adiado' } },
      '2026-10-05': { r: { t1: 'nao_fez' } }
      // 06 e 07: sem registro
    }
  } as ActivityLog;
  const p = buildPeriod('personalizado', '2026-10-01', { from: '2026-10-01', to: '2026-10-07' });
  const rep = routineReport(tasks, [], log, p, bucketsFor(p.from, p.to, p.granularity), '2026-11-09');
  const c = rep.routines.total;
  assert.equal(c.previstas, 5);
  assert.equal(c.feitas, 1);
  assert.equal(c.adiadas, 1);
  assert.equal(c.naoFeitas, 1);
  assert.equal(c.semRegistro, 2);
  assert.equal(c.pct, 20);
});

test('Remédios não se misturam com rotinas', () => {
  const meds = [{ id: 'm1', name: 'X', dosage: '', frequency: '', memberId: '1', memberName: 'A', time: '09:00', confirmed: false, category: 'medicamento' }] as HealthMedication[];
  const log = { since: '2026-10-01', days: { '2026-10-01': { r: { m1: 'fez' }, m: { m1: { st: 'adiado' } } } } } as unknown as ActivityLog;
  const p = buildPeriod('dia', '2026-10-01');
  const rep = medicationReport(meds, log, p, bucketsFor(p.from, p.to, p.granularity), '2026-11-09');
  assert.equal(rep.total.feitas, 0);
  assert.equal(rep.total.adiadas, 1);
});

test('Medições: só valores registrados, pressão vira duas séries', () => {
  const s = healthMetricSeries([
    { date: '03/10/2026', metrics: [{ label: 'Peso', value: '62,5 kg' }, { label: 'Pressão', value: '12/8' }] },
    { date: '2026-10-10', metrics: [{ label: 'Peso', value: '61 kg' }] }
  ]);
  const peso = s.find((x) => x.label === 'Peso')!;
  assert.equal(peso.points.length, 2);
  assert.equal(peso.change, -1.5);
  assert.equal(s.filter((x) => x.label.startsWith('Pressão')).length, 2);
});

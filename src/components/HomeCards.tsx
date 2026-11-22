import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarCheck, ChevronRight, ClipboardList, HeartPulse, Square, Target } from 'lucide-react';
import { calculateGoalSummary, calculateHealthCompliance, calculatePerformanceMetrics } from '../utils/routineCalculations';
import { todayISO } from '../utils/dateUtils';
import { SectionTitle, SoftCard, SHADOW_SOFT } from './ui/Kit';

/** "Tarefas pendentes": tarefas recorrentes de hoje (e próximas), com marcar como feita. */
export const PendingTasksCard: React.FC = () => {
  const { recurringTasks, completeRecurringTask, setActiveTab } = useApp();
  const today = todayISO();
  const weekday = new Date().getDay();
  const dueToday = (t: (typeof recurringTasks)[number]) => t.status === 'hoje' || (t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === today);
  const pending = recurringTasks
    .filter((t) => t.status !== 'concluido')
    .sort((a, b) => Number(dueToday(b)) - Number(dueToday(a)))
    .slice(0, 3);
  if (!recurringTasks.length) return null;

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-4 select-none">
      <SoftCard className="p-4">
        <div className="px-1">
          <SectionTitle
            icon={<CalendarCheck className="w-6 h-6" strokeWidth={1.9} />}
            title="Tarefas pendentes"
            action={pending.length ? { label: 'Ver todas', onClick: () => setActiveTab('recorrentes') } : undefined}
          />
        </div>
        {pending.length === 0 ? (
          <p className="px-1 pt-3 text-sm text-[#2C5230] font-semibold">Tudo em dia por aqui ✨</p>
        ) : (
          <div className="mt-2 space-y-1">
            {pending.map((t) => (
              <div key={t.id} className="flex items-center gap-3.5 px-1 py-2">
                <button
                  type="button"
                  onClick={() => completeRecurringTask(t.id)}
                  className={`w-12 h-12 shrink-0 rounded-full bg-white flex items-center justify-center text-[#9E6C52] ${SHADOW_SOFT}`}
                  aria-label={`Marcar ${t.title} como feita`}
                >
                  <Square className="w-6 h-6" strokeWidth={1.8} />
                </button>
                <button type="button" onClick={() => setActiveTab('recorrentes')} className="min-w-0 flex-1 text-left">
                  <span className="block text-[15px] font-medium text-[#2C2C2C] leading-snug break-words">{t.title}</span>
                  {!dueToday(t) && t.nextDate && <span className="block text-xs text-[#8C7A6B]">Próxima: {t.nextDate}</span>}
                </button>
                <span className={`shrink-0 text-sm font-semibold ${dueToday(t) ? 'text-[#3B663F]' : 'text-[#B78A58]'}`}>{dueToday(t) ? 'Hoje' : 'Pendente'}</span>
              </div>
            ))}
          </div>
        )}
      </SoftCard>
    </section>
  );
};

/** "Seu humor hoje": humor registrado + Registrar; e o resumo do Meu Mapa do dia. */
export const MoodTodayCard: React.FC = () => {
  const { currentMood, moodOptions, questionResponses, questions, selectedDate, setIsMoodModalOpen, setActiveTab } = useApp();
  const option = currentMood ? moodOptions.find((o) => o.id === currentMood.mood || o.label === currentMood.label) : undefined;
  const emoji = option?.emoji || (currentMood ? '🙂' : '🙂');
  const metrics = calculatePerformanceMetrics(
    questionResponses.filter((r) => r.date === selectedDate),
    questions
  );

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-4 select-none">
      <SoftCard className="p-4 bg-[#F4EDE2]">
        <h2 className="px-1 text-[17px] font-bold text-[#2C2C2C]">Seu humor hoje</h2>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMoodModalOpen(true)}
            className={`min-w-0 inline-flex items-center gap-2.5 pl-2 pr-5 py-2 rounded-full bg-[#FAF8F5] ${SHADOW_SOFT}`}
          >
            <span className="text-[34px] leading-none">{emoji}</span>
            <span className="text-lg font-semibold text-[#2C2C2C] truncate">{currentMood ? currentMood.label : 'Como você está?'}</span>
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setIsMoodModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-0.5 px-3.5 py-2 rounded-full bg-[#FAF8F5] text-sm font-semibold text-[#9E6C52]"
          >
            Registrar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button type="button" onClick={() => setActiveTab('mapa')} className="mt-3 w-full flex items-center justify-between gap-2 px-1 text-left">
          <span className="text-[13px] text-[#6E5D4F]">
            Meu Mapa:{' '}
            {metrics.hasEvaluatedAnswers ? (
              <strong className="text-[#2C5230]">{metrics.positivePercentage}% positivo hoje</strong>
            ) : (
              'responda as perguntas do dia'
            )}
          </span>
          <ChevronRight className="w-4 h-4 text-[#B78A58] shrink-0" />
        </button>
      </SoftCard>
    </section>
  );
};

/** Atalhos: Cuidados e Saúde, Metas e Rotinas por período (o que já existia no Início). */
export const HomeShortcuts: React.FC = () => {
  const { healthItems, goals, setActiveTab, setActivePeriodModal } = useApp();
  const health = calculateHealthCompliance(healthItems);
  const goal = calculateGoalSummary(goals);
  const tile = (icon: React.ReactNode, title: string, sub: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className={`min-w-0 text-left bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[22px] p-3.5 ${SHADOW_SOFT}`}>
      <span className="text-[#9E6C52]">{icon}</span>
      <span className="block mt-2 text-sm font-bold text-[#2C2C2C] leading-tight">{title}</span>
      <span className="block mt-0.5 text-xs text-[#8C7A6B] leading-snug">{sub}</span>
    </button>
  );
  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-4 select-none space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {tile(
          <HeartPulse className="w-6 h-6" strokeWidth={1.9} />,
          'Cuidados e Saúde',
          health.total ? (health.confirmed === health.total ? 'Tudo tomado hoje' : `${health.confirmed} de ${health.total} hoje`) : 'Nenhum cadastrado',
          () => setActiveTab('cuidados')
        )}
        {tile(
          <Target className="w-6 h-6" strokeWidth={1.9} />,
          'Minhas Metas',
          goal.total ? `${goal.completed} de ${goal.total} concluídas` : 'Nenhuma meta ainda',
          () => setActiveTab('metas')
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {(
          [
            ['manha', '☀️ Manhã'],
            ['tarde', '🏠 Tarde'],
            ['noite', '🌙 Noite'],
            ['especiais', '✨ Cuidados especiais']
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setActivePeriodModal(k)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#FAF8F5] text-sm font-semibold text-[#4A3E34] whitespace-nowrap ${SHADOW_SOFT}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab('rotinas')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#FAF8F5] text-sm font-semibold text-[#9E6C52] whitespace-nowrap ${SHADOW_SOFT}`}
        >
          <ClipboardList className="w-4 h-4" /> Minhas rotinas
        </button>
      </div>
    </section>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarCheck, ChevronRight, Plus } from 'lucide-react';
import { agendaOccursOn, formatBrazilianDate } from '../utils/routineCalculations';
import { todayISO, shiftISODate, parseISODate, nowHHMM, WEEKDAY_NAMES } from '../utils/dateUtils';

type ScheduleEntry = {
  key: string;
  time: string;
  title: string;
  icon: string;
  kind: 'Agenda' | 'Rotina' | 'Recorrente';
  done: boolean;
};

const MAX_ITEMS = 5;

export const AgendaCard: React.FC = () => {
  const {
    agendaItems,
    routineTasks,
    dailyChronologicalSteps,
    recurringTasks,
    selectedDate,
    setIsAgendaModalOpen,
    setActiveTab
  } = useApp();

  const dateStr = selectedDate || todayISO();
  const isToday = dateStr === todayISO();
  const weekday = parseISODate(dateStr).getDay();
  const appliesToday = (days?: number[]) => !days || days.length === 0 || days.includes(weekday);

  // Everything the user registered for the selected day, in time order
  const entries: ScheduleEntry[] = [
    ...agendaItems
      .filter((a) => agendaOccursOn(a, dateStr))
      .map((a) => ({
        key: `ag-${a.id}`,
        time: a.time || '',
        title: a.title,
        icon: a.icon || '📅',
        kind: 'Agenda' as const,
        done: !!a.completed
      })),
    ...dailyChronologicalSteps.map((s) => ({
      key: `st-${s.id}`,
      time: s.time || '',
      title: s.title,
      icon: s.icon || '⏰',
      kind: 'Rotina' as const,
      done: !!s.completed
    })),
    ...routineTasks
      .filter((t) => t.time && appliesToday(t.daysOfWeek))
      .map((t) => ({
        key: `rt-${t.id}`,
        time: t.time || '',
        title: t.title,
        icon: '✅',
        kind: 'Rotina' as const,
        done: !!t.completed
      })),
    ...recurringTasks
      .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === dateStr))
      .map((t) => ({
        key: `rc-${t.id}`,
        time: t.time || '',
        title: t.title,
        icon: t.icon || '🔁',
        kind: 'Recorrente' as const,
        done: t.status === 'concluido'
      }))
  ].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  // Today: start from what is still ahead (keeps 1 item that just passed for context)
  const now = nowHHMM();
  let visible = entries;
  if (isToday) {
    const firstUpcoming = entries.findIndex((e) => !e.done && (e.time || '99:99') >= now);
    if (firstUpcoming > 0) visible = entries.slice(firstUpcoming - 1);
    else if (firstUpcoming === -1 && entries.length > MAX_ITEMS) visible = entries.slice(-MAX_ITEMS);
  }
  visible = visible.slice(0, MAX_ITEMS);
  const hiddenCount = entries.length - visible.length;

  // Next agenda commitment after the selected day (next 60 days)
  let nextUpcoming: { title: string; icon: string; dateLabel: string; time: string; recurring: boolean } | null = null;
  for (let i = 1; i <= 60 && !nextUpcoming; i++) {
    const d = shiftISODate(dateStr, i);
    const item = agendaItems
      .filter((a) => agendaOccursOn(a, d))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
    if (item) {
      nextUpcoming = {
        title: item.title,
        icon: item.icon || '📅',
        dateLabel: i === 1 && isToday ? 'Amanhã' : formatBrazilianDate(d),
        time: item.time,
        recurring: item.isRecurring
      };
    }
  }

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5 select-none">
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)]">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58] shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#B78A58]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#2C2C2C] tracking-tight leading-tight">
                {isToday ? 'Sua programação de hoje' : `Programação de ${WEEKDAY_NAMES[weekday].toLowerCase()}`}
              </h2>
              <p className="text-xs text-[#8C7A6B]">Compromissos e rotinas do dia</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAgendaModalOpen(true)}
              className="w-7 h-7 rounded-full bg-[#EFE8DE] hover:bg-[#E4DACD] flex items-center justify-center text-[#5C4F44] transition-colors"
              aria-label="Adicionar compromisso"
              title="Adicionar compromisso"
            >
              <Plus className="w-3.5 h-3.5 text-[#5C4F44]" />
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-0.5 transition-colors"
              aria-label="Ver tudo sobre a programação"
            >
              <span>Ver tudo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-5 px-3 bg-white border border-[#EFE8DE] rounded-2xl mb-3 space-y-2">
            <p className="text-xs text-[#8C7A6B]">
              Nada programado para {isToday ? 'hoje' : 'este dia'}.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => setIsAgendaModalOpen(true)}
                className="text-[11px] font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] px-3 py-1.5 rounded-xl"
              >
                + Compromisso
              </button>
              <button
                onClick={() => setActiveTab('rotinas')}
                className="text-[11px] font-bold text-[#5C4F44] bg-[#EFE8DE] hover:bg-[#E4DACD] px-3 py-1.5 rounded-xl"
              >
                + Rotina
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            {visible.map((item) => (
              <div
                key={item.key}
                onClick={() => setActiveTab(item.kind === 'Agenda' ? 'agenda' : 'rotinas')}
                className={`flex items-center gap-3 p-2.5 bg-[#F7F4EE] hover:bg-[#F2ECE0] border border-[#EAE3D6] rounded-2xl cursor-pointer transition-colors ${
                  item.done ? 'opacity-55' : ''
                }`}
              >
                <span className="text-base shrink-0 w-6 text-center">{item.icon}</span>
                <span className="text-xs font-bold text-[#5C4F44] bg-[#EFE8DE] px-2 py-0.5 rounded-md shrink-0 tabular-nums">
                  {item.time || '--:--'}
                </span>
                <span className={`text-xs font-semibold text-[#2C2C2C] flex-1 min-w-0 truncate ${item.done ? 'line-through' : ''}`}>
                  {item.title}
                </span>
                <span className="text-[9px] font-bold text-[#8C7A6B] bg-[#FAF8F5] border border-[#E2D8CA] px-1.5 py-0.5 rounded-full shrink-0">
                  {item.done ? 'Feito' : item.kind}
                </span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <button
                onClick={() => setActiveTab('agenda')}
                className="w-full text-[11px] font-bold text-[#8C7A6B] hover:text-[#5C4F44] py-1"
              >
                + {hiddenCount} {hiddenCount === 1 ? 'item' : 'itens'} no dia
              </button>
            )}
          </div>
        )}

        {nextUpcoming && (
          <div
            onClick={() => setActiveTab('agenda')}
            className="flex items-center gap-2.5 p-3 bg-[#F2ECE0]/70 hover:bg-[#ECE4D4] border border-[#E4DACD] rounded-2xl cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E2D8CA] flex items-center justify-center text-sm shadow-2xs shrink-0">
              {nextUpcoming.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wide">Próximo compromisso</p>
              <h3 className="text-xs font-bold text-[#2C2C2C] leading-tight truncate">{nextUpcoming.title}</h3>
              <p className="text-[11px] text-[#8C7A6B] mt-0.5 font-medium truncate">
                {nextUpcoming.dateLabel}
                {nextUpcoming.time ? ` • ${nextUpcoming.time}` : ''}
                {nextUpcoming.recurring ? ' • Recorrente' : ''}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          </div>
        )}
      </div>
    </section>
  );
};

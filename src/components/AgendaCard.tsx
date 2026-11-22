import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarCheck, ChevronRight, Plus } from 'lucide-react';
import { agendaOccursOn, formatBrazilianDate } from '../utils/routineCalculations';
import { todayISO, shiftISODate, parseISODate, nowHHMM, WEEKDAY_NAMES } from '../utils/dateUtils';
import { personalOccursOn, stepOccursOn } from '../utils/routineSchedule';
import { IconBubble, SectionTitle, SoftCard, StatusChip } from './ui/Kit';

const DAY_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const longDays = (days?: number[]) => {
  if (!days || days.length === 0 || days.length === 7) return 'Todos os dias';
  const n = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAY_LONG[d]);
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}`;
};

type ScheduleEntry = {
  key: string;
  time: string;
  title: string;
  icon: string;
  kind: 'Agenda' | 'Rotina' | 'Recorrente';
  done: boolean;
  sub?: string; // "Segunda, Quarta e Sexta", "Em jejum"...
};

const hourLabel = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

const MAX_ITEMS = 4;

export const AgendaCard: React.FC = () => {
  const {
    agendaItems,
    routineTasks,
    dailyChronologicalSteps,
    recurringTasks,
    personalRoutines,
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
        done: !!a.completed,
        sub: 'Compromisso'
      })),
    ...dailyChronologicalSteps.filter((s) => stepOccursOn(s, weekday)).map((s) => ({
      key: `st-${s.id}`,
      time: s.time || '',
      title: s.title,
      icon: s.icon || '⏰',
      kind: 'Rotina' as const,
      done: isToday && !!s.completed,
      sub: s.description || (s.daysOfWeek?.length ? longDays(s.daysOfWeek) : 'Todos os dias')
    })),
    // Rotinas Pessoais na rotina diária ou no calendário (cadastro original, sem cópia)
    ...personalRoutines
      .filter((p) => (p.inDailyRoutine || p.showOnCalendar) && p.time && personalOccursOn(p, weekday))
      .map((p) => ({
        key: `pr-${p.id}`,
        time: p.time || '',
        title: `${p.title}${p.context ? ` ${p.context}` : ''}`,
        icon: p.icon || '✨',
        kind: 'Rotina' as const,
        done: isToday && !!p.completedOn,
        sub: longDays(p.daysOfWeek)
      })),
    ...routineTasks
      .filter((t) => t.time && appliesToday(t.daysOfWeek))
      .map((t) => ({
        key: `rt-${t.id}`,
        time: t.time || '',
        title: t.title,
        icon: '✅',
        kind: 'Rotina' as const,
        done: isToday && !!t.completed
      })),
    ...recurringTasks
      .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === dateStr))
      .map((t) => ({
        key: `rc-${t.id}`,
        time: t.time || '',
        title: t.title,
        icon: t.icon || '🔁',
        kind: 'Recorrente' as const,
        done: isToday && t.status === 'concluido',
        sub: t.recurrence
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
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-4 select-none">
      <SoftCard className="p-4">
        <div className="px-1">
          <SectionTitle
            title={isToday ? 'Sua rotina de hoje' : `Rotina de ${WEEKDAY_NAMES[weekday].toLowerCase()}`}
            action={{ label: 'Ver tudo', onClick: () => setActiveTab('rotinas') }}
          />
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-6 px-3 space-y-3">
            <p className="text-sm text-[#8C7A6B]">Nada programado para {isToday ? 'hoje' : 'este dia'}.</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button onClick={() => setIsAgendaModalOpen(true)} className="text-xs font-semibold text-white bg-[#8C7A6B] px-4 py-2 rounded-full">
                + Compromisso
              </button>
              <button onClick={() => setActiveTab('rotinas')} className="text-xs font-semibold text-[#4A3E34] bg-[#E6C8A8] px-4 py-2 rounded-full">
                + Rotina
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-[#EFE8DE]/70">
            {visible.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.kind === 'Agenda' ? 'agenda' : item.kind === 'Recorrente' ? 'recorrentes' : 'rotinas')}
                className={`w-full flex items-center gap-3.5 px-1 py-3 text-left ${item.done ? 'opacity-55' : ''}`}
              >
                <IconBubble>{item.icon}</IconBubble>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] font-semibold text-[#2C2C2C] leading-snug break-words line-clamp-2 ${item.done ? 'line-through' : ''}`}>{item.title}</span>
                  <span className="block text-[13px] text-[#6E5D4F] leading-snug mt-0.5 truncate">
                    {[hourLabel(item.time), item.sub].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {item.done && <StatusChip tone="done" icon>Feito</StatusChip>}
              </button>
            ))}
          </div>
        )}
        {hiddenCount > 0 && (
          <button onClick={() => setActiveTab('rotinas')} className="w-full text-xs font-semibold text-[#B78A58] pt-1">
            + {hiddenCount} {hiddenCount === 1 ? 'item' : 'itens'} hoje
          </button>
        )}
      </SoftCard>

      {nextUpcoming && (
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className="mt-3 w-full flex items-center gap-3 px-4 py-3 bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[22px] shadow-[0_3px_12px_rgba(150,100,60,0.08)] text-left"
        >
          <IconBubble size="sm">{nextUpcoming.icon}</IconBubble>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-[#B78A58] uppercase tracking-wide">Próximo compromisso</span>
            <span className="block text-sm font-semibold text-[#2C2C2C] truncate">{nextUpcoming.title}</span>
            <span className="block text-xs text-[#8C7A6B] truncate">
              {nextUpcoming.dateLabel}
              {nextUpcoming.time ? ` · ${hourLabel(nextUpcoming.time)}` : ''}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#B78A58] shrink-0" />
        </button>
      )}
    </section>
  );
};

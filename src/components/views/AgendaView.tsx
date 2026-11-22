import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO, toISODate, shiftISODate, parseISODate, MONTH_NAMES } from '../../utils/dateUtils';
import { IconBubble, ListRow, PageHeader, RoundButton, SectionTitle, SoftCard } from '../ui/Kit';
import { agendaOccursOn } from '../../utils/routineCalculations';
import { personalOccursOn, profileName } from '../../utils/routineSchedule';
import { AgendaItem, WeeklyFixedTopic, AgendaCategory } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Calendar,
  Clock,
  Bell,
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  MapPin,
  Repeat,
  X,
  Sliders,
  CalendarDays
} from 'lucide-react';
import { formatBrazilianDate } from '../../utils/routineCalculations';

export const AgendaView: React.FC = () => {
  const {
    setActiveTab,
    agendaItems,
    addAgendaItem,
    updateAgendaItem,
    toggleAgendaItem,
    deleteAgendaItem,
    agendaCategories,
    addAgendaCategory,
    updateAgendaCategory,
    deleteAgendaCategory,
    weeklyFixedTopics,
    addWeeklyFixedTopic,
    updateWeeklyFixedTopic,
    deleteWeeklyFixedTopic,
    recurringTasks,
    triggerAlarm,
    personalRoutines,
    profiles
  } = useApp();

  // Strict vertical collapsible accordion sections
  const [openSections, setOpenSections] = useState<{
    calendario: boolean;
    detalhesDia: boolean;
    topicosFixos: boolean;
    todosCompromissos: boolean;
  }>({
    calendario: true,
    detalhesDia: true,
    topicosFixos: true,
    todosCompromissos: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Calendar month being viewed + selected day (starts on the real today)
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [activeDayNum, setActiveDayNum] = useState<number>(today.getDate());
  const isoForDay = (dayNum: number) => toISODate(new Date(viewYear, viewMonth, dayNum));
  const monthLabel = `${MONTH_NAMES[viewMonth]} de ${viewYear}`;
  const goToMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setActiveDayNum(1);
  };
  const goToToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setActiveDayNum(t.getDate());
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isWeeklyTopicModalOpen, setIsWeeklyTopicModalOpen] = useState(false);

  // Form states for new event
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(todayISO());
  const [newTime, setNewTime] = useState('17:00');
  const [newCategoryId, setNewCategoryId] = useState<string>(agendaCategories[0]?.id || 'cat-familia');
  const [newIcon, setNewIcon] = useState('⚽');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('7'); // em dias
  const [recurrenceType, setRecurrenceType] = useState<'semanal' | 'diario' | 'quinzenal' | 'mensal' | 'personalizado'>('semanal');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(shiftISODate(todayISO(), 60));
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [hasVisualNotification, setHasVisualNotification] = useState<boolean>(true);
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(true);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Form states for category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');

  // Form states for weekly fixed topics
  const [newTopicDay, setNewTopicDay] = useState<number>(5); // 5 = Sexta
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicIcon, setNewTopicIcon] = useState('🎬');
  const [newTopicTime, setNewTopicTime] = useState('19:30');

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const daysOfWeekLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const daysOfWeekNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // Events (direct + recurring) for a day of the month being viewed
  const getEventsForDay = (dayNum: number) => {
    const dateStr = isoForDay(dayNum);
    const dayOfWeek = new Date(viewYear, viewMonth, dayNum).getDay();
    const directEvents = agendaItems.filter((item) => agendaOccursOn(item, dateStr));
    const recurringEvents = recurringTasks
      .filter((t) => (t.showOnCalendar ?? true) && (t.daysOfWeek ? t.daysOfWeek.includes(dayOfWeek) : true))
      .map((t) => ({
        id: `rec-cal-${t.id}`,
        title: `🔁 ${t.title}`,
        date: dateStr,
        time: t.time || '13:00',
        displayDay: daysOfWeekNames[dayOfWeek],
        isRecurring: true,
        recurrenceLabel: `Recorrente: ${t.recurrence}`,
        completed: t.status === 'concluido',
        category: 'rotina',
        icon: '🔁'
      }));
    // Rotinas Pessoais com "Mostrar no calendário" (lidas do cadastro original, sem cópia)
    const personalEvents = personalRoutines
      .filter((p) => p.showOnCalendar && p.time && personalOccursOn(p, dayOfWeek))
      .map((p) => ({
        id: `pes-cal-${p.id}`,
        title: `${p.icon || '✨'} ${p.title}${p.context ? ` ${p.context}` : ''}`,
        date: dateStr,
        time: p.time || '',
        displayDay: daysOfWeekNames[dayOfWeek],
        isRecurring: true,
        recurrenceLabel: `Rotina pessoal · ${profileName(profiles, p.profileId)}`,
        completed: dateStr === todayISO() && !!p.completedOn,
        category: 'rotina',
        icon: p.icon || '✨'
      }));
    return [...directEvents, ...recurringEvents, ...personalEvents];
  };

  const selectedDateStr = isoForDay(activeDayNum);
  const selectedDayEvents = getEventsForDay(activeDayNum);

  const selectedDayDateObj = new Date(viewYear, viewMonth, activeDayNum);
  const selectedDayOfWeek = selectedDayDateObj.getDay();
  const selectedDayOfWeekName = daysOfWeekNames[selectedDayOfWeek];

  // Fixed weekly topic for selected day
  const fixedTopicForSelectedDay = weeklyFixedTopics.find((t) => t.dayOfWeek === selectedDayOfWeek);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const hasEvents = getEventsForDay(day).length > 0;
    return { day, hasEvents };
  });

  const availableEmojis = [
    '⚽', '🎂', '💅', '🩺', '📚', '🎒', '🛒', '🚗', '🌿', '🏥',
    '🎬', '🍕', '🏖️', '🚲', '🧘‍♀️', '🦷', '💻', '🎨', '🧺', '🏊',
    '🎭', '🍦', '🧸', '🌳', '🍝', '🧼', '🐕', '🎉', '✈️', '💼'
  ];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const chosenCat = agendaCategories.find((c) => c.id === newCategoryId) || agendaCategories[0];

    addAgendaItem({
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      displayDay: daysOfWeekNames[new Date(newDate + 'T12:00:00').getDay()],
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceIntervalDays: isRecurring ? Number(recurrenceInterval) || 7 : undefined,
      recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
      recurrenceLabel: isRecurring ? `A cada ${recurrenceInterval} dias • até ${recurrenceEndDate}` : undefined,
      category: chosenCat.id,
      categoryId: chosenCat.id,
      icon: newIcon,
      reminderMinutes,
      hasVisualNotification,
      alarmEnabled
    });

    showToast(`Compromisso "${newTitle.trim()}" agendado com sucesso!`);
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addAgendaCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: '#8C7A6B'
    });
    setNewCatName('');
    showToast(`Categoria "${newCatName.trim()}" criada!`);
  };

  const handleCreateWeeklyTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    addWeeklyFixedTopic({
      dayOfWeek: newTopicDay,
      dayName: daysOfWeekNames[newTopicDay],
      title: newTopicTitle.trim(),
      icon: newTopicIcon,
      time: newTopicTime
    });
    setNewTopicTitle('');
    setIsWeeklyTopicModalOpen(false);
    showToast(`Tópico fixo de ${daysOfWeekNames[newTopicDay]} adicionado!`);
  };

  // Próximos compromissos (30 dias a partir de hoje, primeira ocorrência de cada um)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const upcomingAll = (() => {
    const out: { item: AgendaItem; date: string }[] = [];
    const seen = new Set<string>();
    const start = todayISO();
    for (let i = 0; i <= 30 && out.length < 12; i++) {
      const d = shiftISODate(start, i);
      agendaItems
        .filter((it) => !it.completed && !seen.has(it.id) && agendaOccursOn(it, d))
        .sort((x, y) => x.time.localeCompare(y.time))
        .forEach((it) => {
          seen.add(it.id);
          out.push({ item: it, date: d });
        });
    }
    return out.slice(0, 12);
  })();
  const upcomingDayLabel = (iso: string) => {
    if (iso === todayISO()) return 'Hoje';
    if (iso === shiftISODate(todayISO(), 1)) return 'Amanhã';
    const s = parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-32 select-none relative">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#C58B68] shrink-0" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
          <button onClick={() => setToastNotification(null)} className="text-white/70 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PageHeader
        icon={CalendarDays}
        title="Minha Agenda"
        right={
          <>
            <RoundButton label="Gerenciar categorias" onClick={() => setIsCategoryModalOpen(true)}>
              <Sliders className="w-[18px] h-[18px]" strokeWidth={1.9} />
            </RoundButton>
            <RoundButton
              label="Adicionar compromisso"
              tone="accent"
              onClick={() => {
                setNewDate(selectedDateStr);
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.2} />
            </RoundButton>
          </>
        }
      />

      <div className="space-y-4 mt-3">
        {/* Calendário do mês (sempre aberto, como na foto) */}
        <SoftCard className="p-4">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#4A3E34] hover:bg-[#F4EDE2]"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" onClick={goToToday} className="text-[17px] font-bold text-[#2C2C2C]" title="Ir para hoje">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </button>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#4A3E34] hover:bg-[#F4EDE2]"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center mt-3 mb-1">
            {daysOfWeekLetters.map((d, i) => (
              <span key={i} className="text-[13px] font-semibold text-[#8C7A6B]">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {calendarDays.map((cd) => {
              const isSelected = activeDayNum === cd.day;
              const isToday = isoForDay(cd.day) === todayISO();
              return (
                <button
                  key={cd.day}
                  type="button"
                  onClick={() => setActiveDayNum(cd.day)}
                  aria-label={`Dia ${cd.day}${cd.hasEvents ? ', com compromissos' : ''}`}
                  aria-pressed={isSelected}
                  className="h-11 flex flex-col items-center justify-center"
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition ${
                      isSelected
                        ? 'bg-[#B78A58] text-white font-bold shadow-sm'
                        : isToday
                          ? 'ring-2 ring-[#B78A58] text-[#2C2C2C] font-bold'
                          : 'text-[#2C2C2C] hover:bg-[#F4EDE2]'
                    }`}
                  >
                    {cd.day}
                  </span>
                  <span className={`w-1 h-1 rounded-full -mt-0.5 ${cd.hasEvents && !isSelected ? 'bg-[#B78A58]' : 'bg-transparent'}`} />
                </button>
              );
            })}
          </div>
          {(viewMonth !== today.getMonth() || viewYear !== today.getFullYear() || activeDayNum !== today.getDate()) && (
            <div className="text-center pt-2">
              <button type="button" onClick={goToToday} className="text-xs font-semibold text-[#B78A58] hover:underline">
                Voltar para hoje ({today.getDate()})
              </button>
            </div>
          )}
        </SoftCard>

        {/* Próximos compromissos */}
        <SoftCard className="p-4">
          <div className="px-1">
            <SectionTitle
              title="Próximos compromissos"
              action={upcomingAll.length > 4 ? { label: showAllUpcoming ? 'Ver menos' : 'Ver todos', onClick: () => setShowAllUpcoming((v) => !v) } : undefined}
            />
          </div>
          {upcomingAll.length === 0 ? (
            <p className="px-1 pt-2 text-sm text-[#8C7A6B]">Nenhum compromisso nos próximos 30 dias.</p>
          ) : (
            <div className="mt-1">
              {(showAllUpcoming ? upcomingAll : upcomingAll.slice(0, 4)).map(({ item, date }) => (
                <ListRow
                  key={`${item.id}-${date}`}
                  icon={<IconBubble size="sm">{item.icon}</IconBubble>}
                  title={item.title}
                  subtitle={`${upcomingDayLabel(date)} · ${item.time}${item.location ? ` · ${item.location}` : ''}`}
                  onClick={() => {
                    const d = parseISODate(date);
                    setViewYear(d.getFullYear());
                    setViewMonth(d.getMonth());
                    setActiveDayNum(d.getDate());
                  }}
                  right={<ChevronRight className="w-4 h-4 text-[#B78A58]" />}
                />
              ))}
            </div>
          )}
        </SoftCard>

        {/* ========================================================
            CARD 2: COMPROMISSOS DETALHADOS DO DIA SELECIONADO (LOGO ABAIXO)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[26px] overflow-hidden shadow-[0_6px_22px_rgba(150,100,60,0.09)] transition-all">
          <div className="p-4 sm:p-5 border-b border-[#EFE8DE]/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📅</span>
              <div>
                <h3 className="text-sm font-bold text-[#2C2C2C]">
                  Programação de {selectedDayOfWeekName}, {activeDayNum} de {MONTH_NAMES[viewMonth]}
                </h3>
                <p className="text-[11px] text-[#8C7A6B]">
                  {selectedDayEvents.length} compromissos agendados para este dia
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setNewDate(selectedDateStr);
                setIsAddModalOpen(true);
              }}
              className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {/* Tópico Fixo da Semana deste dia da semana (ex: Dia do Filme) */}
            {fixedTopicForSelectedDay && (
              <div className="p-3 bg-[#F7F2EA] border border-[#EAE0D2] rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{fixedTopicForSelectedDay.icon}</span>
                  <div>
                    <span className="text-[10px] font-bold text-[#8C7A6B] uppercase tracking-wider block">
                      Tópico Fixo de {fixedTopicForSelectedDay.dayName}
                    </span>
                    <h4 className="text-xs font-bold text-[#2C2C2C]">
                      {fixedTopicForSelectedDay.title}
                    </h4>
                    {fixedTopicForSelectedDay.description && (
                      <p className="text-[10px] text-[#6E5D4F] mt-0.5">
                        {fixedTopicForSelectedDay.description}
                      </p>
                    )}
                  </div>
                </div>
                {fixedTopicForSelectedDay.time && (
                  <span className="text-xs font-bold text-[#5C4F44] bg-[#EAE0D2] px-2.5 py-1 rounded-xl shrink-0 whitespace-nowrap tabular-nums">
                    {fixedTopicForSelectedDay.time}
                  </span>
                )}
              </div>
            )}

            {/* List of events on this day */}
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-6 bg-white border border-[#EFE8DE] rounded-2xl space-y-2">
                <p className="text-xs text-[#8C7A6B]">
                  Nenhum compromisso específico marcado para o dia {activeDayNum}/{viewMonth + 1}.
                </p>
                <button
                  onClick={() => {
                    setNewDate(selectedDateStr);
                    setIsAddModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] underline"
                >
                  + Agendar compromisso para este dia
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayEvents.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-bold break-words ${
                            item.completed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#8C7A6B] mt-1">
                          <span className="flex items-center gap-1 font-semibold text-[#5C4F44] whitespace-nowrap">
                            <Clock className="w-3 h-3 text-[#B78A58]" />
                            {item.time}
                          </span>
                          {item.isRecurring && (
                            <span className="bg-[#FAF2EB] text-[#A85B48] px-2 py-0.5 rounded-md font-semibold">
                              🔁 {item.recurrenceLabel || 'Recorrente'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          triggerAlarm({
                            id: item.id,
                            type: 'agenda',
                            title: item.title,
                            time: item.time,
                            subtitle: `Compromisso agendado para as ${item.time}`
                          })
                        }
                        className="p-1.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B]"
                        title="Testar alarme sonoro / balão"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleAgendaItem(item.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-[#7D9D7F] text-white shadow-2xs'
                            : 'bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B]'
                        }`}
                        title={item.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAgendaItem(item.id)}
                        className="p-1.5 text-[#A39385] hover:text-[#9E6C52]"
                        title="Excluir compromisso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            CARD 3: TÓPICOS FIXOS DA SEMANA (TOTALMENTE EDITÁVEIS)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[26px] overflow-hidden shadow-[0_6px_22px_rgba(150,100,60,0.09)] transition-all">
          <button
            onClick={() => toggleSection('topicosFixos')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.topicosFixos}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-[0_3px_12px_rgba(150,100,60,0.08)] flex items-center justify-center text-lg text-[#B78A58]">
                🎬
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                  2. Tópicos Fixos da Semana
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Rituais semanais (ex: Dia do Filme na sexta, Futebol, Feira)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-[#8C7A6B] bg-[#F4EDE2] px-2.5 py-1 rounded-full whitespace-nowrap">
                {weeklyFixedTopics.length} rituais
              </span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.topicosFixos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.topicosFixos && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-3">
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-bold text-[#4A3E34]">
                  Programação semanal que se repete:
                </span>
                <button
                  onClick={() => setIsWeeklyTopicModalOpen(true)}
                  className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Tópico Fixo</span>
                </button>
              </div>

              <div className="space-y-2">
                {weeklyFixedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3 bg-white border border-[#EFE8DE] rounded-2xl flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#5C4F44] bg-[#F4EDE2] px-2 py-0.5 rounded-md text-[10px]">
                            {topic.dayName}
                          </span>
                          <strong className="text-[#2C2C2C]">{topic.title}</strong>
                        </div>
                        {topic.description && (
                          <p className="text-[11px] text-[#8C7A6B] mt-0.5">{topic.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {topic.time && (
                        <span className="text-[11px] font-bold text-[#8C7A6B]">{topic.time}</span>
                      )}
                      <button
                        onClick={() => deleteWeeklyFixedTopic(topic.id)}
                        className="text-[#A39385] hover:text-[#9E6C52] p-1"
                        title="Excluir tópico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: NOVO COMPROMISSO COM INTERVALO E DATA FINAL
         ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[26px] p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Novo Compromisso na Agenda</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">
                  Título do compromisso:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Futebol das crianças, Consulta pediátrica..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Data:</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Horário:</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">Categoria:</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C] focus:outline-none font-semibold"
                >
                  {agendaCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">Ícone / Emoji:</label>
                <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
                  {availableEmojis.slice(0, 15).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewIcon(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-all ${
                        newIcon === emoji
                          ? 'bg-[#8C7A6B] text-white border-[#8C7A6B] shadow-xs scale-105'
                          : 'bg-white border-[#EFE8DE] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* RECORRÊNCIA COM INTERVALO E DATA FINAL */}
              <div className="bg-[#F7F4EE] p-3 rounded-2xl border border-[#EAE3D6] space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#4A3E34]">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded accent-[#8C7A6B] w-4 h-4"
                  />
                  <span>Compromisso Recorrente</span>
                </label>

                {isRecurring && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C4F44] mb-1">
                          Intervalo em dias:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(e.target.value)}
                          placeholder="Ex: 7 (semanal)"
                          className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2C2C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#5C4F44] mb-1">
                          Data Limite / Final:
                        </label>
                        <input
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-1.5 text-xs text-[#2C2C2C]"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-[#8C7A6B]">
                      O compromisso se repetirá a cada {recurrenceInterval} dias até a data final selecionada.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold shadow-xs transition-colors"
                >
                  Salvar Compromisso
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: GERENCIAR CATEGORIAS DE COMPROMISSO
         ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[26px] p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#8C7A6B]" />
                <h3 className="text-sm font-bold text-[#2C2C2C]">Categorias da Agenda</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              <span className="text-xs font-bold text-[#5C4F44] block mb-1">
                Categorias existentes:
              </span>
              {agendaCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2.5 bg-white border border-[#EFE8DE] rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-bold text-[#2C2C2C]">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => deleteAgendaCategory(cat.id)}
                    disabled={agendaCategories.length <= 1}
                    className="p-1 text-[#A39385] hover:text-[#9E6C52] disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Category Form */}
              <form onSubmit={handleCreateCategory} className="pt-3 border-t border-[#EFE8DE] space-y-2">
                <span className="text-xs font-bold text-[#5C4F44] block">Nova Categoria:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-12 bg-white border border-[#EFE8DE] rounded-xl px-2 py-2 text-center text-lg"
                    placeholder="🏷️"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nome da categoria (ex: Culinária, Música...)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#8C7A6B] text-white font-bold text-xs"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-[#EFE8DE] flex justify-end">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#8C7A6B] text-white font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NOVO TÓPICO FIXO DA SEMANA
         ======================================================== */}
      {isWeeklyTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE]/70 rounded-[26px] p-5 shadow-2xl relative space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎬</span>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Novo Tópico Fixo Semanal</h3>
              </div>
              <button
                onClick={() => setIsWeeklyTopicModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWeeklyTopic} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">Dia da semana:</label>
                <select
                  value={newTopicDay}
                  onChange={(e) => setNewTopicDay(Number(e.target.value))}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C] font-semibold"
                >
                  {daysOfWeekNames.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">Título do tópico fixo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Noite do Filme em Família com Pipoca..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Emoji:</label>
                  <input
                    type="text"
                    value={newTopicIcon}
                    onChange={(e) => setNewTopicIcon(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Horário (opcional):</label>
                  <input
                    type="time"
                    value={newTopicTime}
                    onChange={(e) => setNewTopicTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8C7A6B] text-white font-bold"
                >
                  Salvar Tópico
                </button>
                <button
                  type="button"
                  onClick={() => setIsWeeklyTopicModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F4EDE2] text-[#5C4F44]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

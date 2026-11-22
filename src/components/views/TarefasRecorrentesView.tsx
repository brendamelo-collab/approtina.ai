import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Repeat,
  Check,
  Trash2,
  X,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CheckCircle, IconBubble, ListRow, PageHeader, PeachButton, RoundButton, SectionTitle, SegmentTrack, SoftCard, StatusChip } from '../ui/Kit';
import { RecurringTaskItem } from '../../types';

const daysOfWeekNames = [
  { id: 1, name: 'Segunda', short: 'Seg' },
  { id: 2, name: 'Terça', short: 'Ter' },
  { id: 3, name: 'Quarta', short: 'Qua' },
  { id: 4, name: 'Quinta', short: 'Qui' },
  { id: 5, name: 'Sexta', short: 'Sex' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
  { id: 0, name: 'Domingo', short: 'Dom' }
];

export const TarefasRecorrentesView: React.FC = () => {
  const {
    setActiveTab,
    recurringTasks,
    completeRecurringTask,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    uncompleteRecurringTask,
    recurringHistory
  } = useApp();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'todos'>('todos');

  // Modal for new recurring task
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRecurrence, setNewRecurrence] = useState('Semanalmente');
  const [newNextDate, setNewNextDate] = useState('Segunda-feira');
  const [newTime, setNewTime] = useState('13:00');
  const [newShowOnCalendar, setNewShowOnCalendar] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 1 = Segunda
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const toggleDaySelection = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length <= 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addRecurringTask({
      title: newTitle.trim(),
      recurrence: newRecurrence,
      nextDate: newNextDate,
      icon: 'sparkles',
      time: newTime,
      showOnCalendar: newShowOnCalendar,
      daysOfWeek: selectedDays
    });

    setToastNotification(`Tarefa "${newTitle.trim()}" salva e integrada à Rotina Diária!`);
    setTimeout(() => setToastNotification(null), 3000);

    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const handleCompleteWithToast = (task: RecurringTaskItem) => {
    completeRecurringTask(task.id);
    setToastNotification(`✓ "${task.title}" concluída!`);
    setTimeout(() => setToastNotification(null), 3000);
  };

  const toggleCalendarVisibility = (task: RecurringTaskItem) => {
    const nextVal = !task.showOnCalendar;
    updateRecurringTask(task.id, { showOnCalendar: nextVal });
    setToastNotification(
      nextVal
        ? `📅 "${task.title}" agora aparecerá na Agenda`
        : `🔒 "${task.title}" oculta da Agenda`
    );
    setTimeout(() => setToastNotification(null), 2500);
  };

  const getTaskEmoji = (task: RecurringTaskItem) => {
    const lower = task.title.toLowerCase();
    if (lower.includes('pneu') || lower.includes('carro') || lower.includes('moto')) return '🏍️';
    if (lower.includes('sapato') || lower.includes('tênis')) return '👟';
    if (lower.includes('cama') || lower.includes('lençol') || lower.includes('toalha')) return '🛏️';
    if (lower.includes('planta') || lower.includes('jardim')) return '🌱';
    if (lower.includes('filtro') || lower.includes('ar')) return '❄️';
    if (lower.includes('geladeira')) return '🧊';
    return '✨';
  };

  // Filter tasks by selected day if filtering
  const displayedTasks = recurringTasks.filter((t) => {
    if (selectedDayFilter === 'todos') return true;
    return t.daysOfWeek ? t.daysOfWeek.includes(selectedDayFilter) : true;
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-32 select-none relative">
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7D9D7F] shrink-0" />
            <span className="font-semibold">{toastNotification}</span>
          </div>
          <button onClick={() => setToastNotification(null)} className="text-white/70 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PageHeader
        icon={RefreshCw}
        title="Tarefas Recorrentes"
        right={
          <RoundButton label="Adicionar tarefa recorrente" tone="accent" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-5 h-5" strokeWidth={2.2} />
          </RoundButton>
        }
      />

      <div className="mt-3 space-y-4">
        <SegmentTrack<number | 'todos'>
          options={[{ id: 'todos', label: 'Todas' }, ...daysOfWeekNames.map((d) => ({ id: d.id, label: d.short }))]}
          value={selectedDayFilter}
          onChange={setSelectedDayFilter}
          marker={new Date().getDay()}
        />

        {displayedTasks.length === 0 ? (
          <SoftCard className="p-8 text-center space-y-2">
            <Repeat className="w-8 h-8 text-[#B78A58] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhuma tarefa para este filtro</h3>
            <p className="text-xs text-[#8C7A6B]">Adicione tarefas recorrentes e escolha em quais dias da semana elas entram na sua Rotina Diária.</p>
          </SoftCard>
        ) : (
          displayedTasks.map((task: RecurringTaskItem) => {
            const isDone = task.status === 'concluido';
            const showOnCal = task.showOnCalendar ?? true;
            const days = task.daysOfWeek && task.daysOfWeek.length > 0 ? task.daysOfWeek.map((d) => daysOfWeekNames.find((day) => day.id === d)?.short).join(', ') : 'Seg';
            return (
              <SoftCard key={task.id} as="div" className={`p-4 ${isDone ? 'opacity-90' : ''}`}>
                <div className="flex items-center gap-3.5">
                  <IconBubble>{getTaskEmoji(task)}</IconBubble>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-[16px] font-bold leading-snug break-words ${isDone ? 'text-[#8C7A6B]' : 'text-[#2C2C2C]'}`}>{task.title}</h3>
                    <p className="text-[13px] text-[#8C7A6B] mt-0.5">{task.recurrence}</p>
                    <p className="text-[13px] text-[#4A3E34] mt-0.5">
                      {isDone ? 'Feita hoje' : `Próxima: ${task.nextDate || days}`} · {task.time || '13:00'}
                    </p>
                  </div>
                  {isDone ? (
                    <CheckCircle done label={`Desfazer ${task.title}`} onClick={() => uncompleteRecurringTask(task.id)} />
                  ) : (
                    <button type="button" onClick={() => handleCompleteWithToast(task)} aria-label={`Concluir ${task.title}`} className="shrink-0">
                      <StatusChip tone="pending">Pendente</StatusChip>
                    </button>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[#EFE8DE]/70 flex items-center gap-2 text-xs">
                  <span className="flex-1 min-w-0 text-[#8C7A6B] truncate">Dias: <strong className="text-[#4A3E34]">{days}</strong></span>
                  <button
                    type="button"
                    onClick={() => toggleCalendarVisibility(task)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${showOnCal ? 'bg-[#EEF5EF] text-[#2C5230]' : 'bg-[#F4EDE2] text-[#8C7A6B]'}`}
                    title={showOnCal ? 'Visível na Agenda' : 'Oculto da Agenda'}
                  >
                    <Calendar className="w-3.5 h-3.5" /> {showOnCal ? 'Na Agenda' : 'Oculto'}
                  </button>
                  {!isDone && (
                    <button type="button" onClick={() => handleCompleteWithToast(task)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6C8A8] text-[#4A3E34] font-semibold">
                      <Check className="w-3.5 h-3.5" /> Concluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteRecurringTask(task.id)}
                    className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-full hover:bg-[#FDF2EE]"
                    title="Excluir tarefa"
                    aria-label={`Excluir tarefa ${task.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </SoftCard>
            );
          })
        )}

        <PeachButton onClick={() => setIsAddModalOpen(true)}>
          Adicionar tarefa <Plus className="w-4 h-4" />
        </PeachButton>

        <SoftCard className="p-4">
          <div className="px-1">
            <SectionTitle
              title="Histórico recente"
              action={recurringHistory.length > 4 ? { label: showAllHistory ? 'Ver menos' : 'Ver histórico', onClick: () => setShowAllHistory((v) => !v) } : undefined}
            />
          </div>
          {recurringHistory.length === 0 ? (
            <p className="px-1 pt-2 text-sm text-[#8C7A6B]">Quando você concluir uma tarefa, ela aparece aqui.</p>
          ) : (
            <div className="mt-1">
              {[...recurringHistory]
                .sort((x, y) => (y.completedAt || '').localeCompare(x.completedAt || ''))
                .slice(0, showAllHistory ? 30 : 4)
                .map((h) => (
                  <ListRow
                    key={h.id}
                    icon={<IconBubble size="sm">{getTaskEmoji({ title: h.taskTitle } as RecurringTaskItem)}</IconBubble>}
                    title={h.taskTitle}
                    subtitle={`Concluída em ${h.displayDate}`}
                    right={<CheckCircle done label="Concluída" />}
                  />
                ))}
            </div>
          )}
        </SoftCard>
      </div>

      {/* Modal: Nova Tarefa Recorrente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-[26px] p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Tarefa Recorrente</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Encaixa automaticamente na Rotina Diária</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Título da Tarefa / Hábito:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Calibrar pneu do carro, Higienizar calçados..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                  autoFocus
                />
              </div>

              {/* Days of Week multi-selector */}
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1.5">
                  Em quais dias da semana essa tarefa deve acontecer?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeekNames.map((d) => {
                    const active = selectedDays.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDaySelection(d.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? 'bg-[#8C7A6B] text-white border-[#8C7A6B]'
                            : 'bg-white text-[#5C4F44] border-[#EFE8DE]'
                        }`}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Horário na Rotina Diária:
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2C2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Periodicidade:
                  </label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    <option value="Semanalmente">Semanalmente</option>
                    <option value="A cada 14 dias">A cada 14 dias</option>
                    <option value="Mensalmente">Mensalmente</option>
                  </select>
                </div>
              </div>

              {/* Toggle option for Calendar / Agenda */}
              <div className="p-3 bg-[#F7EEE3]/50 rounded-2xl border border-[#EFE8DE] flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A3E34] flex items-center gap-1.5 cursor-pointer">
                  <Calendar className="w-4 h-4 text-[#B78A58]" />
                  <span>Exibir esta tarefa no Calendário da Agenda?</span>
                </label>
                <input
                  type="checkbox"
                  checked={newShowOnCalendar}
                  onChange={(e) => setNewShowOnCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8C7A6B] focus:ring-[#8C7A6B]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] text-xs font-semibold rounded-xl"
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

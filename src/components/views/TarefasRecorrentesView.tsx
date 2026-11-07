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
  Sparkles
} from 'lucide-react';
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
    deleteRecurringTask
  } = useApp();

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
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none relative">
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

      {/* Top Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3.5 py-1.5 rounded-full transition-colors"
          aria-label="Voltar ao início"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Início</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Tarefas Recorrentes & Hábitos</h1>
          <p className="text-[11px] text-[#8C7A6B]">Manutenção periódica integrada à Rotina Diária</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-9 h-9 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white flex items-center justify-center shadow-xs transition-colors"
          title="Nova Tarefa Recorrente"
          aria-label="Adicionar tarefa recorrente"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Days of the Week Visual Filter Pills */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-3 mb-4 shadow-2xs space-y-2">
        <span className="text-[11px] font-bold text-[#8C7A6B] block px-1">
          Visualização por Dia da Semana:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDayFilter('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedDayFilter === 'todos'
                ? 'bg-[#8C7A6B] text-white shadow-xs'
                : 'bg-[#F4EDE2] text-[#5C4F44] hover:bg-[#EAE0D2]'
            }`}
          >
            Todos os dias
          </button>
          {daysOfWeekNames.map((d) => {
            const isSelected = selectedDayFilter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDayFilter(d.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#8C7A6B] text-white font-bold shadow-xs'
                    : 'bg-[#FAF8F5] text-[#5C4F44] border border-[#EFE8DE] hover:bg-[#F4EDE2]'
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Tasks Assigned to Days */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#2C2C2C]">
            Tarefas & Hábitos Periódicos ({displayedTasks.length})
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Tarefa</span>
          </button>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-8 text-center space-y-2">
            <Repeat className="w-8 h-8 text-[#B78A58] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhuma tarefa para este filtro</h3>
            <p className="text-xs text-[#8C7A6B]">
              Adicione tarefas recorrentes e escolha em quais dias da semana elas entram na sua Rotina Diária.
            </p>
          </div>
        ) : (
          displayedTasks.map((task: RecurringTaskItem) => {
            const isDone = task.status === 'concluido';
            const showOnCal = task.showOnCalendar ?? true;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-3xl border transition-all shadow-2xs space-y-3 ${
                  isDone
                    ? 'bg-[#F2ECE2] border-[#DDD3C5] opacity-75'
                    : 'bg-white border-[#EFE8DE] hover:bg-[#FDFBF7]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-[#FAF8F5] border border-[#EAE0D2] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      {getTaskEmoji(task)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C] break-words">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-[#8C7A6B] mt-0.5 leading-snug">
                        {task.recurrence} • Horário: <strong className="text-[#5C4F44]">{task.time || '13:00'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Toggle Show on Calendar */}
                    <button
                      type="button"
                      onClick={() => toggleCalendarVisibility(task)}
                      className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                        showOnCal
                          ? 'bg-[#EEF5EF] border-[#B7D2B9] text-[#2C5230]'
                          : 'bg-[#FAF8F5] border-[#EFE8DE] text-[#8C7A6B]'
                      }`}
                      title={showOnCal ? 'Visível na Agenda' : 'Oculto da Agenda'}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{showOnCal ? 'Na Agenda' : 'Oculto'}</span>
                    </button>

                    {/* Complete button */}
                    <button
                      type="button"
                      onClick={() => handleCompleteWithToast(task)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                        isDone
                          ? 'bg-[#7D9D7F] text-white'
                          : 'bg-[#EAE0D2] hover:bg-[#DFD3C3] text-[#5C4F44]'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Feito</span>
                        </>
                      ) : (
                        <span>Concluir</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRecurringTask(task.id)}
                      className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#FDF2EE] transition-colors"
                      title="Excluir tarefa"
                      aria-label={`Excluir tarefa ${task.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Integration notice */}
                <div className="pt-2 border-t border-[#EFE8DE]/60 flex items-center justify-between text-[11px] text-[#8C7A6B]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B78A58]" />
                    Encaixa automaticamente na Rotina Diária às {task.time || '13:00'}
                  </span>
                  <span className="font-semibold text-[#5C4F44]">
                    Dias: {task.daysOfWeek && task.daysOfWeek.length > 0 ? task.daysOfWeek.map((d) => daysOfWeekNames.find((day) => day.id === d)?.short).join(', ') : 'Segunda'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Nova Tarefa Recorrente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
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

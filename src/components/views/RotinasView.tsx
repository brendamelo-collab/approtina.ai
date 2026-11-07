import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoutineTask, PeriodKey, DailyChronologicalStep } from '../../types';
import {
  ChevronLeft,
  Plus,
  Check,
  Clock,
  Bell,
  Calendar,
  X,
  Volume2,
  Trash2,
  Repeat
} from 'lucide-react';

export const RotinasView: React.FC = () => {
  const {
    setActiveTab,
    routineTasks,
    toggleRoutineTask,
    addRoutineTask,
    updateRoutineTask,
    deleteRoutineTask,
    dailyChronologicalSteps,
    toggleDailyChronologicalStep,
    addDailyChronologicalStep,
    deleteDailyChronologicalStep,
    recurringTasks,
    speakVoiceReminder,
    triggerAlarm
  } = useApp();

  // Top Subtab switcher: 'semanal' | 'diaria'
  const [subTab, setSubTab] = useState<'diaria' | 'semanal'>('diaria');

  // Active day selection for the weekly view (1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb, 0 = Dom)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1);

  // Modal for adding/editing a routine task
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newPeriod, setNewPeriod] = useState<PeriodKey>('manha');
  const [newTime, setNewTime] = useState('08:00');
  const [newGroupName, setNewGroupName] = useState('Autocuidado');
  const [newSubgroupName, setNewSubgroupName] = useState('Geral');
  const [hasReminder, setHasReminder] = useState(true);
  const [hasVoiceAlert, setHasVoiceAlert] = useState(true);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Modal for adding chronological daily step
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [newStepTime, setNewStepTime] = useState('09:00');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepIcon, setNewStepIcon] = useState('✨');

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const weekDays = [
    { index: 1, name: 'Segunda-feira', short: 'Seg', emoji: '☕' },
    { index: 2, name: 'Terça-feira', short: 'Ter', emoji: '⚽' },
    { index: 3, name: 'Quarta-feira', short: 'Qua', emoji: '🥦' },
    { index: 4, name: 'Quinta-feira', short: 'Qui', emoji: '🧺' },
    { index: 5, name: 'Sexta-feira', short: 'Sex', emoji: '🎬' },
    { index: 6, name: 'Sábado', short: 'Sáb', emoji: '🌳' },
    { index: 0, name: 'Domingo', short: 'Dom', emoji: '🍝' }
  ];

  const handleOpenAddModal = (period: PeriodKey = 'manha', group: string = 'Geral') => {
    setEditingTaskId(null);
    setNewTitle('');
    setNewSubtitle('');
    setNewPeriod(period);
    setNewTime(period === 'manha' ? '08:00' : period === 'tarde' ? '14:00' : '20:00');
    setNewGroupName(group);
    setNewSubgroupName('Família');
    setIsAddModalOpen(true);
  };

  const handleSaveRoutineTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingTaskId) {
      updateRoutineTask(editingTaskId, {
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        period: newPeriod,
        time: newTime,
        groupName: newGroupName.trim() || 'Geral',
        subgroupName: newSubgroupName.trim() || undefined,
        reminder: {
          enabled: hasReminder,
          balloon: true,
          alarm: true,
          sound: true,
          voiceAlert: hasVoiceAlert
        }
      });
      showToast('Rotina atualizada com sucesso!');
    } else {
      addRoutineTask({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        period: newPeriod,
        time: newTime,
        groupName: newGroupName.trim() || 'Geral',
        subgroupName: newSubgroupName.trim() || undefined,
        reminder: {
          enabled: hasReminder,
          balloon: true,
          alarm: true,
          sound: true,
          voiceAlert: hasVoiceAlert
        }
      });
      showToast(`Rotina "${newTitle.trim()}" criada com sucesso!`);
    }

    setIsAddModalOpen(false);
  };

  const handleCreateDailyStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    addDailyChronologicalStep({
      time: newStepTime,
      title: newStepTitle.trim(),
      icon: newStepIcon,
      voiceAlert: true,
      period: 'manha'
    });
    setNewStepTitle('');
    setIsAddStepModalOpen(false);
    showToast('Etapa diária adicionada com sucesso!');
  };

  // Merge today's designated recurring tasks into the Daily Routine Timeline
  const todayDayOfWeek = new Date().getDay();
  const todayRecurringSteps = recurringTasks
    .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(todayDayOfWeek) : true))
    .map((t) => ({
      id: `rec-${t.id}`,
      time: t.time || '13:00',
      title: `🔁 ${t.title}`,
      icon: '🔁',
      completed: t.status === 'concluido',
      voiceAlert: true,
      period: 'tarde' as PeriodKey,
      isRecurringAuto: true
    }));

  const mergedChronologicalSteps = [...dailyChronologicalSteps, ...todayRecurringSteps].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const totalTasksCount = mergedChronologicalSteps.length;
  const completedTasksCount = mergedChronologicalSteps.filter((t) => t.completed).length;
  const routinePercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none relative">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#7D9D7F] shrink-0" />
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
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Minhas Rotinas</h1>
          <p className="text-[11px] text-[#8C7A6B]">O ritmo harmonioso do dia a dia</p>
        </div>

        <button
          onClick={() => setIsAddStepModalOpen(true)}
          className="w-9 h-9 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white flex items-center justify-center shadow-xs transition-colors"
          title="Adicionar etapa à rotina"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Progress Card */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 sm:p-5 mb-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)] flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B]">
            Progresso Geral
          </span>
          <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
            Rotina Diária Integrada
          </h2>
          <p className="text-xs text-[#8C7A6B]">
            {completedTasksCount} de {totalTasksCount} etapas concluídas hoje
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF5EF] border border-[#B7D2B9] flex items-center justify-center font-extrabold text-sm text-[#2C5230]">
            {routinePercentage}%
          </div>
        </div>
      </div>

      {/* 2 Subtabs: Rotina Diária Cronológica (Voz) & Visualização Semanal */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] p-1 rounded-2xl flex items-center mb-4 shadow-2xs gap-1">
        <button
          type="button"
          onClick={() => setSubTab('diaria')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'diaria'
              ? 'bg-[#8C7A6B] text-white shadow-2xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Rotina Diária (Voz)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('semanal')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'semanal'
              ? 'bg-[#8C7A6B] text-white shadow-2xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Visualização Semanal
        </button>
      </div>

      {/* ========================================================
          ABA 1: ROTINA DIÁRIA CRONOLÓGICA (INTEGRADA COM TAREFAS RECORRENTES DO DIA)
         ======================================================== */}
      {subTab === 'diaria' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                  Rotina Diária Cronológica
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Do café ao sono com lembretes por voz e tarefas do dia encaixadas
                </p>
              </div>

              <button
                onClick={() => setIsAddStepModalOpen(true)}
                className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Etapa</span>
              </button>
            </div>

            {/* Timeline List */}
            <div className="space-y-2.5 relative before:absolute before:top-3 before:bottom-3 before:left-4 before:w-0.5 before:bg-[#EFE8DE]">
              {mergedChronologicalSteps.map((step) => (
                <div
                  key={step.id}
                  className={`p-3 border rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs relative ml-1 transition-colors ${
                    step.isRecurringAuto
                      ? 'bg-[#FAF6F0] border-[#EADFCB]'
                      : 'bg-white border-[#EFE8DE] hover:border-[#8C7A6B]/40'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!step.isRecurringAuto) toggleDailyChronologicalStep(step.id);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        step.completed
                          ? 'bg-[#7D9D7F] text-white shadow-2xs'
                          : step.isRecurringAuto
                          ? 'bg-[#EAE0D2] text-[#5C4F44]'
                          : 'bg-[#F4EDE2] text-[#5C4F44]'
                      }`}
                    >
                      {step.completed ? '✓' : step.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#5C4F44] bg-[#F4EDE2] px-1.5 py-0.5 rounded text-[10px]">
                          {step.time}
                        </span>
                        <h4
                          className={`font-bold truncate ${
                            step.completed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                          }`}
                        >
                          {step.title}
                        </h4>
                      </div>
                      {step.isRecurringAuto && (
                        <span className="text-[10px] text-[#8C7A6B] font-semibold block mt-0.5">
                          Encaixado automaticamente das Tarefas Recorrentes
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Voice Reminder Trigger */}
                    <button
                      onClick={() =>
                        speakVoiceReminder(`Brenda, são ${step.time}. Hora de: ${step.title.replace('🔁 ', '')}`)
                      }
                      className="p-1.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B]"
                      title="Ouvir lembrete falado por voz"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {!step.isRecurringAuto && (
                      <button
                        onClick={() => deleteDailyChronologicalStep(step.id)}
                        className="p-1 text-[#A39385] hover:text-[#9E6C52]"
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 2: VISUALIZAÇÃO SEMANAL (Didática com Emojis)
         ======================================================== */}
      {subTab === 'semanal' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                Visualização Semanal
              </h2>
              <p className="text-xs text-[#8C7A6B]">
                Clique no dia da semana para consultar as tarefas do dia:
              </p>
            </div>

            {/* Days pills selector with emojis */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((wd) => {
                const isSelected = selectedDayIndex === wd.index;
                return (
                  <button
                    key={wd.index}
                    onClick={() => setSelectedDayIndex(wd.index)}
                    className={`p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#8C7A6B] text-white shadow-xs font-bold scale-105'
                        : 'bg-white border border-[#EFE8DE] text-[#4A3E34] hover:bg-[#F4EDE2]'
                    }`}
                  >
                    <span className="text-lg">{wd.emoji}</span>
                    <span className="text-[10px] font-bold">{wd.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected day container */}
            <div className="p-4 bg-white border border-[#EFE8DE] rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DE]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {weekDays.find((d) => d.index === selectedDayIndex)?.emoji || '☕'}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                      {weekDays.find((d) => d.index === selectedDayIndex)?.name}
                    </h3>
                    <p className="text-[10px] text-[#8C7A6B]">
                      Tarefas recorrentes deste dia da semana
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('recorrentes')}
                  className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl"
                >
                  <Plus className="w-3 h-3" />
                  <span>Gerenciar Tarefas</span>
                </button>
              </div>

              {/* Filter recurring tasks for selected day */}
              <div className="space-y-2">
                {recurringTasks
                  .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(selectedDayIndex) : true))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🔁</span>
                        <div>
                          <strong className="text-[#2C2C2C]">{t.title}</strong>
                          <span className="text-[10px] text-[#8C7A6B] block">
                            Horário: {t.time || '13:00'} • {t.recurrence}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                        Ativo
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR ETAPA DIÁRIA CRONOLÓGICA */}
      {isAddStepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-2xl relative space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏰</span>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Etapa Cronológica</h3>
              </div>
              <button
                onClick={() => setIsAddStepModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDailyStep} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Horário:</label>
                  <input
                    type="time"
                    required
                    value={newStepTime}
                    onChange={(e) => setNewStepTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4A3E34] mb-1">Emoji:</label>
                  <input
                    type="text"
                    value={newStepIcon}
                    onChange={(e) => setNewStepIcon(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3E34] mb-1">O que fazer:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beber água, Preparar almoço, Pausa para café..."
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-[#2C2C2C]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#8C7A6B] text-white font-bold"
                >
                  Salvar Etapa
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStepModalOpen(false)}
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

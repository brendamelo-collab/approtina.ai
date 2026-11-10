import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { todayISO } from '../../utils/dateUtils';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Smile,
  Sliders,
  Plus,
  Check,
  Calendar,
  Sparkles,
  Info,
  Clock,
  HelpCircle,
  BarChart2,
  ChevronRight,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import {
  calculatePerformanceMetrics,
  calculateAreaPerformance,
  formatBrazilianDate
} from '../../utils/routineCalculations';
import { DayPeriod, QuestionResponseValue, QuestionItem, MoodOption } from '../../types';
import { buildPeriod, bucketsFor, countAnswers, factorReport, moodReport } from '../../utils/reportStats';
import { BarSeries, EmptyState, ProgressRow } from '../reports/ReportCharts';

const FACTOR_EMOJIS = ['😴', '🔋', '👶', '💸', '⏳', '⚡', '🤕', '🌿', '☀️', '🤝', '🥗', '😰', '🎉', '🏠', '🚗', '💼', '🌧️', '❤️', '📚', '🙏'];

export const MeuMapaView: React.FC = () => {
  const {
    setActiveTab,
    selectedDate,
    setSelectedDate,
    lifeAreas,
    questionGroups,
    questions,
    questionResponses,
    setQuestionResponse,
    getQuestionResponse,
    recordChoiceResponse,
    availableFactors,
    addCustomFactor,
    updateCustomFactor,
    deleteCustomFactor,
    dayFactors,
    toggleDayFactor,
    dayNotes,
    setDayNotesForDate,
    moodRecords,
    savePeriodMood,
    deleteMoodRecord,
    getMoodRecordsForDate,
    moodOptions,
    addMoodOption,
    deleteMoodOption,
    setIsManageQuestionsModalOpen,
    setIsRelatoriosModalOpen
  } = useApp();

  // Subtab switcher: 'diario' (Registro Diário) vs 'resumo' (Resumo & Análises)
  const [subTab, setSubTab] = useState<'diario' | 'resumo'>('diario');
  const [saveToast, setSaveToast] = useState(false);

  // Vertical accordion sections
  const [openSections, setOpenSections] = useState<{
    humor: boolean;
    fatores: boolean;
    perguntas: boolean;
    resumo: boolean;
  }>({
    humor: true,
    fatores: true,
    perguntas: true,
    resumo: true
  });

  const toggleSection = (section: 'humor' | 'fatores' | 'perguntas' | 'resumo') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // State for active mood logging
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriod>('manha');
  const [selectedMoodId, setSelectedMoodId] = useState<string>(moodOptions[1]?.id || 'bem');
  const [intensity, setIntensity] = useState<number>(3);
  const [moodNotes, setMoodNotes] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('12:00');

  // Modal for Mood Management (Add/Delete/Choose moods)
  const [isMoodManagerOpen, setIsMoodManagerOpen] = useState(false);
  const [newMoodEmoji, setNewMoodEmoji] = useState('✨');
  const [newMoodLabel, setNewMoodLabel] = useState('');

  // State for adding custom factor
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [newFactorName, setNewFactorName] = useState('');
  const [newFactorIcon, setNewFactorIcon] = useState('✨');
  // Edit an existing factor (name + emoji) without losing the days already marked
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);
  const [editFactorLabel, setEditFactorLabel] = useState('');
  const [editFactorIcon, setEditFactorIcon] = useState('');

  // Expandable state for life areas inside questions section
  const [expandedAreaId, setExpandedAreaId] = useState<string>(lifeAreas[0]?.id || '');

  // Performance metrics calculated via MANDATORY RULE (excluding neutral answers from denominator)
  const metrics = calculatePerformanceMetrics(
    questionResponses.filter((r) => r.date === selectedDate),
    questions
  );

  const moodListForDay = getMoodRecordsForDate(selectedDate);
  // Per-day isolated factors (restarts for each selected day)
  const selectedFactorsForDay = dayFactors[selectedDate] || [];
  const selectedFactorLabels = Array.from(
    new Set(
      selectedFactorsForDay
        .map((x) => availableFactors.find((f) => f.id === x || f.label === x))
        .filter((f): f is NonNullable<typeof f> => !!f)
        .map((f) => `${f.icon ? `${f.icon} ` : ''}${f.label}`)
    )
  );

  // Resumo do mês (aba "Resumo & Análises") — só registros reais
  const monthPeriod = buildPeriod('mes', selectedDate);
  const monthBuckets = bucketsFor(monthPeriod.from, monthPeriod.to, 'semana');
  const monthAnswers = countAnswers(questions, questionResponses, monthPeriod.from, monthPeriod.to, todayISO());
  const monthMood = moodReport(moodRecords, moodOptions, monthPeriod, monthBuckets);
  const monthFactors = factorReport(dayFactors, availableFactors, monthPeriod);

  const periodOptions: { period: DayPeriod; label: string; icon: string }[] = [
    { period: 'manha', label: 'Manhã', icon: '☀️' },
    { period: 'tarde', label: 'Tarde', icon: '🏠' },
    { period: 'noite', label: 'Noite', icon: '🌙' },
    { period: 'personalizado', label: 'Horário Livre', icon: '⏰' }
  ];

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = moodOptions.find((m) => m.id === selectedMoodId) || moodOptions[0];
    savePeriodMood({
      date: selectedDate,
      period: selectedPeriod,
      customTime: selectedPeriod === 'personalizado' ? customTime : undefined,
      mood: chosen.id,
      label: chosen.label,
      intensity,
      notes: moodNotes.trim() || undefined
    });
    setMoodNotes('');
  };

  const handleAddMoodOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoodLabel.trim()) return;
    addMoodOption({
      emoji: newMoodEmoji || '✨',
      label: newMoodLabel.trim(),
      intensity: 3,
      visible: true
    });
    setNewMoodLabel('');
    setNewMoodEmoji('✨');
  };

  const handleCreateFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactorName.trim()) return;
    const id = addCustomFactor(newFactorName.trim(), newFactorIcon.trim() || '✨');
    toggleDayFactor(selectedDate, id);
    setNewFactorName('');
    setNewFactorIcon('✨');
    setIsAddingFactor(false);
  };

  const startEditFactor = (id: string) => {
    const f = availableFactors.find((x) => x.id === id);
    if (!f) return;
    setEditingFactorId(id);
    setEditFactorLabel(f.label);
    setEditFactorIcon(f.icon || '');
  };

  const handleSaveFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFactorId || !editFactorLabel.trim()) return;
    updateCustomFactor(editingFactorId, editFactorLabel.trim(), editFactorIcon.trim() || '✨');
    setEditingFactorId(null);
  };

  const handleDateChange = (daysDelta: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + daysDelta);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSaveAllRegistro = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none">
      {/* Toast Confirmation */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7D9D7F] shrink-0" />
            <span className="font-semibold">Registro do dia salvo com sucesso no Meu Mapa!</span>
          </div>
          <button onClick={() => setSaveToast(false)} className="text-white/70 hover:text-white p-1">
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
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Meu Mapa</h1>
          <p className="text-[11px] text-[#8C7A6B]">Acompanhamento & Bem-estar</p>
        </div>

        <button
          onClick={() => setIsManageQuestionsModalOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-1.5 rounded-full transition-colors shadow-2xs"
          title="Gerenciar estrutura de perguntas"
        >
          <Sliders className="w-3.5 h-3.5 text-[#8C7A6B]" />
          <span>Estrutura</span>
        </button>
      </div>

      {/* Subtab Switcher: Screen 2 vs Screen 3 */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] p-1 rounded-2xl flex items-center mb-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('diario')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'diario'
              ? 'bg-[#8C7A6B] text-white shadow-2xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Registro Diário
        </button>
        <button
          type="button"
          onClick={() => setSubTab('resumo')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'resumo'
              ? 'bg-[#8C7A6B] text-white shadow-2xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Resumo & Análises
        </button>
      </div>

      {/* =========================================================================
          SUBTAB 1: REGISTRO DIÁRIO (Humor, Fatores por dia e Hábitos Bons/Ruins)
         ========================================================================= */}
      {subTab === 'diario' && (
        <div className="space-y-4">
          {/* Day Navigation Banner */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <button
              onClick={() => handleDateChange(-1)}
              className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] px-2.5 py-1.5 rounded-xl bg-[#F4EDE2] transition-colors"
            >
              ◀ Ontem
            </button>

            <div className="text-center">
              <span className="text-xs sm:text-sm font-bold text-[#2C2C2C] block">
                {formatBrazilianDate(selectedDate)}
              </span>
              <span className="text-[10px] text-[#8C7A6B]">
                {selectedDate === todayISO() ? 'Hoje' : 'Data do registro'}
              </span>
            </div>

            <button
              onClick={() => handleDateChange(1)}
              className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] px-2.5 py-1.5 rounded-xl bg-[#F4EDE2] transition-colors"
            >
              Hoje ▶
            </button>
          </div>

          {/* ========================================================
              SEÇÃO 1: REGISTRO DE HUMOR (COM GESTÃO TOTAL DE HUMORES)
             ======================================================== */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
            <button
              onClick={() => toggleSection('humor')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
              aria-expanded={openSections.humor}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-xl">
                  😊
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                    1. Registo de Humor
                  </h2>
                  <p className="text-xs text-[#8C7A6B]">
                    Sentimento independente de metas comportamentais
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8C7A6B]">
                  {moodListForDay.length} registos
                </span>
                <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                  {openSections.humor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {openSections.humor && (
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-4">
                {/* Saved Mood Logs for Today */}
                {moodListForDay.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#5C4F44]">
                      Registos salvos para este dia:
                    </span>
                    <div className="space-y-1.5">
                      {moodListForDay.map((rec) => {
                        const opt = moodOptions.find((m) => m.id === rec.mood);
                        return (
                          <div
                            key={rec.id}
                            className="p-2.5 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{opt?.emoji || '😊'}</span>
                              <div>
                                <span className="font-bold text-[#2C2C2C]">{rec.label}</span>
                                <span className="text-[#8C7A6B] ml-1.5 text-[11px]">
                                  ({rec.period === 'personalizado' ? rec.customTime : rec.period})
                                </span>
                                {rec.notes && (
                                  <p className="text-[11px] text-[#6E5D4F] italic mt-0.5 line-clamp-1">
                                    "{rec.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#8C7A6B] bg-[#F4EDE2] px-2 py-0.5 rounded-full">
                                Nível {rec.intensity}/5
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteMoodRecord(rec.id)}
                                className="text-[#A39385] hover:text-[#9E6C52] p-1"
                                title="Excluir registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mood Logging Form */}
                <form onSubmit={handleSaveMood} className="space-y-3.5 pt-1">
                  {/* Momento do dia */}
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E34] mb-1.5">
                      Momento do dia:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {periodOptions.map((opt) => (
                        <button
                          key={opt.period}
                          type="button"
                          onClick={() => setSelectedPeriod(opt.period)}
                          className={`py-2 px-2.5 rounded-2xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                            selectedPeriod === opt.period
                              ? 'bg-[#8C7A6B] text-white border-[#8C7A6B] shadow-2xs font-bold'
                              : 'bg-white border-[#EFE8DE] text-[#6E5D4F] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selector & Button to Manage Moods */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#4A3E34]">
                        Como você está se sentindo?
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsMoodManagerOpen(true)}
                        className="text-[11px] font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Gerenciar Humores</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {moodOptions.map((opt) => {
                        const isSelected = selectedMoodId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedMoodId(opt.id)}
                            className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs transition-all ${
                              isSelected
                                ? 'bg-[#8C7A6B] text-white border-[#8C7A6B] font-bold shadow-2xs'
                                : 'bg-white border-[#EFE8DE] text-[#2C2C2C] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Intensity rating 1 to 5 */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#4A3E34] mb-1.5">
                      <span>Intensidade emocional:</span>
                      <span className="text-[#8C7A6B]">{intensity} - {intensity >= 4 ? 'Alta' : intensity === 3 ? 'Moderada' : 'Suave'}</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setIntensity(lvl)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            intensity === lvl
                              ? 'bg-[#8C7A6B] text-white shadow-2xs'
                              : 'bg-white border border-[#EFE8DE] text-[#6E5D4F] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observation / Free notes */}
                  <div>
                    <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                      Acontecimentos ou observações do momento:
                    </label>
                    <textarea
                      value={moodNotes}
                      onChange={(e) => setMoodNotes(e.target.value)}
                      placeholder="Ex: Tivemos um momento afetuoso no café da manhã / Me senti um pouco ansiosa com o trabalho..."
                      className="w-full bg-white border border-[#EFE8DE] rounded-2xl p-3 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B] resize-none h-18 placeholder:text-[#B2A396]"
                    />
                  </div>

                  <div className="bg-[#FAF5ED] p-2.5 rounded-xl border border-[#EAE0D2] flex items-center gap-2 text-[11px] text-[#6E5D4F]">
                    <Info className="w-3.5 h-3.5 text-[#8C7A6B] shrink-0" />
                    <span>
                      O humor é um registo de acolhimento emocional e não altera suas métricas de desempenho.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Gravar Registo deste Momento</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ========================================================
              SEÇÃO 2: FATORES QUE INFLUENCIARAM O DIA (RESET DIÁRIO)
             ======================================================== */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
            <button
              onClick={() => toggleSection('fatores')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
              aria-expanded={openSections.fatores}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-xl">
                  🌱
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                    2. Fatores do Dia
                  </h2>
                  <p className="text-xs text-[#8C7A6B]">
                    Contextos que impactaram seu dia e sua rotina (seleção reinicia por dia)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8C7A6B]">
                  {selectedFactorsForDay.length} ativos
                </span>
                <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                  {openSections.fatores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {openSections.fatores && (
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-3">
                <p className="text-xs text-[#6E5D4F]">
                  Selecione os fatores presentes em <strong>{formatBrazilianDate(selectedDate)}</strong>:
                </p>

                {/* Factors Chips */}
                <div className="flex flex-wrap gap-2">
                  {availableFactors.map((f) => {
                    const isSelected = selectedFactorsForDay.includes(f.id) || selectedFactorsForDay.includes(f.label);
                    return (
                      <div
                        key={f.id}
                        className={`inline-flex items-center rounded-2xl text-xs transition-all border ${
                          isSelected
                            ? 'bg-[#8C7A6B] text-white border-[#8C7A6B] shadow-2xs font-semibold'
                            : 'bg-[#F4EDE2] text-[#4A3E34] hover:bg-[#EAE0D2] border-[#EAE3D6]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDayFactor(selectedDate, f.id)}
                          className="px-3 py-2 flex items-center gap-1.5 focus:outline-none"
                        >
                          {f.icon && <span>{f.icon}</span>}
                          <span>{f.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditFactor(f.id);
                          }}
                          className={`p-1 rounded-full opacity-70 hover:opacity-100 ${
                            isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-[#EAE0D2] text-[#8C7A6B]'
                          }`}
                          title="Editar nome e emoji"
                          aria-label={`Editar ${f.label}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomFactor(f.id);
                          }}
                          className={`p-1 mr-1 rounded-full opacity-60 hover:opacity-100 ${
                            isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-[#EAE0D2] text-[#8C7A6B]'
                          }`}
                          title="Excluir fator da lista"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Edit factor: name + emoji (the days already marked keep this factor) */}
                {editingFactorId && (
                  <form onSubmit={handleSaveFactor} className="bg-white border border-[#EFE8DE] rounded-2xl p-3 space-y-2.5">
                    <p className="text-xs font-bold text-[#4A3E34]">Editar fator</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editFactorIcon}
                        onChange={(e) => setEditFactorIcon(e.target.value)}
                        className="w-14 shrink-0 text-center text-lg bg-[#F7F4EE] border border-[#EFE8DE] rounded-xl py-1.5 focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
                        aria-label="Emoji do fator"
                        maxLength={8}
                      />
                      <input
                        type="text"
                        value={editFactorLabel}
                        onChange={(e) => setEditFactorLabel(e.target.value)}
                        className="flex-1 min-w-0 text-xs text-[#2C2C2C] bg-[#F7F4EE] border border-[#EFE8DE] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
                        aria-label="Nome do fator"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {FACTOR_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEditFactorIcon(em)}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${
                            editFactorIcon === em ? 'bg-[#EAE0D2] ring-1 ring-[#8C7A6B]' : 'bg-[#F7F4EE] hover:bg-[#EAE0D2]'
                          }`}
                          aria-label={`Usar ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#8C7A6B]">Os dias em que você já marcou este fator continuam registrados.</p>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-2 bg-[#8C7A6B] text-white text-xs font-bold rounded-xl">
                        Salvar
                      </button>
                      <button type="button" onClick={() => setEditingFactorId(null)} className="px-3 py-2 text-xs font-bold text-[#8C7A6B] bg-[#F4EDE2] rounded-xl">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Add Custom Factor */}
                <div className="pt-2">
                  {!isAddingFactor ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingFactor(true)}
                      className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#F4EDE2]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar novo fator personalizado</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateFactor} className="flex flex-wrap items-center gap-2 bg-white border border-[#EFE8DE] p-2 rounded-2xl">
                      <input
                        type="text"
                        value={newFactorIcon}
                        onChange={(e) => setNewFactorIcon(e.target.value)}
                        className="w-11 shrink-0 text-center text-base bg-[#F7F4EE] rounded-xl py-1.5 focus:outline-none"
                        aria-label="Emoji do novo fator"
                        maxLength={8}
                      />
                      <input
                        type="text"
                        placeholder="Ex: Visita inesperada, Reforma..."
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        className="flex-1 min-w-[8rem] bg-transparent text-xs text-[#2C2C2C] focus:outline-none px-2 py-1.5"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#8C7A6B] text-white text-xs font-bold rounded-xl"
                      >
                        Adicionar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingFactor(false)}
                        className="px-2 py-1 text-xs text-[#8C7A6B]"
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              SEÇÃO 3: HÁBITOS BONS E RUINS SEPARADOS VISUALMENTE DENTRO DE CADA GRUPO
             ========================================================================= */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
            <button
              onClick={() => toggleSection('perguntas')}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
              aria-expanded={openSections.perguntas}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-xl">
                  📝
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                    3. Hábitos e Perguntas Diárias
                  </h2>
                  <p className="text-xs text-[#8C7A6B]">
                    Hábitos bons e comportamentos a evitar separados por grupo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8C7A6B]">
                  {metrics.totalResponses}/{questions.length} respondidas
                </span>
                <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                  {openSections.perguntas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {openSections.perguntas && (
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-4">
                {/* Visual Legend with actual colors, WITHOUT writing color names in text */}
                <div className="bg-[#F7F2EA] border border-[#EAE0D2] p-3 rounded-2xl">
                  <span className="text-[11px] font-bold text-[#4A3E34] block mb-1.5">
                    Legenda das 4 Opções de Resposta:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                    {/* Verde */}
                    <div className="bg-[#EEF5EF] text-[#2C5230] border border-[#B7D2B9] px-2 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#487E50]" />
                      <span>Positivo</span>
                    </div>
                    {/* Vermelho */}
                    <div className="bg-[#FDF2EE] text-[#8C3A24] border border-[#E8C2B8] px-2 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C0563C]" />
                      <span>Negativo</span>
                    </div>
                    {/* Cinza */}
                    <div className="bg-[#F0ECE4] text-[#5C4F44] border border-[#DCD3C5] px-2 py-1 rounded-lg font-medium flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9E9488]" />
                      <span>Não se aplica</span>
                    </div>
                    {/* Amarelo */}
                    <div className="bg-[#FEF9E7] text-[#8C6D1F] border border-[#EADB9B] px-2 py-1 rounded-lg font-medium flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
                      <span>Não lembro</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8C7A6B] mt-1.5 leading-snug">
                    * Respostas em Cinza e Amarelo são neutras: nunca diminuem seu percentual nem contam como negativas.
                  </p>
                </div>

                {/* Vertical Areas Accordion List */}
                <div className="space-y-3">
                  {lifeAreas.map((area) => {
                    const areaGroups = questionGroups.filter((g) => g.areaId === area.id);
                    const areaQuestions = questions.filter((q) => q.areaId === area.id);
                    const areaPerf = calculateAreaPerformance(
                      area.id,
                      questionResponses.filter((r) => r.date === selectedDate),
                      questions
                    );
                    const isExpanded = expandedAreaId === area.id;

                    return (
                      <div
                        key={area.id}
                        className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl overflow-hidden transition-all"
                      >
                        {/* Area Header Bar */}
                        <button
                          type="button"
                          onClick={() => setExpandedAreaId(isExpanded ? '' : area.id)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F9F6F0] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{area.icon || '📌'}</span>
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                                {area.name}
                              </h3>
                              <span className="text-[10px] text-[#8C7A6B]">
                                {areaQuestions.length} perguntas cadastradas
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {areaPerf.hasEvaluatedAnswers ? (
                              <span className="text-xs font-extrabold text-[#5C4F44] bg-[#EFE8DE] px-2.5 py-0.5 rounded-full">
                                {areaPerf.positivePercentage}% positivo
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8C7A6B] bg-[#F7F4EE] px-2 py-0.5 rounded-full">
                                Sem avaliação
                              </span>
                            )}
                            <div className="w-6 h-6 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </button>

                        {/* Area Content */}
                        {isExpanded && (
                          <div className="p-3.5 border-t border-[#EFE8DE]/60 space-y-4 bg-[#FCFAF6]">
                            {areaGroups.length === 0 ? (
                              <p className="text-xs text-center text-[#8C7A6B] py-2">
                                Nenhum grupo cadastrado nesta área.
                              </p>
                            ) : (
                              areaGroups.map((grp) => {
                                const grpQuestions = questions.filter((q) => q.groupId === grp.id);
                                if (grpQuestions.length === 0) return null;

                                // STRICT SEPARATION: Bons first, then Ruins!
                                const bonsQuestions = grpQuestions.filter((q) => q.habitType === 'bom');
                                const ruinsQuestions = grpQuestions.filter((q) => q.habitType === 'ruim');

                                return (
                                  <div key={grp.id} className="space-y-3 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE3D6]">
                                    {/* Group Title */}
                                    <div className="flex items-center justify-between border-b border-[#EAE0D2] pb-1.5">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A3E34]">
                                        <span className="w-2 h-2 rounded-full bg-[#8C7A6B]" />
                                        <span>{grp.name}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setIsManageQuestionsModalOpen(true)}
                                        className="text-[10px] font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2 py-0.5 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>+ Pergunta</span>
                                      </button>
                                    </div>

                                    {/* 1. Hábitos Bons (Indicador Verde 🟢) */}
                                    {bonsQuestions.length > 0 && (
                                      <div className="space-y-2.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2.5 py-1 rounded-xl w-fit border border-[#B7D2B9]">
                                          <span className="w-2 h-2 rounded-full bg-[#3B7A42]" />
                                          <span>Hábitos Desejáveis (Coisas Boas)</span>
                                        </div>

                                        {bonsQuestions.map((q) => renderQuestionCard(q))}
                                      </div>
                                    )}

                                    {/* 2. Hábitos Ruins (Indicador Vermelho 🔴) */}
                                    {ruinsQuestions.length > 0 && (
                                      <div className="space-y-2.5 pt-2 border-t border-[#EAE0D2]/70">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C3A24] bg-[#FDF2EE] px-2.5 py-1 rounded-xl w-fit border border-[#E8C2B8]">
                                          <span className="w-2 h-2 rounded-full bg-[#B8472E]" />
                                          <span>Comportamentos a Evitar (Atenção)</span>
                                        </div>

                                        {ruinsQuestions.map((q) => renderQuestionCard(q))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Structure Button */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsManageQuestionsModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Sliders className="w-4 h-4 text-[#8C7A6B]" />
                    <span>Personalizar Áreas, Grupos e Perguntas</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Big Action Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveAllRegistro}
              className="w-full py-3.5 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Salvar registro</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUBTAB 2: RESUMO & ANÁLISES (Screen 3 da Colagem)
         ========================================================================= */}
      {subTab === 'resumo' && (
        <div className="space-y-4">
          {/* Mês do dia selecionado, calculado só com registros reais */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#2C2C2C] leading-snug">Seu mês até agora</h2>
                <p className="text-[11px] text-[#8C7A6B] capitalize">{monthPeriod.label}</p>
              </div>
              <div
                className={`shrink-0 w-20 rounded-2xl border flex flex-col items-center justify-center text-center py-2 ${
                  monthAnswers.pctPositivo === null ? 'bg-white border-[#EFE8DE]' : 'bg-[#EEF5EF] border-[#B7D2B9]'
                }`}
              >
                <span className={`text-lg font-extrabold leading-none ${monthAnswers.pctPositivo === null ? 'text-[#B4A597]' : 'text-[#2C5230]'}`}>
                  {monthAnswers.pctPositivo === null ? '—' : `${monthAnswers.pctPositivo}%`}
                </span>
                <span className="text-[10px] font-semibold text-[#3B663F] mt-0.5">positivo</span>
              </div>
            </div>
            <p className="text-[11px] text-[#5C4F44] leading-snug">
              {monthAnswers.validas
                ? `${monthAnswers.positivo} positivas e ${monthAnswers.negativo} negativas em ${monthAnswers.validas} respostas válidas.`
                : 'Ainda sem respostas válidas neste mês.'}
            </p>
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#4A3E34]">Humor por semana (média de 1 a 5)</p>
              <BarSeries
                values={monthMood.series}
                labels={monthBuckets.map((b) => b.label)}
                max={5}
                tone="accent"
                format={(v) => String(v).replace('.', ',')}
                emptyText="Registre seu humor para ver a evolução."
              />
            </div>
          </div>

          {/* Fatores mais marcados no mês */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-2.5">
            <h2 className="text-sm font-bold text-[#2C2C2C]">Principais fatores do mês</h2>
            {monthFactors.rows.filter((r) => r.days > 0).length === 0 ? (
              <EmptyState hint="Marque os fatores do dia para ver quais mais aparecem." />
            ) : (
              monthFactors.rows
                .filter((r) => r.days > 0)
                .slice(0, 5)
                .map((r) => (
                  <ProgressRow
                    key={r.factor.id}
                    label={`${r.factor.icon ? `${r.factor.icon} ` : ''}${r.factor.label}`}
                    value={r.pctDays}
                    tone="gold"
                    detail={`${r.days} de ${monthFactors.daysMarked} dias com fatores marcados`}
                  />
                ))
            )}
          </div>

          {/* Resumo do dia selecionado */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#2C2C2C] leading-snug">Resumo do dia</h2>
                <p className="text-[11px] text-[#8C7A6B]">{formatBrazilianDate(selectedDate)}</p>
              </div>
              <span className="shrink-0 text-xs font-extrabold text-[#5C4F44] bg-[#EFE8DE] px-2.5 py-0.5 rounded-full">
                {metrics.hasEvaluatedAnswers ? `${metrics.positivePercentage}% positivo` : 'Sem respostas'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-[#EFE8DE] rounded-2xl p-2">
                <p className="text-lg font-extrabold text-[#2C5230] leading-none">{metrics.positivoCount}</p>
                <p className="text-[10px] text-[#8C7A6B] mt-1">Positivas</p>
              </div>
              <div className="bg-white border border-[#EFE8DE] rounded-2xl p-2">
                <p className="text-lg font-extrabold text-[#8C3A24] leading-none">{metrics.negativoCount}</p>
                <p className="text-[10px] text-[#8C7A6B] mt-1">Negativas</p>
              </div>
              <div className="bg-white border border-[#EFE8DE] rounded-2xl p-2">
                <p className="text-lg font-extrabold text-[#5C4F44] leading-none">{metrics.neutralCount}</p>
                <p className="text-[10px] text-[#8C7A6B] mt-1 leading-tight">Não se aplica / não lembro</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#4A3E34]">Por área da vida</h4>
              {lifeAreas.map((area) => {
                const areaPerf = calculateAreaPerformance(
                  area.id,
                  questionResponses.filter((r) => r.date === selectedDate),
                  questions
                );
                return (
                  <div key={area.id} className="p-2.5 rounded-xl bg-white border border-[#EFE8DE] flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0">{area.icon || '📌'}</span>
                      <span className="font-semibold text-[#2C2C2C] truncate">{area.name}</span>
                    </span>
                    <span className="shrink-0 font-extrabold text-[#5C4F44]">
                      {areaPerf.hasEvaluatedAnswers ? `${areaPerf.positivePercentage}% positivo` : 'Sem respostas'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#6E5D4F] bg-[#FAF5ED] p-3 rounded-2xl border border-[#EAE0D2] leading-snug">
              Fatores marcados neste dia:{' '}
              <strong>{selectedFactorLabels.length ? selectedFactorLabels.join(', ') : 'nenhum'}</strong>
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('relatorios')}
              className="w-full py-2.5 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-xs transition-colors shadow-2xs inline-flex items-center justify-center gap-1"
            >
              Ver relatórios completos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE GESTÃO DE HUMORES (ADICIONAR / EXCLUIR / VISIBILIDADE)
         ========================================================================= */}
      {isMoodManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-[#8C7A6B]" />
                <h3 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                  Gerenciar Opções de Humor
                </h3>
              </div>
              <button
                onClick={() => setIsMoodManagerOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of current moods */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              <span className="text-xs font-bold text-[#5C4F44] block">
                Humores Cadastrados ({moodOptions.length}):
              </span>
              {moodOptions.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.emoji}</span>
                    <span className="font-bold text-[#2C2C2C]">{m.label}</span>
                  </div>
                  <button
                    onClick={() => deleteMoodOption(m.id)}
                    disabled={moodOptions.length <= 2}
                    className="p-1 text-[#A39385] hover:text-[#9E6C52] disabled:opacity-30"
                    title="Excluir humor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add New Mood Form */}
              <form onSubmit={handleAddMoodOption} className="pt-3 border-t border-[#EFE8DE] space-y-2">
                <span className="text-xs font-bold text-[#5C4F44] block">
                  Adicionar Novo Humor:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMoodEmoji}
                    onChange={(e) => setNewMoodEmoji(e.target.value)}
                    className="w-14 bg-white border border-[#EFE8DE] rounded-xl px-2 py-2 text-center text-lg"
                    placeholder="Emoji"
                  />
                  <input
                    type="text"
                    value={newMoodLabel}
                    onChange={(e) => setNewMoodLabel(e.target.value)}
                    className="flex-1 bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs"
                    placeholder="Nome do humor (ex: Inspirada, Tranquila...)"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#8C7A6B] text-white font-bold text-xs hover:bg-[#786657]"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-[#EFE8DE] flex justify-end">
              <button
                onClick={() => setIsMoodManagerOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#8C7A6B] text-white font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for each question card
  function renderQuestionCard(q: QuestionItem) {
    const resp = getQuestionResponse(q.id, selectedDate);
    const isSimPositive = q.positiveIf === 'sim';
    const isSimActive =
      resp?.choice === 'sim' ||
      (!resp?.choice && resp?.value === (isSimPositive ? 'positivo' : 'negativo'));
    const isNaoActive =
      resp?.choice === 'nao' ||
      (!resp?.choice && resp?.value === (isSimPositive ? 'negativo' : 'positivo'));
    const isNaActive =
      resp?.choice === 'nao_se_aplica' || resp?.value === 'nao_se_aplica';
    const isNaoLembroActive =
      resp?.choice === 'nao_lembro' || resp?.value === 'nao_lembro';

    const isGoodHabit = q.habitType === 'bom';

    return (
      <div
        key={q.id}
        className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2.5 shadow-2xs"
      >
        {/* Question Header with Clear Red/Green Symbol */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-start gap-1.5">
              {/* Color Dot Indicator for Good vs Habit to Avoid */}
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                  isGoodHabit ? 'bg-[#3B7A42]' : 'bg-[#B8472E]'
                }`}
                title={isGoodHabit ? 'Hábito Desejável (Bom)' : 'Comportamento a Evitar (Atenção)'}
              />
              <h4 className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-snug">
                {q.title}
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap pl-4">
              {isGoodHabit ? (
                <span className="text-[10px] text-[#2C5230] font-semibold">
                  Hábito desejável • [Sim] é Positivo
                </span>
              ) : (
                <span className="text-[10px] text-[#8C3A24] font-semibold">
                  A evitar • [Sim] é Negativo
                </span>
              )}

              {resp?.value === 'positivo' && (
                <span className="text-[10px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-md border border-[#B7D2B9]">
                  ✓ Positivo
                </span>
              )}
              {resp?.value === 'negativo' && (
                <span className="text-[10px] font-bold text-[#8C3A24] bg-[#FDF2EE] px-2 py-0.5 rounded-md border border-[#E8C2B8]">
                  ✕ Negativo
                </span>
              )}
              {resp?.value === 'nao_se_aplica' && (
                <span className="text-[10px] font-semibold text-[#5C4F44] bg-[#F0ECE4] px-2 py-0.5 rounded-md">
                  — Não se aplica
                </span>
              )}
              {resp?.value === 'nao_lembro' && (
                <span className="text-[10px] font-semibold text-[#8C6D1F] bg-[#FEF9E7] px-2 py-0.5 rounded-md">
                  ? Não lembro
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Response Buttons with ACTUAL COLORS, NO COLOR NAMES WRITTEN IN TEXT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {/* Button 1: Sim */}
          <button
            type="button"
            onClick={() => recordChoiceResponse(q.id, selectedDate, 'sim')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              isSimPositive
                ? isSimActive
                  ? 'bg-[#EEF5EF] text-[#1E3B21] border-[#7D9D7F] ring-2 ring-[#7D9D7F]/40 shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#2C5230] border-[#D3E4D5] hover:bg-[#EEF5EF]'
                : isSimActive
                  ? 'bg-[#FDF2EE] text-[#6E2A18] border-[#C06C54] ring-2 ring-[#C06C54]/40 shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#8C3A24] border-[#F0D5CD] hover:bg-[#FDF2EE]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSimPositive ? 'bg-[#3B7A42]' : 'bg-[#B8472E]'
              }`}
            />
            <span>{isSimPositive ? '✓ Sim' : '✕ Sim'}</span>
          </button>

          {/* Button 2: Não */}
          <button
            type="button"
            onClick={() => recordChoiceResponse(q.id, selectedDate, 'nao')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              !isSimPositive
                ? isNaoActive
                  ? 'bg-[#EEF5EF] text-[#1E3B21] border-[#7D9D7F] ring-2 ring-[#7D9D7F]/40 shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#2C5230] border-[#D3E4D5] hover:bg-[#EEF5EF]'
                : isNaoActive
                  ? 'bg-[#FDF2EE] text-[#6E2A18] border-[#C06C54] ring-2 ring-[#C06C54]/40 shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#8C3A24] border-[#F0D5CD] hover:bg-[#FDF2EE]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isSimPositive ? 'bg-[#3B7A42]' : 'bg-[#B8472E]'
              }`}
            />
            <span>{!isSimPositive ? '✓ Não' : '✕ Não'}</span>
          </button>

          {/* Button 3: Não se aplica (CINZA) */}
          <button
            type="button"
            onClick={() => recordChoiceResponse(q.id, selectedDate, 'nao_se_aplica')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              isNaActive
                ? 'bg-[#EAE4D9] text-[#2C2C2C] border-[#B8AEA0] ring-2 ring-[#B8AEA0]/40 shadow-xs font-bold'
                : 'bg-[#FAF8F5] text-[#5C4F44] border-[#E8E2D5] hover:bg-[#F0ECE4]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#9E9488]" />
            <span>— N/A</span>
          </button>

          {/* Button 4: Não lembro (AMARELO) */}
          <button
            type="button"
            onClick={() => recordChoiceResponse(q.id, selectedDate, 'nao_lembro')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              isNaoLembroActive
                ? 'bg-[#FEF9E7] text-[#5A4510] border-[#D4A017] ring-2 ring-[#D4A017]/40 shadow-xs font-bold'
                : 'bg-[#FAF8F5] text-[#8C6D1F] border-[#EADB9B] hover:bg-[#FEF9E7]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D4A017]" />
            <span>? Não lembro</span>
          </button>
        </div>
      </div>
    );
  }
};

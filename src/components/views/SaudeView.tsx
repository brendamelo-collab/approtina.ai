import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  Plus,
  Pill,
  Calendar,
  FileText,
  Check,
  Trash2,
  Clock,
  User,
  Heart,
  X,
  Stethoscope,
  Activity,
  Bell,
  Eye,
  TrendingUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { calculateHealthCompliance } from '../../utils/routineCalculations';
import { healthMetricSeries } from '../../utils/reportStats';
import { EmptyState, LineSeries } from '../reports/ReportCharts';
import { HealthDateItem, HealthMedication, HealthNoteItem } from '../../types';

export const SaudeView: React.FC = () => {
  const {
    setActiveTab,
    profiles,
    healthDateItems,
    addHealthDateItem,
    toggleHealthDateItem,
    deleteHealthDateItem,
    healthMedications,
    addHealthMedication,
    toggleHealthMedication,
    deleteHealthMedication,
    healthNoteItems,
    addHealthNoteItem,
    deleteHealthNoteItem,
    triggerAlarm
  } = useApp();

  // Active Main Tab: 'datas' | 'medicamentos' | 'anotacoes'
  const [activeMainTab, setActiveMainTab] = useState<'datas' | 'medicamentos' | 'anotacoes'>('datas');

  // Member filter: 'todos' | memberId
  const [selectedMember, setSelectedMember] = useState<string>('todos');

  // Evolution Report Modal state
  const [isEvolutionReportOpen, setIsEvolutionReportOpen] = useState(false);
  const [evolutionMemberId, setEvolutionMemberId] = useState<string>('p1');
  const [evolutionMetricType, setEvolutionMetricType] = useState<string>('Pressão');

  // Add Item Modals
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // Form states - Datas
  const [dateTitle, setDateTitle] = useState('');
  const [dateMemberId, setDateMemberId] = useState('p1');
  const [dateDate, setDateDate] = useState('');
  const [dateTime, setDateTime] = useState('10:00');
  const [dateType, setDateType] = useState<'consulta' | 'exame' | 'vacina' | 'prazo' | 'outro'>('exame');
  const [dateProfessional, setDateProfessional] = useState('');
  const [dateIsRecurring, setDateIsRecurring] = useState(false);
  const [dateRecurrenceInterval, setDateRecurrenceInterval] = useState<'anual' | 'semestral' | 'mensal'>('anual');
  const [dateRecurrenceMonth, setDateRecurrenceMonth] = useState('Setembro');

  // Form states - Medicamentos
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Todos os dias');
  const [medMemberId, setMedMemberId] = useState('p1');
  const [medTime, setMedTime] = useState('08:00');
  const [medCategory, setMedCategory] = useState<'medicamento' | 'suplemento' | 'cuidado'>('medicamento');

  // Form states - Anotações
  const [noteTitle, setNoteTitle] = useState('');
  const [noteMemberId, setNoteMemberId] = useState('p1');
  const [noteCategory, setNoteCategory] = useState<'medicao' | 'exame' | 'geral' | 'alergia'>('medicao');
  const [noteContent, setNoteContent] = useState('');
  const [noteMetricLabel, setNoteMetricLabel] = useState('Pressão');
  const [noteMetricValue, setNoteMetricValue] = useState('12/8');

  // Filtering
  const filteredDates = healthDateItems.filter(
    (item) => selectedMember === 'todos' || item.memberId === selectedMember
  );

  const filteredMeds = healthMedications.filter(
    (item) => selectedMember === 'todos' || item.memberId === selectedMember
  );

  const filteredNotes = healthNoteItems.filter(
    (item) => selectedMember === 'todos' || item.memberId === selectedMember
  );

  const { total, confirmed, percent } = calculateHealthCompliance(healthMedications);

  const handleCreateDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTitle.trim()) return;

    const member = profiles.find((p) => p.id === dateMemberId) || profiles[0];

    const isRec = dateIsRecurring;
    const recMonth = dateRecurrenceMonth || 'Setembro';
    const statusLabel = isRec
      ? `Recorrente: Todo ano em ${recMonth}`
      : 'Prazo Único';

    addHealthDateItem({
      title: dateTitle.trim(),
      memberId: member.id,
      memberName: member.name,
      date: dateDate || new Date().toISOString().split('T')[0],
      time: dateTime,
      type: dateType,
      professionalOrClinic: dateProfessional.trim() || undefined,
      isRecurring: isRec,
      recurrenceInterval: dateRecurrenceInterval,
      recurrenceMonth: recMonth,
      statusLabel
    });

    setDateTitle('');
    setDateProfessional('');
    setDateIsRecurring(false);
    setIsAddDateModalOpen(false);
  };

  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const member = profiles.find((p) => p.id === medMemberId) || profiles[0];

    addHealthMedication({
      name: medName.trim(),
      dosage: medDosage.trim() || '1 dose',
      frequency: medFrequency.trim() || 'Diariamente',
      memberId: member.id,
      memberName: member.name,
      time: medTime,
      category: medCategory,
      alarmEnabled: true,
      balloonAlert: true,
    });

    setMedName('');
    setMedDosage('');
    setIsAddMedicationModalOpen(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const member = profiles.find((p) => p.id === noteMemberId) || profiles[0];

    const metrics = noteMetricLabel.trim() && noteMetricValue.trim()
      ? [{ label: noteMetricLabel.trim(), value: noteMetricValue.trim() }]
      : undefined;

    addHealthNoteItem({
      title: noteTitle.trim(),
      memberId: member.id,
      memberName: member.name,
      category: noteCategory,
      date: new Date().toLocaleDateString('pt-BR'),
      content: noteContent.trim() || 'Nenhuma observação adicional.',
      metrics
    });

    setNoteTitle('');
    setNoteContent('');
    setIsAddNoteModalOpen(false);
  };

  // SVG Donut math
  const radius = 36;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Filter notes for Evolution Report
  const memberForReport = profiles.find((p) => p.id === evolutionMemberId) || profiles[0];
  const memberNotes = healthNoteItems.filter((n) => n.memberId === memberForReport?.id && n.metrics && n.metrics.length > 0);
  const metricSeries = healthMetricSeries(memberNotes);

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none relative">
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
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Módulo Saúde</h1>
          <p className="text-[11px] text-[#8C7A6B]">Consultas, Prazos Recorrentes & Medicamentos</p>
        </div>

        <button
          onClick={() => {
            if (activeMainTab === 'datas') setIsAddDateModalOpen(true);
            else if (activeMainTab === 'medicamentos') setIsAddMedicationModalOpen(true);
            else setIsAddNoteModalOpen(true);
          }}
          className="w-9 h-9 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white flex items-center justify-center shadow-xs transition-colors"
          title="Adicionar novo registro"
          aria-label="Adicionar item de saúde"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Main Segmented Tabs: Datas | Medicamentos | Anotações */}
      <div className="flex bg-[#F4EDE2] p-1 rounded-2xl mb-3.5">
        <button
          onClick={() => setActiveMainTab('datas')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'datas'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#B78A58]" />
          <span>Datas & Prazos</span>
        </button>
        <button
          onClick={() => setActiveMainTab('medicamentos')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'medicamentos'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-[#7D9D7F]" />
          <span>Medicamentos</span>
        </button>
        <button
          onClick={() => setActiveMainTab('anotacoes')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'anotacoes'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#9E6C52]" />
          <span>Anotações</span>
        </button>
      </div>

      {/* Family Member Filter Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedMember('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedMember === 'todos'
              ? 'bg-[#8C7A6B] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5C4F44] border border-[#EFE8DE] hover:bg-[#F4EDE2]'
          }`}
        >
          Todos
        </button>
        {profiles.map((p) => {
          const isSelected = selectedMember === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedMember(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#8C7A6B] text-white shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#5C4F44] border border-[#EFE8DE] hover:bg-[#F4EDE2]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#EAE0D2] text-[#5C4F44] text-[10px] flex items-center justify-center font-bold">
                {p.name.charAt(0)}
              </span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          ABA 1: DATAS & PRAZOS RECORRENTES (ex: Exames anuais)
         ======================================================== */}
      {activeMainTab === 'datas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#2C2C2C]">
              Consultas, Exames & Prazos Recorrentes
            </h2>
            <button
              onClick={() => setIsAddDateModalOpen(true)}
              className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Data</span>
            </button>
          </div>

          {filteredDates.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-8 text-center space-y-2">
              <Stethoscope className="w-8 h-8 text-[#B78A58] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhuma data cadastrada</h3>
              <p className="text-xs text-[#8C7A6B]">
                Cadastre consultas ou exames recorrentes (ex: Exame de sangue todo ano em Setembro).
              </p>
            </div>
          ) : (
            filteredDates.map((item: HealthDateItem) => {
              const isDone = item.completed;
              const typeEmoji =
                item.type === 'consulta'
                  ? '🩺'
                  : item.type === 'exame'
                  ? '🔬'
                  : item.type === 'vacina'
                  ? '💉'
                  : '📅';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all shadow-2xs space-y-2.5 ${
                    isDone
                      ? 'bg-[#F2ECE2] border-[#DDD3C5] opacity-80'
                      : 'bg-[#FAF8F5] border-[#EFE8DE] hover:bg-[#F9F6F1]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-[#F7EEE3] border border-[#EAE0D2] flex items-center justify-center text-xl shrink-0">
                        {typeEmoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3
                            className={`text-xs sm:text-sm font-bold leading-snug break-words ${
                              isDone ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-semibold text-[#5C4F44] bg-[#EAE0D2] px-2 py-0.5 rounded-full shrink-0">
                            {item.memberName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8C7A6B] mt-0.5 leading-snug break-words">
                          Data: <strong>{/^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date.split('-').reverse().join('/') : item.date}</strong> {item.time ? `• ${item.time}` : ''}{' '}
                          {item.professionalOrClinic ? `• ${item.professionalOrClinic}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        onClick={() => toggleHealthDateItem(item.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-2xs ${
                          isDone
                            ? 'bg-[#7D9D7F] text-white'
                            : 'bg-[#EAE0D2] hover:bg-[#DFD3C3] text-[#5C4F44]'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Concluído</span>
                          </>
                        ) : (
                          <span>Marcar Feito</span>
                        )}
                      </button>

                      <button
                        onClick={() => deleteHealthDateItem(item.id)}
                        className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#F4EDE2] transition-colors"
                        title="Excluir data"
                        aria-label={`Excluir data ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Recurrence & Next Cycle Info Badge */}
                  {item.isRecurring && (
                    <div className="pt-2 border-t border-[#EFE8DE]/60 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#8C7A6B] flex items-center gap-1">
                        <RotateCcw className="w-3 h-3 text-[#B78A58]" />
                        Recorrência: Todo ano em {item.recurrenceMonth || 'Setembro'}
                      </span>
                      {isDone && item.nextDueDate && (
                        <span className="font-bold text-[#2C5230] bg-[#EEF5EF] px-2.5 py-0.5 rounded-full border border-[#B7D2B9]">
                          Próxima data do ciclo: {item.nextDueDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          ABA 2: MEDICAMENTOS & SUPLEMENTOS
         ======================================================== */}
      {activeMainTab === 'medicamentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#2C2C2C]">
              Medicamentos & Dosagens
            </h2>
            <button
              onClick={() => setIsAddMedicationModalOpen(true)}
              className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Remédio</span>
            </button>
          </div>

          {filteredMeds.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-8 text-center space-y-2">
              <Pill className="w-8 h-8 text-[#7D9D7F] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhum medicamento cadastrado</h3>
              <p className="text-xs text-[#8C7A6B]">
                Organize horários e ative alarmes com voz para lembretes diários.
              </p>
            </div>
          ) : (
            filteredMeds.map((item: HealthMedication) => {
              const isConfirmed = item.confirmed;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-3xl border transition-all shadow-2xs space-y-3 ${
                    isConfirmed
                      ? 'bg-[#F2ECE2] border-[#DDD3C5]'
                      : 'bg-[#FAF8F5] border-[#EFE8DE] hover:bg-[#F9F6F1]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE0D2] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                        {item.category === 'medicamento' ? '🧪' : '💊'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-xs sm:text-sm font-bold ${
                              isConfirmed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                            }`}
                          >
                            {item.name}
                          </h3>
                          <span className="text-[10px] font-semibold text-[#5C4F44] bg-[#EAE0D2] px-2 py-0.5 rounded-full">
                            {item.memberName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8C7A6B] mt-0.5">
                          {item.dosage} • {item.frequency} • <strong>{item.time}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleHealthMedication(item.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          isConfirmed
                            ? 'bg-[#7D9D7F] text-white hover:bg-[#6C8B6E]'
                            : 'bg-[#EAE0D2] hover:bg-[#DFD3C3] text-[#5C4F44]'
                        }`}
                      >
                        {isConfirmed ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Feito</span>
                          </>
                        ) : (
                          <span>Confirmar</span>
                        )}
                      </button>

                      <button
                        onClick={() => deleteHealthMedication(item.id)}
                        className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#F4EDE2] transition-colors"
                        title="Excluir remédio"
                        aria-label={`Excluir ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Smart Alarm Trigger Bar */}
                  <div className="pt-2 border-t border-[#EFE8DE]/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8C7A6B] flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-[#B78A58]" />
                      Lembrete inteligente com voz a cada 10s
                    </span>

                    <button
                      onClick={() =>
                        triggerAlarm({
                          id: item.id,
                          title: item.name,
                          subtitle: `${item.frequency} • ${item.dosage}`,
                          time: item.time,
                          type: 'medicamento',
                          memberName: item.memberName,
                          dosage: item.dosage
                        })
                      }
                      className="text-[11px] font-bold text-[#8C7A6B] hover:text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Testar Alarme</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          ABA 3: ANOTAÇÕES & RELATÓRIO DE EVOLUÇÃO
         ======================================================== */}
      {activeMainTab === 'anotacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-[#2C2C2C]">
              Anotações & Medições de Saúde
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEvolutionReportOpen(true)}
                className="text-xs font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Relatório de Evolução</span>
              </button>
              <button
                onClick={() => setIsAddNoteModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center"
                title="Nova Anotação"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-8 text-center space-y-2">
              <Activity className="w-8 h-8 text-[#9E6C52] mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhuma anotação registrada</h3>
              <p className="text-xs text-[#8C7A6B]">
                Registre medições de pressão, peso, glicemia ou notas de exames para visualizar gráficos de evolução.
              </p>
            </div>
          ) : (
            filteredNotes.map((item: HealthNoteItem) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-[#FAF8F5] border border-[#EFE8DE] space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-sm">
                      {item.category === 'medicao' ? '📊' : item.category === 'exame' ? '📋' : '📝'}
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[#8C7A6B]">
                        {item.memberName} • {item.date}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHealthNoteItem(item.id)}
                    className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#F4EDE2] transition-colors"
                    title="Excluir anotação"
                    aria-label={`Excluir anotação ${item.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#5C4F44] leading-relaxed">
                  {item.content}
                </p>

                {item.metrics && item.metrics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.metrics.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold text-[#2C5230] bg-[#EEF5EF] border border-[#B7D2B9] px-2.5 py-1 rounded-xl"
                      >
                        {m.label}: <strong>{m.value}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: RELATÓRIO DE EVOLUÇÃO DE MEDIÇÕES (Gráfico + Tabela)
         ======================================================== */}
      {isEvolutionReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#FDFBF7] rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#EFE8DE] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Relatório de Evolução de Saúde</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Gráfico e histórico de medições e peso</p>
                </div>
              </div>
              <button
                onClick={() => setIsEvolutionReportOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Member selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-[#5C4F44] shrink-0">Membro:</span>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEvolutionMemberId(p.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    evolutionMemberId === p.id
                      ? 'bg-[#8C7A6B] text-white'
                      : 'bg-[#F4EDE2] text-[#5C4F44]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Evolução real das medições registradas (sem pontos inventados) */}
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start gap-2 text-xs">
                <span className="font-bold text-[#2C2C2C] min-w-0 break-words">Evolução das medições · {memberForReport?.name || ''}</span>
                <span className="shrink-0 text-[10px] text-[#8C7A6B] bg-[#EAE0D2] px-2 py-0.5 rounded-full">{memberNotes.length} registro{memberNotes.length === 1 ? '' : 's'}</span>
              </div>
              {metricSeries.length === 0 ? (
                <EmptyState text="Sem medições registradas" hint="Adicione uma anotação com medida (ex.: Peso: 62 kg) para ver a evolução." />
              ) : (
                metricSeries.map((m) => (
                  <div key={m.label} className="space-y-1.5 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#4A3E34] min-w-0 break-words">{m.label}</span>
                      {m.change !== null && (
                        <span className="shrink-0 text-[10px] font-bold text-[#5C4F44] bg-[#F4EDE2] px-2 py-0.5 rounded-full">
                          {m.change > 0 ? '+' : ''}
                          {String(Math.round(m.change * 10) / 10).replace('.', ',')}
                          {m.unit} desde a 1ª
                        </span>
                      )}
                    </div>
                    <LineSeries points={m.points} unit={m.unit} />
                  </div>
                ))
              )}
            </div>

            {/* Written Data Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#4A3E34]">Histórico de registros de {memberForReport?.name || ''}:</h4>
              {memberNotes.length === 0 ? (
                <p className="text-xs text-[#8C7A6B] bg-white p-4 rounded-xl text-center border border-[#EFE8DE]">
                  Nenhum registro de medição escrito para este membro ainda.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {memberNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 bg-white border border-[#EFE8DE] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#2C2C2C]">{n.title}</span>
                        <span className="text-[10px] text-[#8C7A6B] block">{n.date} • {n.content}</span>
                      </div>
                      {n.metrics && n.metrics[0] && (
                        <span className="font-bold text-[#2C5230] bg-[#EEF5EF] px-2.5 py-1 rounded-lg border border-[#B7D2B9]">
                          {n.metrics[0].label}: {n.metrics[0].value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agendar Nova Data */}
      {isAddDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#B78A58]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Agendar Consulta ou Exame</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Suporta exames recorrentes (ex: Todo ano)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Título do Compromisso de Saúde:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Exame de Sangue Anual, Consulta Pediatra..."
                  value={dateTitle}
                  onChange={(e) => setDateTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Tipo:
                  </label>
                  <select
                    value={dateType}
                    onChange={(e) => setDateType(e.target.value as any)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    <option value="exame">Exame</option>
                    <option value="consulta">Consulta</option>
                    <option value="vacina">Vacina</option>
                    <option value="prazo">Prazo de Saúde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Para quem:
                  </label>
                  <select
                    value={dateMemberId}
                    onChange={(e) => setDateMemberId(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurrence Toggle */}
              <div className="p-3 bg-[#F7EEE3]/50 rounded-2xl border border-[#EFE8DE] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#4A3E34] flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#B78A58]" />
                    <span>Recorrência Periódica?</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={dateIsRecurring}
                    onChange={(e) => setDateIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-[#8C7A6B] focus:ring-[#8C7A6B]"
                  />
                </div>

                {dateIsRecurring && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8C7A6B] mb-1">Frequência:</label>
                      <select
                        value={dateRecurrenceInterval}
                        onChange={(e) => setDateRecurrenceInterval(e.target.value as any)}
                        className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2 py-1 text-xs font-semibold"
                      >
                        <option value="anual">Todo Ano</option>
                        <option value="semestral">A cada 6 Meses</option>
                        <option value="mensal">Mensalmente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8C7A6B] mb-1">Mês Preferencial:</label>
                      <input
                        type="text"
                        placeholder="Ex: Setembro"
                        value={dateRecurrenceMonth}
                        onChange={(e) => setDateRecurrenceMonth(e.target.value)}
                        className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Data Limite/Agendada:
                  </label>
                  <input
                    type="date"
                    required
                    value={dateDate}
                    onChange={(e) => setDateDate(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Horário:
                  </label>
                  <input
                    type="time"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Médico / Laboratório / Clínica:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Laboratório Fleury"
                  value={dateProfessional}
                  onChange={(e) => setDateProfessional(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDateModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F4EDE2] text-[#5C4F44] text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Medicamento */}
      {isAddMedicationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#7D9D7F]">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Novo Medicamento ou Suplemento</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Organize dosagens e alarmes com voz</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMedicationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMedication} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Nome do Medicamento / Suplemento:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Omega 3, Paracetamol..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Categoria:
                  </label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value as any)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    <option value="medicamento">Medicamento</option>
                    <option value="suplemento">Suplemento</option>
                    <option value="cuidado">Cuidado Diário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Para quem:
                  </label>
                  <select
                    value={medMemberId}
                    onChange={(e) => setMedMemberId(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Dosagem:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1 comprimido, 5ml"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Horário do Alarme:
                  </label>
                  <input
                    type="time"
                    value={medTime}
                    onChange={(e) => setMedTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Frequência:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Todos os dias com o café da manhã"
                  value={medFrequency}
                  onChange={(e) => setMedFrequency(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Remédio
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMedicationModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F4EDE2] text-[#5C4F44] text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Anotação */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#9E6C52]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Anotação de Saúde</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Registre medições e observações clínicas</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddNoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Título da Anotação:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Medição de Pressão Arterial, Peso..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Categoria:
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    <option value="medicao">Medição</option>
                    <option value="exame">Resultado de Exame</option>
                    <option value="geral">Geral</option>
                    <option value="alergia">Alergia / Alerta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Membro da Família:
                  </label>
                  <select
                    value={noteMemberId}
                    onChange={(e) => setNoteMemberId(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Observações / Conteúdo:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Pressão aferida pela manhã após repouso de 5 min."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Rótulo da Métrica:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pressão, Peso"
                    value={noteMetricLabel}
                    onChange={(e) => setNoteMetricLabel(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Valor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 12/8 mmHg, 68 kg"
                    value={noteMetricValue}
                    onChange={(e) => setNoteMetricValue(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Anotação
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F4EDE2] text-[#5C4F44] text-xs font-semibold rounded-xl"
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

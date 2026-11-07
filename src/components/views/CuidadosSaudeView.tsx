import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  Plus,
  Pill,
  Sparkles,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  User,
  Heart,
  X
} from 'lucide-react';
import { calculateHealthCompliance } from '../../utils/routineCalculations';
import { HealthMedication } from '../../types';

export const CuidadosSaudeView: React.FC = () => {
  const {
    setActiveTab,
    healthItems,
    toggleHealthItem,
    addHealthItem,
    deleteHealthItem,
    profiles,
    routineTasks,
    toggleRoutineTask
  } = useApp();

  // Tab filter: 'todos' | 'medicamentos' | 'suplementos'
  const [activeTabFilter, setActiveTabFilter] = useState<'todos' | 'medicamento' | 'suplemento'>('todos');

  // Member filter: 'todos' | memberId
  const [selectedMember, setSelectedMember] = useState<string>('todos');

  // Modal for new medication/care
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newFrequency, setNewFrequency] = useState('Todos os dias • 9h');
  const [newMemberId, setNewMemberId] = useState('p1');
  const [newTime, setNewTime] = useState('09:00');
  const [newCategory, setNewCategory] = useState<'medicamento' | 'suplemento' | 'cuidado'>('suplemento');

  // Filter items
  const filteredItems = healthItems.filter((item) => {
    const matchesCategory =
      activeTabFilter === 'todos' || item.category === activeTabFilter;
    const matchesMember =
      selectedMember === 'todos' || item.memberId === selectedMember;
    return matchesCategory && matchesMember;
  });

  const { total, confirmed, percent } = calculateHealthCompliance(healthItems);

  // Special routine task for self-care (Matching screen 7: 🧴 Esfoliação corporal)
  const esfoliacaoTask = routineTasks.find((t) =>
    t.title.toLowerCase().includes('esfoliação')
  ) || {
    id: 'rt-10',
    title: 'Esfoliação corporal',
    subtitle: 'Seg, Qua e Sex • Durante o banho',
    completed: false
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const member = profiles.find((p) => p.id === newMemberId) || profiles[0];

    addHealthItem({
      name: newName.trim(),
      dosage: newDosage.trim() || '1 dose',
      frequency: newFrequency.trim() || 'Diariamente',
      memberId: member.id,
      memberName: member.name,
      time: newTime,
      category: newCategory
    });

    setNewName('');
    setNewDosage('');
    setIsAddModalOpen(false);
  };

  // SVG Circular ring math (radius 36, circumference ~226.2)
  const radius = 36;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-28 select-none">
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
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Cuidados e Saúde</h1>
          <p className="text-[11px] text-[#8C7A6B]">Medicamentos & Suplementos da Família</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-9 h-9 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white flex items-center justify-center shadow-xs transition-colors"
          title="Cadastrar novo cuidado"
          aria-label="Adicionar medicamento ou suplemento"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Controller: Medicamentos / Suplementos / Todos (Screen 7) */}
      <div className="flex bg-[#F4EDE2] p-1 rounded-2xl mb-3.5">
        <button
          onClick={() => setActiveTabFilter('medicamento')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTabFilter === 'medicamento'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Medicamentos
        </button>
        <button
          onClick={() => setActiveTabFilter('suplemento')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTabFilter === 'suplemento'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Suplementos
        </button>
        <button
          onClick={() => setActiveTabFilter('todos')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTabFilter === 'todos'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Todos
        </button>
      </div>

      {/* Family Member Filter Pills (Screen 7: Brenda, Bryan, Benício) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3.5 scrollbar-none">
        <button
          onClick={() => setSelectedMember('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
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

      {/* Interactive Self-Care Routine Card (Screen 7: 🧴 Esfoliação corporal with toggle) */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 mb-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-xl shadow-2xs">
              🧴
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                {esfoliacaoTask.title}
              </h3>
              <p className="text-[11px] text-[#8C7A6B]">
                {esfoliacaoTask.subtitle || 'Seg, Qua e Sex • Durante o banho'}
              </p>
            </div>
          </div>

          {/* Interactive Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={esfoliacaoTask.completed}
            onClick={() => toggleRoutineTask(esfoliacaoTask.id)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              esfoliacaoTask.completed ? 'bg-[#7D9D7F]' : 'bg-[#DCD4C8]'
            }`}
            aria-label="Alternar status da esfoliação corporal"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                esfoliacaoTask.completed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main List: Medicamentos e Suplementos (Screen 7) */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-[#2C2C2C]">
            Medicamentos e Suplementos
          </h2>
          <span className="text-xs text-[#8C7A6B] font-semibold">
            {confirmed} de {total} confirmados hoje
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-6 text-center space-y-2">
            <Pill className="w-8 h-8 text-[#B78A58] mx-auto opacity-70" />
            <p className="text-xs text-[#8C7A6B]">
              Nenhum item encontrado para os filtros selecionados.
            </p>
          </div>
        ) : (
          filteredItems.map((item: HealthMedication) => {
            const isConfirmed = item.confirmed;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border transition-all shadow-2xs flex items-center justify-between gap-3 ${
                  isConfirmed
                    ? 'bg-[#F2ECE2] border-[#DDD3C5]'
                    : 'bg-[#FAF8F5] border-[#EFE8DE] hover:bg-[#F9F6F1]'
                }`}
              >
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
                      {item.dosage} • {item.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Confirm Dose Button matching reference mockup screen 7 */}
                  <button
                    onClick={() => toggleHealthItem(item.id)}
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
                    onClick={() => deleteHealthItem(item.id)}
                    className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#F4EDE2] transition-colors"
                    title="Excluir item"
                    aria-label={`Excluir ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resumo do Mês Card (Screen 7: 87% Donut chart & "26 de 30 administrações") */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3">
        <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
          Resumo do mês
        </h3>

        <div className="flex items-center justify-around gap-4 pt-1">
          {/* Donut Progress Chart */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                stroke="#EFE8DE"
                fill="transparent"
                strokeWidth={stroke}
                r={radius}
                cx="48"
                cy="48"
              />
              <circle
                stroke="#B78A58"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                r={radius}
                cx="48"
                cy="48"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-[#2C2C2C] leading-none">
                {percent}%
              </span>
            </div>
          </div>

          {/* Counts */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-lg sm:text-xl font-extrabold text-[#2C2C2C] leading-tight">
              {confirmed} de {total > 0 ? total : 30} administrações
            </div>
            <p className="text-xs text-[#8C7A6B] leading-snug">
              Consistência nos cuidados de saúde da família neste ciclo de Novembro.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Novo Medicamento / Cuidado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#B78A58]">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Novo Cuidado ou Remédio</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Organize dosagens e horários</p>
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
                  Nome do Medicamento ou Suplemento:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vitamina D3, Probiótico, Lavagem nasal..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Categoria:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                  >
                    <option value="suplemento">Suplemento</option>
                    <option value="medicamento">Medicamento</option>
                    <option value="cuidado">Cuidado / Higiene</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Para quem:
                  </label>
                  <select
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
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
                    placeholder="Ex: 1 cápsula, 5ml"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                    Horário:
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2C2C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Frequência / Instrução:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Todos os dias com o café da manhã"
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Cuidado
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

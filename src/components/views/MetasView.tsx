import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  Plus,
  Target,
  Check,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  X,
  Layers,
  FolderPlus
} from 'lucide-react';
import { GoalItem } from '../../types';

export const MetasView: React.FC = () => {
  const {
    setActiveTab,
    goals,
    goalCategories,
    addGoalCategory,
    deleteGoalCategory,
    toggleGoalStep,
    addGoal,
    deleteGoal
  } = useApp();

  const [activeStatusTab, setActiveStatusTab] = useState<'em_andamento' | 'concluida'>('em_andamento');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  // Modal for new goal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Casa');
  const [deadlineType, setDeadlineType] = useState<'data_especifica' | 'contagem_dias'>('contagem_dias');
  const [newDueDate, setNewDueDate] = useState('');
  const [targetDays, setTargetDays] = useState<number>(30);
  const [stepInputs, setStepInputs] = useState<string[]>(['', '', '']);

  // Modal for new category
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleStepInputChange = (index: number, value: string) => {
    const updated = [...stepInputs];
    updated[index] = value;
    setStepInputs(updated);
  };

  const handleAddStepField = () => {
    setStepInputs((prev) => [...prev, '']);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addGoalCategory({
      name: newCatName.trim(),
      icon: 'Target',
      color: '#8C7A6B'
    });
    setNewCatName('');
    setIsAddCatModalOpen(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const validSteps = stepInputs
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t, idx) => ({
        id: `s-${Date.now()}-${idx}`,
        text: t,
        done: false
      }));

    addGoal({
      title: newTitle.trim(),
      category: newCategory.trim() || 'Casa',
      categoryId: newCategory.toLowerCase().replace(/\s+/g, '-'),
      deadlineType,
      dueDate: deadlineType === 'data_especifica' ? newDueDate : undefined,
      targetDays: deadlineType === 'contagem_dias' ? targetDays : undefined,
      status: 'em_andamento',
      steps: validSteps.length > 0 ? validSteps : [{ id: `s-${Date.now()}`, text: 'Iniciar planejamento', done: false }]
    });

    setNewTitle('');
    setNewDueDate('');
    setTargetDays(30);
    setStepInputs(['', '', '']);
    setIsAddModalOpen(false);
  };

  const activeGoals = goals.filter((g) => g.status === 'em_andamento');
  const completedGoals = goals.filter((g) => g.status === 'concluida' || g.progressPercent >= 100);

  const filteredByStatus = activeStatusTab === 'em_andamento' ? activeGoals : completedGoals;

  const displayedGoals = filteredByStatus.filter(
    (g) => selectedCategory === 'todas' || g.category.toLowerCase() === selectedCategory.toLowerCase()
  );

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
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Minhas Metas</h1>
          <p className="text-[11px] text-[#8C7A6B]">Seus objetivos em passos possíveis</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-9 h-9 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white flex items-center justify-center shadow-xs transition-colors"
          title="Nova Meta"
          aria-label="Adicionar nova meta"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Controller: Em andamento / Concluídas */}
      <div className="flex bg-[#F4EDE2] p-1 rounded-2xl mb-3">
        <button
          onClick={() => setActiveStatusTab('em_andamento')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeStatusTab === 'em_andamento'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Em andamento ({activeGoals.length})
        </button>
        <button
          onClick={() => setActiveStatusTab('concluida')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeStatusTab === 'concluida'
              ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs'
              : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
          }`}
        >
          Concluídas ({completedGoals.length})
        </button>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('todas')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedCategory === 'todas'
              ? 'bg-[#8C7A6B] text-white shadow-xs'
              : 'bg-[#FAF8F5] text-[#5C4F44] border border-[#EFE8DE] hover:bg-[#F4EDE2]'
          }`}
        >
          Todas
        </button>
        {goalCategories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#8C7A6B] text-white shadow-xs font-bold'
                  : 'bg-[#FAF8F5] text-[#5C4F44] border border-[#EFE8DE] hover:bg-[#F4EDE2]'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => setIsAddCatModalOpen(true)}
          className="px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#F4EDE2] text-[#8C7A6B] hover:bg-[#EAE0D2] flex items-center gap-1 shrink-0"
          title="Nova Categoria"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Categoria</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4 mb-5">
        {displayedGoals.length === 0 ? (
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-8 text-center space-y-2">
            <Target className="w-8 h-8 text-[#9E6C52] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">
              {activeStatusTab === 'em_andamento'
                ? 'Nenhuma meta em andamento no momento!'
                : 'Nenhuma meta concluída ainda.'}
            </h3>
            <p className="text-xs text-[#8C7A6B]">
              Defina pequenos passos para realizar grandes conquistas familiares.
            </p>
            {activeStatusTab === 'em_andamento' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2 bg-[#8C7A6B] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Criar Primeira Meta
              </button>
            )}
          </div>
        ) : (
          displayedGoals.map((goal: GoalItem) => {
            const isCompleted = goal.status === 'concluida' || goal.progressPercent >= 100;
            const icon =
              goal.category.toLowerCase().includes('casa')
                ? '🔨'
                : goal.category.toLowerCase().includes('fam')
                ? '🛍️'
                : goal.category.toLowerCase().includes('saúde') || goal.category.toLowerCase().includes('saude')
                ? '🩺'
                : '🎯';

            return (
              <div
                key={goal.id}
                className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3.5 transition-all"
              >
                {/* Header of Goal Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F7EDE4] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#2C2C2C] leading-snug">
                          {goal.title}
                        </h3>
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                            Concluída
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8C7A6B] mt-0.5">
                        <span className="font-semibold whitespace-nowrap">{goal.category}</span>
                        <span>•</span>

                        {/* Deadline Display: Data Específica vs Contagem de Dias */}
                        {goal.deadlineType === 'contagem_dias' ? (
                          <span className="flex items-center gap-1 font-bold whitespace-nowrap text-[#9E6C52] bg-[#FDF2EE] px-2 py-0.5 rounded-md border border-[#E8C2B8]">
                            <Clock className="w-3 h-3" />
                            {goal.targetDays != null ? `Faltam ${goal.targetDays} ${goal.targetDays === 1 ? 'dia' : 'dias'}` : 'Sem prazo definido'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold whitespace-nowrap text-[#5C4F44]">
                            <Calendar className="w-3 h-3 text-[#B78A58]" />
                            {goal.dueDate ? `Prazo: ${/^\d{4}-\d{2}-\d{2}$/.test(goal.dueDate) ? goal.dueDate.split('-').reverse().join('/') : goal.dueDate}` : 'Sem prazo definido'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 text-[#B4A597] hover:text-[#8C3A24] rounded-lg hover:bg-[#F4EDE2] transition-colors"
                    title="Excluir meta"
                    aria-label={`Excluir meta ${goal.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[#5C4F44]">
                      {goal.progressPercent}% concluído
                    </span>
                    <span className="text-[11px] text-[#8C7A6B] font-semibold">
                      {goal.completedSteps} de {goal.totalSteps} passos
                    </span>
                  </div>
                  <div className="w-full bg-[#EFE8DE] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${goal.progressPercent}%`,
                        backgroundColor: isCompleted ? '#7D9D7F' : '#9E6C52'
                      }}
                    />
                  </div>
                </div>

                {/* Checklist Steps */}
                {goal.steps && goal.steps.length > 0 && (
                  <div className="pt-1 space-y-2 border-t border-[#EFE8DE]/60">
                    <span className="text-[11px] font-bold text-[#8C7A6B] block">
                      Passos para realizar:
                    </span>
                    <div className="space-y-1.5">
                      {goal.steps.map((step) => (
                        <div
                          key={step.id}
                          onClick={() => toggleGoalStep(goal.id, step.id)}
                          className={`p-2.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                            step.done
                              ? 'bg-[#F2ECE2] border-[#DDD3C5] text-[#8C7A6B]'
                              : 'bg-white border-[#EFE8DE] text-[#2C2C2C] hover:bg-[#FDFBF7]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                              step.done
                                ? 'bg-[#7D9D7F] border-[#7D9D7F] text-white'
                                : 'border-[#C8B8A6] bg-white'
                            }`}
                          >
                            {step.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              step.done ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'
                            }`}
                          >
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Encouragement Card */}
      <div className="bg-[#FAF5ED] border border-[#EAE0D2] rounded-3xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#4A3E34]">Você está indo bem!</h4>
            <p className="text-[11px] text-[#6E5D4F] leading-snug">
              Cada pequeno passo concluído é uma vitória para a tranquilidade da casa.
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-[#B78A58] shrink-0" />
      </div>

      {/* Modal: Nova Meta */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EDE4] flex items-center justify-center text-[#9E6C52]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Meta Familiar</h3>
                  <p className="text-[11px] text-[#8C7A6B]">Divida em pequenos passos fáceis</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Título da Meta:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pintar o quarto, Viagem das férias, Organizar armários..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Categoria:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs font-semibold text-[#2C2C2C] focus:outline-none"
                >
                  {goalCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline Type Selector: Data Específica vs Contagem de Dias */}
              <div className="space-y-2 bg-[#F7EEE3]/50 p-3 rounded-2xl border border-[#EFE8DE]">
                <label className="block text-xs font-bold text-[#4A3E34]">
                  Tipo de Prazo:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeadlineType('contagem_dias')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                      deadlineType === 'contagem_dias'
                        ? 'bg-[#8C7A6B] text-white border-[#8C7A6B]'
                        : 'bg-white text-[#5C4F44] border-[#EFE8DE]'
                    }`}
                  >
                    Faltam X dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineType('data_especifica')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors ${
                      deadlineType === 'data_especifica'
                        ? 'bg-[#8C7A6B] text-white border-[#8C7A6B]'
                        : 'bg-white text-[#5C4F44] border-[#EFE8DE]'
                    }`}
                  >
                    Data no Calendário
                  </button>
                </div>

                {deadlineType === 'contagem_dias' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C7A6B] mb-1">
                      Quantidade de dias restantes:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={targetDays}
                      onChange={(e) => setTargetDays(Number(e.target.value))}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C] font-bold focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C7A6B] mb-1">
                      Selecione a data limite:
                    </label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C] font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#4A3E34]">
                    Passos práticos (Checklist):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStepField}
                    className="text-[11px] font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Mais um passo</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {stepInputs.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Passo ${idx + 1}...`}
                      value={val}
                      onChange={(e) => handleStepInputChange(idx, e.target.value)}
                      className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C] focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Meta
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

      {/* Modal: Nova Categoria de Meta */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Nova Categoria de Meta</h3>
              </div>
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#5C4F44]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#4A3E34] mb-1">
                  Nome da Categoria:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagens, Estudos, Carro..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Salvar Categoria
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
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

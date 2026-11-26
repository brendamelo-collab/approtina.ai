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
  FolderPlus,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { CheckCircle, ConfirmDialog, IconBubble, PageHeader, PeachButton, PillTabs, ProgressLine, RoundButton, SHADOW_SOFT, SoftCard, StatusChip } from '../ui/Kit';
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
    deleteGoal,
    updateGoal
  } = useApp();

  const [activeStatusTab, setActiveStatusTab] = useState<'em_andamento' | 'concluida'>('em_andamento');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});

  // Modal for new goal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Casa');
  const [deadlineType, setDeadlineType] = useState<'data_especifica' | 'contagem_dias'>('contagem_dias');
  const [newDueDate, setNewDueDate] = useState('');
  const [targetDays, setTargetDays] = useState<number>(30);
  const [stepInputs, setStepInputs] = useState<string[]>(['', '', '']);
  // Editar: mesma tela do "Nova meta", preenchida; os passos mantêm o que já estava feito
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<GoalItem | null>(null);

  const openNewGoal = () => {
    setEditingGoal(null);
    setNewTitle('');
    setNewDueDate('');
    setTargetDays(30);
    setDeadlineType('contagem_dias');
    setStepInputs(['', '', '']);
    setIsAddModalOpen(true);
  };

  const openEditGoal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setNewTitle(goal.title);
    setNewCategory(goal.category);
    setDeadlineType(goal.deadlineType);
    setNewDueDate(goal.dueDate || '');
    setTargetDays(goal.targetDays ?? 30);
    setStepInputs(goal.steps.length ? goal.steps.map((x) => x.text) : ['']);
    setIsAddModalOpen(true);
  };

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
      icon: '🎯',
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

    if (editingGoal) {
      // Passos: o mesmo texto continua com o mesmo id e o "feito" de antes
      const used = new Set<string>();
      const steps = stepInputs
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t, idx) => {
          const same = editingGoal.steps.find((x) => x.text === t && !used.has(x.id)) || (editingGoal.steps[idx] && !used.has(editingGoal.steps[idx].id) ? editingGoal.steps[idx] : undefined);
          if (same) used.add(same.id);
          return same ? { ...same, text: t } : { id: `s-${Date.now()}-${idx}`, text: t, done: false };
        });
      updateGoal(editingGoal.id, {
        title: newTitle.trim(),
        category: newCategory.trim() || editingGoal.category,
        categoryId: (newCategory.trim() || editingGoal.category).toLowerCase().replace(/\s+/g, '-'),
        deadlineType,
        dueDate: deadlineType === 'data_especifica' ? newDueDate : undefined,
        targetDays: deadlineType === 'contagem_dias' ? targetDays : undefined,
        steps: steps.length ? steps : editingGoal.steps
      });
      setEditingGoal(null);
      setIsAddModalOpen(false);
      return;
    }

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
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-32 select-none">
      <PageHeader
        icon={Target}
        title="Minhas Metas"
        right={
          <RoundButton label="Adicionar nova meta" tone="accent" onClick={openNewGoal}>
            <Plus className="w-5 h-5" strokeWidth={2.2} />
          </RoundButton>
        }
      />

      <div className="mt-3 space-y-4 mb-5">
        <PillTabs
          options={[
            { id: 'em_andamento', label: `Em andamento (${activeGoals.length})` },
            { id: 'concluida', label: `Concluídas (${completedGoals.length})` }
          ]}
          value={activeStatusTab}
          onChange={setActiveStatusTab}
        />

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {[{ id: 'todas', name: 'Todas' }, ...goalCategories].map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === (cat.id === 'todas' ? 'todas' : cat.name.toLowerCase());
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id === 'todas' ? 'todas' : cat.name)}
                className={`shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition ${
                  isSelected ? 'bg-[#E6C8A8] text-[#3A2619]' : `bg-[#FAF8F5] text-[#4A3E34] ${SHADOW_SOFT}`
                }`}
              >
                {cat.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsAddCatModalOpen(true)}
            className={`shrink-0 inline-flex items-center gap-1 px-3.5 h-9 rounded-full text-[13px] font-semibold bg-[#FAF8F5] text-[#9E6C52] ${SHADOW_SOFT}`}
            title="Nova Categoria"
          >
            <FolderPlus className="w-4 h-4" /> Categoria
          </button>
        </div>

        {displayedGoals.length === 0 ? (
          <SoftCard className="p-8 text-center space-y-2">
            <Target className="w-8 h-8 text-[#9E6C52] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">
              {activeStatusTab === 'em_andamento' ? 'Nenhuma meta em andamento no momento!' : 'Nenhuma meta concluída ainda.'}
            </h3>
            <p className="text-xs text-[#8C7A6B]">Defina pequenos passos para realizar grandes conquistas familiares.</p>
          </SoftCard>
        ) : (
          displayedGoals.map((goal: GoalItem) => {
            const isCompleted = goal.status === 'concluida' || goal.progressPercent >= 100;
            const lower = goal.category.toLowerCase();
            const icon = lower.includes('casa') ? '🏠' : lower.includes('fam') ? '👨‍👩‍👧' : lower.includes('saúde') || lower.includes('saude') ? '🩺' : lower.includes('finan') ? '💰' : '🎯';
            const deadline =
              goal.deadlineType === 'contagem_dias'
                ? goal.targetDays != null
                  ? `Faltam ${goal.targetDays} ${goal.targetDays === 1 ? 'dia' : 'dias'}`
                  : 'Sem prazo'
                : goal.dueDate
                  ? `Prazo: ${/^\d{4}-\d{2}-\d{2}$/.test(goal.dueDate) ? goal.dueDate.split('-').reverse().slice(0, 2).join('/') : goal.dueDate}`
                  : 'Sem prazo';
            const open = !!openSteps[goal.id];
            return (
              <SoftCard key={goal.id} as="div" className="p-4">
                <div className="flex items-start gap-3.5">
                  <IconBubble>{icon}</IconBubble>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h3 className="flex-1 min-w-0 text-[16px] font-bold text-[#2C2C2C] leading-snug break-words">{goal.title}</h3>
                      <button
                        type="button"
                        onClick={() => openEditGoal(goal)}
                        className="-mt-1 w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#4A3E34] flex items-center justify-center"
                        title="Editar meta"
                        aria-label={`Editar meta ${goal.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGoal(goal)}
                        className="-mr-1 -mt-1 w-8 h-8 shrink-0 rounded-full text-[#A9472F] hover:bg-[#FDF2EE] flex items-center justify-center"
                        title="Excluir meta"
                        aria-label={`Excluir meta ${goal.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[12px] text-[#8C7A6B]">{goal.category}</p>
                    <div className="mt-2">
                      <ProgressLine value={goal.progressPercent} tone={isCompleted ? 'green' : 'caramel'} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {isCompleted ? (
                        <StatusChip tone="done" icon>
                          Concluída
                        </StatusChip>
                      ) : goal.progressPercent > 0 ? (
                        <StatusChip tone="info">Em andamento</StatusChip>
                      ) : (
                        <StatusChip tone="pending">Pendente</StatusChip>
                      )}
                      <span className="text-[13px] text-[#4A3E34] whitespace-nowrap">{deadline}</span>
                    </div>
                  </div>
                </div>

                {goal.steps && goal.steps.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#EFE8DE]/70">
                    <button
                      type="button"
                      onClick={() => setOpenSteps((o) => ({ ...o, [goal.id]: !o[goal.id] }))}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between py-1.5 text-[13px] font-semibold text-[#9E6C52]"
                    >
                      <span>
                        Passos ({goal.completedSteps} de {goal.totalSteps})
                      </span>
                      <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="pt-1 space-y-0.5">
                        {goal.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-3 py-1.5">
                            <CheckCircle done={step.done} onClick={() => toggleGoalStep(goal.id, step.id)} label={`${step.done ? 'Desmarcar' : 'Marcar'} ${step.text}`} />
                            <span className={`text-sm ${step.done ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'}`}>{step.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </SoftCard>
            );
          })
        )}

        <PeachButton onClick={openNewGoal}>
          Adicionar Meta <Plus className="w-4 h-4" />
        </PeachButton>
      </div>

      {/* Encouragement Card */}
      <div className="bg-[#FAF5ED] border border-[#EAE0D2] rounded-[26px] p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white shadow-[0_3px_12px_rgba(150,100,60,0.08)] flex items-center justify-center text-xl shrink-0">
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
      {confirmDeleteGoal && (
        <ConfirmDialog
          title={`Excluir a meta “${confirmDeleteGoal.title}”?`}
          message="A meta e os passos dela saem da lista. Isso não pode ser desfeito."
          onCancel={() => setConfirmDeleteGoal(null)}
          onConfirm={() => {
            deleteGoal(confirmDeleteGoal.id);
            setConfirmDeleteGoal(null);
          }}
        />
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FDFBF7] rounded-[26px] p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F7EDE4] flex items-center justify-center text-[#9E6C52]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2C2C]">{editingGoal ? 'Editar meta' : 'Nova Meta Familiar'}</h3>
                  <p className="text-[11px] text-[#8C7A6B]">{editingGoal ? 'Os passos já feitos continuam marcados' : 'Divida em pequenos passos fáceis'}</p>
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
                  {editingGoal ? 'Salvar alterações' : 'Salvar Meta'}
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
          <div className="w-full max-w-sm bg-[#FDFBF7] rounded-[26px] p-5 shadow-2xl border border-[#EFE8DE] space-y-4 animate-in zoom-in-95 duration-200">
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

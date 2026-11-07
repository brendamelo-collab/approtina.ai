import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderPlus,
  Sliders,
  Copy,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LifeArea, QuestionGroup, QuestionItem } from '../types';

export const ManageQuestionsModal: React.FC = () => {
  const {
    isManageQuestionsModalOpen,
    setIsManageQuestionsModalOpen,
    lifeAreas,
    createLifeArea,
    deleteLifeArea,
    reorderArea,
    questionGroups,
    createQuestionGroup,
    deleteQuestionGroup,
    reorderGroup,
    questions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestion
  } = useApp();

  const [activeAreaId, setActiveAreaId] = useState<string>(lifeAreas[0]?.id || '');
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaIcon, setNewAreaIcon] = useState('🌟');

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQTitle, setNewQTitle] = useState('');
  const [newQGroupId, setNewQGroupId] = useState('');
  const [newQHabitType, setNewQHabitType] = useState<'bom' | 'ruim'>('bom');

  // Editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHabitType, setEditHabitType] = useState<'bom' | 'ruim'>('bom');

  if (!isManageQuestionsModalOpen) return null;

  const currentArea = lifeAreas.find((a) => a.id === activeAreaId) || lifeAreas[0];
  const currentGroups = questionGroups.filter((g) => g.areaId === (currentArea?.id || ''));

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    createLifeArea(newAreaName, newAreaIcon);
    setNewAreaName('');
    setIsAddingArea(false);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentArea) return;
    createQuestionGroup(currentArea.id, newGroupName);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTitle.trim() || !currentArea) return;
    const targetGroupId = newQGroupId || currentGroups[0]?.id;
    if (!targetGroupId) return;

    const isGood = newQHabitType === 'bom';
    createQuestion({
      areaId: currentArea.id,
      groupId: targetGroupId,
      title: newQTitle.trim(),
      habitType: newQHabitType,
      positiveIf: isGood ? 'sim' : 'nao',
      positiveLabel: isGood ? 'Sim' : 'Não',
      negativeLabel: isGood ? 'Não' : 'Sim',
      frequency: 'todos_os_dias'
    });

    setNewQTitle('');
    setIsAddingQuestion(false);
  };

  const handleSaveEdit = (qId: string) => {
    if (!editTitle.trim()) return;
    const isGood = editHabitType === 'bom';
    updateQuestion(qId, {
      title: editTitle.trim(),
      habitType: editHabitType,
      positiveIf: isGood ? 'sim' : 'nao',
      positiveLabel: isGood ? 'Sim' : 'Não',
      negativeLabel: isGood ? 'Não' : 'Sim'
    });
    setEditingQuestionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[92vh] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
              <Sliders className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">
                Estrutura & Perguntas do Mapa
              </h2>
              <p className="text-xs text-[#8C7A6B]">
                Áreas • Grupos • Hábitos Bons vs Comportamentos a Evitar
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsManageQuestionsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* 1. Life Areas Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#3C3C3C] uppercase tracking-wider">
                1. Áreas da Vida
              </span>
              <button
                onClick={() => setIsAddingArea(!isAddingArea)}
                className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Área</span>
              </button>
            </div>

            {/* Add Area Form */}
            {isAddingArea && (
              <form onSubmit={handleCreateArea} className="bg-[#FAF8F5] border border-[#EFE8DE] p-3 rounded-2xl mb-2.5 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ícone"
                    value={newAreaIcon}
                    onChange={(e) => setNewAreaIcon(e.target.value)}
                    className="w-16 bg-white border border-[#EFE8DE] rounded-xl px-2 py-1.5 text-center text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nome da Área (ex: Espiritualidade, Estudos)"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="flex-1 bg-white border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C]"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingArea(false)}
                    className="px-3 py-1 text-xs text-[#8C7A6B] rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#8C7A6B] text-white text-xs font-bold rounded-lg"
                  >
                    Salvar Área
                  </button>
                </div>
              </form>
            )}

            {/* Areas list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lifeAreas.map((area, index) => {
                const isSelected = area.id === (currentArea?.id || '');
                return (
                  <div
                    key={area.id}
                    className={`p-2 rounded-2xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#EAE0D2] border-[#C8B8A6] font-bold text-[#2C2C2C] shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#EFE8DE] text-[#4A3E34] hover:bg-[#F6EFE6]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveAreaId(area.id)}
                      className="flex items-center gap-1.5 truncate flex-1 text-left"
                    >
                      <span className="text-base">{area.icon || '📌'}</span>
                      <span className="text-xs truncate">{area.name}</span>
                    </button>
                    <div className="flex items-center shrink-0 ml-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => reorderArea(area.id, 'up')}
                          className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      )}
                      {index < lifeAreas.length - 1 && (
                        <button
                          type="button"
                          onClick={() => reorderArea(area.id, 'down')}
                          className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Groups inside the Selected Area */}
          {currentArea && (
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EFE8DE]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentArea.icon}</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                      Grupos em: {currentArea.name}
                    </h3>
                    <p className="text-[10px] text-[#8C7A6B]">
                      Subdivisões temáticas da rotina
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsAddingGroup(!isAddingGroup)}
                    className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-1 bg-[#F4EDE2] px-2.5 py-1 rounded-xl"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Novo Grupo</span>
                  </button>
                  {lifeAreas.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a área "${currentArea.name}" e todas as suas perguntas?`)) {
                          deleteLifeArea(currentArea.id);
                          setActiveAreaId(lifeAreas.find((a) => a.id !== currentArea.id)?.id || '');
                        }
                      }}
                      className="w-7 h-7 rounded-xl hover:bg-[#F2E5E0] text-[#A85A48] flex items-center justify-center transition-colors"
                      title="Excluir Área"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Add Group Form */}
              {isAddingGroup && (
                <form onSubmit={handleCreateGroup} className="bg-white border border-[#EFE8DE] p-3 rounded-2xl my-2.5 space-y-2">
                  <input
                    type="text"
                    placeholder="Nome do grupo (ex: Alimentação das crianças, Sono)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingGroup(false)}
                      className="px-3 py-1 text-xs text-[#8C7A6B]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#8C7A6B] text-white text-xs font-bold rounded-lg"
                    >
                      Criar Grupo
                    </button>
                  </div>
                </form>
              )}

              {/* Groups & Questions List */}
              <div className="mt-3 space-y-3">
                {currentGroups.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#8C7A6B]">
                    Nenhum grupo cadastrado nesta área ainda. Crie o primeiro grupo acima!
                  </div>
                ) : (
                  currentGroups.map((grp, grpIdx) => {
                    const grpQuestions = questions.filter((q) => q.groupId === grp.id);
                    return (
                      <div
                        key={grp.id}
                        className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#4A3E34] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8C7A6B]" />
                            {grp.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {grpIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => reorderGroup(grp.id, 'up')}
                                className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                title="Subir Grupo"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {grpIdx < currentGroups.length - 1 && (
                              <button
                                type="button"
                                onClick={() => reorderGroup(grp.id, 'down')}
                                className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                title="Descer Grupo"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm(`Excluir o grupo "${grp.name}" e suas perguntas?`)) {
                                  deleteQuestionGroup(grp.id);
                                }
                              }}
                              className="text-[#A87053] hover:text-[#8C3A24] p-1 rounded-lg"
                              title="Excluir grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Questions in group */}
                        <div className="space-y-2 pl-2">
                          {grpQuestions.map((q, qIdx) => {
                            const isEditing = editingQuestionId === q.id;
                            const isGood = (q.habitType || (q.positiveIf === 'sim' ? 'bom' : 'ruim')) === 'bom';

                            return (
                              <div
                                key={q.id}
                                className="bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl p-2.5 flex items-start justify-between gap-2"
                              >
                                {isEditing ? (
                                  <div className="flex-1 space-y-2">
                                    <input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full bg-white border border-[#EFE8DE] rounded-lg p-2 text-xs"
                                    />
                                    {/* Habit type selection in edit */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() => setEditHabitType('bom')}
                                        className={`p-2 rounded-lg border text-left ${
                                          editHabitType === 'bom'
                                            ? 'bg-[#EEF5EF] text-[#2C5230] border-[#97C29B] font-bold'
                                            : 'bg-white text-[#5C4F44] border-[#E2DDD3]'
                                        }`}
                                      >
                                        ✓ Hábito Bom
                                        <span className="block text-[9px] font-normal opacity-80">
                                          [Sim] é Positivo
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditHabitType('ruim')}
                                        className={`p-2 rounded-lg border text-left ${
                                          editHabitType === 'ruim'
                                            ? 'bg-[#FDF2EE] text-[#8C3A24] border-[#E8C2B8] font-bold'
                                            : 'bg-white text-[#5C4F44] border-[#E2DDD3]'
                                        }`}
                                      >
                                        ✕ A Evitar
                                        <span className="block text-[9px] font-normal opacity-80">
                                          [Sim] é Negativo
                                        </span>
                                      </button>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(q.id)}
                                        className="px-3 py-1 bg-[#8C7A6B] text-white text-[11px] rounded font-bold"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => setEditingQuestionId(null)}
                                        className="px-3 py-1 bg-[#EFE8DE] text-[11px] rounded"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <h5 className="text-xs font-semibold text-[#2C2C2C]">
                                      {q.title}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-1">
                                      {isGood ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF5EF] text-[#2C5230] border border-[#B7D2B9] font-medium">
                                          Hábito Bom • [Sim] é Positivo
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDF2EE] text-[#8C3A24] border border-[#E8C2B8] font-medium">
                                          A Evitar • [Sim] é Negativo
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {!isEditing && (
                                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                    {qIdx > 0 && (
                                      <button
                                        onClick={() => reorderQuestion(q.id, 'up')}
                                        className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                        title="Subir Pergunta"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {qIdx < grpQuestions.length - 1 && (
                                      <button
                                        onClick={() => reorderQuestion(q.id, 'down')}
                                        className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                        title="Descer Pergunta"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => duplicateQuestion(q.id)}
                                      className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                      title="Duplicar Pergunta"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingQuestionId(q.id);
                                        setEditTitle(q.title);
                                        setEditHabitType(q.habitType || (q.positiveIf === 'sim' ? 'bom' : 'ruim'));
                                      }}
                                      className="p-1 text-[#8C7A6B] hover:text-[#2C2C2C]"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Excluir pergunta "${q.title}"?`)) {
                                          deleteQuestion(q.id);
                                        }
                                      }}
                                      className="p-1 text-[#A87053] hover:text-[#8C3A24]"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 3. Add Question Form Button */}
              {currentGroups.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#EFE8DE]">
                  {!isAddingQuestion ? (
                    <button
                      onClick={() => {
                        setIsAddingQuestion(true);
                        setNewQGroupId(currentGroups[0].id);
                      }}
                      className="w-full py-2.5 px-3 bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Nova Pergunta nesta Área</span>
                    </button>
                  ) : (
                    <form
                      onSubmit={handleCreateQuestion}
                      className="bg-white border border-[#EFE8DE] rounded-2xl p-4 space-y-3"
                    >
                      <h4 className="text-xs font-bold text-[#2C2C2C]">
                        Nova Pergunta de Acompanhamento
                      </h4>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#4A3E34] mb-1">
                          Grupo da Pergunta
                        </label>
                        <select
                          value={newQGroupId}
                          onChange={(e) => setNewQGroupId(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-3 py-1.5 text-xs text-[#2C2C2C]"
                        >
                          {currentGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#4A3E34] mb-1">
                          Título da Pergunta
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Gritei com as crianças? / Preparei almoço nutritivo?"
                          value={newQTitle}
                          onChange={(e) => setNewQTitle(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-xl px-3 py-2 text-xs text-[#2C2C2C]"
                          required
                        />
                      </div>

                      {/* Positive vs Negative Rule Setup */}
                      <div className="bg-[#FAF8F5] border border-[#EFE8DE] p-3 rounded-xl space-y-2">
                        <label className="block text-[11px] font-bold text-[#3C3C3C]">
                          Tipo de Hábito / Regra de Interpretação:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewQHabitType('bom')}
                            className={`p-2.5 rounded-xl text-left border transition-all ${
                              newQHabitType === 'bom'
                                ? 'bg-[#EEF5EF] text-[#2C5230] border-[#97C29B] font-bold ring-2 ring-[#7D9D7F]/30'
                                : 'bg-white border-[#EFE8DE] text-[#6E5D4F]'
                            }`}
                          >
                            <span className="text-xs font-bold block">✓ Hábito Desejável</span>
                            <span className="text-[10px] text-[#2C5230] font-semibold block mt-0.5">
                              [Sim] é Positivo (Verde)
                            </span>
                            <span className="text-[9px] text-[#6E5D4F] block mt-0.5">
                              Ex: Fui paciente com os filhos?
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewQHabitType('ruim')}
                            className={`p-2.5 rounded-xl text-left border transition-all ${
                              newQHabitType === 'ruim'
                                ? 'bg-[#FDF2EE] text-[#8C3A24] border-[#E8C2B8] font-bold ring-2 ring-[#C06C54]/30'
                                : 'bg-white border-[#EFE8DE] text-[#6E5D4F]'
                            }`}
                          >
                            <span className="text-xs font-bold block">✕ Comportamento a Evitar</span>
                            <span className="text-[10px] text-[#8C3A24] font-semibold block mt-0.5">
                              [Sim] é Negativo (Terracota)
                            </span>
                            <span className="text-[9px] text-[#6E5D4F] block mt-0.5">
                              Ex: Gritei com as crianças?
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingQuestion(false)}
                          className="px-3 py-1.5 text-xs text-[#8C7A6B]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold rounded-xl"
                        >
                          Salvar Pergunta
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EFE8DE] flex justify-end">
          <button
            onClick={() => setIsManageQuestionsModalOpen(false)}
            className="w-full py-3 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold text-center transition-colors shadow-xs"
          >
            Concluir Personalização
          </button>
        </div>
      </div>
    </div>
  );
};

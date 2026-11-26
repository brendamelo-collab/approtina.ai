import { iconPrefix } from '../utils/emoji';
import React, { useMemo, useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuestionItem } from '../types';

const WEEKDAYS = [
  { d: 1, l: 'Seg' },
  { d: 2, l: 'Ter' },
  { d: 3, l: 'Qua' },
  { d: 4, l: 'Qui' },
  { d: 5, l: 'Sex' },
  { d: 6, l: 'Sáb' },
  { d: 0, l: 'Dom' }
];

const FREQUENCIES: { id: QuestionItem['frequency']; label: string }[] = [
  { id: 'todos_os_dias', label: 'Todos os dias' },
  { id: 'dias_uteis', label: 'Dias úteis' },
  { id: 'fins_de_semana', label: 'Fins de semana' },
  { id: 'personalizado', label: 'Escolher dias' }
];

/**
 * Edição completa de uma pergunta do Meu Mapa. Mantém o mesmo id, então
 * todas as respostas já registradas continuam ligadas a ela.
 */
export const QuestionEditorModal: React.FC<{ question: QuestionItem; onClose: (msg?: string) => void }> = ({ question, onClose }) => {
  const { lifeAreas, questionGroups, questionResponses, updateQuestion, deleteQuestion } = useApp();
  const [title, setTitle] = useState(question.title);
  const [habitType, setHabitType] = useState<'bom' | 'ruim'>(question.habitType || (question.positiveIf === 'nao' ? 'ruim' : 'bom'));
  const [areaId, setAreaId] = useState(question.areaId);
  const [groupId, setGroupId] = useState(question.groupId);
  const [frequency, setFrequency] = useState<QuestionItem['frequency']>(question.frequency || 'todos_os_dias');
  const [days, setDays] = useState<number[]>(question.activeDays?.length ? question.activeDays : [1, 2, 3, 4, 5]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const answers = useMemo(() => questionResponses.filter((r) => r.questionId === question.id).length, [questionResponses, question.id]);
  const groups = questionGroups.filter((g) => g.areaId === areaId).sort((a, b) => a.order - b.order);
  const typeChanged = habitType !== (question.habitType || (question.positiveIf === 'nao' ? 'ruim' : 'bom'));

  const save = () => {
    const t = title.trim();
    if (!t) return;
    const isGood = habitType === 'bom';
    updateQuestion(question.id, {
      title: t,
      habitType,
      positiveIf: isGood ? 'sim' : 'nao',
      positiveLabel: isGood ? 'Sim' : 'Não',
      negativeLabel: isGood ? 'Não' : 'Sim',
      areaId,
      groupId: groups.some((g) => g.id === groupId) ? groupId : groups[0]?.id || groupId,
      frequency,
      activeDays: frequency === 'personalizado' ? days : undefined
    });
    onClose('✓ Pergunta atualizada');
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs" onClick={() => onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editar pergunta"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-[#FAF8F5] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#2C2C2C]">Editar pergunta</h2>
            <p className="text-[11px] text-[#8C7A6B] leading-snug mt-0.5">
              {answers > 0
                ? `${answers} ${answers === 1 ? 'resposta registrada continua' : 'respostas registradas continuam'} ligada${answers === 1 ? '' : 's'} a esta pergunta.`
                : 'Ainda sem respostas registradas.'}
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4A3E34]">Pergunta</span>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="w-full bg-white border border-[#EFE8DE] rounded-2xl px-3 py-2.5 text-sm text-[#2C2C2C] leading-snug resize-none focus:outline-none focus:border-[#8C7A6B]"
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[#4A3E34]">Tipo</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHabitType('bom')}
              className={`p-2.5 rounded-2xl border text-left text-xs ${habitType === 'bom' ? 'bg-[#EEF5EF] text-[#2C5230] border-[#97C29B] font-bold' : 'bg-white text-[#5C4F44] border-[#EFE8DE]'}`}
            >
              ✓ Hábito positivo
              <span className="block text-[10px] font-normal opacity-80">“Sim” conta como positivo</span>
            </button>
            <button
              type="button"
              onClick={() => setHabitType('ruim')}
              className={`p-2.5 rounded-2xl border text-left text-xs ${habitType === 'ruim' ? 'bg-[#FDF2EE] text-[#8C3A24] border-[#E8C2B8] font-bold' : 'bg-white text-[#5C4F44] border-[#EFE8DE]'}`}
            >
              ✕ A evitar
              <span className="block text-[10px] font-normal opacity-80">“Sim” conta como negativo</span>
            </button>
          </div>
          {typeChanged && answers > 0 && (
            <p className="text-[11px] text-[#7A5E14] bg-[#FEF9E7] border border-[#EADB9B] rounded-xl p-2 leading-snug">
              As respostas antigas continuam com o mesmo “Sim” ou “Não”; só a cor (positivo/negativo) passa a seguir o novo tipo.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 min-w-0">
            <span className="text-xs font-bold text-[#4A3E34]">Área da vida</span>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                const g = questionGroups.filter((x) => x.areaId === e.target.value).sort((a, b) => a.order - b.order)[0];
                if (g) setGroupId(g.id);
              }}
              className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs text-[#2C2C2C]"
            >
              {lifeAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {iconPrefix(a.icon)}
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 min-w-0">
            <span className="text-xs font-bold text-[#4A3E34]">Grupo</span>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full bg-white border border-[#EFE8DE] rounded-xl px-2.5 py-2 text-xs text-[#2C2C2C]">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[#4A3E34]">Quando perguntar</span>
          <div className="grid grid-cols-2 gap-1.5">
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                className={`py-2 rounded-xl text-xs font-bold border ${frequency === f.id ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {frequency === 'personalizado' && (
            <div className="grid grid-cols-7 gap-1 pt-1">
              {WEEKDAYS.map((w) => {
                const on = days.includes(w.d);
                return (
                  <button
                    key={w.d}
                    type="button"
                    onClick={() => setDays((p) => (on ? (p.length > 1 ? p.filter((x) => x !== w.d) : p) : [...p, w.d]))}
                    className={`py-2 rounded-xl text-[11px] font-bold border ${on ? 'bg-[#4A3E34] border-[#4A3E34] text-white' : 'bg-white border-[#EFE8DE] text-[#5C4F44]'}`}
                  >
                    {w.l}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!title.trim()}
          className="w-full h-12 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> Salvar alterações
        </button>

        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="w-full h-10 text-xs font-bold text-[#A87053] inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir pergunta
          </button>
        ) : (
          <div className="bg-[#FDF2EE] border border-[#E8C2B8] rounded-2xl p-3 space-y-2">
            <p className="text-xs text-[#8C3A24] leading-snug">
              Excluir apaga também {answers > 0 ? `as ${answers} respostas` : 'o histórico'} desta pergunta. Para só corrigir o texto, use “Salvar alterações”.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl bg-white text-[#5C4F44] text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteQuestion(question.id);
                  onClose('Pergunta excluída');
                }}
                className="flex-1 py-2 rounded-xl bg-[#A9472F] text-white text-xs font-bold"
              >
                Excluir mesmo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

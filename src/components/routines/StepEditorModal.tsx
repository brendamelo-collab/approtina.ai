import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DailyChronologicalStep, PeriodKey } from '../../types';
import { spokenForStep } from '../../utils/routineSchedule';
import { DayPicker, Field, Sheet, SoundSelect, SpokenField, ToggleRow, inputCls } from './RoutineFormParts';
import { cleanEmojiInput, displayEmoji } from '../../utils/emoji';

const periodFor = (time: string): PeriodKey => {
  const h = Number(time.split(':')[0]);
  return h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
};

/** Criar ou editar uma etapa da Rotina Diária (com voz). Editar mantém o mesmo id e o histórico. */
export const StepEditorModal: React.FC<{ step?: DailyChronologicalStep; onClose: (msg?: string) => void }> = ({ step, onClose }) => {
  const { addDailyChronologicalStep, updateDailyChronologicalStep, deleteDailyChronologicalStep, currentProfile } = useApp();
  const [title, setTitle] = useState(step?.title || '');
  const [icon, setIcon] = useState(step?.icon || '✨');
  const [time, setTime] = useState(step?.time || '09:00');
  const [days, setDays] = useState<number[]>(step?.daysOfWeek || []);
  const [voice, setVoice] = useState(step ? step.voiceAlert !== false : true);
  const [spoken, setSpoken] = useState(step?.spokenText || '');
  const [sound, setSound] = useState(step?.sound || '');
  const [description, setDescription] = useState(step?.description || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const automatic = spokenForStep({ ...(step || ({} as DailyChronologicalStep)), title: title || 'beber água', spokenText: '' }, currentProfile?.name);

  const save = () => {
    const t = title.trim();
    if (!t) return;
    const data = {
      title: t,
      icon: cleanEmojiInput(icon) || '✨',
      time,
      period: periodFor(time),
      daysOfWeek: days,
      voiceAlert: voice,
      spokenText: spoken.trim() || undefined,
      sound: sound || undefined,
      description: description.trim() || undefined
    };
    if (step) {
      updateDailyChronologicalStep(step.id, data);
      onClose('✓ Rotina atualizada');
    } else {
      addDailyChronologicalStep(data);
      onClose(`✓ "${t}" adicionada à rotina diária`);
    }
  };

  return (
    <Sheet title={step ? 'Editar rotina' : 'Nova etapa da rotina diária'} subtitle={step ? 'As alterações valem para os próximos lembretes; o histórico continua.' : undefined} onClose={() => onClose()}>
      <div className="grid grid-cols-[4.5rem_1fr] gap-2">
        <Field label="Emoji">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={() => setIcon(displayEmoji(icon, '✨'))} className={`${inputCls} text-center text-xl`} aria-label="Emoji" />
        </Field>
        <Field label="Nome da rotina">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Beber água" className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Horário">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Detalhe (opcional)">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: 500 ml" className={inputCls} />
        </Field>
      </div>

      <Field label="Dias da semana" group>
        <DayPicker value={days} onChange={setDays} />
      </Field>

      <ToggleRow checked={voice} onChange={setVoice} title="Lembrete por voz e alarme" hint="Toca o som e fala o lembrete no horário." />

      {voice && (
        <>
          <Field label="O que a voz fala" group>
            <SpokenField value={spoken} onChange={setSpoken} automatic={automatic} />
          </Field>
          <Field label="Som de alerta" group>
            <SoundSelect value={sound} onChange={setSound} />
          </Field>
        </>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!title.trim()}
        className="w-full h-12 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Check className="w-4 h-4" /> {step ? 'Salvar alterações' : 'Adicionar à rotina'}
      </button>

      {step &&
        (!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="w-full h-10 text-xs font-bold text-[#A87053] inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir rotina
          </button>
        ) : (
          <div className="bg-[#FDF2EE] border border-[#E8C2B8] rounded-2xl p-3 space-y-2">
            <p className="text-xs text-[#8C3A24]">Excluir “{step.title}” da rotina diária? Os lembretes dela param.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl bg-white text-[#5C4F44] text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDailyChronologicalStep(step.id);
                  onClose('Rotina excluída');
                }}
                className="flex-1 py-2 rounded-xl bg-[#A9472F] text-white text-xs font-bold"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
    </Sheet>
  );
};

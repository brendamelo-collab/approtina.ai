import React, { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PersonalRoutine } from '../../types';
import { spokenForPersonal } from '../../utils/routineSchedule';
import { DayPicker, Field, Sheet, SoundSelect, SpokenField, ToggleRow, inputCls } from './RoutineFormParts';
import { cleanEmojiInput, displayEmoji } from '../../utils/emoji';

const ICONS = ['🧴', '🚿', '💆', '🪥', '💅', '🧖', '💊', '🩹', '🏃', '📚', '🧘', '✨'];

/** Criar ou editar uma Rotina Pessoal (o cadastro original). */
export const PersonalRoutineEditor: React.FC<{ routine?: PersonalRoutine; defaultProfileId?: string; onClose: (msg?: string) => void }> = ({
  routine,
  defaultProfileId,
  onClose
}) => {
  const { profiles, currentProfile, addPersonalRoutine, updatePersonalRoutine, deletePersonalRoutine } = useApp();
  const [profileId, setProfileId] = useState(routine?.profileId || defaultProfileId || currentProfile?.id || profiles[0]?.id || '');
  const [title, setTitle] = useState(routine?.title || '');
  const [context, setContext] = useState(routine?.context || '');
  const [icon, setIcon] = useState(routine?.icon || '✨');
  const [days, setDays] = useState<number[]>(routine?.daysOfWeek || []);
  const [time, setTime] = useState(routine?.time || '');
  const [notes, setNotes] = useState(routine?.notes || '');
  const [inDaily, setInDaily] = useState(routine?.inDailyRoutine ?? false);
  const [onCalendar, setOnCalendar] = useState(routine?.showOnCalendar ?? false);
  const [spoken, setSpoken] = useState(routine?.spokenText || '');
  const [sound, setSound] = useState(routine?.sound || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const draft: PersonalRoutine = {
    id: routine?.id || 'novo',
    profileId,
    title: title || 'fazer esfoliação',
    context: context || (title ? '' : 'durante o banho'),
    icon,
    daysOfWeek: days,
    time,
    inDailyRoutine: inDaily,
    showOnCalendar: onCalendar,
    createdAt: ''
  };
  const automatic = spokenForPersonal({ ...draft, spokenText: '' }, profiles);
  const needsTime = (inDaily || onCalendar) && !time;

  const save = () => {
    const t = title.trim();
    if (!t || needsTime || !profileId) return;
    const data = {
      profileId,
      title: t,
      context: context.trim() || undefined,
      icon: cleanEmojiInput(icon) || '✨',
      daysOfWeek: days,
      time: time || undefined,
      notes: notes.trim() || undefined,
      inDailyRoutine: inDaily,
      showOnCalendar: onCalendar,
      spokenText: spoken.trim() || undefined,
      sound: sound || undefined
    };
    if (routine) {
      updatePersonalRoutine(routine.id, data);
      onClose('✓ Rotina pessoal atualizada');
    } else {
      addPersonalRoutine(data);
      onClose(`✓ "${t}" criada`);
    }
  };

  return (
    <Sheet title={routine ? 'Editar rotina pessoal' : 'Nova rotina pessoal'} onClose={() => onClose()}>
      <Field label="De quem é" group>
        <div className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProfileId(p.id)}
              className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-xs font-bold ${profileId === p.id ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'}`}
            >
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#EFE8DE] text-[#5C4F44] flex items-center justify-center text-[11px]">{p.name.charAt(0)}</span>
              )}
              {p.name}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-[4.5rem_1fr] gap-2">
        <Field label="Emoji">
          <input value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={() => setIcon(displayEmoji(icon, '✨'))} className={`${inputCls} text-center text-xl`} aria-label="Emoji" />
        </Field>
        <Field label="Atividade">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Fazer esfoliação" className={inputCls} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-1">
        {ICONS.map((i) => (
          <button key={i} type="button" onClick={() => setIcon(i)} className={`w-8 h-8 rounded-lg text-base ${icon === i ? 'bg-[#EAE0D2]' : 'bg-white border border-[#EFE8DE]'}`}>
            {i}
          </button>
        ))}
      </div>

      <Field label="Contexto (opcional)" hint="Entra na frase falada: “…fazer esfoliação durante o banho.”">
        <input value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ex.: durante o banho" className={inputCls} />
      </Field>

      <Field label="Dias" group>
        <DayPicker value={days} onChange={setDays} />
      </Field>

      <Field label="Horário" hint={needsTime ? 'Escolha um horário para o lembrete e o calendário.' : 'Opcional se for só para consultar aqui.'}>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} ${needsTime ? 'border-[#E8C2B8]' : ''}`} />
      </Field>

      <div className="space-y-2">
        <ToggleRow
          checked={inDaily}
          onChange={setInDaily}
          title="Adicionar à rotina diária / lembrete por voz"
          hint="Aparece na Rotina Diária nos dias e horário escolhidos e a voz avisa. Continua cadastrada aqui."
        />
        <ToggleRow checked={onCalendar} onChange={setOnCalendar} title="Mostrar no calendário" hint="Aparece na Agenda nos dias escolhidos." />
      </div>

      {inDaily && (
        <>
          <Field label="O que a voz fala" group>
            <SpokenField value={spoken} onChange={setSpoken} automatic={automatic} />
          </Field>
          <Field label="Som de alerta" group>
            <SoundSelect value={sound} onChange={setSound} />
          </Field>
        </>
      )}

      <Field label="Observações (opcional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex.: usar a pomada da gaveta" className={`${inputCls} resize-none`} />
      </Field>

      <button
        type="button"
        onClick={save}
        disabled={!title.trim() || needsTime}
        className="w-full h-12 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Check className="w-4 h-4" /> {routine ? 'Salvar alterações' : 'Criar rotina pessoal'}
      </button>

      {routine &&
        (!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="w-full h-10 text-xs font-bold text-[#A87053] inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir rotina pessoal
          </button>
        ) : (
          <div className="bg-[#FDF2EE] border border-[#E8C2B8] rounded-2xl p-3 space-y-2">
            <p className="text-xs text-[#8C3A24] leading-snug">
              Excluir “{routine.title}”? {routine.inDailyRoutine || routine.showOnCalendar ? 'Ela também sai da rotina diária, do calendário e dos lembretes.' : ''}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl bg-white text-[#5C4F44] text-xs font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePersonalRoutine(routine.id);
                  onClose('Rotina pessoal excluída');
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

import React, { useMemo, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RecurringGroup, RecurringTaskItem } from '../../types';
import { cleanEmojiInput, displayEmoji } from '../../utils/emoji';
import { DayPicker, Field, Sheet, ToggleRow, inputCls } from '../routines/RoutineFormParts';
import { ConfirmDialog } from '../ui/Kit';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const RECURRENCES = ['Semanalmente', 'A cada 14 dias', 'Mensalmente', 'Diariamente'];

/** Dono da tarefa: o integrante escolhido ou, nas tarefas antigas, o perfil principal. */
export const ownerOf = (t: Pick<RecurringTaskItem, 'memberId'>, profiles: { id: string; isPrimary?: boolean }[]) =>
  (t.memberId && profiles.some((p) => p.id === t.memberId) ? t.memberId : (profiles.find((p) => p.isPrimary) || profiles[0])?.id) || '';

/**
 * Criar ou editar uma tarefa recorrente. Editar mantém o mesmo id, o histórico de execuções
 * e tudo o que não foi mudado (inclusive a data da próxima vez e o status de hoje).
 */
export const RecurringTaskEditor: React.FC<{
  task?: RecurringTaskItem;
  defaultMemberId?: string;
  defaultGroupId?: string;
  onClose: (msg?: string) => void;
}> = ({ task, defaultMemberId, defaultGroupId, onClose }) => {
  const { profiles, recurringGroups, addRecurringGroup, addRecurringTask, updateRecurringTask, deleteRecurringTask } = useApp();
  const [title, setTitle] = useState(task?.title || '');
  const [icon, setIcon] = useState(displayEmoji(task?.icon, '✨'));
  const [notes, setNotes] = useState(task?.notes || '');
  const [memberId, setMemberId] = useState(task ? ownerOf(task, profiles) : defaultMemberId || ownerOf({}, profiles));
  const [groupId, setGroupId] = useState(task?.groupId || defaultGroupId || '');
  const [newGroupName, setNewGroupName] = useState('');
  const [days, setDays] = useState<number[]>(task?.daysOfWeek && task.daysOfWeek.length < 7 ? task.daysOfWeek : task?.daysOfWeek ? [] : task ? [] : [1]);
  const [daysTouched, setDaysTouched] = useState(false);
  const [time, setTime] = useState(task?.time || '13:00');
  const [recurrence, setRecurrence] = useState(task?.recurrence || 'Semanalmente');
  const [showOnCalendar, setShowOnCalendar] = useState(task ? task.showOnCalendar ?? true : true);
  const [inDaily, setInDaily] = useState(task ? task.showInDailyRoutine !== false : true);
  const [voice, setVoice] = useState(task ? task.voiceReminder !== false : true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const memberGroups = useMemo(() => recurringGroups.filter((g) => g.memberId === memberId), [recurringGroups, memberId]);
  const recurrenceOptions = RECURRENCES.includes(recurrence) ? RECURRENCES : [recurrence, ...RECURRENCES];

  const save = () => {
    const t = title.trim();
    if (!t) return;
    let gid = groupId;
    if (gid === '__novo__') gid = newGroupName.trim() ? addRecurringGroup({ memberId, name: newGroupName.trim() }) : '';
    if (gid && !recurringGroups.some((g) => g.id === gid && g.memberId === memberId) && groupId !== '__novo__') gid = '';
    // Dias: só muda se a pessoa mexeu (tarefas antigas sem dias continuam iguais)
    const daysValue = !task || daysTouched ? (days.length === 0 ? ALL_DAYS : days) : task.daysOfWeek;
    const data: Partial<RecurringTaskItem> = {
      title: t,
      icon: cleanEmojiInput(icon) || '✨',
      notes: notes.trim() || undefined,
      memberId,
      groupId: gid || undefined,
      daysOfWeek: daysValue,
      time,
      recurrence,
      showOnCalendar,
      showInDailyRoutine: inDaily,
      voiceReminder: voice
    };
    if (task) {
      updateRecurringTask(task.id, data);
      onClose('✓ Tarefa atualizada');
    } else {
      addRecurringTask({ ...(data as RecurringTaskItem), nextDate: '' });
      onClose(`✓ "${t}" criada`);
    }
  };

  return (
    <>
      <Sheet
        title={task ? 'Editar tarefa recorrente' : 'Nova tarefa recorrente'}
        subtitle={task ? 'O que você não mudar continua igual, e o histórico é mantido.' : undefined}
        onClose={() => onClose()}
      >
        <div className="grid grid-cols-[4.5rem_1fr] gap-2">
          <Field label="Emoji">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={() => setIcon(displayEmoji(icon, '✨'))} className={`${inputCls} text-center text-xl`} aria-label="Emoji" />
          </Field>
          <Field label="Nome da tarefa">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Trocar roupa de cama" className={inputCls} />
          </Field>
        </div>

        <Field label="Descrição (opcional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Detalhes, materiais, observações…" className={`${inputCls} resize-none leading-snug`} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="De quem é">
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setGroupId('');
              }}
              className={inputCls}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grupo">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
              <option value="">Sem grupo</option>
              {memberGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {displayEmoji(g.icon, '') ? `${displayEmoji(g.icon, '')} ` : ''}
                  {g.name}
                </option>
              ))}
              <option value="__novo__">+ Novo grupo…</option>
            </select>
          </Field>
        </div>
        {groupId === '__novo__' && (
          <Field label="Nome do novo grupo">
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex.: Casa, Escola, Saúde" className={inputCls} autoFocus />
          </Field>
        )}

        <Field label="Dias da semana" group>
          <DayPicker
            value={days}
            onChange={(d) => {
              setDays(d);
              setDaysTouched(true);
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Horário">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Frequência">
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputCls}>
              {recurrenceOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-bold text-[#4A3E34]">Onde esta tarefa aparece</span>
          <ToggleRow checked={showOnCalendar} onChange={setShowOnCalendar} title="Na Agenda" hint="Aparece no calendário nos dias escolhidos." />
          <ToggleRow checked={inDaily} onChange={setInDaily} title="Na Rotina Diária" hint="Entra na lista do dia em Rotinas e no Início." />
          <ToggleRow checked={voice} onChange={setVoice} title="Lembrete com alarme e voz" hint="Toca e fala no horário. Desligado: fica só organizada aqui." />
          <p className="text-[10px] text-[#8C7A6B] leading-snug">Desligar não apaga a tarefa nem muda os dias: só controla onde ela aparece e se avisa.</p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!title.trim() || (groupId === '__novo__' && !newGroupName.trim())}
          className="w-full h-12 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> {task ? 'Salvar alterações' : 'Criar tarefa'}
        </button>

        {task && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="w-full h-10 text-xs font-bold text-[#A87053] inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir tarefa
          </button>
        )}
      </Sheet>
      {task && confirmDelete && (
        <ConfirmDialog
          title={`Excluir “${task.title}”?`}
          message="A tarefa sai da lista, da Agenda e dos lembretes. O histórico do que já foi feito continua nos relatórios."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteRecurringTask(task.id);
            onClose('Tarefa excluída');
          }}
        />
      )}
    </>
  );
};

/** Criar, renomear ou apagar um grupo (apagar o grupo não apaga as tarefas). */
export const RecurringGroupEditor: React.FC<{ group?: RecurringGroup; memberId: string; onClose: (msg?: string) => void }> = ({ group, memberId, onClose }) => {
  const { profiles, recurringTasks, addRecurringGroup, updateRecurringGroup, deleteRecurringGroup } = useApp();
  const [name, setName] = useState(group?.name || '');
  const [icon, setIcon] = useState(group?.icon ? displayEmoji(group.icon, '') : '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const owner = profiles.find((p) => p.id === (group?.memberId || memberId));
  const count = group ? recurringTasks.filter((t) => t.groupId === group.id).length : 0;

  const save = () => {
    const n = name.trim();
    if (!n) return;
    const ic = cleanEmojiInput(icon) || undefined;
    if (group) {
      updateRecurringGroup(group.id, { name: n, icon: ic });
      onClose('✓ Grupo atualizado');
    } else {
      addRecurringGroup({ memberId, name: n, icon: ic });
      onClose(`✓ Grupo "${n}" criado`);
    }
  };

  return (
    <>
      <Sheet title={group ? 'Editar grupo' : 'Novo grupo'} subtitle={owner ? `Na área de ${owner.name}` : undefined} onClose={() => onClose()}>
        <div className="grid grid-cols-[4.5rem_1fr] gap-2">
          <Field label="Emoji">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} onBlur={() => setIcon(displayEmoji(icon, ''))} placeholder="🏠" className={`${inputCls} text-center text-xl`} aria-label="Emoji do grupo" />
          </Field>
          <Field label="Nome do grupo">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Casa, Higiene, Escola" className={inputCls} autoFocus />
          </Field>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          className="w-full h-12 rounded-full bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> {group ? 'Salvar' : 'Criar grupo'}
        </button>
        {group && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="w-full h-10 text-xs font-bold text-[#A87053] inline-flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Excluir grupo
          </button>
        )}
      </Sheet>
      {group && confirmDelete && (
        <ConfirmDialog
          title={`Excluir o grupo “${group.name}”?`}
          message={
            count === 0
              ? 'O grupo está vazio.'
              : count === 1
                ? 'A tarefa dele não é apagada: fica em “Sem grupo”.'
                : `As ${count} tarefas dele não são apagadas: ficam em “Sem grupo”.`
          }
          confirmLabel="Excluir grupo"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteRecurringGroup(group.id);
            onClose('Grupo excluído');
          }}
        />
      )}
    </>
  );
};

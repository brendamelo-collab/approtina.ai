import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, ChevronDown, FolderPlus, ListChecks, Pencil, Plus, RefreshCw, Repeat, Sparkles, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { CheckCircle, ConfirmDialog, IconBubble, ListRow, PageHeader, PeachButton, RoundButton, SectionTitle, SegmentTrack, SHADOW_SOFT, SoftCard, StatusChip } from '../ui/Kit';
import { RecurringGroup, RecurringTaskItem } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { displayEmoji } from '../../utils/emoji';
import { todayISO } from '../../utils/dateUtils';
import { RecurringGroupEditor, RecurringTaskEditor, ownerOf } from '../recurring/RecurringEditors';

const daysOfWeekNames = [
  { id: 1, name: 'Segunda', short: 'Seg' },
  { id: 2, name: 'Terça', short: 'Ter' },
  { id: 3, name: 'Quarta', short: 'Qua' },
  { id: 4, name: 'Quinta', short: 'Qui' },
  { id: 5, name: 'Sexta', short: 'Sex' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
  { id: 0, name: 'Domingo', short: 'Dom' }
];

/** Emoji da tarefa: o gravado; nas antigas sem emoji, um pelo assunto. */
const taskEmoji = (task: Pick<RecurringTaskItem, 'icon' | 'title'>) => {
  const own = displayEmoji(task.icon, '');
  if (own) return own;
  const lower = (task.title || '').toLowerCase();
  if (lower.includes('pneu') || lower.includes('carro') || lower.includes('moto')) return '🏍️';
  if (lower.includes('sapato') || lower.includes('tênis')) return '👟';
  if (lower.includes('cama') || lower.includes('lençol') || lower.includes('toalha')) return '🛏️';
  if (lower.includes('planta') || lower.includes('jardim')) return '🌱';
  if (lower.includes('filtro')) return '❄️';
  if (lower.includes('geladeira')) return '🧊';
  return '✨';
};

const daysText = (days?: number[]) => {
  if (!days) return 'Na data marcada';
  if (days.length === 0 || days.length === 7) return 'Todos os dias';
  return days.map((d) => daysOfWeekNames.find((x) => x.id === d)?.short).join(', ');
};

type EditorState = { task?: RecurringTaskItem; memberId?: string; groupId?: string } | null;
type GroupEditorState = { group?: RecurringGroup; memberId: string } | null;

export const TarefasRecorrentesView: React.FC = () => {
  const { recurringTasks, completeRecurringTask, deleteRecurringTask, uncompleteRecurringTask, recurringHistory, recurringGroups, profiles, activityLog } = useApp();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'todos'>('todos');
  const [editor, setEditor] = useState<EditorState>(null);
  const [groupEditor, setGroupEditor] = useState<GroupEditorState>(null);
  const [confirmTask, setConfirmTask] = useState<RecurringTaskItem | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const today = todayISO();
  const notDoneToday = activityLog.days?.[today]?.t || {};

  const toast = (msg?: string) => {
    if (!msg) return;
    setToastNotification(msg);
    setTimeout(() => setToastNotification((m) => (m === msg ? null : m)), 2800);
  };

  const displayedTasks = recurringTasks.filter((t) => {
    if (selectedDayFilter === 'todos') return true;
    return t.daysOfWeek ? t.daysOfWeek.length === 0 || t.daysOfWeek.includes(selectedDayFilter) : true;
  });

  // Áreas: uma por integrante (principal primeiro), com as tarefas dele
  const areas = useMemo(() => {
    const ordered = [...profiles].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary));
    return ordered.map((p) => ({
      profile: p,
      tasks: displayedTasks.filter((t) => ownerOf(t, profiles) === p.id),
      groups: recurringGroups.filter((g) => g.memberId === p.id)
    }));
  }, [profiles, displayedTasks, recurringGroups]);

  const taskRow = (task: RecurringTaskItem) => {
    const isDone = task.status === 'concluido';
    const notDone = !isDone && notDoneToday[task.id] === 'nao_fez';
    const onCal = task.showOnCalendar ?? true;
    const inDaily = task.showInDailyRoutine !== false;
    const voice = task.voiceReminder !== false;
    return (
      <div key={task.id} className="py-3 border-t border-[#EFE8DE]/70 first:border-t-0">
        <div className="flex items-start gap-3">
          <IconBubble size="sm">{taskEmoji(task)}</IconBubble>
          <div className="min-w-0 flex-1">
            <h4 className={`text-[15px] font-bold leading-snug break-words ${isDone ? 'text-[#8C7A6B]' : 'text-[#2C2C2C]'}`}>{task.title}</h4>
            {task.notes && <p className="text-[12px] text-[#6E5D4F] leading-snug mt-0.5 break-words">{task.notes}</p>}
            <p className="text-[12px] text-[#8C7A6B] leading-snug mt-0.5">
              {task.recurrence} · {daysText(task.daysOfWeek)} · {task.time || '13:00'}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${onCal ? 'bg-[#EEF5EF] text-[#2C5230]' : 'bg-[#F4EDE2] text-[#8C7A6B] line-through'}`}>
                <Calendar className="w-3 h-3" /> Agenda
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${inDaily ? 'bg-[#EEF5EF] text-[#2C5230]' : 'bg-[#F4EDE2] text-[#8C7A6B] line-through'}`}>
                <ListChecks className="w-3 h-3" /> Rotina
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${voice ? 'bg-[#EEF5EF] text-[#2C5230]' : 'bg-[#F4EDE2] text-[#8C7A6B] line-through'}`}>
                {voice ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />} Lembrete
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {isDone ? (
              <CheckCircle done label={`Desfazer ${task.title}`} onClick={() => uncompleteRecurringTask(task.id)} />
            ) : notDone ? (
              <StatusChip tone="bad">Não fiz</StatusChip>
            ) : (
              <StatusChip tone="pending">Pendente</StatusChip>
            )}
          </div>
        </div>
        <div className="mt-2 pl-[52px] flex flex-wrap items-center gap-1.5">
          {!isDone && (
            <button
              type="button"
              onClick={() => {
                completeRecurringTask(task.id);
                toast(`✓ "${task.title}" concluída!`);
              }}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-[#E6C8A8] text-[#3A2619] text-xs font-semibold"
              aria-label={`Concluir ${task.title}`}
            >
              Concluir
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditor({ task })}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-[#F4EDE2] text-[#4A3E34] text-xs font-semibold"
            aria-label={`Editar ${task.title}`}
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmTask(task)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[#A9472F] hover:bg-[#FDF2EE] text-xs font-semibold"
            aria-label={`Excluir tarefa ${task.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-32 select-none relative">
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#7D9D7F] shrink-0" />
            <span className="font-semibold break-words">{toastNotification}</span>
          </span>
          <button onClick={() => setToastNotification(null)} className="text-white/70 hover:text-white p-1 shrink-0" aria-label="Fechar aviso">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PageHeader
        icon={RefreshCw}
        title="Tarefas Recorrentes"
        right={
          <RoundButton label="Adicionar tarefa recorrente" tone="accent" onClick={() => setEditor({})}>
            <Plus className="w-5 h-5" strokeWidth={2.2} />
          </RoundButton>
        }
      />

      <div className="mt-3 space-y-4">
        <SegmentTrack<number | 'todos'>
          options={[{ id: 'todos', label: 'Todas' }, ...daysOfWeekNames.map((d) => ({ id: d.id, label: d.short }))]}
          value={selectedDayFilter}
          onChange={setSelectedDayFilter}
          marker={new Date().getDay()}
        />

        {areas.map(({ profile, tasks, groups }) => {
          const isOpen = !collapsed[profile.id];
          const loose = tasks.filter((t) => !t.groupId || !groups.some((g) => g.id === t.groupId));
          return (
            <SoftCard key={profile.id} className="p-4" as="section">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [profile.id]: isOpen }))}
                  aria-expanded={isOpen}
                  className="min-w-0 flex-1 flex items-center gap-3 text-left"
                >
                  <UserAvatar name={profile.name} avatarUrl={profile.avatarUrl} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-[#2C2C2C] leading-tight break-words">{profile.name}</span>
                    <span className="block text-xs text-[#8C7A6B]">
                      {tasks.length === 1 ? '1 tarefa' : `${tasks.length} tarefas`}
                      {groups.length ? ` · ${groups.length === 1 ? '1 grupo' : `${groups.length} grupos`}` : ''}
                    </span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#B78A58] shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 space-y-3">
                  {loose.length > 0 && (
                    <div className={groups.length ? 'rounded-[20px] bg-white/70 px-3' : ''}>
                      {groups.length > 0 && <p className="pt-3 text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B]">Sem grupo</p>}
                      {loose.map(taskRow)}
                    </div>
                  )}

                  {groups.map((g) => {
                    const gTasks = tasks.filter((t) => t.groupId === g.id);
                    return (
                      <div key={g.id} className="rounded-[20px] bg-white/70 px-3 pb-1">
                        <div className="flex items-center gap-2 pt-3 pb-1">
                          <span className="text-lg leading-none">{displayEmoji(g.icon, '📁')}</span>
                          <h3 className="min-w-0 flex-1 text-sm font-bold text-[#2C2C2C] break-words">{g.name}</h3>
                          <span className="text-[11px] text-[#8C7A6B] shrink-0">{gTasks.length}</span>
                          <button
                            type="button"
                            onClick={() => setEditor({ memberId: profile.id, groupId: g.id })}
                            className="w-8 h-8 rounded-full bg-[#F4EDE2] text-[#4A3E34] flex items-center justify-center shrink-0"
                            aria-label={`Nova tarefa no grupo ${g.name}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupEditor({ group: g, memberId: profile.id })}
                            className="w-8 h-8 rounded-full bg-[#F4EDE2] text-[#4A3E34] flex items-center justify-center shrink-0"
                            aria-label={`Editar grupo ${g.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {gTasks.length === 0 ? <p className="py-2 text-xs text-[#8C7A6B]">Nenhuma tarefa neste grupo{selectedDayFilter !== 'todos' ? ' neste dia' : ''}.</p> : gTasks.map(taskRow)}
                      </div>
                    );
                  })}

                  {tasks.length === 0 && groups.length === 0 && (
                    <p className="text-xs text-[#8C7A6B] px-1">{selectedDayFilter === 'todos' ? 'Nenhuma tarefa ainda.' : 'Nenhuma tarefa neste dia.'}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditor({ memberId: profile.id })}
                      className={`h-10 rounded-full bg-[#FAF8F5] text-[#4A3E34] text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${SHADOW_SOFT}`}
                    >
                      <Plus className="w-4 h-4" /> Tarefa
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupEditor({ memberId: profile.id })}
                      className={`h-10 rounded-full bg-[#FAF8F5] text-[#4A3E34] text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${SHADOW_SOFT}`}
                    >
                      <FolderPlus className="w-4 h-4" /> Grupo
                    </button>
                  </div>
                </div>
              )}
            </SoftCard>
          );
        })}

        {recurringTasks.length === 0 && (
          <SoftCard className="p-8 text-center space-y-2">
            <Repeat className="w-8 h-8 text-[#B78A58] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">Nenhuma tarefa recorrente</h3>
            <p className="text-xs text-[#8C7A6B]">Crie tarefas para cada pessoa da família e organize em grupos, se quiser.</p>
          </SoftCard>
        )}

        <PeachButton onClick={() => setEditor({})}>
          Adicionar tarefa <Plus className="w-4 h-4" />
        </PeachButton>

        <SoftCard className="p-4">
          <div className="px-1">
            <SectionTitle
              title="Histórico recente"
              action={recurringHistory.length > 4 ? { label: showAllHistory ? 'Ver menos' : 'Ver histórico', onClick: () => setShowAllHistory((v) => !v) } : undefined}
            />
          </div>
          {recurringHistory.length === 0 ? (
            <p className="px-1 pt-2 text-sm text-[#8C7A6B]">Quando você concluir uma tarefa, ela aparece aqui.</p>
          ) : (
            <div className="mt-1">
              {[...recurringHistory]
                .sort((x, y) => (y.completedAt || '').localeCompare(x.completedAt || ''))
                .slice(0, showAllHistory ? 30 : 4)
                .map((h) => {
                  const t = recurringTasks.find((x) => x.id === h.taskId);
                  return (
                    <ListRow
                      key={h.id}
                      icon={<IconBubble size="sm">{taskEmoji(t || { title: h.taskTitle, icon: '' })}</IconBubble>}
                      title={h.taskTitle}
                      subtitle={`Concluída em ${h.displayDate}`}
                      right={<CheckCircle done label="Concluída" />}
                    />
                  );
                })}
            </div>
          )}
        </SoftCard>
      </div>

      {editor && (
        <RecurringTaskEditor
          task={editor.task}
          defaultMemberId={editor.memberId}
          defaultGroupId={editor.groupId}
          onClose={(msg) => {
            setEditor(null);
            toast(msg);
          }}
        />
      )}
      {groupEditor && (
        <RecurringGroupEditor
          group={groupEditor.group}
          memberId={groupEditor.memberId}
          onClose={(msg) => {
            setGroupEditor(null);
            toast(msg);
          }}
        />
      )}
      {confirmTask && (
        <ConfirmDialog
          title={`Excluir “${confirmTask.title}”?`}
          message="A tarefa sai da lista, da Agenda e dos lembretes. O histórico do que já foi feito continua nos relatórios."
          onCancel={() => setConfirmTask(null)}
          onConfirm={() => {
            deleteRecurringTask(confirmTask.id);
            toast('Tarefa excluída');
            setConfirmTask(null);
          }}
        />
      )}
    </div>
  );
};

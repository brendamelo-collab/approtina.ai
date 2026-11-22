import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyChronologicalStep, PersonalRoutine } from '../../types';
import { BellOff, Calendar, Check, ChevronLeft, Pencil, Plus, Repeat, Volume2, X } from 'lucide-react';
import { isMuted, muteLabel } from '../../utils/alarmMute';
import { daysLabel, personalOccursOn, profileName, spokenForPersonal, spokenForStep, stepOccursOn } from '../../utils/routineSchedule';
import { SilenceRoutinesSheet } from '../SilenceRoutinesSheet';
import { StepEditorModal } from '../routines/StepEditorModal';
import { PersonalRoutineEditor } from '../routines/PersonalRoutineEditor';

type Tab = 'diaria' | 'semanal' | 'pessoais';

interface DailyItem {
  key: string;
  kind: 'etapa' | 'recorrente' | 'pessoal';
  id: string;
  time: string;
  title: string;
  icon: string;
  completed: boolean;
  voice: boolean;
  spoken: string;
  badge?: string;
}

const WEEK = [
  { index: 1, name: 'Segunda-feira', short: 'Seg', emoji: '☕' },
  { index: 2, name: 'Terça-feira', short: 'Ter', emoji: '⚽' },
  { index: 3, name: 'Quarta-feira', short: 'Qua', emoji: '🥦' },
  { index: 4, name: 'Quinta-feira', short: 'Qui', emoji: '🧺' },
  { index: 5, name: 'Sexta-feira', short: 'Sex', emoji: '🎬' },
  { index: 6, name: 'Sábado', short: 'Sáb', emoji: '🌳' },
  { index: 0, name: 'Domingo', short: 'Dom', emoji: '🍝' }
];

export const RotinasView: React.FC = () => {
  const {
    setActiveTab,
    dailyChronologicalSteps,
    toggleDailyChronologicalStep,
    recurringTasks,
    completeRecurringTask,
    uncompleteRecurringTask,
    personalRoutines,
    togglePersonalRoutineToday,
    updatePersonalRoutine,
    profiles,
    currentProfile,
    speakVoiceReminder,
    notificationPreferences
  } = useApp();

  const [tab, setTab] = useState<Tab>('diaria');
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay());
  const [toast, setToast] = useState<string | null>(null);
  const [silenceOpen, setSilenceOpen] = useState(false);
  const [stepEditor, setStepEditor] = useState<{ step?: DailyChronologicalStep } | null>(null);
  const [personalEditor, setPersonalEditor] = useState<{ routine?: PersonalRoutine; profileId?: string } | null>(null);
  const [profileFilter, setProfileFilter] = useState<string>('todos');

  const showToast = (msg?: string) => {
    if (!msg) return;
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const muted = isMuted(notificationPreferences.alarmsMutedUntil);
  const today = new Date().getDay();

  /** Tudo o que acontece num dia da semana: etapas + tarefas recorrentes + rotinas pessoais integradas. */
  const itemsFor = (weekday: number, isToday: boolean): DailyItem[] =>
    [
      ...dailyChronologicalSteps
        .filter((s) => stepOccursOn(s, weekday))
        .map<DailyItem>((s) => ({
          key: `etapa-${s.id}`,
          kind: 'etapa',
          id: s.id,
          time: s.time,
          title: s.title,
          icon: s.icon || '✨',
          completed: isToday && s.completed,
          voice: s.voiceAlert !== false,
          spoken: spokenForStep(s, currentProfile?.name),
          badge: s.daysOfWeek?.length ? daysLabel(s.daysOfWeek) : undefined
        })),
      ...recurringTasks
        .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(weekday) : true))
        .map<DailyItem>((t) => ({
          key: `rec-${t.id}`,
          kind: 'recorrente',
          id: t.id,
          time: t.time || '13:00',
          title: t.title,
          icon: '🔁',
          completed: isToday && t.status === 'concluido',
          voice: !!t.time,
          spoken: `${currentProfile?.name ? `${currentProfile.name}, ` : ''}está na hora de: ${t.title}.`,
          badge: 'Tarefa recorrente'
        })),
      ...personalRoutines
        .filter((p) => p.inDailyRoutine && p.time && personalOccursOn(p, weekday))
        .map<DailyItem>((p) => ({
          key: `pes-${p.id}`,
          kind: 'pessoal',
          id: p.id,
          time: p.time || '',
          title: `${p.title}${p.context ? ` ${p.context}` : ''}`,
          icon: p.icon || '✨',
          completed: isToday && !!p.completedOn,
          voice: true,
          spoken: spokenForPersonal(p, profiles),
          badge: `Rotina pessoal · ${profileName(profiles, p.profileId)}`
        }))
    ].sort((a, b) => a.time.localeCompare(b.time));

  const todayItems = itemsFor(today, true);
  const doneCount = todayItems.filter((i) => i.completed).length;
  const pct = todayItems.length ? Math.round((doneCount / todayItems.length) * 100) : 0;

  const toggle = (it: DailyItem) => {
    if (it.kind === 'etapa') toggleDailyChronologicalStep(it.id);
    else if (it.kind === 'recorrente') (it.completed ? uncompleteRecurringTask : completeRecurringTask)(it.id);
    else togglePersonalRoutineToday(it.id);
  };

  const openEditor = (it: DailyItem) => {
    if (it.kind === 'etapa') setStepEditor({ step: dailyChronologicalSteps.find((s) => s.id === it.id) });
    else if (it.kind === 'pessoal') setPersonalEditor({ routine: personalRoutines.find((p) => p.id === it.id) });
    else setActiveTab('recorrentes');
  };

  const filteredPersonal = useMemo(
    () => (profileFilter === 'todos' ? personalRoutines : personalRoutines.filter((p) => p.profileId === profileFilter)),
    [personalRoutines, profileFilter]
  );
  const personalByProfile = useMemo(() => {
    const ids = profileFilter === 'todos' ? profiles.map((p) => p.id) : [profileFilter];
    const orphans = filteredPersonal.filter((r) => !profiles.some((p) => p.id === r.profileId));
    const groups = ids
      .map((id) => ({ id, name: profileName(profiles, id), avatar: profiles.find((p) => p.id === id)?.avatarUrl, items: filteredPersonal.filter((r) => r.profileId === id) }))
      .filter((g) => g.items.length > 0 || profileFilter !== 'todos');
    if (orphans.length) groups.push({ id: '_', name: 'Sem perfil', avatar: undefined, items: orphans });
    return groups;
  }, [filteredPersonal, profiles, profileFilter]);

  const row = (it: DailyItem, interactive: boolean) => (
    <div
      key={it.key}
      className={`flex items-center gap-2.5 p-2.5 border rounded-2xl ${it.kind === 'etapa' ? 'bg-white border-[#EFE8DE]' : 'bg-[#FAF6F0] border-[#EADFCB]'}`}
    >
      {interactive ? (
        <button
          type="button"
          onClick={() => toggle(it)}
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base transition-colors ${it.completed ? 'bg-[#7D9D7F] text-white' : 'bg-[#F4EDE2] text-[#5C4F44]'}`}
          aria-label={it.completed ? `Desmarcar ${it.title}` : `Marcar ${it.title} como feita`}
        >
          {it.completed ? <Check className="w-4 h-4" /> : it.icon}
        </button>
      ) : (
        <span className="w-9 h-9 shrink-0 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-base">{it.icon}</span>
      )}
      <button type="button" onClick={() => openEditor(it)} className="min-w-0 flex-1 text-left">
        <span className="flex items-start gap-2">
          <span className="mt-px text-[10px] font-extrabold text-[#5C4F44] bg-[#F4EDE2] px-1.5 py-0.5 rounded tabular-nums shrink-0">{it.time}</span>
          <span className={`text-xs font-bold leading-snug break-words line-clamp-2 ${it.completed ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'}`}>{it.title}</span>
        </span>
        {it.badge && <span className="block text-[10px] text-[#8C7A6B] font-semibold mt-0.5 truncate">{it.badge}</span>}
      </button>
      {it.voice && (
        <button
          type="button"
          onClick={() => speakVoiceReminder(it.spoken)}
          className="w-8 h-8 shrink-0 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B] flex items-center justify-center"
          aria-label={`Ouvir o lembrete de ${it.title}`}
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => openEditor(it)}
        className="w-8 h-8 shrink-0 rounded-xl text-[#A39385] hover:text-[#5C4F44] flex items-center justify-center"
        aria-label={`Editar ${it.title}`}
      >
        {it.kind === 'recorrente' ? <Repeat className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none relative space-y-3.5">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-11/12 max-w-md bg-[#2C2C2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold">{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/70 p-1" aria-label="Fechar aviso">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {silenceOpen && <SilenceRoutinesSheet onClose={(m) => { setSilenceOpen(false); showToast(m); }} />}
      {stepEditor && <StepEditorModal step={stepEditor.step} onClose={(m) => { setStepEditor(null); showToast(m); }} />}
      {personalEditor && (
        <PersonalRoutineEditor routine={personalEditor.routine} defaultProfileId={personalEditor.profileId} onClose={(m) => { setPersonalEditor(null); showToast(m); }} />
      )}

      {/* Cabeçalho */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={() => setActiveTab('inicio')}
          className="w-9 h-9 shrink-0 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          aria-label="Voltar ao início"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[#2C2C2C] leading-tight">Minhas Rotinas</h1>
          <p className="text-[11px] text-[#8C7A6B] leading-snug">O ritmo do dia a dia, com lembretes por voz</p>
        </div>
      </div>

      {/* SILENCIAR ROTINAS */}
      <button
        type="button"
        onClick={() => setSilenceOpen(true)}
        className={`w-full flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${muted ? 'bg-[#FEF9E7] border-[#EADB9B]' : 'bg-white border-[#EFE8DE] hover:bg-[#FAF8F5]'}`}
      >
        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${muted ? 'bg-[#F7EBC0] text-[#7A5E14]' : 'bg-[#F4EDE2] text-[#8C7A6B]'}`}>
          <BellOff className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#2C2C2C] tracking-wide">SILENCIAR ROTINAS</span>
          <span className={`block text-[11px] leading-snug ${muted ? 'text-[#5A4510]' : 'text-[#8C7A6B]'}`}>
            {muted ? `Avisos pausados ${muteLabel(notificationPreferences.alarmsMutedUntil)} · toque para mudar` : 'Pausa os avisos por um tempo, sem mexer nas tarefas'}
          </span>
        </span>
        <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${muted ? 'bg-[#7A5E14] text-white' : 'bg-[#EEF5EF] text-[#2C5230]'}`}>{muted ? 'Silenciado' : 'Ativo'}</span>
      </button>

      {/* Abas */}
      <div className="grid grid-cols-3 gap-1 bg-[#F4EDE2] p-1 rounded-2xl">
        {(
          [
            ['diaria', 'Diária (voz)'],
            ['semanal', 'Semanal'],
            ['pessoais', 'Pessoais']
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`py-2 rounded-xl text-xs font-bold transition ${tab === id ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-xs' : 'text-[#8C7A6B]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ============ DIÁRIA ============ */}
      {tab === 'diaria' && (
        <div className="space-y-3">
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A6B]">Hoje</p>
              <h2 className="text-sm font-bold text-[#2C2C2C]">Rotina diária</h2>
              <p className="text-xs text-[#8C7A6B]">
                {todayItems.length ? `${doneCount} de ${todayItems.length} feitas` : 'Nada programado para hoje'}
              </p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#EEF5EF] border border-[#B7D2B9] flex items-center justify-center text-sm font-extrabold text-[#2C5230]">
              {todayItems.length ? `${pct}%` : '—'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[#8C7A6B] leading-snug">Toque no quadrado para marcar como feita e no nome para editar.</p>
            <button
              type="button"
              onClick={() => setStepEditor({})}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] px-3 py-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Etapa
            </button>
          </div>

          {todayItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DDD3C5] bg-[#FAF8F5] p-5 text-center text-xs text-[#8C7A6B]">
              Adicione etapas com horário (ex.: beber água às 10:00) para receber os lembretes por voz.
            </div>
          ) : (
            <div className="space-y-2">{todayItems.map((it) => row(it, true))}</div>
          )}
        </div>
      )}

      {/* ============ SEMANAL ============ */}
      {tab === 'semanal' && (
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((wd) => (
              <button
                key={wd.index}
                onClick={() => setSelectedDay(wd.index)}
                className={`py-2 rounded-2xl flex flex-col items-center gap-0.5 transition ${
                  selectedDay === wd.index ? 'bg-[#8C7A6B] text-white shadow-xs' : 'bg-white border border-[#EFE8DE] text-[#4A3E34]'
                }`}
              >
                <span className="text-base">{wd.emoji}</span>
                <span className="text-[10px] font-bold">{wd.short}</span>
              </button>
            ))}
          </div>
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#2C2C2C] min-w-0">
                {WEEK.find((d) => d.index === selectedDay)?.name}
                {selectedDay === today && <span className="ml-1.5 text-[10px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full align-middle">hoje</span>}
              </h2>
              <button onClick={() => setActiveTab('recorrentes')} className="shrink-0 text-[11px] font-bold text-[#8C7A6B] bg-[#F4EDE2] px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Recorrentes
              </button>
            </div>
            {itemsFor(selectedDay, selectedDay === today).length === 0 ? (
              <p className="text-xs text-[#8C7A6B] py-3 text-center">Nada programado neste dia.</p>
            ) : (
              <div className="space-y-2">{itemsFor(selectedDay, selectedDay === today).map((it) => row(it, selectedDay === today))}</div>
            )}
          </div>
        </div>
      )}

      {/* ============ PESSOAIS ============ */}
      {tab === 'pessoais' && (
        <div className="space-y-3">
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 w-max pb-1">
              {[{ id: 'todos', name: 'Todos', avatarUrl: undefined as string | undefined }, ...profiles].map((p) => {
                const n = p.id === 'todos' ? personalRoutines.length : personalRoutines.filter((r) => r.profileId === p.id).length;
                const on = profileFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfileFilter(p.id)}
                    className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${on ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'}`}
                  >
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${on ? 'bg-white/20' : 'bg-[#EFE8DE]'}`}>{p.id === 'todos' ? '👪' : p.name.charAt(0)}</span>
                    )}
                    {p.name}
                    <span className={`text-[10px] ${on ? 'text-white/80' : 'text-[#8C7A6B]'}`}>{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPersonalEditor({ profileId: profileFilter !== 'todos' ? profileFilter : undefined })}
            className="w-full h-12 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova rotina pessoal
          </button>

          {filteredPersonal.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#DDD3C5] bg-[#FAF8F5] p-5 text-center space-y-1">
              <p className="text-sm font-bold text-[#5C4F44]">Nenhuma rotina pessoal {profileFilter !== 'todos' ? `de ${profileName(profiles, profileFilter)}` : 'ainda'}</p>
              <p className="text-[11px] text-[#8C7A6B] leading-snug">Ex.: skincare, lavar o cabelo, esfoliação no banho, pomada do filho às 20h.</p>
            </div>
          )}

          {personalByProfile
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <section key={g.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {g.avatar ? (
                    <img src={g.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-[#EFE8DE] text-[#5C4F44] flex items-center justify-center text-xs font-bold">{g.name.charAt(0)}</span>
                  )}
                  <h3 className="text-sm font-bold text-[#2C2C2C]">{g.name}</h3>
                  <span className="text-[11px] text-[#8C7A6B]">{g.items.length}</span>
                </div>
                {g.items
                  .slice()
                  .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
                  .map((r) => {
                    const todayToo = personalOccursOn(r, today);
                    return (
                      <div key={r.id} className="bg-white border border-[#EFE8DE] rounded-2xl p-3 space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          {todayToo ? (
                            <button
                              type="button"
                              onClick={() => togglePersonalRoutineToday(r.id)}
                              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${r.completedOn ? 'bg-[#7D9D7F] text-white' : 'bg-[#F4EDE2]'}`}
                              aria-label={r.completedOn ? `Desmarcar ${r.title} de hoje` : `Marcar ${r.title} como feita hoje`}
                            >
                              {r.completedOn ? <Check className="w-4 h-4" /> : r.icon}
                            </button>
                          ) : (
                            <span className="w-10 h-10 shrink-0 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-lg">{r.icon}</span>
                          )}
                          <button type="button" onClick={() => setPersonalEditor({ routine: r })} className="min-w-0 flex-1 text-left">
                            <span className={`block text-sm font-bold leading-snug break-words ${r.completedOn ? 'line-through text-[#8C7A6B]' : 'text-[#2C2C2C]'}`}>
                              {r.title}
                              {r.context && <span className="font-normal text-[#5C4F44]"> {r.context}</span>}
                            </span>
                            <span className="block text-[11px] text-[#8C7A6B] mt-0.5">
                              {daysLabel(r.daysOfWeek)}
                              {r.time ? ` · ${r.time}` : ''}
                              {todayToo ? ' · hoje' : ''}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalEditor({ routine: r })}
                            className="w-8 h-8 shrink-0 rounded-xl text-[#A39385] hover:text-[#5C4F44] flex items-center justify-center"
                            aria-label={`Editar ${r.title}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (!r.time) {
                                setPersonalEditor({ routine: { ...r, inDailyRoutine: true } });
                                return;
                              }
                              updatePersonalRoutine(r.id, { inDailyRoutine: !r.inDailyRoutine });
                              showToast(r.inDailyRoutine ? 'Saiu da rotina diária (continua aqui)' : '🔊 Na rotina diária, com lembrete por voz');
                            }}
                            className={`h-9 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 border ${
                              r.inDailyRoutine ? 'bg-[#EEF5EF] border-[#B7D2B9] text-[#2C5230]' : 'bg-[#FAF8F5] border-[#EFE8DE] text-[#8C7A6B]'
                            }`}
                            aria-pressed={r.inDailyRoutine}
                          >
                            <Volume2 className="w-3.5 h-3.5" /> {r.inDailyRoutine ? 'Na rotina diária' : 'Pôr na rotina diária'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!r.time) {
                                setPersonalEditor({ routine: { ...r, showOnCalendar: true } });
                                return;
                              }
                              updatePersonalRoutine(r.id, { showOnCalendar: !r.showOnCalendar });
                              showToast(r.showOnCalendar ? 'Saiu do calendário (continua aqui)' : '📅 Aparece no calendário');
                            }}
                            className={`h-9 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 border ${
                              r.showOnCalendar ? 'bg-[#EEF5EF] border-[#B7D2B9] text-[#2C5230]' : 'bg-[#FAF8F5] border-[#EFE8DE] text-[#8C7A6B]'
                            }`}
                            aria-pressed={r.showOnCalendar}
                          >
                            <Calendar className="w-3.5 h-3.5" /> {r.showOnCalendar ? 'No calendário' : 'Pôr no calendário'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </section>
            ))}
        </div>
      )}
    </div>
  );
};

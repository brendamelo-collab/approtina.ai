import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DailyChronologicalStep, PersonalRoutine } from '../../types';
import { BellOff, CalendarCheck, CalendarDays, ChevronDown, Plus, Repeat, Volume2, X } from 'lucide-react';
import { muteLabel, useMuted } from '../../utils/alarmMute';
import { daysLabel, personalOccursOn, profileName, spokenForPersonal, spokenForStep, stepOccursOn } from '../../utils/routineSchedule';
import { SilenceRoutinesSheet } from '../SilenceRoutinesSheet';
import { StepEditorModal } from '../routines/StepEditorModal';
import { PersonalRoutineEditor } from '../routines/PersonalRoutineEditor';
import { UserAvatar } from '../UserAvatar';
import { CheckCircle, IconBubble, PageHeader, PeachButton, RoundButton, SegmentTrack, SoftCard } from '../ui/Kit';

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
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' }
];

const hourLabel = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

/** Cartão que abre e fecha (como "Cuidados Pessoais ⌄" nas fotos). */
const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, count, action, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <SoftCard className="p-3">
      <div className="flex items-center gap-2 px-1.5 py-1">
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 flex items-center gap-3 text-left" aria-expanded={open}>
          <span className="shrink-0 text-[28px] leading-none">{icon}</span>
          <span className="min-w-0 flex-1 text-[17px] font-bold text-[#2C2C2C] leading-tight truncate">
            {title}
            {count !== undefined && <span className="ml-1.5 text-xs font-semibold text-[#8C7A6B]">{count}</span>}
          </span>
        </button>
        {action}
        <button type="button" onClick={() => setOpen((v) => !v)} className="w-8 h-8 shrink-0 flex items-center justify-center text-[#4A3E34]" aria-label={open ? 'Recolher' : 'Abrir'}>
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      </div>
      {open && <div className="mt-1">{children}</div>}
    </SoftCard>
  );
};

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
    profiles,
    currentProfile,
    speakVoiceReminder,
    notificationPreferences
  } = useApp();

  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);
  const [toast, setToast] = useState<string | null>(null);
  const [silenceOpen, setSilenceOpen] = useState(false);
  const [stepEditor, setStepEditor] = useState<{ step?: DailyChronologicalStep } | null>(null);
  const [personalEditor, setPersonalEditor] = useState<{ routine?: PersonalRoutine; profileId?: string } | null>(null);

  const showToast = (msg?: string) => {
    if (!msg) return;
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const muted = useMuted(notificationPreferences.alarmsMutedUntil);
  const isToday = selectedDay === today;

  /** Tudo o que acontece no dia: etapas + tarefas recorrentes + rotinas pessoais integradas. */
  const items: DailyItem[] = useMemo(
    () =>
      [
        ...dailyChronologicalSteps
          .filter((s) => stepOccursOn(s, selectedDay))
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
            badge: s.description || daysLabel(s.daysOfWeek)
          })),
        ...recurringTasks
          .filter((t) => (t.daysOfWeek ? t.daysOfWeek.includes(selectedDay) : false))
          .map<DailyItem>((t) => ({
            key: `rec-${t.id}`,
            kind: 'recorrente',
            id: t.id,
            time: t.time || '13:00',
            title: t.title,
            icon: t.icon || '🔁',
            completed: isToday && t.status === 'concluido',
            voice: !!t.time,
            spoken: `${currentProfile?.name ? `${currentProfile.name}, ` : ''}está na hora de: ${t.title}.`,
            badge: 'Tarefa recorrente'
          })),
        ...personalRoutines
          .filter((p) => p.inDailyRoutine && p.time && personalOccursOn(p, selectedDay))
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
      ].sort((a, b) => a.time.localeCompare(b.time)),
    [dailyChronologicalSteps, recurringTasks, personalRoutines, selectedDay, isToday, currentProfile, profiles]
  );
  const doneCount = items.filter((i) => i.completed).length;

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

  // Rotinas pessoais por integrante: a pessoa logada primeiro ("Cuidados Pessoais")
  const groups = useMemo(() => {
    const order = [currentProfile?.id, ...profiles.map((p) => p.id).filter((id) => id !== currentProfile?.id)].filter(Boolean) as string[];
    return order
      .map((id) => ({
        profile: profiles.find((p) => p.id === id)!,
        items: personalRoutines
          .filter((r) => r.profileId === id)
          .sort((a, b) => Number(personalOccursOn(b, selectedDay)) - Number(personalOccursOn(a, selectedDay)) || (a.time || '99').localeCompare(b.time || '99'))
      }))
      .filter((g) => g.profile && g.items.length > 0);
  }, [personalRoutines, profiles, currentProfile, selectedDay]);
  const orphans = personalRoutines.filter((r) => !profiles.some((p) => p.id === r.profileId));

  const personalRow = (r: PersonalRoutine) => {
    const occurs = personalOccursOn(r, selectedDay);
    const done = isToday && occurs && !!r.completedOn;
    const sub = [hourLabel(r.time), r.context ? r.context.charAt(0).toUpperCase() + r.context.slice(1) : '', occurs ? '' : daysLabel(r.daysOfWeek)].filter(Boolean).join(' · ');
    return (
      <div key={r.id} className={`flex items-center gap-3.5 px-2 py-2.5 rounded-[22px] ${done ? 'bg-[#F4EDE2]' : ''} ${occurs ? '' : 'opacity-55'}`}>
        <button type="button" onClick={() => setPersonalEditor({ routine: r })} className="min-w-0 flex-1 flex items-center gap-3.5 text-left" aria-label={`Editar ${r.title}`}>
          <IconBubble>{r.icon}</IconBubble>
          <span className="min-w-0 flex-1">
            <span className={`block text-[15px] font-semibold leading-snug break-words ${done ? 'text-[#8C7A6B] line-through' : 'text-[#2C2C2C]'}`}>{r.title}</span>
            <span className="block text-[13px] text-[#8C7A6B] leading-snug mt-0.5">
              {sub || 'Sem horário'}
              {r.inDailyRoutine && <span title="Na rotina diária, com voz"> · 🔊</span>}
              {r.showOnCalendar && <span title="No calendário"> · 📅</span>}
            </span>
          </span>
        </button>
        {isToday && occurs && (
          <CheckCircle done={done} tone="caramel" onClick={() => togglePersonalRoutineToday(r.id)} label={done ? `Desmarcar ${r.title} de hoje` : `Marcar ${r.title} como feita hoje`} />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-32 select-none relative space-y-4">
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

      <PageHeader
        icon={CalendarCheck}
        title="Minhas Rotinas"
        right={
          <RoundButton label="SILENCIAR ROTINAS" onClick={() => setSilenceOpen(true)} className={muted ? '!bg-[#FEF9E7] !text-[#8C6D1F]' : ''}>
            <BellOff className="w-5 h-5" />
          </RoundButton>
        }
      />

      {muted && (
        <button
          type="button"
          onClick={() => setSilenceOpen(true)}
          className="w-full flex items-center gap-2.5 bg-[#FEF9E7] border border-[#EADB9B] rounded-2xl px-3.5 py-2.5 text-left"
        >
          <BellOff className="w-4 h-4 text-[#8C6D1F] shrink-0" />
          <span className="flex-1 min-w-0 text-[13px] text-[#5A4510] leading-snug">
            <strong>Rotinas silenciadas</strong> {muteLabel(notificationPreferences.alarmsMutedUntil)}
          </span>
          <span className="shrink-0 text-xs font-bold text-[#8C6D1F]">Alterar</span>
        </button>
      )}

      <SegmentTrack options={WEEK} value={selectedDay} onChange={setSelectedDay} marker={today} />

      {/* Rotina do dia (etapas com voz + recorrentes + pessoais integradas) */}
      <Section
        icon="☀️"
        title={isToday ? 'Rotina de hoje' : `Rotina de ${WEEK.find((w) => w.id === selectedDay)?.label}`}
        count={items.length ? (isToday ? undefined : items.length) : undefined}
        action={
          <button
            type="button"
            onClick={() => setStepEditor({})}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#4A3E34] bg-[#E6C8A8] px-3 py-1.5 rounded-full"
          >
            <Plus className="w-3.5 h-3.5" /> Etapa
          </button>
        }
      >
        {isToday && items.length > 0 && (
          <div className="px-2 pb-2">
            <div className="flex items-center justify-between text-xs text-[#8C7A6B] mb-1">
              <span>
                {doneCount} de {items.length} feitas
              </span>
              <span className="font-semibold text-[#2C2C2C]">{Math.round((doneCount / items.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#F4EDE2] overflow-hidden">
              <div className="h-full rounded-full bg-[#B78A58]" style={{ width: `${(doneCount / items.length) * 100}%` }} />
            </div>
          </div>
        )}
        {items.length === 0 ? (
          <p className="px-2 py-4 text-sm text-[#8C7A6B] text-center">Nada programado neste dia. Toque em “+ Etapa” para criar.</p>
        ) : (
          <div className="space-y-0.5">
            {items.map((it) => (
              <div key={it.key} className={`flex items-center gap-3 px-2 py-2.5 rounded-[22px] ${it.completed ? 'bg-[#F4EDE2]' : ''}`}>
                <button type="button" onClick={() => openEditor(it)} className="min-w-0 flex-1 flex items-center gap-3.5 text-left" aria-label={`Editar ${it.title}`}>
                  <IconBubble>{it.icon}</IconBubble>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] font-semibold leading-snug break-words line-clamp-2 ${it.completed ? 'text-[#8C7A6B] line-through' : 'text-[#2C2C2C]'}`}>{it.title}</span>
                    <span className="block text-[13px] text-[#8C7A6B] leading-snug mt-0.5 truncate">
                      {[hourLabel(it.time), it.badge].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
                {it.voice && (
                  <button
                    type="button"
                    onClick={() => speakVoiceReminder(it.spoken)}
                    className="w-8 h-8 shrink-0 rounded-full text-[#B78A58] hover:bg-[#F4EDE2] flex items-center justify-center"
                    aria-label={`Ouvir o lembrete de ${it.title}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                {isToday &&
                  (it.kind === 'recorrente' && !it.completed ? (
                    <CheckCircle done={false} tone="caramel" onClick={() => toggle(it)} label={`Marcar ${it.title} como feita`} />
                  ) : (
                    <CheckCircle done={it.completed} tone="caramel" onClick={() => toggle(it)} label={it.completed ? `Desmarcar ${it.title}` : `Marcar ${it.title} como feita`} />
                  ))}
                {it.kind === 'recorrente' && !isToday && <Repeat className="w-4 h-4 text-[#B4A597] shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Rotinas pessoais por integrante da família */}
      {groups.map((g) => (
        <Section
          key={g.profile.id}
          icon={
            g.profile.id === currentProfile?.id ? (
              '🪷'
            ) : g.profile.avatarUrl ? (
              <UserAvatar name={g.profile.name} avatarUrl={g.profile.avatarUrl} size="sm" />
            ) : (
              '🧒'
            )
          }
          title={g.profile.id === currentProfile?.id ? 'Cuidados Pessoais' : `Rotina de ${g.profile.name}`}
          count={g.items.length}
          action={
            <button
              type="button"
              onClick={() => setPersonalEditor({ profileId: g.profile.id })}
              className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#4A3E34] flex items-center justify-center"
              aria-label={`Nova rotina pessoal de ${g.profile.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          }
        >
          <div className="space-y-0.5">{g.items.map(personalRow)}</div>
        </Section>
      ))}
      {orphans.length > 0 && (
        <Section icon="👪" title="Sem perfil" count={orphans.length}>
          <div className="space-y-0.5">{orphans.map(personalRow)}</div>
        </Section>
      )}

      <PeachButton onClick={() => setPersonalEditor({})}>
        <Plus className="w-4 h-4" /> Nova rotina pessoal
      </PeachButton>
      <p className="text-center text-xs text-[#8C7A6B] leading-snug px-4">
        Rotinas pessoais ficam aqui; ligue “rotina diária” (🔊) ou “calendário” (📅) em cada uma quando quiser lembrete por voz ou ver na Agenda.
      </p>
      <button type="button" onClick={() => setActiveTab('agenda')} className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-[#B78A58]">
        <CalendarDays className="w-4 h-4" /> Ver no calendário
      </button>
    </div>
  );
};

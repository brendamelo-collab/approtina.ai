import React, { useEffect, useRef, useState } from 'react';
import { BellRing, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { agendaOccursOn } from '../utils/routineCalculations';
import { parseISODate, shiftISODate, todayISO } from '../utils/dateUtils';
import { isNativeAlarmAvailable, nativeAlarm, NativeAlarm, NativeAlarmStatus } from '../services/nativeAlarm';

// Android app only: sends the upcoming alarms (next 7 days) to the native alarm and
// applies the answers given on the alarm screen ("Já fiz" / "Adiar").

const DAYS_AHEAD = 7;
const MAX_ALARMS = 400;

const stripEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim();

const atFor = (iso: string, hhmm: string, minusMinutes = 0) => {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  const d = parseISODate(iso);
  d.setHours(h, m - minusMinutes, 0, 0);
  return d.getTime();
};

const hhmmOf = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const NativeAlarmSync: React.FC = () => {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;
  const native = isNativeAlarmAvailable();

  const {
    isLoggedIn,
    routineTasks,
    dailyChronologicalSteps,
    agendaItems,
    recurringTasks,
    healthMedications,
    currentProfile,
    notificationPreferences
  } = app;

  // 1) Keep the native alarm list up to date with the user's data
  useEffect(() => {
    if (!native) return;
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        nativeAlarm.setAlarms([]).catch(() => undefined);
        return;
      }
      const name = currentProfile?.name ? `${currentProfile.name}, ` : '';
      const now = Date.now();
      const today = todayISO();
      const alarms: NativeAlarm[] = [];
      const push = (a: NativeAlarm) => {
        if (Number.isFinite(a.at) && a.at > now - 60 * 1000) alarms.push(a);
      };

      for (let i = 0; i < DAYS_AHEAD; i++) {
        const day = shiftISODate(today, i);
        const weekday = parseISODate(day).getDay();
        const isToday = i === 0;

        routineTasks.forEach((t) => {
          if (!t.time || (isToday && t.completed)) return;
          if (t.daysOfWeek && t.daysOfWeek.length > 0 && !t.daysOfWeek.includes(weekday)) return;
          if (t.reminder && t.reminder.enabled === false) return;
          const title = stripEmoji(t.title);
          push({
            key: `rotina:${t.id}@${day}T${t.time}`,
            id: t.id,
            type: 'rotina',
            heading: 'Hora da rotina',
            title,
            subtitle: t.subtitle,
            spoken: `${name}está na hora da sua tarefa da rotina: ${title}.`,
            timeLabel: t.time,
            at: atFor(day, t.time)
          });
        });

        dailyChronologicalSteps.forEach((s) => {
          if (!s.time || (isToday && s.completed) || s.voiceAlert === false) return;
          const title = stripEmoji(s.title);
          push({
            key: `etapa:${s.id}@${day}T${s.time}`,
            id: s.id,
            type: 'rotina',
            heading: 'Hora da rotina',
            title,
            subtitle: s.description,
            spoken: `${name}está na hora de: ${title}.`,
            timeLabel: s.time,
            at: atFor(day, s.time)
          });
        });

        agendaItems.forEach((a) => {
          if (!a.time || a.alarmEnabled === false || !agendaOccursOn(a, day)) return;
          if (a.completed && !a.isRecurring) return;
          const before = a.reminderMinutes || 0;
          const title = stripEmoji(a.title);
          push({
            key: `agenda:${a.id}@${day}T${a.time}`,
            id: a.id,
            type: 'agenda',
            heading: before ? `Compromisso em ${before} min` : 'Compromisso agora',
            title,
            subtitle: a.location ? `${a.time} • ${a.location}` : `Às ${a.time}`,
            spoken: before
              ? `${name}você tem um compromisso daqui a ${before} minutos: ${title}, às ${a.time}.`
              : `${name}você tem um compromisso agendado agora: ${title}.`,
            timeLabel: hhmmOf(atFor(day, a.time, before)),
            at: atFor(day, a.time, before)
          });
        });

        recurringTasks.forEach((t) => {
          if (!t.time || (isToday && t.status === 'concluido')) return;
          if (!(t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === day)) return;
          const title = stripEmoji(t.title);
          push({
            key: `recorrente:${t.id}@${day}T${t.time}`,
            id: t.id,
            type: 'rotina',
            heading: 'Tarefa recorrente',
            title,
            spoken: `${name}está na hora de: ${title}.`,
            timeLabel: t.time,
            at: atFor(day, t.time)
          });
        });

        healthMedications.forEach((m) => {
          if (!m.time || m.alarmEnabled === false || (isToday && m.status === 'fez')) return;
          const forOther = m.memberName && m.memberName !== currentProfile?.name ? ` para ${m.memberName}` : '';
          const what = m.category === 'medicamento' ? 'tomar' : m.category === 'suplemento' ? 'tomar o suplemento' : 'fazer o cuidado';
          push({
            key: `remedio:${m.id}@${day}T${m.time}`,
            id: m.id,
            type: 'medicamento',
            heading: m.category === 'cuidado' ? 'Hora do cuidado' : 'Hora do remédio',
            title: `${m.name}${m.dosage ? ` • ${m.dosage}` : ''}`,
            subtitle: m.instructions || (forOther ? `Para ${m.memberName}` : undefined),
            spoken: `${name}está na hora de ${what}${forOther}: ${m.name}${m.dosage ? `, ${m.dosage}` : ''}.`,
            timeLabel: m.time,
            at: atFor(day, m.time)
          });
        });
      }

      alarms.sort((a, b) => a.at - b.at);
      // Sound and voice chosen in Configurações > Sons e voz
      const prefs = notificationPreferences || ({} as typeof notificationPreferences);
      const style = {
        sound: prefs.alarmSound || 'padrao',
        voice: prefs.nativeVoiceName || '',
        rate: prefs.voiceRate ?? 0.95,
        pitch: prefs.voicePitch ?? 1
      };
      const speak = prefs.voiceAlerts !== false;
      nativeAlarm
        .setAlarms(alarms.slice(0, MAX_ALARMS).map((a) => ({ ...a, ...style, spoken: speak ? a.spoken : '' })))
        .catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [native, isLoggedIn, routineTasks, dailyChronologicalSteps, agendaItems, recurringTasks, healthMedications, currentProfile, notificationPreferences]);

  // 2) Apply "Já fiz" / "Adiar" answered on the native alarm screen
  useEffect(() => {
    if (!native) return;
    const apply = async () => {
      if (!appRef.current.isLoggedIn) return;
      let actions = [];
      try {
        actions = await nativeAlarm.takePendingActions();
      } catch {
        return;
      }
      const a = appRef.current;
      const today = todayISO();
      actions.forEach((act) => {
        const [kind, rest] = act.key.split(':');
        const day = (rest || '').split('@')[1]?.slice(0, 10);
        const id = act.id;
        if (act.action === 'adiar') {
          if (kind === 'remedio') a.setMedicationStatus(id, 'adiado', act.minutes);
          return;
        }
        // "Já fiz": routine completion only counts for today's occurrence
        if (kind === 'rotina' && day === today) {
          const t = a.routineTasks.find((x) => x.id === id);
          if (t && !t.completed) a.toggleRoutineTask(id);
        } else if (kind === 'etapa' && day === today) {
          const s = a.dailyChronologicalSteps.find((x) => x.id === id);
          if (s && !s.completed) a.toggleDailyChronologicalStep(id);
        } else if (kind === 'agenda') {
          const it = a.agendaItems.find((x) => x.id === id);
          if (it && !it.completed && !it.isRecurring) a.toggleAgendaItem(id);
        } else if (kind === 'recorrente') {
          const r = a.recurringTasks.find((x) => x.id === id);
          if (r && r.status !== 'concluido') a.completeRecurringTask(id);
        } else if (kind === 'remedio') {
          a.setMedicationStatus(id, 'fez');
        }
      });
    };
    apply();
    const onVisible = () => document.visibilityState === 'visible' && apply();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(apply, 30 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [native, isLoggedIn]);

  return null;
};

const PERMISSION_LABELS: Record<keyof NativeAlarmStatus, { title: string; why: string }> = {
  notifications: { title: 'Notificações', why: 'para o alarme aparecer no celular' },
  exactAlarm: { title: 'Alarmes e lembretes', why: 'para tocar no horário exato' },
  fullScreen: { title: 'Tela cheia', why: 'para aparecer com a tela bloqueada' },
  overlay: { title: 'Sobrepor a outros apps', why: 'para aparecer por cima do que você estiver usando' },
  battery: { title: 'Sem economia de bateria', why: 'para o celular não bloquear o alarme' }
};

/** Card on the home screen (Android app only) to enable the alarm permissions and test it. */
export const NativeAlarmSetupCard: React.FC = () => {
  const { notificationPreferences: prefs } = useApp();
  const native = isNativeAlarmAvailable();
  const [status, setStatus] = useState<NativeAlarmStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('rotina_ai_alarm_setup_ok') === 'ok';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!native) return;
    const refresh = () => nativeAlarm.getStatus().then(setStatus).catch(() => undefined);
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [native]);

  if (!native || !status) return null;
  const missing = (Object.keys(PERMISSION_LABELS) as (keyof NativeAlarmStatus)[]).filter((k) => !status[k]);
  if (missing.length === 0 && hidden) return null;

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5">
      <div className="bg-[#FAF8F5] border-2 border-[#B78A58]/40 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F7EEE3] text-[#B78A58] flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#2C2C2C]">
              {missing.length ? 'Ative o alarme do celular' : 'Alarme do celular ativo ✓'}
            </h2>
            <p className="text-[11px] text-[#8C7A6B]">
              {missing.length
                ? 'Toque em cada item e permita na tela que abrir.'
                : 'Rotinas, agenda e remédios vão tocar com som e voz, mesmo com o app fechado.'}
            </p>
          </div>
        </div>

        {missing.map((k) => (
          <button
            key={k}
            onClick={() => nativeAlarm.openSetting(k).catch(() => undefined)}
            className="w-full flex items-center gap-2 text-left bg-white border border-[#EFE8DE] rounded-2xl px-3 py-2.5 hover:bg-[#F7F4EE]"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#2C2C2C]">{PERMISSION_LABELS[k].title}</span>
              <span className="block text-[10px] text-[#8C7A6B]">{PERMISSION_LABELS[k].why}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          </button>
        ))}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setTesting(true);
              nativeAlarm
                .testAlarm(10, {
                  sound: prefs?.alarmSound || 'padrao',
                  voice: prefs?.nativeVoiceName || '',
                  rate: prefs?.voiceRate ?? 0.95,
                  pitch: prefs?.voicePitch ?? 1
                })
                .catch(() => undefined);
              setTimeout(() => setTesting(false), 12000);
            }}
            disabled={testing}
            className="flex-1 text-xs font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] disabled:opacity-60 py-2.5 rounded-2xl"
          >
            {testing ? 'Bloqueie a tela: toca em 10 s…' : 'Testar alarme (10 s)'}
          </button>
          {missing.length === 0 && (
            <button
              onClick={() => {
                setHidden(true);
                try {
                  localStorage.setItem('rotina_ai_alarm_setup_ok', 'ok');
                } catch {
                  // ignore
                }
              }}
              className="text-xs font-bold text-[#5C4F44] bg-[#EFE8DE] hover:bg-[#E4DACD] px-4 py-2.5 rounded-2xl"
            >
              Ocultar
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

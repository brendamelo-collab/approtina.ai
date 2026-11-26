import React, { useEffect, useRef, useState } from 'react';
import { BellRing, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { agendaOccursOn } from '../utils/routineCalculations';
import { parseISODate, shiftISODate, todayISO } from '../utils/dateUtils';
import { isNativeAlarmAvailable, nativeAlarm, NativeAlarm, NativeAlarmStatus } from '../services/nativeAlarm';
import { personalOccursOn, profileName, spokenForPersonal, spokenForStep, stepOccursOn } from '../utils/routineSchedule';
import { isMuted } from '../utils/alarmMute';
import { stripEmojis } from '../utils/emoji';
import { alertStyleFrom } from '../utils/alertStyle';

// Android app only: sends the upcoming alarms (next 7 days) to the native alarm and
// applies the answers given on the alarm screen ("Já fiz" / "Adiar").

const DAYS_AHEAD = 7;
// false quando o app Android instalado é antigo e não tem "Silenciar" (getMute/setMute)
let nativeMuteSupported: boolean | null = null;
const MUTE_SYNC_KEY = 'rotina_ai_mute_synced';
const rememberMuteSync = (v: number) => {
  try {
    localStorage.setItem(MUTE_SYNC_KEY, String(v || 0));
  } catch {
    // sem armazenamento: segue sem lembrar
  }
};
const MAX_ALARMS = 400;

const cssVar = (name: string, fallback: string) => {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

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
    notificationPreferences,
    colorPalette,
    personalRoutines,
    profiles
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
          if (!s.time || (isToday && s.completed) || s.voiceAlert === false || !stepOccursOn(s, weekday)) return;
          const title = stripEmoji(s.title);
          push({
            key: `etapa:${s.id}@${day}T${s.time}`,
            id: s.id,
            type: 'rotina',
            heading: 'Hora da rotina',
            title,
            subtitle: s.description,
            spoken: spokenForStep(s, currentProfile?.name),
            sound: s.sound || undefined,
            timeLabel: s.time,
            at: atFor(day, s.time)
          });
        });

        // Rotinas Pessoais com "Adicionar à rotina diária" ligado (lidas direto do cadastro original)
        personalRoutines.forEach((p) => {
          if (!p.inDailyRoutine || !p.time || !personalOccursOn(p, weekday)) return;
          if (isToday && p.completedOn === today) return;
          const who = profileName(profiles, p.profileId);
          push({
            key: `pessoal:${p.id}@${day}T${p.time}`,
            id: p.id,
            type: 'rotina',
            heading: `Rotina pessoal · ${who}`,
            title: stripEmoji(p.title),
            subtitle: p.context || undefined,
            spoken: spokenForPersonal(p, profiles),
            sound: p.sound || undefined,
            timeLabel: p.time,
            at: atFor(day, p.time)
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
          if (!t.time || (isToday && t.status === 'concluido') || t.voiceReminder === false) return;
          if (!(t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === day)) return;
          const title = stripEmoji(t.title);
          const member = t.memberId && t.memberId !== currentProfile?.id ? profiles.find((p) => p.id === t.memberId)?.name : '';
          push({
            key: `recorrente:${t.id}@${day}T${t.time}`,
            id: t.id,
            type: 'rotina',
            heading: member ? `Tarefa recorrente · ${member}` : 'Tarefa recorrente',
            title,
            spoken: `${name}está na hora de: ${title}${member ? `, de ${member}` : ''}.`,
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
        ...alertStyleFrom(prefs),
        sound: prefs.alarmSound || 'padrao',
        repeats: prefs.alarmRepeats || 0,
        voice: prefs.nativeVoiceName || '',
        rate: prefs.voiceRate ?? 0.95,
        pitch: prefs.voicePitch ?? 1,
        // Cores da paleta escolhida, usadas na tela do alarme
        accent: cssVar('--t-accent', '#A69280'),
        accentDark: cssVar('--t-accent-dark', '#5E4D40')
      };
      const speak = style.mode !== 'alarme';
      // App Android antigo (sem "Silenciar"): enquanto estiver silenciado, nem agenda os alarmes desse período
      const mutedUntil = isMuted(prefs.alarmsMutedUntil) ? (prefs.alarmsMutedUntil as number) : 0;
      if (mutedUntil && nativeMuteSupported === false) {
        for (let i = alarms.length - 1; i >= 0; i--) if (alarms[i].at <= mutedUntil) alarms.splice(i, 1);
      }
      nativeAlarm
        .setAlarms(
          alarms
            .slice(0, MAX_ALARMS)
            .map((a) => ({ ...a, ...style, sound: a.sound || style.sound, spoken: speak ? stripEmojis(a.spoken) : '', title: stripEmojis(a.title) || a.title }))
        )
        .catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [native, isLoggedIn, routineTasks, dailyChronologicalSteps, agendaItems, recurringTasks, healthMedications, currentProfile, notificationPreferences, colorPalette, personalRoutines, profiles]);

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
        if (act.action === 'naofez') {
          // "Não fiz": registra para a tarefa e o dia do aviso; nada é marcado como feito
          const map: Record<string, 'r' | 's' | 'a' | 'p' | 't' | 'm'> = { rotina: 'r', etapa: 's', agenda: 'a', pessoal: 'p', recorrente: 't', remedio: 'm' };
          if (map[kind]) a.markNotDone(map[kind], id, day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : today);
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
        } else if (kind === 'pessoal' && day === today) {
          a.completePersonalRoutineToday(id);
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

  // 3) "Silenciar alarmes": o mesmo estado no app e no alarme do celular.
  //    Mudou no app (ou em outro aparelho) -> envia ao celular; mudou na tela do alarme -> traz para o app.
  const mutedPref = notificationPreferences?.alarmsMutedUntil;
  const lastMute = useRef<number | null>(null);
  const norm = (v: number | undefined) => (isMuted(v) ? (v as number) : 0);
  useEffect(() => {
    if (!native || !isLoggedIn) return;
    const want = norm(mutedPref);
    if (lastMute.current === null) {
      // Ao abrir: se foi silenciado na tela do alarme com o app fechado, vale o do celular
      nativeAlarm
        .getMute()
        .then((n) => {
          nativeMuteSupported = true;
          const phone = norm(n);
          // Quem mudou por último vale: o celular (tela do alarme, com o app fechado) ou a conta
          // (outro aparelho / site). Guardamos o último valor combinado neste aparelho.
          let synced: number | null = null;
          try {
            const raw = localStorage.getItem(MUTE_SYNC_KEY);
            synced = raw === null ? null : Number(raw) || 0;
          } catch {
            synced = null;
          }
          const accountChanged = synced !== null && want !== synced;
          if (phone !== want && !accountChanged && phone !== synced) {
            lastMute.current = phone;
            rememberMuteSync(phone);
            appRef.current.updateNotificationPreferences({ alarmsMutedUntil: phone });
          } else {
            lastMute.current = want;
            rememberMuteSync(want);
            if (phone !== want) nativeAlarm.setMute(want).catch(() => undefined);
          }
        })
        .catch(() => {
          nativeMuteSupported = false;
        });
      return;
    }
    if (lastMute.current === want) return;
    lastMute.current = want;
    rememberMuteSync(want);
    nativeAlarm.setMute(want).catch(() => undefined);
  }, [native, isLoggedIn, mutedPref]);
  useEffect(() => {
    if (!native || !isLoggedIn) return;
    const pull = async () => {
      let n: number;
      try {
        n = norm(await nativeAlarm.getMute());
        nativeMuteSupported = true;
      } catch {
        nativeMuteSupported = false; // app Android antigo, sem esta função
        return;
      }
      if (lastMute.current === null || n === lastMute.current) return;
      lastMute.current = n;
      rememberMuteSync(n);
      if (n !== norm(appRef.current.notificationPreferences?.alarmsMutedUntil)) {
        appRef.current.updateNotificationPreferences({ alarmsMutedUntil: n });
      }
    };
    pull();
    const onVisible = () => document.visibilityState === 'visible' && pull();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(pull, 15 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [native, isLoggedIn]);

  return null;
};

const PERMISSION_LABELS: Record<keyof NativeAlarmStatus, { title: string; why: string }> = {
  lockscreen: { title: 'Aviso na tela bloqueada', why: 'deixe "Alarmes do Rotina.ai" como urgente e visível na tela bloqueada' },
  notifications: { title: 'Notificações', why: 'para o alarme aparecer no celular' },
  exactAlarm: { title: 'Alarmes e lembretes', why: 'para tocar no horário exato' },
  fullScreen: { title: 'Tela cheia', why: 'para aparecer com a tela bloqueada' },
  overlay: { title: 'Sobrepor a outros apps', why: 'para aparecer por cima do que você estiver usando' },
  battery: { title: 'Sem economia de bateria', why: 'para o celular não bloquear o alarme' }
};

/** Card on the home screen (Android app only) to enable the alarm permissions and test it. */
export const NativeAlarmSetupCard: React.FC<{ alwaysShow?: boolean }> = ({ alwaysShow }) => {
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
  // false = falta permitir (APKs antigos não informam "lockscreen": não conta como faltando)
  const missing = (Object.keys(PERMISSION_LABELS) as (keyof NativeAlarmStatus)[]).filter((k) => status[k] === false);
  if (missing.length === 0 && hidden && !alwaysShow) return null;

  return (
    <section className={alwaysShow ? '' : 'w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5'}>
      <div className="bg-[#FAF8F5] border-2 border-[#B78A58]/40 rounded-[26px] p-4 space-y-3">
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

        <button
          type="button"
          onClick={() => nativeAlarm.openSetting('details' as any).catch(() => undefined)}
          className="w-full text-left text-[11px] leading-snug text-[#5C4F44] bg-[#F7F2EA] border border-[#ECE3D5] rounded-2xl px-3 py-2.5"
        >
          <strong className="block text-[#2C2C2C]">Celular Xiaomi, Samsung, Motorola…?</strong>
          Alguns pedem mais uma autorização: “Mostrar na tela de bloqueio”, “Abrir janelas em segundo plano” e “Início automático”.
          Toque aqui para abrir os ajustes do app e ligar essas opções.
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setTesting(true);
              nativeAlarm
                .testAlarm(10, {
                  sound: prefs?.alarmSound || 'padrao',
                  voice: prefs?.nativeVoiceName || '',
                  rate: prefs?.voiceRate ?? 0.95,
                  pitch: prefs?.voicePitch ?? 1,
                  repeats: prefs?.alarmRepeats || 0,
                  ...alertStyleFrom(prefs)
                })
                .catch(() => undefined);
              setTimeout(() => setTesting(false), 12000);
            }}
            disabled={testing}
            className="flex-1 text-xs font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] disabled:opacity-60 py-2.5 rounded-2xl"
          >
            {testing ? 'Bloqueie a tela: toca em 10 s…' : 'Testar alarme (10 s)'}
          </button>
          {missing.length === 0 && !alwaysShow && (
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

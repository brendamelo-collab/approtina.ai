import { useEffect, useRef } from 'react';
import { useApp, ActiveAlarmPayload } from '../context/AppContext';
import { agendaOccursOn } from '../utils/routineCalculations';
import { todayISO, nowHHMM } from '../utils/dateUtils';
import { isNativeAlarmAvailable } from '../services/nativeAlarm';

// Fires the alarm balloon (+ voice) when a routine, timeline step, agenda item,
// recurring task or medication reaches its time. Works while the app is open.

const CHECK_EVERY_MS = 15 * 1000;
const CATCH_UP_MINUTES = 10; // if the app was closed/asleep at the exact minute, still warn up to 10 min later

const firedKey = (day: string) => `rotina_ai_alarms_fired_${day}`;
export const SNOOZE_STORAGE_KEY = 'rotina_ai_alarms_snooze';

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
};

const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

type Candidate = ActiveAlarmPayload & { key: string; dueAt: string; voice: boolean };

export const AlarmScheduler: React.FC = () => {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;

  // Asks once for notification permission (needed to warn while the app is in the background)
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    const ask = () => {
      Notification.requestPermission().catch(() => undefined);
      window.removeEventListener('click', ask);
    };
    window.addEventListener('click', ask);
    return () => window.removeEventListener('click', ask);
  }, []);

  useEffect(() => {
    // In the Android app the native alarm rings instead (sound + voice + full screen)
    if (isNativeAlarmAvailable()) return;
    const check = () => {
      const {
        isLoggedIn,
        activeAlarm,
        triggerAlarm,
        routineTasks,
        dailyChronologicalSteps,
        agendaItems,
        recurringTasks,
        healthMedications,
        currentProfile
      } = appRef.current;
      if (!isLoggedIn || activeAlarm) return;

      const day = todayISO();
      const now = toMinutes(nowHHMM());
      const weekday = new Date().getDay();
      const fired = readJSON<Record<string, boolean>>(firedKey(day), {});
      const snoozes = readJSON<Record<string, number>>(SNOOZE_STORAGE_KEY, {});
      const appliesToday = (days?: number[]) => !days || days.length === 0 || days.includes(weekday);

      const candidates: Candidate[] = [];
      const add = (c: Omit<Candidate, 'key'> & { keyBase: string }) => {
        const { keyBase, ...rest } = c;
        candidates.push({ ...rest, key: `${keyBase}@${c.dueAt}` });
      };

      routineTasks.forEach((t) => {
        if (!t.time || t.completed || !appliesToday(t.daysOfWeek)) return;
        if (t.reminder && (!t.reminder.enabled || (!t.reminder.balloon && !t.reminder.alarm && !t.reminder.voiceAlert))) return;
        add({
          keyBase: `rotina:${t.id}`,
          id: t.id,
          type: 'rotina',
          title: t.title,
          subtitle: t.subtitle,
          time: t.time,
          dueAt: t.time,
          memberName: currentProfile?.name,
          voice: t.reminder ? t.reminder.voiceAlert !== false : true
        });
      });

      dailyChronologicalSteps.forEach((s) => {
        if (!s.time || s.completed) return;
        add({
          keyBase: `etapa:${s.id}`,
          id: s.id,
          type: 'rotina',
          title: `${s.icon ? `${s.icon} ` : ''}${s.title}`,
          subtitle: s.description,
          time: s.time,
          dueAt: s.time,
          memberName: currentProfile?.name,
          voice: s.voiceAlert !== false
        });
      });

      agendaItems.forEach((a) => {
        if (!a.time || a.completed || a.alarmEnabled === false || !agendaOccursOn(a, day)) return;
        const start = toMinutes(a.time);
        if (!Number.isFinite(start)) return;
        const due = fromMinutes(Math.max(0, start - (a.reminderMinutes || 0)));
        add({
          keyBase: `agenda:${a.id}`,
          id: a.id,
          type: 'agenda',
          title: a.title,
          subtitle: a.reminderMinutes ? `Começa às ${a.time}` : undefined,
          time: a.time,
          dueAt: due,
          memberName: currentProfile?.name,
          voice: true
        });
      });

      recurringTasks.forEach((t) => {
        if (!t.time || t.status === 'concluido') return;
        if (!(t.daysOfWeek ? t.daysOfWeek.includes(weekday) : t.nextDate === day)) return;
        add({
          keyBase: `recorrente:${t.id}`,
          id: t.id,
          type: 'rotina',
          title: `${t.icon ? `${t.icon} ` : ''}${t.title}`,
          time: t.time,
          dueAt: t.time,
          memberName: currentProfile?.name,
          voice: true
        });
      });

      healthMedications.forEach((m) => {
        if (!m.time || m.alarmEnabled === false || m.status === 'fez') return;
        add({
          keyBase: `remedio:${m.id}`,
          id: m.id,
          type: 'medicamento',
          title: m.name,
          subtitle: m.instructions,
          time: m.time,
          dueAt: m.time,
          memberName: m.memberName || currentProfile?.name,
          dosage: m.dosage,
          voice: true
        });
      });

      // First item whose time has come (or whose snooze ended) and that was not shown yet
      const due = candidates
        .map((c) => {
          const snoozedUntil = snoozes[c.key];
          if (snoozedUntil) return Date.now() >= snoozedUntil ? { c, dueMin: now } : null;
          if (fired[c.key]) return null;
          const dueMin = toMinutes(c.dueAt);
          return Number.isFinite(dueMin) && now >= dueMin && now - dueMin <= CATCH_UP_MINUTES ? { c, dueMin } : null;
        })
        .filter((x): x is { c: Candidate; dueMin: number } => !!x)
        .sort((a, b) => a.dueMin - b.dueMin)[0];
      if (!due) return;

      const { c } = due;
      fired[c.key] = true;
      delete snoozes[c.key];
      try {
        localStorage.setItem(firedKey(day), JSON.stringify(fired));
        localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(snoozes));
      } catch {
        // ignore
      }

      triggerAlarm({
        id: c.id,
        key: c.key,
        type: c.type,
        title: c.title,
        subtitle: c.subtitle,
        time: c.time,
        memberName: c.memberName,
        dosage: c.dosage,
        voice: c.voice
      });

      // App in the background: also show a system notification
      if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
        const body = `${c.time} • ${c.title}`;
        navigator.serviceWorker?.getRegistration().then((reg) => {
          if (reg) reg.showNotification('Rotina.ai', { body, icon: '/pwa-192x192-v2.png', tag: c.key });
          else new Notification('Rotina.ai', { body, icon: '/pwa-192x192-v2.png', tag: c.key });
        });
      }
    };

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
};

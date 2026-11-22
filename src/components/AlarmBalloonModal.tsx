import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { playWebSoundTimes } from '../utils/alarmSounds';
import { MUTE_OPTIONS, isMuted, muteLabel, muteUntilFor } from '../utils/alarmMute';
import { BellOff, Check, ChevronLeft, Eye, X } from 'lucide-react';

const SNOOZE_MINUTES = [5, 10, 15, 30, 60];

/** Tela do alarme com o app aberto (no app Android, quem toca é o alarme nativo, com o mesmo visual). */
export const AlarmBalloonModal: React.FC = () => {
  const { activeAlarm, dismissAlarm, confirmAlarmAction, speakVoiceReminder, notificationPreferences, updateNotificationPreferences } = useApp();
  const [stoppedKey, setStoppedKey] = useState<string | null>(null); // "Só este aviso"
  const [showMute, setShowMute] = useState(false);

  const alarmKey = activeAlarm ? activeAlarm.key || `${activeAlarm.id}@${activeAlarm.time}` : '';
  const globallyMuted = isMuted(notificationPreferences.alarmsMutedUntil);
  const silent = globallyMuted || stoppedKey === alarmKey;

  useEffect(() => {
    setShowMute(false);
  }, [alarmKey]);

  useEffect(() => {
    if (!activeAlarm || silent) return;
    let repeats = 0;

    // Som (o desta rotina ou o de Configurações), tocado N vezes; depois a voz — igual ao alarme do celular
    const soundId = activeAlarm.sound || notificationPreferences.alarmSound || 'padrao';
    const triggerAnnounce = () => {
      const ms = notificationPreferences.soundAlerts === false ? 0 : playWebSoundTimes(soundId, notificationPreferences.alarmRepeats || 0);
      if (activeAlarm.voice !== false) {
        const title = activeAlarm.title.replace(/^[^\p{L}\p{N}]+/u, '');
        const text = activeAlarm.spoken || `${activeAlarm.memberName ? `${activeAlarm.memberName}, ` : ''}são ${activeAlarm.time}. Hora de: ${title}.`;
        setTimeout(() => speakVoiceReminder(text), ms + 300);
      }
    };

    triggerAnnounce();
    // Repete voz + som a cada 10 segundos por cerca de 1 minuto; depois fica só na tela até responder
    const interval = setInterval(() => {
      repeats += 1;
      if (repeats > 5) {
        clearInterval(interval);
        return;
      }
      triggerAnnounce();
    }, 10000);

    return () => clearInterval(interval);
  }, [activeAlarm, silent, speakVoiceReminder, notificationPreferences.soundAlerts, notificationPreferences.alarmSound, notificationPreferences.alarmRepeats]);

  if (!activeAlarm) return null;

  const stopVoiceNow = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // sem voz no navegador
    }
  };

  const muteFor = (minutes: number | null | 'este') => {
    stopVoiceNow();
    if (minutes === 'este') setStoppedKey(alarmKey);
    else updateNotificationPreferences({ alarmsMutedUntil: muteUntilFor(minutes) });
    setShowMute(false);
  };

  const isMed = activeAlarm.type === 'medicamento';
  const emoji = isMed ? '💊' : activeAlarm.type === 'rotina' ? '🌿' : '📅';
  const heading = isMed ? 'Hora do remédio' : activeAlarm.type === 'rotina' ? 'Hora da rotina' : 'Compromisso';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`${heading}: ${activeAlarm.title}`}
        className="w-full sm:max-w-sm h-[100dvh] sm:h-auto sm:max-h-[94vh] flex flex-col overflow-hidden sm:rounded-[28px] shadow-2xl select-none animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Parte de cima: horário e lembrete */}
        <div
          className="relative flex-1 min-h-[280px] flex flex-col items-center justify-center text-center px-6 pt-12 pb-10 text-white overflow-y-auto"
          style={{ background: 'linear-gradient(165deg, var(--t-accent, #A69280) 0%, var(--t-accent-dark, #5E4D40) 100%)' }}
        >
          <button
            type="button"
            onClick={dismissAlarm}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-bold tracking-[0.18em] uppercase bg-white/15 px-3 py-1 rounded-full">{heading}</span>

          <div className="relative w-28 h-28 mt-7 flex items-center justify-center" aria-hidden="true">
            {!silent && (
              <>
                <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:1.8s]" />
                <span className="absolute -inset-3 rounded-full bg-white/10 animate-ping [animation-duration:2.4s]" />
              </>
            )}
            <span className="relative w-24 h-24 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-5xl">{emoji}</span>
          </div>

          <p className="mt-6 text-5xl font-light tracking-tight tabular-nums leading-none">{activeAlarm.time}</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight break-words line-clamp-3 max-w-full">{activeAlarm.title}</h2>
          {activeAlarm.subtitle && <p className="mt-1.5 text-sm text-white/85 leading-snug break-words line-clamp-3 max-w-full">{activeAlarm.subtitle}</p>}

          {(activeAlarm.dosage || activeAlarm.memberName) && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {activeAlarm.dosage && <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">Dose: {activeAlarm.dosage}</span>}
              {activeAlarm.memberName && <span className="text-xs font-semibold bg-white/15 px-2.5 py-1 rounded-full">Para: {activeAlarm.memberName}</span>}
            </div>
          )}

          {silent && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold bg-black/20 px-3 py-1.5 rounded-full">
              <BellOff className="w-3.5 h-3.5" />
              {globallyMuted ? `Alarmes silenciados ${muteLabel(notificationPreferences.alarmsMutedUntil)}` : 'Som e voz parados neste aviso'}
            </p>
          )}
        </div>

        {/* Parte de baixo: respostas */}
        <div className="relative -mt-6 bg-[#FAF8F5] rounded-t-[28px] sm:rounded-b-[28px] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3">
          {!showMute ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmAlarmAction('fez')}
                  className="flex-[2] min-h-14 rounded-2xl bg-[#4F7A53] hover:bg-[#43694A] text-white font-bold text-base inline-flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  {isMed ? 'Já tomei' : 'Já fiz'}
                </button>
                <button
                  type="button"
                  onClick={() => confirmAlarmAction('viu')}
                  className="flex-1 min-h-14 rounded-2xl bg-[#EFE8DE] hover:bg-[#E5DCCF] text-[#4A3E34] font-bold text-sm inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  Já vi
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B]">Adiar por</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {SNOOZE_MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => confirmAlarmAction('adiar', m)}
                      className="h-11 rounded-xl bg-white border border-[#EFE8DE] hover:bg-[#F4EDE2] text-[#4A3E34] font-bold text-xs whitespace-nowrap active:scale-95 transition"
                    >
                      {m === 60 ? '1 h' : `${m} min`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMute(true)}
                className="w-full h-12 rounded-2xl border border-[#DDD3C5] hover:bg-[#F4EDE2] text-[#5C4F44] font-bold text-sm inline-flex items-center justify-center gap-2 transition"
              >
                <BellOff className="w-4 h-4 shrink-0" />
                {globallyMuted ? `Silenciado ${muteLabel(notificationPreferences.alarmsMutedUntil)}` : 'Silenciar'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setShowMute(false)}
                  className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center"
                  aria-label="Voltar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2C2C2C] leading-tight">Silenciar alarmes</p>
                  <p className="text-[11px] text-[#8C7A6B] leading-snug mt-0.5">Os lembretes continuam aparecendo, só que sem som e sem voz.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => muteFor('este')}
                className="w-full h-11 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#4A3E34] font-bold text-sm transition"
              >
                Só este aviso
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                {MUTE_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => muteFor(o.minutes)}
                    className={`h-11 rounded-xl border font-bold text-sm transition ${
                      o.minutes === null ? 'col-span-2 border-transparent text-white hover:opacity-90' : 'bg-white border-[#EFE8DE] text-[#4A3E34] hover:bg-[#F4EDE2]'
                    }`}
                    style={o.minutes === null ? { background: 'var(--t-accent-dark, #5E4D40)' } : undefined}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {globallyMuted && (
                <button
                  type="button"
                  onClick={() => {
                    updateNotificationPreferences({ alarmsMutedUntil: 0 });
                    setShowMute(false);
                  }}
                  className="w-full h-10 text-sm font-bold text-[#4F7A53]"
                >
                  Reativar o som agora
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

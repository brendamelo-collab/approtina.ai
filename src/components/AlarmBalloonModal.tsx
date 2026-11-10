import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { playWebSound } from '../utils/alarmSounds';
import { Bell, Clock, Check, Eye, X, Volume2, VolumeX } from 'lucide-react';

export const AlarmBalloonModal: React.FC = () => {
  const { activeAlarm, dismissAlarm, confirmAlarmAction, speakVoiceReminder, notificationPreferences } = useApp();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!activeAlarm || isMuted) return;
    let repeats = 0;

    // Sound chosen in Configurações > Sons e voz
    const playChimeBeep = () => {
      if (notificationPreferences.soundAlerts === false) return;
      playWebSound(notificationPreferences.alarmSound || 'padrao');
    };

    const triggerAnnounce = () => {
      const title = activeAlarm.title.replace(/^[^\p{L}\p{N}]+/u, '');
      if (activeAlarm.voice !== false) {
        speakVoiceReminder(
          `${activeAlarm.memberName ? `${activeAlarm.memberName}, ` : ''}são ${activeAlarm.time}. Hora de: ${title}.`
        );
      }
      setTimeout(playChimeBeep, 1200);
    };

    // First immediate announcement
    triggerAnnounce();

    // Repeat voice alert + beep every 10 seconds until user interacts
    // Repeats for about 1 minute, then stays silent on screen until answered
    const interval = setInterval(() => {
      repeats += 1;
      if (repeats > 5) {
        clearInterval(interval);
        return;
      }
      triggerAnnounce();
    }, 10000);

    return () => clearInterval(interval);
  }, [activeAlarm, isMuted, speakVoiceReminder, notificationPreferences.soundAlerts, notificationPreferences.alarmSound]);

  if (!activeAlarm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-2xl relative select-none animate-in zoom-in-95 duration-200">
        {/* Soft Close button */}
        <button
          onClick={dismissAlarm}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B] flex items-center justify-center transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mute toggle button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B] flex items-center justify-center transition-colors"
          title={isMuted ? 'Ativar som de aviso' : 'Silenciar repetição'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#8C3A24]" /> : <Volume2 className="w-4 h-4 text-[#7D9D7F]" />}
        </button>

        {/* Pulsing Alarm Icon Badge */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-3xl bg-[#F7EEE3] border border-[#EAE0D2] flex items-center justify-center text-3xl shadow-xs animate-bounce">
              {activeAlarm.type === 'medicamento' ? '💊' : activeAlarm.type === 'rotina' ? '🌿' : '📅'}
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B78A58] opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#B78A58]" />
            </span>
          </div>

          <span className="text-[10px] font-bold tracking-wider uppercase text-[#8C7A6B] bg-[#F4EDE2] px-3 py-0.5 rounded-full mb-1.5">
            Lembrete Inteligente • {activeAlarm.time}
          </span>

          <h3 className="text-base font-bold text-[#2C2C2C] leading-snug">
            {activeAlarm.title}
          </h3>

          {activeAlarm.subtitle && (
            <p className="text-xs text-[#6E5D4F] mt-1 font-medium">
              {activeAlarm.subtitle}
            </p>
          )}

          {activeAlarm.dosage && (
            <p className="text-xs text-[#2C5230] bg-[#EEF5EF] px-2.5 py-0.5 rounded-md font-bold mt-1.5 border border-[#B7D2B9]">
              Dose: {activeAlarm.dosage}
            </p>
          )}

          {activeAlarm.memberName && (
            <p className="text-[11px] text-[#8C7A6B] mt-1">
              Para: <strong className="text-[#5C4F44]">{activeAlarm.memberName}</strong>
            </p>
          )}

          {/* Voice indicator notice */}
          <div className="mt-2 text-[11px] font-semibold text-[#8C7A6B] flex items-center gap-1.5 bg-[#F4EDE2] px-3 py-1 rounded-full">
            <Volume2 className="w-3.5 h-3.5 text-[#7D9D7F] animate-pulse" />
            <span>{activeAlarm.voice !== false ? 'Aviso de voz ativo' : 'Lembrete no horário'}</span>
          </div>
        </div>

        {/* 3 Interactive Buttons: Viu, Fez, Adiar */}
        <div className="mt-5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Fez */}
            <button
              onClick={() => confirmAlarmAction('fez')}
              className="py-3 px-3 rounded-2xl bg-[#7D9D7F] hover:bg-[#68886A] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Fez / Tomou</span>
            </button>

            {/* Viu */}
            <button
              onClick={() => confirmAlarmAction('viu')}
              className="py-3 px-3 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Já Vi</span>
            </button>
          </div>

          {/* Adiar */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => confirmAlarmAction('adiar', 15)}
              className="flex-1 py-2 px-2 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Adiar +15m</span>
            </button>
            <button
              onClick={() => confirmAlarmAction('adiar', 30)}
              className="flex-1 py-2 px-2 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Adiar +30m</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

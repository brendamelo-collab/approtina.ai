import { NativeOutdatedNotice } from './NativeOutdatedNotice';
import React, { useState } from 'react';
import { BellOff, Check, Clock, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todayISO } from '../utils/dateUtils';
import { MUTE_FOREVER, MUTE_HOURS, endOfToday, muteLabel, untilClock, untilDateTime, useMuted } from '../utils/alarmMute';

/**
 * SILENCIAR ROTINAS: pausa só os avisos (som, voz, vibração e tela de alarme).
 * Nenhuma tarefa é alterada: horários, status e registros continuam iguais.
 * Quando o tempo acaba, os avisos voltam sozinhos.
 */
export const SilenceRoutinesSheet: React.FC<{ onClose: (msg?: string) => void }> = ({ onClose }) => {
  const { notificationPreferences, updateNotificationPreferences } = useApp();
  const until = notificationPreferences.alarmsMutedUntil;
  const muted = useMuted(until);
  const [mode, setMode] = useState<'menu' | 'horario' | 'personalizado'>('menu');
  const [clock, setClock] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  });
  const [date, setDate] = useState(todayISO());
  const [dateClock, setDateClock] = useState('18:00');

  const apply = (ms: number) => {
    if (!(ms > Date.now())) return;
    updateNotificationPreferences({ alarmsMutedUntil: ms });
    onClose(`🔕 Rotinas silenciadas ${muteLabel(ms)}`);
  };

  const option = (label: string, onClick: () => void, wide = false) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-2xl bg-white border border-[#EFE8DE] hover:bg-[#F4EDE2] text-[#4A3E34] font-bold text-sm transition ${wide ? 'col-span-2' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs" onClick={() => onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Silenciar rotinas"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-[#FAF8F5] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center">
            <BellOff className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#2C2C2C] leading-tight">Silenciar rotinas</h2>
            <p className="text-[11px] text-[#8C7A6B] leading-snug mt-0.5">
              {muted ? `Silenciadas ${muteLabel(until)}.` : 'Pausa só os avisos: som, voz e vibração.'} Suas tarefas, horários e registros não mudam.
            </p>
          </div>
          <button type="button" onClick={() => onClose()} className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <NativeOutdatedNotice />

        {muted && (
          <button
            type="button"
            onClick={() => {
              updateNotificationPreferences({ alarmsMutedUntil: 0 });
              onClose('🔔 Avisos das rotinas reativados');
            }}
            className="w-full h-12 rounded-2xl bg-[#4F7A53] hover:bg-[#43694A] text-white font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Reativar os avisos agora
          </button>
        )}

        {mode === 'menu' && (
          <div className="space-y-2">
            {muted && <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B]">Ou mudar o tempo</p>}
            <div className="grid grid-cols-2 gap-2">
              {MUTE_HOURS.map((h) => option(h === 1 ? '1 hora' : `${h} horas`, () => apply(Date.now() + h * 3600 * 1000)))}
              {option('Até um horário', () => setMode('horario'))}
              {option('Resto do dia', () => apply(endOfToday()))}
              {option('Escolher data e hora', () => setMode('personalizado'), true)}
            </div>
            <button
              type="button"
              onClick={() => apply(MUTE_FOREVER)}
              className="w-full h-12 rounded-2xl text-white font-bold text-sm"
              style={{ background: 'var(--t-accent-dark, #5E4D40)' }}
            >
              Até eu reativar
            </button>
          </div>
        )}

        {mode === 'horario' && (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bold text-[#4A3E34] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Silenciar até
              </span>
              <input type="time" value={clock} onChange={(e) => setClock(e.target.value)} className="w-full h-12 bg-white border border-[#EFE8DE] rounded-2xl px-3 text-lg text-[#2C2C2C]" />
            </label>
            <p className="text-[11px] text-[#8C7A6B]">Os avisos voltam {muteLabel(untilClock(clock))}.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('menu')} className="flex-1 h-12 rounded-2xl bg-[#F4EDE2] text-[#5C4F44] font-bold text-sm">
                Voltar
              </button>
              <button type="button" onClick={() => apply(untilClock(clock))} className="flex-[2] h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm">
                Silenciar
              </button>
            </div>
          </div>
        )}

        {mode === 'personalizado' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1 min-w-0">
                <span className="text-xs font-bold text-[#4A3E34]">Até o dia</span>
                <input type="date" value={date} min={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-full h-12 bg-white border border-[#EFE8DE] rounded-2xl px-2 text-sm text-[#2C2C2C]" />
              </label>
              <label className="block space-y-1 min-w-0">
                <span className="text-xs font-bold text-[#4A3E34]">Às</span>
                <input type="time" value={dateClock} onChange={(e) => setDateClock(e.target.value)} className="w-full h-12 bg-white border border-[#EFE8DE] rounded-2xl px-2 text-sm text-[#2C2C2C]" />
              </label>
            </div>
            {untilDateTime(date, dateClock) <= Date.now() ? (
              <p className="text-[11px] text-[#8C3A24]">Escolha um momento no futuro.</p>
            ) : (
              <p className="text-[11px] text-[#8C7A6B]">Os avisos voltam {muteLabel(untilDateTime(date, dateClock))}.</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('menu')} className="flex-1 h-12 rounded-2xl bg-[#F4EDE2] text-[#5C4F44] font-bold text-sm">
                Voltar
              </button>
              <button
                type="button"
                disabled={untilDateTime(date, dateClock) <= Date.now()}
                onClick={() => apply(untilDateTime(date, dateClock))}
                className="flex-[2] h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm disabled:opacity-50"
              >
                Silenciar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

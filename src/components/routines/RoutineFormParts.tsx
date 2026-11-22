// Peças comuns dos editores de rotina (dias, som, voz, interruptor).
import React from 'react';
import { Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALARM_SOUNDS, previewAlarmSound, speakText, AlarmSoundId } from '../../utils/alarmSounds';
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from '../../utils/routineSchedule';

/** Campo com título. `group` = vários botões (não usa <label>, que ativaria o primeiro botão ao tocar no título). */
export const Field: React.FC<{ label: string; hint?: string; group?: boolean; children: React.ReactNode }> = ({ label, hint, group, children }) => {
  const inner = (
    <>
      <span className="block text-xs font-bold text-[#4A3E34]">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-[#8C7A6B] leading-snug">{hint}</span>}
    </>
  );
  return group ? (
    <div role="group" aria-label={label} className="space-y-1 min-w-0">
      {inner}
    </div>
  ) : (
    <label className="block space-y-1 min-w-0">{inner}</label>
  );
};

export const inputCls = 'w-full bg-white border border-[#EFE8DE] rounded-2xl px-3 py-2.5 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#8C7A6B]';

/** Dias da semana: vazio = todos os dias. */
export const DayPicker: React.FC<{ value: number[]; onChange: (d: number[]) => void }> = ({ value, onChange }) => {
  const all = value.length === 0 || value.length === 7;
  const presets: { label: string; days: number[] }[] = [
    { label: 'Todos os dias', days: [] },
    { label: 'Dias úteis', days: [1, 2, 3, 4, 5] },
    { label: 'Fins de semana', days: [0, 6] }
  ];
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x) => b.includes(x));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const on = p.days.length === 0 ? all : same(value, p.days);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.days)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${on ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#5C4F44]'}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_ORDER.map((d) => {
          const on = !all && value.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                const base = all ? [] : value;
                const next = base.includes(d) ? base.filter((x) => x !== d) : [...base, d];
                onChange(next.length === 7 ? [] : next);
              }}
              className={`py-2 rounded-xl text-[11px] font-bold border ${on ? 'bg-[#4A3E34] border-[#4A3E34] text-white' : all ? 'bg-[#F4EDE2] border-[#EFE8DE] text-[#5C4F44]' : 'bg-white border-[#EFE8DE] text-[#5C4F44]'}`}
            >
              {WEEKDAY_SHORT[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Interruptor com título e explicação. */
export const ToggleRow: React.FC<{ checked: boolean; onChange: (v: boolean) => void; title: string; hint?: string; disabled?: boolean }> = ({ checked, onChange, title, hint, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`w-full flex items-center gap-3 text-left rounded-2xl border p-3 transition ${checked ? 'bg-[#F4EDE2] border-[#DDD3C5]' : 'bg-white border-[#EFE8DE]'} disabled:opacity-50`}
  >
    <span className="min-w-0 flex-1">
      <span className="block text-xs font-bold text-[#2C2C2C] leading-snug">{title}</span>
      {hint && <span className="block text-[11px] text-[#8C7A6B] leading-snug mt-0.5">{hint}</span>}
    </span>
    <span className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#4F7A53]' : 'bg-[#DDD3C5]'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  </button>
);

/** Som de alerta desta rotina ('' = o escolhido em Configurações). */
export const SoundSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const { notificationPreferences } = useApp();
  const effective = (value || notificationPreferences.alarmSound || 'padrao') as AlarmSoundId;
  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} flex-1`}>
        <option value="">Padrão (Configurações)</option>
        {ALARM_SOUNDS.filter((s) => s.id !== 'celular').map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={effective === 'nenhum'}
        onClick={() => previewAlarmSound(effective, notificationPreferences.alarmRepeats || 0).catch(() => undefined)}
        className="shrink-0 px-3 rounded-2xl bg-[#F4EDE2] text-[#5C4F44] text-xs font-bold inline-flex items-center gap-1 disabled:opacity-40"
        aria-label="Ouvir o som"
      >
        <Play className="w-3 h-3" /> Ouvir
      </button>
    </div>
  );
};

/** Texto falado: em branco usa o automático (mostrado como exemplo). */
export const SpokenField: React.FC<{ value: string; onChange: (v: string) => void; automatic: string }> = ({ value, onChange, automatic }) => {
  const { notificationPreferences: p } = useApp();
  return (
    <div className="space-y-1.5">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={automatic} className={`${inputCls} resize-none leading-snug`} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] text-[#8C7A6B] leading-snug">{value.trim() ? 'Texto próprio.' : 'Em branco, a voz fala o texto de exemplo acima.'}</span>
        <button
          type="button"
          onClick={() => speakText(value.trim() || automatic, { voiceName: p.voiceName, nativeVoiceName: p.nativeVoiceName, voiceRate: p.voiceRate, voicePitch: p.voicePitch })}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-[#F4EDE2] text-[#5C4F44] text-[11px] font-bold inline-flex items-center gap-1"
        >
          <Play className="w-3 h-3" /> Ouvir a voz
        </button>
      </div>
    </div>
  );
};

/** Fundo e cartão de um editor (folha que sobe no celular). */
export const Sheet: React.FC<{ title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }> = ({ title, subtitle, onClose, children }) => (
  <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs" onClick={onClose}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:max-w-md max-h-[94dvh] overflow-y-auto bg-[#FAF8F5] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#2C2C2C] leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-[#8C7A6B] leading-snug mt-0.5">{subtitle}</p>}
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center text-lg leading-none" aria-label="Fechar">
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

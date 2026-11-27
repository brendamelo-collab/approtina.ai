import React, { useEffect, useState } from 'react';
import { Check, Play, Volume2, Mic, BellOff, Minus, Plus, Timer, BellRing } from 'lucide-react';
import { ALERT_MODES, AlertMode, BEEP_MAX, DURATION_OPTIONS, VOICE_REPEAT_MAX, alertModeOf, alertStyleFrom, beepsOf, durationOf, voiceRepeatsOf } from '../utils/alertStyle';
import { MUTE_OPTIONS, muteLabel, muteUntilFor, useMuted } from '../utils/alarmMute';
import { useApp } from '../context/AppContext';
import {
  ALARM_SOUNDS,
  AlarmSoundId,
  VOICE_PITCHES,
  VOICE_RATES,
  SAMPLE_SENTENCE,
  listWebVoices,
  previewAlarmSound,
  speakText
} from '../utils/alarmSounds';
import { isNativeAlarmAvailable, nativeAlarm, NativeVoice } from '../services/nativeAlarm';
import { NativeAlarmSetupCard } from './NativeAlarmSync';
import { NativeOutdatedNotice } from './NativeOutdatedNotice';

interface VoiceOption {
  id: string;
  label: string;
  detail?: string;
}

/** Configurações > Sons e voz: escolher, ouvir e salvar o som do alarme e a voz dos lembretes. */
export const SoundVoiceSettings: React.FC<{ onSaved?: (msg: string) => void }> = ({ onSaved }) => {
  const {
    notificationPreferences: prefs,
    updateNotificationPreferences,
    dailyChronologicalSteps,
    personalRoutines,
    updateDailyChronologicalStep,
    updatePersonalRoutine,
    triggerAlarm
  } = useApp();
  const mode = alertModeOf(prefs);
  const beeps = beepsOf(prefs);
  const voiceTimes = voiceRepeatsOf(prefs);
  const duration = durationOf(prefs);
  const ownSound = [...dailyChronologicalSteps.filter((x) => x.sound), ...personalRoutines.filter((x) => x.sound)];
  const native = isNativeAlarmAvailable();
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [voiceNote, setVoiceNote] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);

  const sound = (prefs.alarmSound || 'padrao') as AlarmSoundId;
  const rate = prefs.voiceRate ?? 0.95;
  const pitch = prefs.voicePitch ?? 1;
  const selectedVoice = (native ? prefs.nativeVoiceName : prefs.voiceName) || '';

  useEffect(() => {
    let alive = true;
    (async () => {
      if (native) {
        try {
          const list: NativeVoice[] = await nativeAlarm.getVoices();
          if (!alive) return;
          setVoices(
            list.map((v, i) => ({
              id: v.name,
              label: `Voz ${i + 1} (${v.locale.replace('-', ' - ')})`,
              detail: v.network ? 'Usa internet' : 'Funciona sem internet'
            }))
          );
          if (!list.length) setVoiceNote('Seu celular só tem a voz padrão em português.');
        } catch {
          if (!alive) return;
          setVoices([]);
          setVoiceNote('Para escolher a voz, instale a versão mais recente do app Android (Configurações > Baixar / Instalar App).');
        }
        return;
      }
      const list = await listWebVoices();
      if (!alive) return;
      setVoices(list.map((v) => ({ id: v.name, label: v.name.replace(/\s*\(.*?\)\s*/g, ' ').trim(), detail: v.localService ? 'Neste aparelho' : 'Usa internet' })));
      if (!list.length) setVoiceNote('Este navegador não oferece vozes em português além da padrão.');
    })();
    return () => {
      alive = false;
    };
  }, [native]);

  const flash = (id: string, ms = 2500) => {
    setPlaying(id);
    setTimeout(() => setPlaying((p) => (p === id ? null : p)), ms);
  };

  const chooseSound = (id: AlarmSoundId) => {
    // "Só a voz" na lista de sons = tipo de aviso "Só voz"
    updateNotificationPreferences(id === 'nenhum' ? { alarmSound: id, alertMode: 'voz', voiceAlerts: true } : { alarmSound: id, ...(mode === 'voz' ? { alertMode: 'ambos' as const } : {}) });
    onSaved?.('✓ Som do alarme salvo');
  };

  const chooseMode = (m: AlertMode) => {
    const updates: Record<string, any> = { alertMode: m, voiceAlerts: m !== 'alarme' };
    if (m !== 'voz' && sound === 'nenhum') updates.alarmSound = 'padrao';
    updateNotificationPreferences(updates);
    onSaved?.(`✓ Aviso: ${ALERT_MODES.find((x) => x.id === m)?.label}`);
  };

  /** Teste com tudo que está escolhido agora (som, toques, voz, repetições e duração). */
  const testNow = () => {
    flash('teste', 6000);
    if (native) {
      nativeAlarm
        .testAlarm(5, {
          sound: sound,
          voice: prefs.nativeVoiceName || '',
          rate,
          pitch,
          repeats: beeps,
          ...alertStyleFrom(prefs),
          spoken: mode === 'alarme' ? '' : 'Este é um teste do alarme do Rotina ponto A I.'
        })
        .then(() => onSaved?.('Alarme de teste em 5 segundos. Pode bloquear a tela.'))
        .catch(() => onSaved?.('Para testar, instale a versão mais recente do app Android.'));
      return;
    }
    triggerAlarm({ id: 'teste', key: `teste:${Date.now()}`, type: 'rotina', title: 'Alarme de teste', time: new Date().toTimeString().slice(0, 5), spoken: 'Este é um teste do alarme do Rotina ponto A I.' });
  };

  const stepper = (value: number, min: number, max: number, onChange: (v: number) => void, unit: [string, string], label: string) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-11 h-11 rounded-full bg-white border border-[#EFE8DE] text-[#4A3E34] flex items-center justify-center disabled:opacity-40"
        aria-label={`Menos ${label}`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="flex-1 text-center text-sm font-bold text-[#2C2C2C] tabular-nums" aria-live="polite">
        {value} {value === 1 ? unit[0] : unit[1]}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-11 h-11 rounded-full bg-white border border-[#EFE8DE] text-[#4A3E34] flex items-center justify-center disabled:opacity-40"
        aria-label={`Mais ${label}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  const chooseVoice = (id: string) => {
    updateNotificationPreferences(native ? { nativeVoiceName: id } : { voiceName: id });
    onSaved?.('✓ Voz salva');
  };

  const hearVoice = (voiceId: string, r = rate, p = pitch) => {
    flash(`voz:${voiceId}`, 4000);
    speakText(SAMPLE_SENTENCE, native ? { nativeVoiceName: voiceId, voiceRate: r, voicePitch: p } : { voiceName: voiceId, voiceRate: r, voicePitch: p });
  };

  const voiceRows: VoiceOption[] = [{ id: '', label: native ? 'Padrão do celular' : 'Padrão do aparelho' }, ...(voices || [])];

  const mutedUntil = prefs.alarmsMutedUntil;
  const muted = useMuted(mutedUntil);

  return (
    <div className="space-y-4">
      {native && <NativeOutdatedNotice />}
      {native && <NativeAlarmSetupCard alwaysShow />}

      {/* Silenciar alarmes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BellOff className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          <h3 className="text-xs font-bold text-[#4A3E34]">Silenciar alarmes</h3>
        </div>
        <p className="text-[11px] text-[#8C7A6B] leading-snug">
          {muted
            ? `Silenciados ${muteLabel(mutedUntil)}. Os lembretes aparecem sem som, sem voz e sem vibração.`
            : 'Por um tempo, os lembretes aparecem sem som, sem voz e sem vibração. Depois volta sozinho.'}
        </p>
        {muted ? (
          <button
            type="button"
            onClick={() => {
              updateNotificationPreferences({ alarmsMutedUntil: 0 });
              onSaved?.('✓ Som dos alarmes reativado');
            }}
            className="w-full py-2.5 rounded-xl bg-[#8C7A6B] text-white text-xs font-bold"
          >
            Reativar o som agora
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {MUTE_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  updateNotificationPreferences({ alarmsMutedUntil: muteUntilFor(o.minutes) });
                  onSaved?.(`✓ Alarmes silenciados ${muteLabel(muteUntilFor(o.minutes))}`);
                }}
                className={`py-2 rounded-xl text-xs font-bold border bg-white border-[#EFE8DE] text-[#4A3E34] hover:bg-[#F4EDE2] ${o.minutes === null ? 'col-span-2' : ''}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Como o aviso toca: tipo, duração e teste */}
      <div className="space-y-3 pt-3 border-t border-[#EFE8DE]/60">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          <h3 className="text-xs font-bold text-[#4A3E34]">Tipo de aviso</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Tipo de aviso">
          {ALERT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => chooseMode(m.id)}
              className={`min-h-11 px-1.5 py-2 rounded-xl text-xs font-bold border leading-tight ${
                mode === m.id ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#8C7A6B] leading-snug">{ALERT_MODES.find((m) => m.id === mode)?.hint}. Vale para todos os avisos.</p>

        {mode !== 'voz' && (
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-[#5C4F44]">Quantidade de toques (bipes) em cada rodada</span>
            {stepper(
              beeps || 3,
              1,
              BEEP_MAX,
              (v) => {
                updateNotificationPreferences({ alarmRepeats: v });
                flash(`som:${sound}`, 3500);
                if (sound !== 'nenhum') previewAlarmSound(sound, v).catch(() => undefined);
              },
              ['toque', 'toques'],
              'toques'
            )}
            {!beeps && <p className="text-[10px] text-[#8C7A6B] leading-snug">Ainda no padrão do som. Use − e + para escolher.</p>}
          </div>
        )}

        {mode !== 'alarme' && (
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-[#5C4F44]">Quantas vezes a voz fala em cada rodada</span>
            {stepper(voiceTimes, 1, VOICE_REPEAT_MAX, (v) => updateNotificationPreferences({ voiceRepeats: v }), ['vez', 'vezes'], 'repetições da voz')}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-[#8C7A6B]" />
            <span className="text-[11px] font-bold text-[#5C4F44]">Por quanto tempo o aviso toca</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Duração do aviso">
            {DURATION_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={duration === o.value}
                onClick={() => {
                  updateNotificationPreferences({ alarmDurationSec: o.value });
                  onSaved?.(`✓ Duração: ${o.label}`);
                }}
                className={`min-h-10 px-2 py-2 rounded-xl text-xs font-bold border leading-tight ${
                  duration === o.value ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'
                } ${o.value === -1 ? 'col-span-2' : ''}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#8C7A6B] leading-snug">
            {duration === -1
              ? 'Continua tocando e falando até você responder (Já fiz, Não fiz, Adiar ou Silenciar).'
              : duration === -2
                ? 'Toca uma rodada (toques + voz) e para. O lembrete fica pendente na barra de notificações.'
                : duration === 0
                  ? 'Como sempre foi: no celular repete por 10 minutos e depois adia sozinho por 10 minutos.'
                  : 'Repete as rodadas durante esse tempo e para sozinho. O lembrete fica pendente na barra de notificações (nada é marcado como feito).'}
          </p>
        </div>

        <button
          type="button"
          onClick={testNow}
          className="w-full h-11 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#4A3E34] text-xs font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5" /> {playing === 'teste' ? (native ? 'Alarme em 5 segundos…' : 'Testando…') : 'Testar o aviso completo'}
        </button>
      </div>

      {/* Som do alarme */}
      <div className="space-y-2 pt-3 border-t border-[#EFE8DE]/60">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          <h3 className="text-xs font-bold text-[#4A3E34]">Som do alarme</h3>
        </div>
        <p className="text-[11px] text-[#8C7A6B] leading-snug">Toque em “Ouvir” para escutar e no nome para escolher. O som escolhido vale para os próximos avisos.</p>
        <div className="space-y-1.5">
          {ALARM_SOUNDS.map((s) => {
            const isSel = sound === s.id;
            const unavailable = s.id === 'celular' && !native;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 rounded-2xl border p-2 pl-3 transition-colors ${
                  isSel ? 'bg-[#F4EDE2] border-[#8C7A6B]' : 'bg-white border-[#EFE8DE]'
                } ${unavailable ? 'opacity-60' : ''}`}
              >
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => chooseSound(s.id)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left py-1"
                  aria-pressed={isSel}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSel ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'border-[#DDD3C5]'
                    }`}
                  >
                    {isSel && <Check className="w-3 h-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[#2C2C2C] leading-tight">{s.label}</span>
                    <span className="block text-[11px] text-[#8C7A6B] leading-tight">
                      {unavailable ? 'Disponível no app Android' : s.description}
                    </span>
                  </span>
                </button>
                {s.id !== 'nenhum' && <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    flash(`som:${s.id}`, 3500);
                    previewAlarmSound(s.id, beeps).catch(() => undefined);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-2 rounded-xl"
                  aria-label={`Ouvir ${s.label}`}
                >
                  <Play className="w-3 h-3" />
                  {playing === `som:${s.id}` ? 'Tocando' : 'Ouvir'}
                </button>}
              </div>
            );
          })}
        </div>
      </div>

      {ownSound.length > 0 && (
        <div className="rounded-2xl border border-[#ECE3D5] bg-[#F7F2EA] p-3 space-y-2">
          <p className="text-[11px] text-[#5C4F44] leading-snug">
            {ownSound.length === 1 ? '1 rotina tem um som próprio' : `${ownSound.length} rotinas têm um som próprio`} e não muda{ownSound.length === 1 ? '' : 'm'} quando você troca o som aqui.
          </p>
          <button
            type="button"
            onClick={() => {
              dailyChronologicalSteps.filter((x) => x.sound).forEach((x) => updateDailyChronologicalStep(x.id, { sound: undefined }));
              personalRoutines.filter((x) => x.sound).forEach((x) => updatePersonalRoutine(x.id, { sound: undefined }));
              onSaved?.('✓ Todas as rotinas usam o som escolhido aqui');
            }}
            className="w-full h-10 rounded-xl bg-white border border-[#EFE8DE] text-[#4A3E34] text-xs font-bold"
          >
            Usar este som em todas
          </button>
        </div>
      )}

      {/* Voz dos lembretes */}
      <div className="space-y-2 pt-3 border-t border-[#EFE8DE]/60">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          <h3 className="text-xs font-bold text-[#4A3E34]">Voz dos lembretes falados</h3>
        </div>
        <p className="text-[11px] text-[#8C7A6B] leading-snug">
          {native ? 'Vozes em português instaladas no seu celular.' : 'Vozes em português deste navegador.'}
        </p>
        {voices === null ? (
          <p className="text-[11px] text-[#8C7A6B]">Procurando vozes…</p>
        ) : (
          <div className="space-y-1.5">
            {voiceRows.map((v) => {
              const isSel = selectedVoice === v.id;
              return (
                <div
                  key={v.id || 'padrao'}
                  className={`flex items-center gap-2 rounded-2xl border p-2 pl-3 ${
                    isSel ? 'bg-[#F4EDE2] border-[#8C7A6B]' : 'bg-white border-[#EFE8DE]'
                  }`}
                >
                  <button type="button" onClick={() => chooseVoice(v.id)} className="flex-1 min-w-0 flex items-center gap-2.5 text-left py-1" aria-pressed={isSel}>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSel ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'border-[#DDD3C5]'
                      }`}
                    >
                      {isSel && <Check className="w-3 h-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-[#2C2C2C] leading-tight break-words">{v.label}</span>
                      {v.detail && <span className="block text-[11px] text-[#8C7A6B] leading-tight">{v.detail}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => hearVoice(v.id)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-2 rounded-xl"
                    aria-label={`Ouvir ${v.label}`}
                  >
                    <Play className="w-3 h-3" />
                    {playing === `voz:${v.id}` ? 'Falando' : 'Ouvir'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {voiceNote && <p className="text-[11px] text-[#8C7A6B] leading-snug">{voiceNote}</p>}

        <div className="grid grid-cols-1 gap-2 pt-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#5C4F44]">Velocidade da fala</span>
            <div className="grid grid-cols-3 gap-1.5">
              {VOICE_RATES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    updateNotificationPreferences({ voiceRate: o.value });
                    hearVoice(selectedVoice, o.value, pitch);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    rate === o.value ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#5C4F44]">Tom da voz</span>
            <div className="grid grid-cols-3 gap-1.5">
              {VOICE_PITCHES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    updateNotificationPreferences({ voicePitch: o.value });
                    hearVoice(selectedVoice, rate, o.value);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    pitch === o.value ? 'bg-[#8C7A6B] border-[#8C7A6B] text-white' : 'bg-white border-[#EFE8DE] text-[#4A3E34]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#8C7A6B] leading-snug bg-[#F7F2EA] border border-[#ECE3D5] rounded-2xl p-3">
        Suas escolhas ficam salvas na sua conta e valem para os avisos do app aberto e para o alarme do app Android.
        No Android, o som e a voz novos funcionam depois de instalar a versão mais recente do app.
      </p>
    </div>
  );
};

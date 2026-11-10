import React, { useEffect, useState } from 'react';
import { Check, Play, Volume2, Mic } from 'lucide-react';
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

interface VoiceOption {
  id: string;
  label: string;
  detail?: string;
}

/** Configurações > Sons e voz: escolher, ouvir e salvar o som do alarme e a voz dos lembretes. */
export const SoundVoiceSettings: React.FC<{ onSaved?: (msg: string) => void }> = ({ onSaved }) => {
  const { notificationPreferences: prefs, updateNotificationPreferences } = useApp();
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
    updateNotificationPreferences({ alarmSound: id });
    onSaved?.('✓ Som do alarme salvo');
  };

  const chooseVoice = (id: string) => {
    updateNotificationPreferences(native ? { nativeVoiceName: id } : { voiceName: id });
    onSaved?.('✓ Voz salva');
  };

  const hearVoice = (voiceId: string, r = rate, p = pitch) => {
    flash(`voz:${voiceId}`, 4000);
    speakText(SAMPLE_SENTENCE, native ? { nativeVoiceName: voiceId, voiceRate: r, voicePitch: p } : { voiceName: voiceId, voiceRate: r, voicePitch: p });
  };

  const voiceRows: VoiceOption[] = [{ id: '', label: native ? 'Padrão do celular' : 'Padrão do aparelho' }, ...(voices || [])];

  return (
    <div className="space-y-4">
      {/* Som do alarme */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#8C7A6B] shrink-0" />
          <h3 className="text-xs font-bold text-[#4A3E34]">Som do alarme</h3>
        </div>
        <p className="text-[11px] text-[#8C7A6B] leading-snug">Toque em “Ouvir” para escutar e no nome para escolher.</p>
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
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    flash(`som:${s.id}`, 3500);
                    previewAlarmSound(s.id).catch(() => undefined);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3 py-2 rounded-xl"
                  aria-label={`Ouvir ${s.label}`}
                >
                  <Play className="w-3 h-3" />
                  {playing === `som:${s.id}` ? 'Tocando' : 'Ouvir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, ShieldCheck, Smartphone, X } from 'lucide-react';
import { APK_URL, VERSION_URL, isNativeAlarmAvailable, nativeAlarm, NativeAppInfo, PublishedVersion } from '../services/nativeAlarm';

/**
 * Atualização do app Android por dentro do próprio app:
 * ao abrir, compara a versão instalada com a publicada; se houver nova, baixa sozinho
 * (mostrando o progresso) e abre a tela de instalação do Android, onde basta tocar em "Atualizar".
 */
type Stage =
  | { kind: 'idle' }
  | { kind: 'downloading'; latest: PublishedVersion; percent: number }
  | { kind: 'ready'; latest: PublishedVersion }
  | { kind: 'permission'; latest: PublishedVersion }
  | { kind: 'installing'; latest: PublishedVersion }
  | { kind: 'error'; latest: PublishedVersion; message: string }
  | { kind: 'manual'; reason: 'old-app' | 'signature' };

const CHECK_EVERY_MS = 30 * 60 * 1000;
const SNOOZE_KEY = 'rotina_ai_update_later_until';

const later = (): boolean => {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
};

export const AppUpdater: React.FC = () => {
  const native = isNativeAlarmAvailable();
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [hidden, setHidden] = useState(false);
  const busy = useRef(false);
  const lastCheck = useRef(0);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  const install = useCallback(async (latest: PublishedVersion) => {
    try {
      const res = await nativeAlarm.installUpdate();
      setStage(res?.needsPermission ? { kind: 'permission', latest } : { kind: 'installing', latest });
    } catch (e: any) {
      setStage({ kind: 'error', latest, message: 'Não foi possível abrir a instalação.' });
    }
  }, []);

  const download = useCallback(
    async (latest: PublishedVersion) => {
      setHidden(false);
      setStage({ kind: 'downloading', latest, percent: 0 });
      const stop = await nativeAlarm.onUpdateProgress((p) => {
        setStage((s) => (s.kind === 'downloading' ? { ...s, percent: p.percent >= 0 ? p.percent : s.percent } : s));
      });
      try {
        await nativeAlarm.downloadUpdate(latest.apkUrl || APK_URL);
        stop();
        setStage({ kind: 'ready', latest });
        await install(latest);
      } catch {
        stop();
        setStage({ kind: 'error', latest, message: 'A conexão caiu durante o download.' });
      }
    },
    [install]
  );

  const check = useCallback(
    async (force = false) => {
      if (!native || busy.current) return;
      if (!force && Date.now() - lastCheck.current < CHECK_EVERY_MS) return;
      if (!['idle', 'manual'].includes(stageRef.current.kind)) return;
      busy.current = true;
      lastCheck.current = Date.now();
      try {
        let info: NativeAppInfo;
        try {
          info = await nativeAlarm.getAppInfo();
        } catch {
          // App instalado antes do atualizador: ele não sabe se atualizar sozinho
          if (!later()) setStage({ kind: 'manual', reason: 'old-app' });
          return;
        }
        const latest = await nativeAlarm.checkUpdate(VERSION_URL);
        if (!latest?.versionCode || latest.versionCode <= info.versionCode) {
          setStage({ kind: 'idle' });
          return;
        }
        // Assinatura diferente: o Android não aceita instalar por cima
        if (latest.signature && info.signature && latest.signature.toUpperCase() !== info.signature.toUpperCase()) {
          if (!later()) setStage({ kind: 'manual', reason: 'signature' });
          return;
        }
        await download(latest);
      } catch {
        // sem internet ou GitHub fora do ar: tenta de novo na próxima abertura
      } finally {
        busy.current = false;
      }
    },
    [native, download]
  );

  useEffect(() => {
    if (!native) return;
    const t = setTimeout(() => check(true), 4000);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const s = stageRef.current;
      // Voltou da tela de permissão: tenta instalar de novo
      if (s.kind === 'permission') install(s.latest);
      else check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [native, check, install]);

  if (!native || stage.kind === 'idle' || hidden) return null;

  const close = (snoozeHours = 0) => {
    if (snoozeHours) {
      try {
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + snoozeHours * 3600 * 1000));
      } catch {
        // sem armazenamento: só esconde agora
      }
    }
    setHidden(true);
  };

  const version = 'latest' in stage ? `versão ${stage.latest.versionName}` : '';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs">
      <div role="dialog" aria-modal="true" aria-label="Atualização do app" className="w-full sm:max-w-sm bg-[#FAF8F5] rounded-t-[28px] sm:rounded-[28px] shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-2xl bg-[#F4EDE2] text-[#8C7A6B] flex items-center justify-center">
            {stage.kind === 'manual' ? <Smartphone className="w-5 h-5" /> : <RefreshCw className={`w-5 h-5 ${stage.kind === 'downloading' ? 'animate-spin [animation-duration:2s]' : ''}`} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#2C2C2C] leading-tight">
              {stage.kind === 'manual' ? 'Nova versão do app' : stage.kind === 'error' ? 'A atualização não terminou' : 'Atualizando o app'}
            </h2>
            {version && <p className="text-[11px] text-[#8C7A6B] mt-0.5">Rotina.ai {version}</p>}
          </div>
          {(stage.kind === 'manual' || stage.kind === 'error' || stage.kind === 'installing') && (
            <button type="button" onClick={() => close(stage.kind === 'manual' ? 24 : 0)} className="w-8 h-8 shrink-0 rounded-full bg-[#F4EDE2] text-[#5C4F44] flex items-center justify-center" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {stage.kind === 'downloading' && (
          <div className="space-y-2">
            <p className="text-sm text-[#4A3E34]">Tem uma versão nova. Baixando a atualização…</p>
            <div className="h-3 w-full bg-[#EFE8DE] rounded-full overflow-hidden">
              <div className="h-full bg-[#8C7A6B] rounded-full transition-all duration-300" style={{ width: `${Math.max(4, stage.percent)}%` }} />
            </div>
            <p className="text-xs font-bold text-[#5C4F44] text-right tabular-nums">{stage.percent}%</p>
          </div>
        )}

        {(stage.kind === 'ready' || stage.kind === 'installing') && (
          <div className="space-y-3">
            <p className="text-sm text-[#4A3E34] leading-snug">
              Download concluído. Na tela do Android que abriu, toque em <strong>Atualizar</strong> (ou <strong>Instalar</strong>). Seus dados continuam salvos.
            </p>
            <button type="button" onClick={() => install(stage.latest)} className="w-full h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm inline-flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Abrir a instalação de novo
            </button>
          </div>
        )}

        {stage.kind === 'permission' && (
          <div className="space-y-3">
            <p className="text-sm text-[#4A3E34] leading-snug">
              Só falta uma permissão (é pedida uma vez só): na próxima tela, ative <strong>“Permitir desta fonte”</strong> para o Rotina.ai e volte para cá.
            </p>
            <button type="button" onClick={() => nativeAlarm.openInstallPermission().catch(() => undefined)} className="w-full h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm inline-flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Abrir permissão
            </button>
          </div>
        )}

        {stage.kind === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-[#4A3E34] leading-snug">{stage.message} Confira a internet e tente de novo.</p>
            <button type="button" onClick={() => download(stage.latest)} className="w-full h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm inline-flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Tentar de novo
            </button>
          </div>
        )}

        {stage.kind === 'manual' && (
          <div className="space-y-3">
            <p className="text-sm text-[#4A3E34] leading-snug">
              {stage.reason === 'old-app'
                ? 'Saiu uma versão nova, com a tela de alarme nova e o botão Silenciar. Esta versão instalada ainda não sabe se atualizar sozinha, então é preciso trocar uma única vez:'
                : 'Saiu uma versão nova, mas ela não pode ser instalada por cima desta. É preciso trocar uma única vez:'}
            </p>
            <ol className="text-sm text-[#4A3E34] space-y-1.5 list-decimal pl-5 leading-snug">
              <li>Toque em <strong>Baixar app novo</strong> (o download começa no navegador).</li>
              <li>Desinstale o Rotina.ai atual. Seus dados ficam salvos na sua conta.</li>
              <li>Abra o arquivo baixado, instale e entre com a mesma conta.</li>
            </ol>
            <p className="text-[11px] text-[#8C7A6B] leading-snug">Depois disso, as próximas versões se atualizam sozinhas por aqui.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => close(24)} className="flex-1 h-12 rounded-2xl bg-[#F4EDE2] text-[#5C4F44] font-bold text-sm">
                Depois
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = APK_URL;
                }}
                className="flex-[2] h-12 rounded-2xl bg-[#8C7A6B] text-white font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar app novo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

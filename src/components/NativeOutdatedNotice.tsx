import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { APK_URL, VERSION_URL, isNativeAlarmAvailable, nativeAlarm } from '../services/nativeAlarm';

/** Recursos de alarme que esta versão do site espera do app Android. */
export const REQUIRED_ALARM_FEATURES = 3;

type Status = { outdated: boolean; mustUninstall: boolean } | null;

/** No app Android: o alarme instalado sabe fazer o que está nas Configurações? */
export const useNativeAlarmOutdated = (): Status => {
  const [status, setStatus] = useState<Status>(null);
  useEffect(() => {
    if (!isNativeAlarmAvailable()) return;
    let alive = true;
    (async () => {
      let info: Awaited<ReturnType<typeof nativeAlarm.getAppInfo>> | null = null;
      try {
        info = await nativeAlarm.getAppInfo();
      } catch {
        info = null; // app bem antigo, de antes do atualizador
      }
      const outdated = !info || (info.alarmFeatures || 0) < REQUIRED_ALARM_FEATURES;
      let mustUninstall = !info;
      if (outdated && info) {
        try {
          const latest = await nativeAlarm.checkUpdate(VERSION_URL);
          mustUninstall = !!(latest?.signature && info.signature && latest.signature.toUpperCase() !== info.signature.toUpperCase());
        } catch {
          // sem internet: mostra só o aviso
        }
      }
      if (alive) setStatus({ outdated, mustUninstall });
    })();
    return () => {
      alive = false;
    };
  }, []);
  return status;
};

/**
 * Aviso claro quando o app do celular é antigo: as telas vêm do site (já novas), mas quem toca o
 * alarme é o app instalado. Sem atualizar, as escolhas aparecem mas o alarme não muda.
 */
export const NativeOutdatedNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  const status = useNativeAlarmOutdated();
  if (!status?.outdated) return null;
  return (
    <div role="alert" className={`rounded-2xl border border-[#E3B9AC] bg-[#FDF2EE] p-3.5 space-y-2.5 ${className}`}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-[#A9472F] shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-[#8C3A24] leading-snug">O app do celular está desatualizado</p>
          <p className="text-xs text-[#5C4F44] leading-snug">
            Estas opções aparecem, mas quem toca o alarme é o app instalado. Até instalar a versão nova, ele continua tocando do jeito antigo (toques, voz, duração, silenciar e tela cheia).
          </p>
          {status.mustUninstall && (
            <p className="text-xs text-[#5C4F44] leading-snug">
              <strong>Desta vez é preciso desinstalar o Rotina.ai antes</strong> (a assinatura do app mudou). Seus dados ficam salvos na conta.
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          window.location.href = APK_URL;
        }}
        className="w-full h-11 rounded-full bg-[#A9472F] text-white text-sm font-bold inline-flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" /> Baixar a versão nova
      </button>
    </div>
  );
};

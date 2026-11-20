import React, { useEffect, useState } from 'react';
import { BellOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isMuted, muteLabel } from '../utils/alarmMute';

/** Aviso no topo do app enquanto os alarmes estiverem silenciados, com o botão para reativar. */
export const AlarmMuteBanner: React.FC = () => {
  const { notificationPreferences, updateNotificationPreferences } = useApp();
  const [, tick] = useState(0);
  const until = notificationPreferences.alarmsMutedUntil;

  // Some sozinho quando o tempo de silêncio acaba
  useEffect(() => {
    if (!isMuted(until)) return;
    const t = setInterval(() => tick((n) => n + 1), 30 * 1000);
    return () => clearInterval(t);
  }, [until]);

  if (!isMuted(until)) return null;
  return (
    <div className="px-4 sm:px-6 pt-3">
      <div className="flex items-center gap-2.5 bg-[#FEF9E7] border border-[#EADB9B] rounded-2xl px-3 py-2.5">
        <span className="w-8 h-8 shrink-0 rounded-xl bg-[#F7EBC0] text-[#7A5E14] flex items-center justify-center">
          <BellOff className="w-4 h-4" />
        </span>
        <p className="flex-1 min-w-0 text-xs text-[#5A4510] leading-snug">
          <strong>Alarmes silenciados</strong> {muteLabel(until)}. Os lembretes aparecem sem som e sem voz.
        </p>
        <button
          type="button"
          onClick={() => updateNotificationPreferences({ alarmsMutedUntil: 0 })}
          className="shrink-0 text-xs font-bold text-white bg-[#8C7A6B] hover:bg-[#786657] px-3 py-2 rounded-xl whitespace-nowrap"
        >
          Reativar
        </button>
      </div>
    </div>
  );
};

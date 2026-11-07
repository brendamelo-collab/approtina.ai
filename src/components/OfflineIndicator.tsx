import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-[#3C3C3C] text-white px-4 py-2 text-xs font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <WifiOff className="w-4 h-4 text-[#E6C8A8] shrink-0" />
      <span>Modo Offline — Seus dados salvos continuam disponíveis.</span>
    </div>
  );
};

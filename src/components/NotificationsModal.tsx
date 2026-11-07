import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, CheckCheck } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, notifications, markNotificationRead } = useApp();

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <Bell className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">Notificações</h2>
              <p className="text-xs text-[#8C7A6B]">Lembretes e avisos familiares</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                item.read
                  ? 'bg-[#FAF8F5] border-[#EFE8DE] opacity-75'
                  : 'bg-[#F7F2EA] border-[#E4DACD]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-[#2C2C2C]">{item.title}</h4>
                <span className="text-[10px] text-[#A8988B]">{item.time}</span>
              </div>
              <p className="text-xs text-[#5C4F44] mt-1 leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            notifications.forEach((n) => markNotificationRead(n.id));
            setIsNotificationsOpen(false);
          }}
          className="w-full py-2.5 bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Marcar todas como lidas</span>
        </button>
      </div>
    </div>
  );
};

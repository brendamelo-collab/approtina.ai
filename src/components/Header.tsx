import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { Bell, ChevronDown, UserCheck } from 'lucide-react';
import { todayISO, shiftISODate, parseISODate } from '../utils/dateUtils';
import { RoundButton } from './ui/Kit';

const longDate = (iso: string) => {
  const s = parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Início: "Olá, Brenda! ☀️", a data e o sino (como nas fotos). Tocar no nome troca de perfil; na data, escolhe o dia. */
export const Header: React.FC = () => {
  const { currentProfile, profiles, switchProfile, selectedDate, setSelectedDate, notifications, setIsNotificationsOpen, setIsMaisDrawerOpen } = useApp();
  const [dateOpen, setDateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greetIcon = hour < 18 ? '☀️' : '🌙';
  const isToday = selectedDate === todayISO();

  const dateOptions = [
    { label: 'Hoje', value: todayISO() },
    { label: 'Amanhã', value: shiftISODate(todayISO(), 1) },
    { label: 'Ontem', value: shiftISODate(todayISO(), -1) }
  ];

  return (
    <header className="px-4 sm:px-6 pt-5 pb-1 w-full max-w-xl mx-auto select-none">
      <div className="flex items-start gap-3">
        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="text-left max-w-full flex items-center gap-1.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7A6B]"
            aria-label="Alternar perfil da família"
            title="Toque para trocar de perfil"
          >
            <h1 className="text-[26px] font-bold text-[#2C2C2C] tracking-tight leading-tight truncate">
              Olá, {currentProfile.name}! <span className="text-[24px]">{greetIcon}</span>
            </h1>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDateOpen((v) => !v)}
              className="mt-0.5 inline-flex items-center gap-1 text-[15px] text-[#4A3E34] font-medium"
              aria-label="Escolher o dia"
            >
              {longDate(selectedDate)}
              {!isToday && <span className="text-xs font-semibold text-[#B78A58]">(não é hoje)</span>}
              <ChevronDown className="w-3.5 h-3.5 text-[#B78A58]" />
            </button>
            {dateOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl shadow-xl z-50 p-1.5">
                {dateOptions.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => {
                      setSelectedDate(o.value);
                      setDateOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm ${selectedDate === o.value ? 'bg-[#F4EDE2] font-bold text-[#2C2C2C]' : 'text-[#4A3E34] hover:bg-[#F4EDE2]'}`}
                  >
                    {o.label}
                  </button>
                ))}
                <label className="block px-3 pt-1 pb-2 text-xs text-[#8C7A6B]">
                  Outro dia
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setDateOpen(false);
                      }
                    }}
                    className="mt-1 w-full bg-white border border-[#EFE8DE] rounded-xl px-2 py-1.5 text-sm text-[#2C2C2C]"
                  />
                </label>
              </div>
            )}
          </div>

          {profileOpen && (
            <div className="absolute left-0 top-10 mt-1 w-64 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl shadow-xl z-50 p-2">
              <p className="px-3 py-2 text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider border-b border-[#EFE8DE]/60">Perfis da família</p>
              <div className="py-1">
                {profiles.map((p) => {
                  const isCurrent = p.id === currentProfile.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs ${isCurrent ? 'bg-[#EFE8DE] font-bold text-[#2C2C2C]' : 'text-[#4A4A4A] hover:bg-[#F3ECE0]'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <UserAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                        <span>
                          <span className="block text-xs font-semibold">{p.name}</span>
                          <span className="block text-[10px] text-[#8C7A6B]">{p.role}</span>
                        </span>
                      </span>
                      {isCurrent && <UserCheck className="w-3.5 h-3.5 text-[#8C7A6B]" />}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setIsMaisDrawerOpen(true);
                }}
                className="w-full text-center py-1.5 text-[11px] text-[#8C7A6B] hover:text-[#2C2C2C] font-medium border-t border-[#EFE8DE]/60"
              >
                Gerenciar família e perfis
              </button>
            </div>
          )}
        </div>

        <RoundButton label="Abrir notificações" onClick={() => setIsNotificationsOpen(true)} className="relative mt-0.5">
          <Bell className="w-[22px] h-[22px]" strokeWidth={1.9} />
          {unread > 0 && <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-[#B78A58] ring-2 ring-[#FAF8F5]" />}
        </RoundButton>
      </div>
    </header>
  );
};

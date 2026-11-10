import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FamilyIllustration } from './FamilyIllustration';
import { UserAvatar } from './UserAvatar';
import { PWAInstallButton } from './PWAInstallButton';
import { Calendar, Bell, ChevronDown, Sparkles, Heart, Users, UserCheck, Settings } from 'lucide-react';
import { formatBrazilianDate } from '../utils/routineCalculations';
import { todayISO, shiftISODate } from '../utils/dateUtils';

export const Header: React.FC = () => {
  const {
    currentProfile,
    profiles,
    switchProfile,
    selectedDate,
    setSelectedDate,
    notifications,
    setIsNotificationsOpen,
    setIsMaisDrawerOpen
  } = useApp();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const dateOptions = [
    { label: 'Hoje', value: todayISO() },
    { label: 'Amanhã', value: shiftISODate(todayISO(), 1) },
    { label: 'Ontem', value: shiftISODate(todayISO(), -1) },
    { label: 'Outro dia...', value: 'custom' }
  ];

  return (
    <header className="pt-2 pb-1 px-4 sm:px-6 w-full max-w-xl mx-auto select-none">
      {/* Brand Tagline & PWA Install Banner */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#EFE8DE]/60 mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#EFE8DE] flex items-center justify-center text-[#8C7A6B] shrink-0">
            <Heart className="w-3.5 h-3.5 fill-[#8C7A6B]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-tight text-[#2C2C2C]">Rotina.ai</span>
            <span className="text-[11px] text-[#8C7A6B] block -mt-0.5 font-normal leading-snug">
              Sua vida, acompanhada com clareza.
            </span>
          </div>
        </div>

        <PWAInstallButton variant="button" />
      </div>

      {/* Main Greeting & Avatar Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar with Profile Switcher */}
        <div className="relative min-w-0 flex-1">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3 text-left max-w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7A6B] rounded-2xl p-1 transition-transform active:scale-95"
            aria-label="Alternar perfil familiar"
            title="Clique para alternar perfil da família"
          >
            <div className="relative shrink-0">
              {currentProfile.avatarUrl ? (
                <UserAvatar name={currentProfile.name} avatarUrl={currentProfile.avatarUrl} size="lg" />
              ) : (
                <FamilyIllustration size="md" />
              )}
              <div className="absolute -bottom-1 -right-1 bg-[#8C7A6B] text-white p-1 rounded-full shadow-sm border border-white">
                <Users className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-[#2C2C2C] tracking-tight leading-tight break-words min-w-0">
                  Olá, {currentProfile.name}!
                </h1>
                <Sparkles className="hidden sm:block w-4 h-4 shrink-0 text-[#C58B68] fill-[#F6E9DC]" />
              </div>
              <p className="text-xs sm:text-sm text-[#8C7A6B] font-medium leading-snug">
                Que tal organizar seu dia?
              </p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider border-b border-[#EFE8DE]/60">
                Perfis da Família
              </div>
              <div className="py-1">
                {profiles.map((p) => {
                  const isCurrent = p.id === currentProfile.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchProfile(p.id);
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                        isCurrent
                          ? 'bg-[#EFE8DE] font-bold text-[#2C2C2C]'
                          : 'text-[#4A4A4A] hover:bg-[#F3ECE0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                        <div>
                          <span className="block text-xs font-semibold">{p.name}</span>
                          <span className="block text-[10px] text-[#8C7A6B]">{p.role}</span>
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-3.5 h-3.5 text-[#8C7A6B]" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-1.5 border-t border-[#EFE8DE]/60">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsMaisDrawerOpen(true);
                  }}
                  className="w-full text-center py-1.5 text-[11px] text-[#8C7A6B] hover:text-[#2C2C2C] font-medium"
                >
                  Gerenciar Família & Perfis
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Notifications Bell & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            aria-label="Abrir notificações"
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F7F4EE] border border-[#EFE8DE] flex items-center justify-center text-[#5C4F44] hover:bg-[#EFE8DE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7A6B]"
          >
            <Bell className="w-5 h-5 text-[#6E5D4F]" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#B78A58] ring-2 ring-[#FDFBF7]" />
            )}
          </button>

          <button
            onClick={() => setIsMaisDrawerOpen(true)}
            aria-label="Ajustes e Mais Opções"
            title="Ajustes e Mais Opções"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F7F4EE] border border-[#EFE8DE] flex items-center justify-center text-[#5C4F44] hover:bg-[#EFE8DE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7A6B]"
          >
            <Settings className="w-5 h-5 text-[#6E5D4F]" />
          </button>
        </div>
      </div>

      {/* Date Pill Selector */}
      <div className="mt-4 relative">
        <div className="w-full bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_2px_8px_rgba(140,122,107,0.04)]">
          <div className="flex items-center gap-2.5 text-[#2C2C2C]">
            <div className="w-8 h-8 rounded-xl bg-[#EFE8DE] flex items-center justify-center text-[#8C7A6B]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {formatBrazilianDate(selectedDate)}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5C4F44] bg-[#EFE8DE] hover:bg-[#E4DACD] px-3 py-1.5 rounded-xl transition-colors"
              aria-label="Selecionar período da data"
            >
              <span>{selectedDate === todayISO() ? 'Hoje' : 'Data'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C7A6B]" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl shadow-xl z-50 p-2 animate-in fade-in duration-150">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      if (opt.value !== 'custom') {
                        setSelectedDate(opt.value);
                      }
                      setIsDatePickerOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-[#4A4A4A] hover:bg-[#EFE8DE] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

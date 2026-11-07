import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckSquare, ChevronRight, Sun, Home, Moon, Sparkles, Bell } from 'lucide-react';
import { PeriodKey } from '../types';
import { calculateRoutineProgress } from '../utils/routineCalculations';

export const RotinasCard: React.FC = () => {
  const {
    routineTasks,
    contextualReminders,
    setActivePeriodModal,
    setActiveTab
  } = useApp();

  const periods: { key: PeriodKey; label: string; icon: React.ReactNode; color: string }[] = [
    {
      key: 'manha',
      label: 'Manhã',
      icon: <Sun className="w-5 h-5 text-[#C58B68]" />,
      color: 'bg-[#F9F4EB]'
    },
    {
      key: 'tarde',
      label: 'Tarde',
      icon: <Home className="w-5 h-5 text-[#8C7A6B]" />,
      color: 'bg-[#F7F2EA]'
    },
    {
      key: 'noite',
      label: 'Noite',
      icon: <Moon className="w-5 h-5 text-[#70647C]" />,
      color: 'bg-[#F5ECE2]'
    },
    {
      key: 'especiais',
      label: 'Cuidados Especiais',
      icon: <Sparkles className="w-5 h-5 text-[#B78A58]" />,
      color: 'bg-[#F7F1E6]'
    }
  ];

  const activeReminder = contextualReminders[0];

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5 select-none">
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)]">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
              <CheckSquare className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2C2C2C] tracking-tight">
                Minhas Rotinas
              </h2>
              <p className="text-xs text-[#8C7A6B]">Seu dia no ritmo certo</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('rotinas')}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#8C7A6B] transition-colors"
            aria-label="Ver todas as rotinas"
          >
            <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
          </button>
        </div>

        {/* 4 Period Quick Blocks */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {periods.map((p) => {
            const { completed, total } = calculateRoutineProgress(routineTasks, p.key);
            return (
              <button
                key={p.key}
                onClick={() => setActivePeriodModal(p.key)}
                className="bg-[#F7F4EE] hover:bg-[#F2ECE0] border border-[#EAE3D6] rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all active:scale-95 min-h-[96px] shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] flex items-center justify-center shadow-2xs">
                  {p.icon}
                </div>
                <span className="text-[11px] font-bold text-[#3C3C3C] mt-2 leading-tight">
                  {p.label}
                </span>
                <span className="text-[10px] text-[#8C7A6B] font-medium mt-0.5">
                  {completed}/{total} feitas
                </span>
              </button>
            );
          })}
        </div>

        {/* Contextual Reminder */}
        {activeReminder && (
          <div
            onClick={() => setActivePeriodModal('especiais')}
            className="mt-3.5 bg-[#F7F1E6] hover:bg-[#F1E8DA] border border-[#EAE1D1] rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EFE4D2] flex items-center justify-center text-[#8C7A6B] shrink-0">
                <Bell className="w-3.5 h-3.5 text-[#8C7A6B]" />
              </div>
              <p className="text-xs font-semibold text-[#4A3E34] leading-snug">
                {activeReminder.text}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C7A6B] shrink-0 ml-2" />
          </div>
        )}
      </div>
    </section>
  );
};

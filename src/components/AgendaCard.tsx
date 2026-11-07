import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarCheck, ChevronRight, Plus, Clock, Sparkles } from 'lucide-react';

export const AgendaCard: React.FC = () => {
  const { agendaItems, setIsAgendaModalOpen, setActiveTab } = useApp();

  const todaySchedule = [
    { time: '08:00', title: 'Organizar a casa', icon: '🕒', color: 'text-[#B78A58]' },
    { time: '10:30', title: 'Preparar o almoço', icon: '🍲', color: 'text-[#C58B68]' },
    { time: '15:00', title: 'Atividade com as crianças', icon: '🎨', color: 'text-[#8C7A6B]' }
  ];

  const nextUpcoming = agendaItems[0] || {
    id: 'placeholder',
    title: 'Futebol das crianças',
    displayDay: 'Terça-feira',
    time: '17:00',
    isRecurring: true,
    recurrenceLabel: 'Recorrente',
    icon: '⚽'
  };

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5 select-none">
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)]">
        {/* Card Header matching Screen 1 */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <CalendarCheck className="w-5 h-5 text-[#B78A58]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2C2C2C] tracking-tight">
                Sua programação de hoje
              </h2>
              <p className="text-xs text-[#8C7A6B]">Compromissos e ritmo do dia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAgendaModalOpen(true)}
              className="w-7 h-7 rounded-full bg-[#EFE8DE] hover:bg-[#E4DACD] flex items-center justify-center text-[#5C4F44] transition-colors"
              aria-label="Adicionar compromisso"
              title="Adicionar compromisso"
            >
              <Plus className="w-3.5 h-3.5 text-[#5C4F44]" />
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] flex items-center gap-0.5 transition-colors"
              aria-label="Ver tudo sobre a programação"
            >
              <span>Ver tudo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Schedule List matching Screen 1 collage */}
        <div className="space-y-2 mb-3">
          {todaySchedule.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab('agenda')}
              className="flex items-center justify-between p-2.5 bg-[#F7F4EE] hover:bg-[#F2ECE0] border border-[#EAE3D6] rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-xs font-bold text-[#5C4F44] bg-[#EFE8DE] px-2 py-0.5 rounded-md">
                  {item.time}
                </span>
                <span className="text-xs font-semibold text-[#2C2C2C]">{item.title}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#B5A496]" />
            </div>
          ))}
        </div>

        {/* Next Upcoming Appointment Highlight */}
        <div
          onClick={() => setActiveTab('agenda')}
          className="flex items-center justify-between p-3 bg-[#F2ECE0]/70 hover:bg-[#ECE4D4] border border-[#E4DACD] rounded-2xl cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E2D8CA] flex items-center justify-center text-sm shadow-2xs">
              {nextUpcoming.icon || '⚽'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#2C2C2C] leading-tight">
                  {nextUpcoming.title}
                </h3>
                {nextUpcoming.isRecurring && (
                  <span className="text-[9px] font-bold text-[#6E5D4F] bg-[#EFE8DE] px-2 py-0.5 rounded-full border border-[#E2D8CA]">
                    Recorrente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8C7A6B] mt-0.5 font-medium">
                {nextUpcoming.displayDay} • {nextUpcoming.time ? `${nextUpcoming.time}h` : '17h'}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-[#8C7A6B]">
            Agenda &gt;
          </span>
        </div>
      </div>
    </section>
  );
};

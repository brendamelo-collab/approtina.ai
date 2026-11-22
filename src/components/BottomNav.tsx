import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  HeartHandshake,
  ClipboardCheck,
  CalendarDays,
  Menu,
  Compass,
  Smile,
  CheckSquare,
  BarChart2,
  Bot,
  Calendar,
  HeartPulse,
  Target,
  Repeat,
  Settings
} from 'lucide-react';
import { NavTab } from '../types';

const SHORT_LABEL: Partial<Record<NavTab, string>> = {
  inicio: 'Início',
  mapa: 'Mapa',
  agenda: 'Agenda',
  rotinas: 'Rotinas',
  saude: 'Saúde',
  cuidados: 'Saúde',
  metas: 'Metas',
  recorrentes: 'Tarefas',
  relatorios: 'Relatórios',
  ia: 'IA',
  configuracoes: 'Ajustes'
};

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    bottomNavSlots,
    isMaisDrawerOpen,
    setIsMaisDrawerOpen
  } = useApp();

  const getSlotIcon = (tab: NavTab) => {
    switch (tab) {
      case 'inicio':
        return <Home className="w-[22px] h-[22px]" strokeWidth={1.8} />;
      case 'mapa':
        return <HeartHandshake className="w-[22px] h-[22px]" strokeWidth={1.8} />;
      case 'rotinas':
        return <ClipboardCheck className="w-[22px] h-[22px]" strokeWidth={1.8} />;
      case 'agenda':
        return <CalendarDays className="w-[22px] h-[22px]" strokeWidth={1.8} />;
      case 'saude':
      case 'cuidados':
        return <HeartPulse className="w-[22px] h-[22px]" />;
      case 'metas':
        return <Target className="w-[22px] h-[22px]" />;
      case 'recorrentes':
        return <Repeat className="w-[22px] h-[22px]" />;
      case 'relatorios':
        return <BarChart2 className="w-[22px] h-[22px]" />;
      case 'ia':
        return <Bot className="w-[22px] h-[22px]" />;
      case 'configuracoes':
        return <Settings className="w-[22px] h-[22px]" />;
      default:
        return <Home className="w-[22px] h-[22px]" />;
    }
  };

  const item = (key: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void) => (
    <button
      key={key}
      onClick={onClick}
      className="flex-1 min-w-0 flex flex-col items-center justify-center focus:outline-none"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={`flex flex-col items-center justify-center gap-0.5 w-[62px] max-w-full py-1.5 rounded-2xl transition-colors ${
          isActive ? 'bg-[#F4EDE2] text-[#4A3E34]' : 'text-[#9E6C52] hover:text-[#4A3E34]'
        }`}
      >
        {icon}
        <span className={`text-[11px] leading-tight truncate max-w-full ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </span>
    </button>
  );

  return (
    <nav aria-label="Navegação Principal" className="fixed bottom-0 left-0 right-0 z-40 select-none px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="pointer-events-auto max-w-xl mx-auto bg-[#FAF8F5]/95 backdrop-blur-md border border-[#EFE8DE]/80 rounded-[26px] shadow-[0_8px_28px_rgba(150,100,60,0.16)] px-1.5 py-1.5 flex items-center">
        {bottomNavSlots.slice(0, 4).map((slot) =>
          item(
            slot.tab,
            SHORT_LABEL[slot.tab] || slot.label,
            getSlotIcon(slot.tab),
            activeTab === slot.tab || (slot.tab === 'saude' && activeTab === 'cuidados'),
            () => setActiveTab(slot.tab)
          )
        )}
        {item('mais', 'Mais', <Menu className="w-[22px] h-[22px]" strokeWidth={1.8} />, isMaisDrawerOpen, () => setIsMaisDrawerOpen(true))}
      </div>
    </nav>
  );
};

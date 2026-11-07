import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  Compass,
  Smile,
  CheckSquare,
  BarChart2,
  Bot,
  Calendar,
  HeartPulse,
  Target,
  Repeat,
  Settings,
  Sliders
} from 'lucide-react';
import { NavTab } from '../types';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    bottomNavSlots,
    setIsCustomizingNavOpen
  } = useApp();

  const getSlotIcon = (tab: NavTab) => {
    switch (tab) {
      case 'inicio':
        return <Home className="w-5 h-5" />;
      case 'mapa':
        return <Compass className="w-5 h-5" />;
      case 'rotinas':
        return <CheckSquare className="w-5 h-5" />;
      case 'agenda':
        return <Calendar className="w-5 h-5" />;
      case 'saude':
      case 'cuidados':
        return <HeartPulse className="w-5 h-5" />;
      case 'metas':
        return <Target className="w-5 h-5" />;
      case 'recorrentes':
        return <Repeat className="w-5 h-5" />;
      case 'relatorios':
        return <BarChart2 className="w-5 h-5" />;
      case 'ia':
        return <Bot className="w-5 h-5" />;
      case 'configuracoes':
        return <Settings className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  return (
    <nav
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/98 backdrop-blur-md border-t border-[#EFE8DE] shadow-[0_-2px_12px_rgba(140,122,107,0.06)] select-none"
    >
      <div className="max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around relative">
        {bottomNavSlots.map((item) => {
          const isActive =
            activeTab === item.tab ||
            (item.tab === 'saude' && activeTab === 'cuidados');
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex-1 py-1 px-1 flex flex-col items-center justify-center relative transition-colors focus:outline-none ${
                isActive ? 'text-[#2C2C2C]' : 'text-[#8C7A6B] hover:text-[#5C4F44]'
              }`}
              aria-label={item.label}
            >
              <div className="relative p-0.5">
                {getSlotIcon(item.tab)}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 truncate max-w-[68px] ${
                  isActive ? 'font-extrabold text-[#2C2C2C]' : 'font-medium text-[#8C7A6B]'
                }`}
              >
                {item.label}
              </span>

              {/* Indicator dot or line for active tab */}
              {isActive ? (
                <span className="w-4 h-0.5 bg-[#8C7A6B] rounded-full mt-0.5 animate-in fade-in duration-200" />
              ) : (
                <span className="w-4 h-0.5 bg-transparent mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Small subtle button on the far right or top to customize menu */}
        <button
          onClick={() => setIsCustomizingNavOpen(true)}
          className="absolute -top-3 right-3 w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#EFE8DE] text-[#A39385] hover:text-[#5C4F44] flex items-center justify-center shadow-xs transition-colors hover:scale-105"
          title="Personalizar atalhos da barra inferior"
          aria-label="Personalizar menu"
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>
    </nav>
  );
};

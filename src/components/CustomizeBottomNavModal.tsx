import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, ArrowUp, ArrowDown, RotateCcw, Sliders } from 'lucide-react';
import { NavTab, BottomNavSlot } from '../types';

interface AvailableOption {
  tab: NavTab;
  label: string;
  icon: string;
  emoji: string;
}

const allPossibleTabs: AvailableOption[] = [
  { tab: 'inicio', label: 'Início', icon: 'Home', emoji: '🏠' },
  { tab: 'mapa', label: 'Meu Mapa', icon: 'Compass', emoji: '🧭' },
  { tab: 'rotinas', label: 'Rotinas', icon: 'CalendarDays', emoji: '🌿' },
  { tab: 'agenda', label: 'Agenda', icon: 'Calendar', emoji: '📅' },
  { tab: 'saude', label: 'Saúde', icon: 'HeartPulse', emoji: '🩺' },
  { tab: 'metas', label: 'Metas', icon: 'Target', emoji: '🎯' },
  { tab: 'recorrentes', label: 'Recorrentes', icon: 'Repeat', emoji: '🔁' },
  { tab: 'relatorios', label: 'Relatórios', icon: 'BarChart2', emoji: '📊' },
  { tab: 'ia', label: 'Assistente', icon: 'Bot', emoji: '🤖' },
  { tab: 'configuracoes', label: 'Configurações', icon: 'Settings', emoji: '⚙️' }
];

export const CustomizeBottomNavModal: React.FC = () => {
  const {
    bottomNavSlots,
    setBottomNavSlots,
    isCustomizingNavOpen,
    setIsCustomizingNavOpen,
    resetBottomNavToDefault
  } = useApp();

  const [selectedSlots, setSelectedSlots] = useState<BottomNavSlot[]>(bottomNavSlots);

  if (!isCustomizingNavOpen) return null;

  const isTabSelected = (tab: NavTab) => selectedSlots.some((s) => s.tab === tab);

  const toggleTab = (opt: AvailableOption) => {
    if (isTabSelected(opt.tab)) {
      if (selectedSlots.length <= 3) {
        alert('Mantenha ao menos 3 atalhos na barra inferior para facilitar a navegação.');
        return;
      }
      setSelectedSlots((prev) => prev.filter((s) => s.tab !== opt.tab));
    } else {
      if (selectedSlots.length >= 5) {
        alert('A barra suporta no máximo 5 atalhos para manter a visualização limpa e acolhedora.');
        return;
      }
      setSelectedSlots((prev) => [...prev, { tab: opt.tab, label: opt.label, icon: opt.icon }]);
    }
  };

  const moveSlot = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedSlots.length) return;
    const copy = [...selectedSlots];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSelectedSlots(copy);
  };

  const handleSave = () => {
    setBottomNavSlots(selectedSlots);
    setIsCustomizingNavOpen(false);
  };

  const handleReset = () => {
    resetBottomNavToDefault();
    setSelectedSlots([
      { tab: 'inicio', label: 'Início', icon: 'Home' },
      { tab: 'mapa', label: 'Meu Mapa', icon: 'Compass' },
      { tab: 'rotinas', label: 'Rotinas', icon: 'CalendarDays' },
      { tab: 'relatorios', label: 'Relatórios', icon: 'BarChart2' },
      { tab: 'ia', label: 'Assistente', icon: 'Bot' }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#8C7A6B]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                Personalizar Menu Inferior
              </h2>
              <p className="text-[11px] text-[#8C7A6B]">
                Escolha e ordene de 3 a 5 atalhos rápidos
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomizingNavOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#8C7A6B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Active Slots Ordering */}
          <div>
            <h3 className="text-xs font-bold text-[#5C4F44] mb-2">
              Atalhos Ativos na Barra ({selectedSlots.length}/5):
            </h3>
            <div className="space-y-1.5">
              {selectedSlots.map((slot, index) => {
                const opt = allPossibleTabs.find((t) => t.tab === slot.tab);
                return (
                  <div
                    key={slot.tab}
                    className="p-2.5 rounded-2xl bg-white border border-[#EFE8DE] flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{opt?.emoji || '📌'}</span>
                      <span className="text-xs font-bold text-[#2C2C2C]">{slot.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSlot(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-[#8C7A6B] hover:bg-[#F4EDE2] disabled:opacity-30"
                        title="Mover para esquerda"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSlot(index, 'down')}
                        disabled={index === selectedSlots.length - 1}
                        className="p-1 rounded-lg text-[#8C7A6B] hover:bg-[#F4EDE2] disabled:opacity-30"
                        title="Mover para direita"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedSlots((prev) => prev.filter((s) => s.tab !== slot.tab))}
                        disabled={selectedSlots.length <= 3}
                        className="p-1 rounded-lg text-[#9E6C52] hover:bg-[#FDF2EE] disabled:opacity-30 ml-1"
                        title="Remover atalho"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Modules to Toggle */}
          <div>
            <h3 className="text-xs font-bold text-[#5C4F44] mb-2">
              Todos os Módulos do Rotina.ai:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {allPossibleTabs.map((opt) => {
                const selected = isTabSelected(opt.tab);
                return (
                  <button
                    key={opt.tab}
                    onClick={() => toggleTab(opt)}
                    className={`p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-[#EEF5EF] border-[#B7D2B9] text-[#2C5230] font-bold shadow-2xs'
                        : 'bg-white border-[#EFE8DE] text-[#6E5D4F] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{opt.emoji}</span>
                      <span className="text-xs">{opt.label}</span>
                    </div>
                    {selected ? (
                      <span className="w-5 h-5 rounded-full bg-[#7D9D7F] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A39385]">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-[#EFE8DE] flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#8C7A6B] hover:text-[#5C4F44] px-2 py-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Padrão</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsCustomizingNavOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-[#F4EDE2] text-[#6E5D4F] font-semibold text-xs hover:bg-[#EAE0D2]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

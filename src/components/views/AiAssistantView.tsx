import React from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, Bot, Sparkles } from 'lucide-react';
import { AiChatContainer } from '../AiChatContainer';

export const AiAssistantView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-28 select-none flex flex-col h-[calc(100vh-80px)]">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3.5 py-1.5 rounded-full transition-colors"
          aria-label="Voltar ao início"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Início</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight flex items-center justify-center gap-1.5">
            <span>Assistente IA</span>
            <Sparkles className="w-4 h-4 text-[#B78A58]" />
          </h1>
          <p className="text-[11px] text-[#8C7A6B]">Conversas, rotinas e cuidados inteligentes</p>
        </div>

        <div className="w-9 h-9" />
      </div>

      {/* Main chat container in full view */}
      <div className="flex-1 bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] flex flex-col overflow-hidden">
        <AiChatContainer isEmbeddedView={true} />
      </div>
    </div>
  );
};

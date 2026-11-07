import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bot, Sparkles } from 'lucide-react';
import { AiChatContainer } from './AiChatContainer';

export const AiAssistantModal: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen } = useApp();

  if (!isAiChatOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] h-[90vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <Bot className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C] flex items-center gap-1.5">
                <span>Assistente IA</span>
                <Sparkles className="w-3.5 h-3.5 text-[#B78A58]" />
              </h2>
              <p className="text-xs text-[#8C7A6B]">Gestão Inteligente de Rotinas & Hábitos</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiChatOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
            aria-label="Fechar assistente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AiChatContainer onClose={() => setIsAiChatOpen(false)} />
        </div>
      </div>
    </div>
  );
};

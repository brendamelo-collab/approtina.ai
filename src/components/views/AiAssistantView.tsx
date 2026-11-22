import React from 'react';
import { Bot } from 'lucide-react';
import { AiChatContainer } from '../AiChatContainer';
import { PageHeader } from '../ui/Kit';

export const AiAssistantView: React.FC = () => (
  <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-28 select-none flex flex-col h-[calc(100dvh-80px)]">
    <PageHeader icon={Bot} title="Assistente IA" />
    <div className="flex-1 min-h-0 mt-2 flex flex-col">
      <AiChatContainer isEmbeddedView={true} />
    </div>
  </div>
);

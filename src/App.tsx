/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MeuMapaCard } from './components/MeuMapaCard';
import { AgendaCard } from './components/AgendaCard';
import { RotinasCard } from './components/RotinasCard';
import { CuidadosMetasCards } from './components/CuidadosMetasCards';
import { BottomNav } from './components/BottomNav';
import { MaisDrawer } from './components/MaisDrawer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { MoodModal } from './components/MoodModal';
import { RoutineModal } from './components/RoutineModal';
import { AgendaModal } from './components/AgendaModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { ManageQuestionsModal } from './components/ManageQuestionsModal';
import { RelatoriosModal } from './components/RelatoriosModal';
import { AlarmBalloonModal } from './components/AlarmBalloonModal';
import { CustomizeBottomNavModal } from './components/CustomizeBottomNavModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GitHubUpdateBanner } from './components/GitHubUpdateBanner';
import { MeuMapaView } from './components/views/MeuMapaView';
import { AgendaView } from './components/views/AgendaView';
import { RotinasView } from './components/views/RotinasView';
import { RelatoriosView } from './components/views/RelatoriosView';
import { SaudeView } from './components/views/SaudeView';
import { MetasView } from './components/views/MetasView';
import { TarefasRecorrentesView } from './components/views/TarefasRecorrentesView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { ConfiguracoesPerfilView } from './components/views/ConfiguracoesPerfilView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2C2C] flex flex-col justify-between selection:bg-[#EAE0D2]">
      {/* GitHub Update Notification Banner */}
      <GitHubUpdateBanner />

      {/* Dynamic Screen Routing based on active bottom navigation tab */}
      <main className="flex-1 w-full max-w-xl mx-auto pb-32 sm:pb-36">
        {activeTab === 'inicio' && (
          <div className="animate-in fade-in duration-200">
            <Header />
            <MeuMapaCard />
            <AgendaCard />
            <RotinasCard />
            <CuidadosMetasCards />
          </div>
        )}

        {activeTab === 'mapa' && <MeuMapaView />}
        {activeTab === 'agenda' && <AgendaView />}
        {activeTab === 'rotinas' && <RotinasView />}
        {activeTab === 'relatorios' && <RelatoriosView />}
        {(activeTab === 'saude' || activeTab === 'cuidados') && <SaudeView />}
        {activeTab === 'metas' && <MetasView />}
        {activeTab === 'recorrentes' && <TarefasRecorrentesView />}
        {activeTab === 'ia' && <AiAssistantView />}
        {activeTab === 'configuracoes' && <ConfiguracoesPerfilView />}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav />

      {/* Global Interactive Modals and Drawers */}
      <MaisDrawer />
      <AiAssistantModal />
      <MoodModal />
      <RoutineModal />
      <AgendaModal />
      <NotificationsModal />
      <AuthModal />
      <ManageQuestionsModal />
      <RelatoriosModal />
      <AlarmBalloonModal />
      <CustomizeBottomNavModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

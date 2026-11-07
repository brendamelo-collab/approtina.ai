import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import { PWAInstallButton } from './PWAInstallButton';
import {
  X,
  Repeat,
  Target,
  Pill,
  Users,
  LineChart,
  Bot,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const MaisDrawer: React.FC = () => {
  const {
    isMaisDrawerOpen,
    setIsMaisDrawerOpen,
    setIsAiChatOpen,
    setIsAuthModalOpen,
    setIsRelatoriosModalOpen,
    setActiveTab,
    recurringTasks,
    completeRecurringTask,
    profiles,
    currentProfile,
    switchProfile,
    userEmail,
    isLoggedIn,
    logout
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<
    'menu' | 'recorrentes' | 'familia' | 'seguranca'
  >('menu');

  if (!isMaisDrawerOpen) return null;

  const menuSections = [
    {
      id: 'configuracoes',
      label: 'Configurações & Perfil',
      desc: 'Gestão familiar, lembretes, backup e limpeza de dados',
      icon: <Settings className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('configuracoes');
      }
    },
    {
      id: 'relatorios',
      label: 'Relatórios do Mapa',
      desc: 'Desempenho geral, gráfico de evolução e acompanhamento',
      icon: <LineChart className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('relatorios');
      }
    },
    {
      id: 'cuidados',
      label: 'Cuidados e Saúde',
      desc: 'Medicamentos, suplementos e cuidados diários',
      icon: <Pill className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('cuidados');
      }
    },
    {
      id: 'metas',
      label: 'Minhas Metas',
      desc: 'Objetivos da casa e família divididos em passos',
      icon: <Target className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('metas');
      }
    },
    {
      id: 'recorrentes',
      label: 'Tarefas Recorrentes',
      desc: 'Calibrar pneu, lavar sapatos, troca de roupa de cama',
      icon: <Repeat className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('recorrentes');
      }
    },
    {
      id: 'ia',
      label: 'Assistente IA',
      desc: 'Aba dedicada para conversar e criar rotinas',
      icon: <Bot className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => {
        setIsMaisDrawerOpen(false);
        setActiveTab('ia');
      }
    },
    {
      id: 'familia',
      label: 'Membros da Família',
      desc: 'Gerenciar e alternar entre os membros da família',
      icon: <Users className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => setActiveSubView('familia')
    },
    {
      id: 'seguranca',
      label: 'Conta & Segurança',
      desc: 'Autenticação, backup de dados e privacidade',
      icon: <ShieldCheck className="w-5 h-5 text-[#8C7A6B]" />,
      action: () => setActiveSubView('seguranca')
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-5 border-b border-[#EFE8DE] flex items-center justify-between sticky top-0 bg-[#FDFBF7]/95 backdrop-blur-xs z-10">
            <div>
              <h2 className="text-lg font-bold text-[#2C2C2C]">
                {activeSubView === 'menu' && 'Menu Completo'}
                {activeSubView === 'recorrentes' && 'Tarefas Recorrentes'}
                {activeSubView === 'familia' && 'Membros da Família'}
                {activeSubView === 'seguranca' && 'Segurança & Conta'}
              </h2>
              <p className="text-xs text-[#8C7A6B]">
                {activeSubView === 'menu'
                  ? 'Todos os módulos do Rotina.ai'
                  : 'Gerencie e personalize'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSubView !== 'menu' && (
                <button
                  onClick={() => setActiveSubView('menu')}
                  className="text-xs text-[#8C7A6B] hover:text-[#2C2C2C] px-2.5 py-1 rounded-xl bg-[#F4EDE2]"
                >
                  Voltar
                </button>
              )}
              <button
                onClick={() => {
                  setIsMaisDrawerOpen(false);
                  setActiveSubView('menu');
                }}
                className="w-9 h-9 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subview: Main Menu */}
          {activeSubView === 'menu' && (
            <div className="p-5 space-y-3">
              {/* Profile Bar */}
              <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3.5 flex items-center justify-between mb-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <UserAvatar name={currentProfile.name} avatarUrl={currentProfile.avatarUrl} size="md" />
                  <div>
                    <span className="block text-sm font-bold text-[#2C2C2C]">
                      {currentProfile.name}
                    </span>
                    <span className="block text-xs text-[#8C7A6B]">
                      {currentProfile.role} • {isLoggedIn ? userEmail : 'Modo Offline'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubView('familia')}
                  className="text-xs font-semibold text-[#8C7A6B] hover:text-[#5C4F44] bg-[#F4EDE2] px-2.5 py-1.5 rounded-xl"
                >
                  Trocar
                </button>
              </div>

              {/* PWA Install Banner */}
              <PWAInstallButton variant="banner" className="mb-3" />

              {/* Navigation items */}
              <div className="space-y-2">
                {menuSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={sec.action}
                    className="w-full text-left p-3.5 bg-[#FAF8F5] hover:bg-[#F4EDE2] border border-[#EFE8DE] rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F4EDE2] flex items-center justify-center">
                        {sec.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#2C2C2C]">
                          {sec.label}
                        </h3>
                        <p className="text-xs text-[#8C7A6B]">{sec.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subview: Tarefas Recorrentes */}
          {activeSubView === 'recorrentes' && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-[#8C7A6B] mb-2">
                Tarefas automáticas com periodicidade inteligente.
              </p>
              {recurringTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#2C2C2C]">{t.title}</h4>
                    <p className="text-[11px] text-[#8C7A6B]">
                      {t.recurrence} • Próximo: {t.nextDate}
                    </p>
                  </div>
                  <button
                    onClick={() => completeRecurringTask(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                      t.status === 'concluido'
                        ? 'bg-[#EAE0D2] text-[#5C4F44]'
                        : 'bg-[#F4EDE2] text-[#8C7A6B] hover:bg-[#EAE0D2]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.status === 'concluido' ? 'Feito' : 'Concluir'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Subview: Minha Família */}
          {activeSubView === 'familia' && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-[#8C7A6B] mb-2">
                Selecione o membro ativo para visualizar a rotina personalizada.
              </p>
              {profiles.map((p) => {
                const isSelected = p.id === currentProfile.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#F4EDE2] border-[#D8C7B4]'
                        : 'bg-[#FAF8F5] border-[#EFE8DE] hover:bg-[#F7F2EA]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E8DFC8] flex items-center justify-center font-bold text-sm text-[#5C4F44]">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#2C2C2C]">{p.name}</h4>
                        <p className="text-xs text-[#8C7A6B]">{p.role}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-[#5C4F44] bg-[#EAE0D2] px-2.5 py-1 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Subview: Conta & Segurança */}
          {activeSubView === 'seguranca' && (
            <div className="p-5 space-y-4">
              <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-4">
                <h4 className="text-xs font-bold text-[#2C2C2C] mb-1">
                  Status de Sincronização
                </h4>
                <p className="text-xs text-[#8C7A6B]">
                  Seus dados estão protegidos e salvos no seu dispositivo e nuvem.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#5C4F44] font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#8C7A6B]" />
                  <span>Criptografia local ativa</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMaisDrawerOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] text-xs font-bold text-center transition-colors"
              >
                Gerenciar Credenciais de Acesso
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#EFE8DE] bg-[#FAF8F5]">
          <div className="flex items-center justify-between text-xs text-[#8C7A6B]">
            <span>Rotina.ai v1.0.0</span>
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-[#8C7A6B] hover:text-[#5C4F44] font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="font-bold text-[#5C4F44] underline"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

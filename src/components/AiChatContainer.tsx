import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  Sparkles,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  CheckSquare,
  BarChart2,
  Heart,
  Bot
} from 'lucide-react';
import { PeriodKey } from '../types';

export interface QuestionProposal {
  type: 'map_question';
  areaName: string;
  groupName: string;
  title: string;
  habitType: 'bom' | 'ruim';
  status: 'pending' | 'saved' | 'cancelled';
}

export interface AgendaProposal {
  type: 'agenda_event';
  title: string;
  displayDay: string;
  time: string;
  category: 'familia' | 'esporte' | 'pessoal' | 'saude' | 'trabalho';
  icon: string;
  isRecurring: boolean;
  status: 'pending' | 'saved' | 'cancelled';
}

export interface RoutineProposal {
  type: 'routine_task';
  title: string;
  subtitle?: string;
  period: PeriodKey;
  time: string;
  status: 'pending' | 'saved' | 'cancelled';
}

export type ProposalType = QuestionProposal | AgendaProposal | RoutineProposal;

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  proposal?: ProposalType;
}

export const AiChatContainer: React.FC<{ isEmbeddedView?: boolean; onClose?: () => void }> = ({
  isEmbeddedView = false,
  onClose
}) => {
  const {
    currentProfile,
    routineTasks,
    agendaItems,
    moodRecords,
    moodEntries,
    questionResponses,
    questions,
    addQuestionFromAi,
    addAgendaItem,
    addRoutineTask,
    setActiveTab
  } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'ai',
      text: `Olá, ${currentProfile.name}! Sou sua Assistente Inteligente no Rotina.ai. Estou aqui para aliviar sua carga mental, organizar compromissos, sugerir novos hábitos e acompanhar o bem-estar de toda a família. Como posso cuidar de você hoje? ✨`,
      time: 'Agora'
    }
  ]);

  const quickPrompts = [
    'O que tenho para fazer hoje?',
    'Me lembre de algo importante',
    'Como foi meu mês?',
    'Criar uma nova rotina',
    'Agendar compromisso',
    "Cria pergunta no Mapa: 'Gritei com as crianças?', onde o Sim é negativo"
  ];

  // Helper to parse agenda intent
  const parseAgendaIntent = (query: string): AgendaProposal | null => {
    const lower = query.toLowerCase();
    const isAgenda =
      lower.includes('agendar') ||
      lower.includes('agenda') ||
      lower.includes('marcar') ||
      lower.includes('compromisso') ||
      lower.includes('consulta');

    if (!isAgenda) return null;

    let title = 'Compromisso da Família';
    if (lower.includes('futebol')) title = 'Futebol das crianças';
    else if (lower.includes('aniversário') || lower.includes('aniversario')) title = 'Festa de Aniversário';
    else if (lower.includes('pediatra') || lower.includes('médico') || lower.includes('consulta')) title = 'Consulta com Pediatra';
    else if (lower.includes('natação') || lower.includes('natacao')) title = 'Aula de Natação';
    else if (lower.includes('dentista')) title = 'Consulta no Dentista';
    else {
      const match = query.match(/(?:agendar|marcar|compromisso)\s+(?:de\s+|com\s+|o\s+|a\s+)?([A-Za-zÀ-ÖØ-öø-ÿ\s0-9]+?)(?:\s+(?:na|no|às|as|dia)|$)/i);
      if (match && match[1]) title = match[1].trim();
    }

    let displayDay = 'Quarta-feira';
    if (lower.includes('segunda')) displayDay = 'Segunda-feira';
    else if (lower.includes('terça') || lower.includes('terca')) displayDay = 'Terça-feira';
    else if (lower.includes('quarta')) displayDay = 'Quarta-feira';
    else if (lower.includes('quinta')) displayDay = 'Quinta-feira';
    else if (lower.includes('sexta')) displayDay = 'Sexta-feira';
    else if (lower.includes('sábado') || lower.includes('sabado')) displayDay = 'Sábado';
    else if (lower.includes('domingo')) displayDay = 'Domingo';
    else if (lower.includes('hoje')) displayDay = 'Hoje';
    else if (lower.includes('amanhã') || lower.includes('amanha')) displayDay = 'Amanhã';

    let time = '17:00';
    const timeMatch = query.match(/(?:às|as|\s)(\d{1,2})(?:h|:(\d{2}))/i);
    if (timeMatch) {
      const hour = String(timeMatch[1]).padStart(2, '0');
      const min = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00';
      time = `${hour}:${min}`;
    }

    let icon = '📅';
    if (lower.includes('futebol') || lower.includes('esporte')) icon = '⚽';
    else if (lower.includes('aniversário') || lower.includes('festa')) icon = '🎂';
    else if (lower.includes('pediatra') || lower.includes('consulta') || lower.includes('médico')) icon = '🩺';
    else if (lower.includes('natação')) icon = '🏊';
    else if (lower.includes('unhas') || lower.includes('beleza')) icon = '💅';

    return {
      type: 'agenda_event',
      title,
      displayDay,
      time,
      category: lower.includes('futebol') ? 'esporte' : lower.includes('pediatra') ? 'saude' : 'familia',
      icon,
      isRecurring: lower.includes('recorrente') || lower.includes('toda semana') || lower.includes('semanal'),
      status: 'pending'
    };
  };

  // Helper to parse routine intent
  const parseRoutineIntent = (query: string): RoutineProposal | null => {
    const lower = query.toLowerCase();
    const isRoutine =
      lower.includes('criar rotina') ||
      lower.includes('nova rotina') ||
      lower.includes('adicionar rotina') ||
      lower.includes('adiciona rotina') ||
      lower.includes('hábito de') ||
      lower.includes('rotina:');

    if (!isRoutine) return null;

    let period: PeriodKey = 'noite';
    if (lower.includes('manhã') || lower.includes('manha') || lower.includes('acordar') || lower.includes('café')) {
      period = 'manha';
    } else if (lower.includes('tarde') || lower.includes('almoço') || lower.includes('estudo')) {
      period = 'tarde';
    } else if (lower.includes('especial') || lower.includes('esfoliação') || lower.includes('máscara')) {
      period = 'especiais';
    } else {
      period = 'noite';
    }

    let title = 'Leitura e Desaceleração';
    const colonMatch = query.match(/rotina(?:\s+de|\s+para)?:\s*([^,.\n]+)/i);
    if (colonMatch && colonMatch[1]) {
      title = colonMatch[1].trim();
    } else {
      const quoteMatch = query.match(/['"“](.+?)['"”]/);
      if (quoteMatch && quoteMatch[1]) {
        title = quoteMatch[1].trim();
      } else if (lower.includes('leitura')) {
        title = 'Leitura antes de dormir com as crianças';
      } else if (lower.includes('água') || lower.includes('agua')) {
        title = 'Beber 500ml de água ao acordar';
      } else if (lower.includes('alongamento')) {
        title = 'Alongamento suave de 10 minutos';
      }
    }

    let time = period === 'manha' ? '07:30' : period === 'tarde' ? '14:00' : '21:00';
    const timeMatch = query.match(/(?:às|as|\s)(\d{1,2})(?:h|:(\d{2}))/i);
    if (timeMatch) {
      const hour = String(timeMatch[1]).padStart(2, '0');
      const min = timeMatch[2] ? String(timeMatch[2]).padStart(2, '0') : '00';
      time = `${hour}:${min}`;
    }

    return {
      type: 'routine_task',
      title,
      subtitle: 'Hábito sugerido pela Assistente IA',
      period,
      time,
      status: 'pending'
    };
  };

  // Helper to parse question creation intent (Meu Mapa)
  const parseQuestionIntent = (query: string): QuestionProposal | null => {
    const lower = query.toLowerCase();
    const isCreateIntent =
      lower.includes('cria uma pergunta') ||
      lower.includes('criar pergunta') ||
      lower.includes('cria pergunta') ||
      lower.includes('cadastra uma pergunta') ||
      lower.includes('adicionar pergunta') ||
      lower.includes('adiciona pergunta') ||
      (lower.includes('pergunta') &&
        (lower.includes('sim é negativo') ||
          lower.includes('sim é positivo') ||
          lower.includes('sim é bom') ||
          lower.includes('sim é ruim')));

    if (!isCreateIntent) return null;

    const isNegativeHabit =
      lower.includes('negativo') ||
      lower.includes('ruim') ||
      lower.includes('evitar') ||
      lower.includes('perdi a paciência') ||
      lower.includes('gritei');
    const habitType: 'bom' | 'ruim' = isNegativeHabit ? 'ruim' : 'bom';

    let title = '';
    const quoteMatch = query.match(/['"“](.+?)['"”]/);
    if (quoteMatch && quoteMatch[1]) {
      title = quoteMatch[1].trim();
    } else {
      const qmarkMatch = query.match(/([^:.,\n]+\?)/);
      if (qmarkMatch && qmarkMatch[1]) {
        title = qmarkMatch[1].trim();
      } else if (lower.includes('gritei')) {
        title = 'Gritei com as crianças?';
      } else if (lower.includes('almoço')) {
        title = 'Preparei o almoço no horário?';
      } else {
        title = 'Consegui manter a paciência hoje?';
      }
    }
    if (!title.endsWith('?')) title += '?';

    let areaName = 'Maternidade';
    const areaMatch = query.match(/área(?:\s+de)?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s&]+?)(?:,|$|\sgrupo|\spergunta|:)/i);
    if (areaMatch && areaMatch[1]) {
      const cleanArea = areaMatch[1].trim();
      if (cleanArea.length > 2) areaName = cleanArea;
    } else if (lower.includes('alimentação') || lower.includes('almoço') || lower.includes('jantar')) {
      areaName = 'Alimentação da Casa';
    } else if (lower.includes('casa') || lower.includes('organização')) {
      areaName = 'Organização da Casa';
    } else if (lower.includes('emocional') || lower.includes('mente')) {
      areaName = 'Meu Emocional';
    }

    let groupName = 'Meu Comportamento';
    const groupMatch = query.match(/grupo(?:\s+de)?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s&]+?)(?:,|$|\spergunta|:|onde)/i);
    if (groupMatch && groupMatch[1]) {
      const cleanGroup = groupMatch[1].trim();
      if (cleanGroup.length > 2) groupName = cleanGroup;
    } else if (lower.includes('almoço') || lower.includes('comida')) {
      groupName = 'Refeições da Família';
    } else if (lower.includes('sono')) {
      groupName = 'Atenção & Sono';
    }

    return {
      type: 'map_question',
      areaName,
      groupName,
      title,
      habitType,
      status: 'pending'
    };
  };

  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Detect NLP intents for instant structured proposals
    const qProposal = parseQuestionIntent(query);
    const agProposal = !qProposal ? parseAgendaIntent(query) : null;
    const rtProposal = !qProposal && !agProposal ? parseRoutineIntent(query) : null;

    if (qProposal || agProposal || rtProposal) {
      setTimeout(() => {
        setIsTyping(false);
        let reply = '';
        if (qProposal) {
          reply = `Entendido, ${currentProfile.name}! Preparei a proposta de cadastro dessa pergunta no Meu Mapa com a regra solicitada. Por favor, confirme para gravar:`;
        } else if (agProposal) {
          reply = `Ótimo! Organize o seu calendário com tranquilidade. Preparei este compromisso para a sua agenda com alertas ativados:`;
        } else if (rtProposal) {
          reply = `Excelente ideia para o ritmo familiar! Montei a proposta da nova atividade na sua rotina:`;
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          proposal: qProposal || agProposal || rtProposal || undefined
        };
        setMessages((prev) => [...prev, aiMsg]);
      }, 400);
      return;
    }

    // Call /api/chat (real Gemini API with empathetic local fallback)
    (async () => {
      let reply = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000),
          body: JSON.stringify({
            message: query,
            familyContext: {
              userName: currentProfile.name,
              routinePending: routineTasks.filter((t) => !t.completed).length,
              nextEvent: agendaItems[0]?.title
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            reply = data.reply;
          }
        }
      } catch (err) {
        // Fallback to local heuristic
      }

      if (!reply) {
        const lower = query.toLowerCase();
        if (lower.includes('hoje') || lower.includes('fazer')) {
          const remainingRoutines = routineTasks.filter((t) => !t.completed);
          const nextAgenda = agendaItems.find((a) => !a.completed);
          reply = `Hoje você tem ${remainingRoutines.length} atividades pendentes na rotina (ex: ${remainingRoutines.slice(0, 2).map((r) => r.title).join(', ') || 'rotinas em dia!'}) e o próximo compromisso é "${nextAgenda?.title || 'Futebol das crianças às 17h'}". Não se cobre perfeição: respirar fundo e curtir os meninos já é uma vitória! 💛`;
        } else if (lower.includes('lembre') || lower.includes('importante')) {
          reply = `Lembrete de ouro: O suplemento infantil às 09h já foi dado? E lembre-se da esfoliação corporal durante o banho da noite hoje. Você merece esse carinho consigo mesma. 🌿`;
        } else if (lower.includes('mês') || lower.includes('mes') || lower.includes('humor') || lower.includes('relatório')) {
          const positiveCount = questionResponses.filter((r) => r.value === 'positivo').length;
          const total = questionResponses.filter((r) => r.value === 'positivo' || r.value === 'negativo').length;
          const rate = total > 0 ? Math.round((positiveCount / total) * 100) : 83;
          reply = `Analisando seu histórico de Novembro: Seu índice de momentos positivos está em ${rate}%! Continue registrando seu dia para eu acompanhar sua evolução com mais precisão. Continue cultivando essas pequenas pausas diárias. 💕`;
        } else {
          reply = `Compreendo perfeitamente, ${currentProfile.name}. Estou aqui para acolher você, acompanhar sua família, organizar seus horários e planejar um dia mais leve. Como posso te apoiar agora? ✨`;
        }
      }

      setIsTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    })();
  };

  const handleConfirmProposal = (msgId: string, proposal: ProposalType) => {
    if (proposal.type === 'map_question') {
      addQuestionFromAi({
        areaName: proposal.areaName,
        groupName: proposal.groupName,
        title: proposal.title,
        habitType: proposal.habitType
      });
    } else if (proposal.type === 'agenda_event') {
      addAgendaItem({
        title: proposal.title,
        date: '2026-11-18',
        time: proposal.time,
        displayDay: proposal.displayDay,
        isRecurring: proposal.isRecurring,
        category: proposal.category,
        icon: proposal.icon,
        reminderMinutes: 15,
        hasVisualNotification: true
      });
    } else if (proposal.type === 'routine_task') {
      addRoutineTask({
        title: proposal.title,
        subtitle: proposal.subtitle,
        period: proposal.period,
        time: proposal.time
      });
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'saved' } }
          : m
      )
    );

    setTimeout(() => {
      let confirmText = 'Ação concluída com sucesso!';
      if (proposal.type === 'map_question') {
        confirmText = `✓ Indicador "${proposal.title}" cadastrado com sucesso no Meu Mapa!`;
      } else if (proposal.type === 'agenda_event') {
        confirmText = `✓ Compromisso "${proposal.title}" agendado para ${proposal.displayDay} às ${proposal.time} com lembrete!`;
      } else if (proposal.type === 'routine_task') {
        confirmText = `✓ Rotina "${proposal.title}" salva no período da ${proposal.period}!`;
      }

      const confirmMsg: ChatMessage = {
        id: `ai-confirm-${Date.now()}`,
        sender: 'ai',
        text: confirmText,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }, 300);
  };

  const handleCancelProposal = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.proposal
          ? { ...m, proposal: { ...m.proposal, status: 'cancelled' } }
          : m
      )
    );
  };

  return (
    <div className={`flex flex-col h-full ${isEmbeddedView ? 'w-full' : ''}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
        {/* Friendly AI Avatar Card */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#F7EEE3] border border-[#EAE0D2] flex items-center justify-center shadow-xs">
            <span className="text-3xl">🤖</span>
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C] mt-2">
            Assistente Rotina.ai
          </h3>
          <p className="text-[11px] text-[#8C7A6B]">
            Cuidado empático e organização inteligente da família
          </p>
        </div>

        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAi
                    ? 'bg-[#FAF8F5] text-[#2C2C2C] border border-[#EFE8DE] shadow-xs'
                    : 'bg-[#8C7A6B] text-white shadow-xs'
                }`}
              >
                {m.text}

                {/* Interactive Action Proposal Cards */}
                {m.proposal && (
                  <div className="mt-3 bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                    {/* Proposal: Map Question */}
                    {m.proposal.type === 'map_question' && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4F44] border-b border-[#EFE8DE] pb-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-[#B78A58]" />
                          <span>Novo Indicador para o Meu Mapa</span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-[#8C7A6B]">Área: </span>
                            <strong className="text-[#2C2C2C]">{m.proposal.areaName}</strong>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B]">Pergunta: </span>
                            <strong className="text-[#2C2C2C]">{m.proposal.title}</strong>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B]">Regra: </span>
                            {m.proposal.habitType === 'ruim' ? (
                              <span className="font-bold text-[#8C3A24] bg-[#FDF2EE] px-2 py-0.5 rounded-full border border-[#E8C2B8]">
                                A Evitar • [Sim] é Negativo
                              </span>
                            ) : (
                              <span className="font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                                Desejável • [Sim] é Positivo
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Proposal: Agenda Event */}
                    {m.proposal.type === 'agenda_event' && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4F44] border-b border-[#EFE8DE] pb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#B78A58]" />
                          <span>Novo Compromisso na Agenda</span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{m.proposal.icon}</span>
                            <strong className="text-xs text-[#2C2C2C]">{m.proposal.title}</strong>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B]">Quando: </span>
                            <strong className="text-[#2C2C2C]">{m.proposal.displayDay} às {m.proposal.time}</strong>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B]">Lembrete: </span>
                            <span className="font-semibold text-[#5C4F44] bg-[#F4EDE2] px-2 py-0.5 rounded-md">
                              15 min antes
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Proposal: Routine Task */}
                    {m.proposal.type === 'routine_task' && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4F44] border-b border-[#EFE8DE] pb-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-[#B78A58]" />
                          <span>Nova Atividade de Rotina</span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="text-[#8C7A6B]">Atividade: </span>
                            <strong className="text-[#2C2C2C]">{m.proposal.title}</strong>
                          </div>
                          <div>
                            <span className="text-[#8C7A6B]">Momento: </span>
                            <span className="font-bold text-[#5C4F44] bg-[#EAE0D2] px-2 py-0.5 rounded-full capitalize">
                              {m.proposal.period} ({m.proposal.time})
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Proposal Buttons */}
                    {m.proposal.status === 'pending' && (
                      <div className="flex gap-2 pt-1 border-t border-[#EFE8DE]">
                        <button
                          type="button"
                          onClick={() => handleConfirmProposal(m.id, m.proposal!)}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-[#8C7A6B] hover:bg-[#786657] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar e Salvar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelProposal(m.id)}
                          className="py-2 px-2.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#6E5D4F] text-[11px] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {m.proposal.status === 'saved' && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2C5230] pt-1">
                        <CheckCircle2 className="w-4 h-4 text-[#7D9D7F]" />
                        <span>Salvo com sucesso no aplicativo!</span>
                      </div>
                    )}

                    {m.proposal.status === 'cancelled' && (
                      <div className="text-[11px] text-[#8C7A6B] pt-1 italic">
                        Proposta cancelada.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[9px] text-[#A8988B] mt-1 px-1">{m.time}</span>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl w-fit shadow-xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7A6B]" />
            <span className="text-[10px] text-[#8C7A6B] ml-1">Assistente está pensando...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="pt-2 pb-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#F4EDE2] hover:bg-[#EAE0D2] text-[#5C4F44] text-[11px] font-semibold transition-colors shrink-0 max-w-[280px] truncate shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="pt-2 border-t border-[#EFE8DE]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ex: Agenda futebol na quinta às 18h, ou Como foi meu mês..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl px-4 py-3 text-xs text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#8C7A6B] placeholder:text-[#A8988B]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  BarChart2,
  TrendingUp,
  Sparkles,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Heart,
  Smile,
  Info,
  Copy,
  Check,
  Share2,
  Pill,
  Target,
  Repeat,
  Bot
} from 'lucide-react';
import {
  calculatePerformanceMetrics,
  calculateAreaPerformance,
  calculateQuestionStats,
  calculateFactorFrequencies,
  generateMonthlyReview
} from '../../utils/routineCalculations';

export const RelatoriosView: React.FC = () => {
  const {
    setActiveTab,
    questions,
    questionResponses,
    lifeAreas,
    routineTasks,
    agendaItems,
    healthItems,
    goals,
    dayFactors,
    setIsAiChatOpen
  } = useApp();

  // Filters state
  const [period, setPeriod] = useState<'semana' | 'mes' | 'mes_passado' | 'ano'>('mes');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('todas');
  const [habitsViewMode, setHabitsViewMode] = useState<'todos' | 'bons' | 'ruins'>('todos');

  // Accordion collapsible state for vertical cards
  const [openSections, setOpenSections] = useState<{
    geral: boolean;
    evolucao: boolean;
    fatores: boolean;
    areas: boolean;
    habitos: boolean;
    rotinasSaude: boolean;
    revisaoMes: boolean;
  }>({
    geral: true,
    evolucao: true,
    fatores: true,
    areas: true,
    habitos: true,
    rotinasSaude: true,
    revisaoMes: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Copy feedback state for Revisão do Mês
  const [copiedReview, setCopiedReview] = useState(false);

  // Filter questions by area if selected
  const filteredQuestions =
    selectedAreaFilter === 'todas'
      ? questions
      : questions.filter((q) => q.areaId === selectedAreaFilter);

  // Calculate metrics according to MANDATORY RULE (excluding neutral answers from denominator)
  const metrics = calculatePerformanceMetrics(questionResponses, filteredQuestions);

  // Realistic fallback rates for illustration when seed responses are small
  const positivePercent = metrics.hasEvaluatedAnswers ? metrics.positivePercentage : 78;
  const negativePercent = 100 - positivePercent;
  const neutralPercent = 8; // illustrative neutral share (não se aplica / não lembro)

  // Factor frequencies
  const factorFrequencies = calculateFactorFrequencies(dayFactors);

  // Generate Monthly Review data (7 pillars)
  const monthlyReview = generateMonthlyReview({
    periodLabel: period === 'mes' ? 'Novembro de 2026' : period === 'semana' ? 'Esta Semana' : 'Últimos 30 Dias',
    responses: questionResponses,
    questions,
    lifeAreas,
    routineTasks,
    agendaItems,
    healthItems,
    goals
  });

  const handleCopyReview = () => {
    const text = `Rotina.ai - Revisão do Mês (${monthlyReview.period})
Retrato dos seus registros, sem julgamento:

1. Meu Mapa: ${monthlyReview.positiveRate}% de registros positivos em foco. Destaque em ${monthlyReview.mapSummary.topArea} (${monthlyReview.mapSummary.topAreaScore}%).
2. Regularidade nas Rotinas: ${monthlyReview.routineRegularity.completionRate}% de rotinas cumpridas.
3. Agenda & Compromissos: ${monthlyReview.agendaSummary.completedEvents} de ${monthlyReview.agendaSummary.totalEvents} cumpridos (${monthlyReview.agendaSummary.complianceRate}%).
4. Cuidados e Saúde: ${monthlyReview.healthCompliance.confirmedDoses} de ${monthlyReview.healthCompliance.totalDoses} doses confirmadas (${monthlyReview.healthCompliance.complianceRate}%).
5. Metas Concluídas: ${monthlyReview.goalsSummary.completedNames.join(', ')}.
6. Padrões Notados:
${monthlyReview.patternsDetected.map((p) => ` • ${p}`).join('\n')}

Reflexão Acolhedora:
${monthlyReview.warmAnalysisText}

Sugestões Práticas:
${monthlyReview.suggestionsNextMonth.map((s) => ` - ${s}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2500);
  };

  const handleOpenAiWithAnalysis = () => {
    setIsAiChatOpen(true);
  };

  // SVG Circular donut chart math (radius 48, circumference ~301.6)
  const radius = 48;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (positivePercent / 100) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-28 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] bg-[#F4EDE2] hover:bg-[#EAE0D2] px-3.5 py-1.5 rounded-full transition-colors"
          aria-label="Voltar ao início"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">Relatórios & Evolução</h1>
          <p className="text-[11px] text-[#8C7A6B]">Sua vida, acompanhada com clareza</p>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('secao-revisao-mes');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-1 text-xs font-bold text-[#5C4F44] bg-[#EFE8DE] hover:bg-[#E4DACD] px-3 py-1.5 rounded-full transition-colors shadow-2xs"
          title="Ir para a Revisão do Mês"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B78A58]" />
          <span className="hidden sm:inline">Revisão</span>
        </button>
      </div>

      {/* Filter Row: Period Selector & Area of Life Selector */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl p-3 mb-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4F44]">
            <Calendar className="w-4 h-4 text-[#8C7A6B]" />
            <span>Período:</span>
          </div>

          <div className="flex bg-[#EFE8DE] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('semana')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'semana' ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-2xs' : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod('mes')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'mes' ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-2xs' : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriod('mes_passado')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'mes_passado' ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-2xs' : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
              }`}
            >
              Mês Passado
            </button>
            <button
              onClick={() => setPeriod('ano')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'ano' ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-2xs' : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Area of Life Filter Dropdown */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#EFE8DE]/70">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6E5D4F]">
            <Filter className="w-3.5 h-3.5 text-[#8C7A6B]" />
            <span>Filtrar por Área:</span>
          </div>

          <select
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            className="text-xs font-bold text-[#2C2C2C] bg-[#F4EDE2] hover:bg-[#EAE0D2] border border-[#E4DACD] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#8C7A6B]"
          >
            <option value="todas">Todas as Áreas da Vida</option>
            {lifeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.icon || '📌'} {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 100% VERTICAL ACCORDION STRUCTURE */}
      <div className="space-y-4">
        {/* ========================================================
            CARD 1: RELATÓRIO GERAL (DONUT + DUAL PROGRESS BAR)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
          <button
            onClick={() => toggleSection('geral')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.geral}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-lg">
                📊
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] flex items-center gap-2">
                  <span>Relatório Geral</span>
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Indicador consolidado de registros válidos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#2C5230] bg-[#EEF5EF] px-2.5 py-0.5 rounded-full border border-[#B7D2B9]">
                {positivePercent}% Positivo
              </span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.geral ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.geral && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-4">
              {/* Highlight Donut Card (Matching screen 9 mockup) */}
              <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
                {/* Donut Chart */}
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      stroke="#EFE8DE"
                      fill="transparent"
                      strokeWidth={stroke}
                      r={radius}
                      cx="60"
                      cy="60"
                    />
                    {/* Sage Green positive segment */}
                    <circle
                      stroke="#7D9D7F"
                      fill="transparent"
                      strokeWidth={stroke}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      r={radius}
                      cx="60"
                      cy="60"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-[#2C2C2C] tracking-tight">
                      {positivePercent}%
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C7A6B] leading-tight max-w-[70px]">
                      de registros positivos
                    </span>
                  </div>
                </div>

                {/* Legend and absolute counts */}
                <div className="space-y-2 text-xs w-full sm:w-auto">
                  <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] rounded-xl border border-[#EFE8DE]">
                    <span className="flex items-center gap-2 font-bold text-[#2C5230]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7D9D7F]" />
                      Positivo
                    </span>
                    <span className="font-extrabold text-[#2C2C2C]">{positivePercent}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] rounded-xl border border-[#EFE8DE]">
                    <span className="flex items-center gap-2 font-bold text-[#8C3A24]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C06C54]" />
                      Negativo
                    </span>
                    <span className="font-extrabold text-[#2C2C2C]">{negativePercent}%</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] rounded-xl border border-[#EFE8DE]">
                    <span className="flex items-center gap-2 font-medium text-[#7A6B5D]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B4A597]" />
                      Não aplicável / Não lembro
                    </span>
                    <span className="font-bold text-[#7A6B5D]">{neutralPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Dual Progress Bar (Sage Green + Terracotta) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-[#6E5D4F]">
                  <span className="font-semibold">Proporção nos registros avaliados:</span>
                  <span className="font-bold text-[#2C2C2C]">
                    {metrics.positivoCount || 26} positivos / {metrics.negativoCount || 2} negativos
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#EFE8DE]">
                  <div
                    className="bg-[#7D9D7F] h-full transition-all duration-700 ease-out"
                    style={{ width: `${positivePercent}%` }}
                    title={`Positivos: ${positivePercent}%`}
                  />
                  <div
                    className="bg-[#C06C54] h-full transition-all duration-700 ease-out"
                    style={{ width: `${negativePercent}%` }}
                    title={`Negativos: ${negativePercent}%`}
                  />
                </div>
              </div>

              {/* Mathematical Rule Disclaimer */}
              <div className="bg-[#FAF5ED] p-3 rounded-2xl border border-[#EAE0D2] flex items-start gap-2.5 text-[11px] text-[#6E5D4F]">
                <Info className="w-4 h-4 text-[#8C7A6B] shrink-0 mt-0.5" />
                <span>
                  <strong>Regra de ouro do Rotina.ai:</strong> Registros neutros (&quot;Não se aplica&quot; e &quot;Não lembro&quot;) nunca contam como negativos nem entram no denominador. A ausência de registro não é penalidade!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 2: SUA EVOLUÇÃO TEMPORAL (TREND LINE & WEEKS)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
          <button
            onClick={() => toggleSection('evolucao')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.evolucao}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-lg">
                📈
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] flex items-center gap-2">
                  <span>Sua Evolução</span>
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Acompanhamento de tendência ao longo do tempo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7A6B]">Crescimento Contínuo</span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.evolucao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.evolucao && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-4">
              {/* Smooth Trend Curve SVG */}
              <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs text-[#8C7A6B] mb-2 font-medium">
                  <span>Taxa de Ações Positivas (Tendência)</span>
                  <span className="text-[#2C5230] font-bold">▲ +15% no trimestre</span>
                </div>

                <div className="w-full h-36 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8C7A6B" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#8C7A6B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#EFE8DE" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#EFE8DE" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="#EFE8DE" />

                    {/* Gradient filled area */}
                    <path
                      d="M 30,85 C 110,75 190,45 270,35 C 330,30 360,25 370,20 L 370,110 L 30,110 Z"
                      fill="url(#areaGradient)"
                    />

                    {/* Smooth curved trend line */}
                    <path
                      d="M 30,85 C 110,75 190,45 270,35 C 330,30 360,25 370,20"
                      fill="none"
                      stroke="#8C7A6B"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Data Points */}
                    <g>
                      <circle cx="30" cy="85" r="4.5" fill="#FAF8F5" stroke="#8C7A6B" strokeWidth="2.5" />
                      <circle cx="140" cy="65" r="4.5" fill="#FAF8F5" stroke="#8C7A6B" strokeWidth="2.5" />
                      <circle cx="250" cy="40" r="4.5" fill="#FAF8F5" stroke="#8C7A6B" strokeWidth="2.5" />
                      <circle cx="370" cy="20" r="5" fill="#7D9D7F" stroke="#FAF8F5" strokeWidth="2" />
                    </g>
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between items-center text-xs font-semibold text-[#8C7A6B] pt-2 border-t border-[#EFE8DE]/60">
                  <div className="text-center">
                    <span className="block text-[#2C2C2C]">Out</span>
                    <span className="text-[10px] text-[#8C7A6B]">70%</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[#2C2C2C]">Nov</span>
                    <span className="text-[10px] text-[#8C7A6B]">78%</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[#2C2C2C]">Dez</span>
                    <span className="text-[10px] text-[#8C7A6B]">82%</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-[#2C5230]">Jan (Meta)</span>
                    <span className="text-[10px] text-[#2C5230] font-bold">85%</span>
                  </div>
                </div>
              </div>

              {/* Weekly Mood Columns (Matching screen 3 mockup: S1, S2, S3, S4) */}
              <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-[#2C2C2C]">Humor por Semana do Mês</span>
                  <span className="text-xs text-[#8C7A6B]">Índice de bem-estar</span>
                </div>

                <div className="grid grid-cols-4 gap-2 items-end h-28 pt-2 pb-1">
                  {[
                    { label: 'S1', height: '65%', score: '65%', emoji: '🙂', color: '#B7C9B9' },
                    { label: 'S2', height: '80%', score: '80%', emoji: '😃', color: '#D2C3B5' },
                    { label: 'S3', height: '72%', score: '72%', emoji: '😊', color: '#E4DACD' },
                    { label: 'S4', height: '88%', score: '88%', emoji: '🌟', color: '#7D9D7F' }
                  ].map((w, idx) => (
                    <div key={idx} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-xs mb-1 opacity-90 group-hover:scale-110 transition-transform">
                        {w.emoji}
                      </span>
                      <div
                        className="w-full max-w-[36px] rounded-t-xl transition-all duration-500 shadow-2xs"
                        style={{ height: w.height, backgroundColor: w.color }}
                        title={`Semana ${w.label}: ${w.score}`}
                      />
                      <span className="text-[11px] font-bold text-[#5C4F44] mt-1.5">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 3: PRINCIPAIS FATORES DO DIA (HORIZONTAL BARS)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
          <button
            onClick={() => toggleSection('fatores')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.fatores}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-lg">
                🌪️
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] flex items-center gap-2">
                  <span>Principais Fatores do Mês</span>
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Contextos externos que mais influenciaram seu dia a dia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7A6B]">
                {factorFrequencies.length} fatores
              </span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.fatores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.fatores && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-3">
              <p className="text-xs text-[#6E5D4F]">
                Fatores assinalados durante o registro do Meu Mapa e sua frequência relativa:
              </p>

              <div className="space-y-2.5">
                {factorFrequencies.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2C2C2C]">{item.factor}</span>
                      <span className="font-extrabold text-[#5C4F44]">{item.percentage}%</span>
                    </div>

                    <div className="w-full bg-[#EFE8DE] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor:
                            item.factor === 'Dia tranquilo' || item.factor === 'Passeio ao ar livre'
                              ? '#7D9D7F'
                              : '#C58B68'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FAF5ED] p-3 rounded-2xl border border-[#EAE0D2] text-[11px] text-[#6E5D4F]">
                💡 <strong>Insight de Correlação:</strong> Nos dias com <em>Cansaço físico</em> assinalado, a paciência com as crianças reduziu 25%. Priorizar pausas de 10 minutos após o almoço ameniza esse padrão.
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 4: DESEMPENHO POR ÁREA DA VIDA (ACORDEÃO VERTICAL)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
          <button
            onClick={() => toggleSection('areas')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.areas}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-lg">
                🌱
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] flex items-center gap-2">
                  <span>Por Área da Vida</span>
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Maternidade, Organização, Emocional e Saúde
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7A6B]">
                {lifeAreas.length} áreas
              </span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.areas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.areas && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-3">
              <div className="space-y-3">
                {[...lifeAreas]
                  .map((area) => {
                    const areaPerf = calculateAreaPerformance(area.id, questionResponses, questions);
                    const score = areaPerf.hasEvaluatedAnswers
                      ? areaPerf.positivePercentage
                      : area.id === 'area-maternidade'
                      ? 82
                      : area.id === 'area-alimentacao'
                      ? 65
                      : 75;
                    return { area, areaPerf, score };
                  })
                  .sort((a, b) => b.score - a.score)
                  .map(({ area, score }) => (
                    <div
                      key={area.id}
                      onClick={() => setSelectedAreaFilter(area.id)}
                      className="p-3 bg-[#FDFBF7] hover:bg-[#FAF8F5] border border-[#EFE8DE] rounded-2xl cursor-pointer transition-all space-y-1.5"
                      title="Clique para filtrar perguntas desta área"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#2C2C2C] flex items-center gap-1.5">
                          <span>{area.icon || '📌'}</span>
                          <span>{area.name}</span>
                        </span>
                        <span className="font-extrabold text-[#2C2C2C]">{score}%</span>
                      </div>

                      <div className="w-full bg-[#EFE8DE] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#7D9D7F] h-full rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              {selectedAreaFilter !== 'todas' && (
                <button
                  onClick={() => setSelectedAreaFilter('todas')}
                  className="text-xs font-bold text-[#8C7A6B] hover:text-[#5C4F44] underline block pt-1"
                >
                  Limpar filtro de área (Ver todas)
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 5: ACOMPANHAMENTO DETALHADO POR PERGUNTA / HÁBITO
            (Com visualização isolada de Hábitos Bons, Ruins e Ambos)
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all">
          <button
            onClick={() => toggleSection('habitos')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none"
            aria-expanded={openSections.habitos}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#F7EEE3] flex items-center justify-center text-lg">
                ✅
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] flex items-center gap-2">
                  <span>Acompanhamento de Hábitos & Comportamentos</span>
                </h2>
                <p className="text-xs text-[#8C7A6B]">
                  Separados entre hábitos bons e ruins, ordenados do maior para o menor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7A6B]">
                {filteredQuestions.length} indicadores
              </span>
              <div className="w-7 h-7 rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
                {openSections.habitos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </button>

          {openSections.habitos && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#EFE8DE]/60 space-y-4">
              {/* 3 Tabs to isolate and compare: Ambos / Hábitos Bons / Hábitos Ruins */}
              <div className="bg-[#EFE8DE] p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHabitsViewMode('todos')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all ${
                    habitsViewMode === 'todos'
                      ? 'bg-[#FAF8F5] text-[#2C2C2C] shadow-2xs'
                      : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
                  }`}
                >
                  Visão Comparativa
                </button>
                <button
                  type="button"
                  onClick={() => setHabitsViewMode('bons')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    habitsViewMode === 'bons'
                      ? 'bg-[#EEF5EF] text-[#2C5230] shadow-2xs border border-[#B7D2B9]'
                      : 'text-[#8C7A6B] hover:text-[#2C5230]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#3B7A42]" />
                  <span>Hábitos Bons</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHabitsViewMode('ruins')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    habitsViewMode === 'ruins'
                      ? 'bg-[#FDF2EE] text-[#8C3A24] shadow-2xs border border-[#E8C2B8]'
                      : 'text-[#8C7A6B] hover:text-[#8C3A24]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#B8472E]" />
                  <span>A Evitar</span>
                </button>
              </div>

              {/* Reference Box: 26/30 Confirmações Positivas */}
              <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2C2C]">
                      Consolidado de Indicadores
                    </h3>
                    <span className="text-[11px] text-[#8C7A6B]">
                      {period === 'mes' ? 'Exemplo 30 dias (Novembro)' : 'Período Selecionado'}
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-[#2C2C2C]">
                    {metrics.positivoCount || 26}/30
                  </span>
                </div>

                <div className="w-full bg-[#EFE8DE] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#7D9D7F] h-full rounded-full transition-all duration-500"
                    style={{ width: `${positivePercent}%` }}
                  />
                </div>

                {/* 4 Summary metric tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-white border border-[#EFE8DE] p-2 rounded-xl">
                    <span className="text-base font-extrabold text-[#2C2C2C] block">
                      {metrics.positivoCount || 26}
                    </span>
                    <span className="text-[10px] text-[#6E5D4F]">Positivos</span>
                  </div>
                  <div className="bg-white border border-[#EFE8DE] p-2 rounded-xl">
                    <span className="text-base font-extrabold text-[#8C3A24] block">
                      {metrics.negativoCount || 2}
                    </span>
                    <span className="text-[10px] text-[#6E5D4F]">Negativos</span>
                  </div>
                  <div className="bg-white border border-[#EFE8DE] p-2 rounded-xl">
                    <span className="text-base font-extrabold text-[#8C6D1F] block">
                      {metrics.naoLembroCount || 1}
                    </span>
                    <span className="text-[10px] text-[#8C7A6B]">Não confirmado</span>
                  </div>
                  <div className="bg-white border border-[#EFE8DE] p-2 rounded-xl">
                    <span className="text-base font-extrabold text-[#5C4F44] block">
                      {metrics.naoSeAplicaCount || 1}
                    </span>
                    <span className="text-[10px] text-[#8C7A6B]">Não aplicável</span>
                  </div>
                </div>
              </div>

              {/* List of individual questions sorted descending from highest to lowest */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-[#4A3E34]">
                  <span>Frequência Detalhada (Maior para Menor):</span>
                  <span className="text-[10px] text-[#8C7A6B] font-normal">
                    {habitsViewMode === 'bons'
                      ? 'Apenas Hábitos Bons'
                      : habitsViewMode === 'ruins'
                      ? 'Apenas Comportamentos a Evitar'
                      : 'Ambos Comparados'}
                  </span>
                </div>

                {filteredQuestions
                  .filter((q) => {
                    if (habitsViewMode === 'bons') return q.habitType === 'bom';
                    if (habitsViewMode === 'ruins') return q.habitType === 'ruim';
                    return true;
                  })
                  .map((q) => {
                    const stats = calculateQuestionStats(q, questionResponses, 30);
                    return { q, stats };
                  })
                  .sort((a, b) => b.stats.successRate - a.stats.successRate)
                  .map(({ q, stats }) => {
                    const isGood = stats.habitType === 'bom';

                    return (
                      <div
                        key={q.id}
                        className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                                isGood ? 'bg-[#3B7A42]' : 'bg-[#B8472E]'
                              }`}
                            />
                            <div>
                              <span className="text-xs font-bold text-[#2C2C2C] block">
                                {q.title}
                              </span>
                              <span className="text-[10px] text-[#8C7A6B] block mt-0.5">
                                {isGood ? 'Hábito Desejável (Sim é Positivo)' : 'Comportamento a Evitar (Sim é Negativo)'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isGood ? (
                              <span className="text-[11px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2.5 py-0.5 rounded-full border border-[#B7D2B9]">
                                {stats.badgeText}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-[#8C3A24] bg-[#FDF2EE] px-2.5 py-0.5 rounded-full border border-[#E8C2B8]">
                                {stats.badgeText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#EFE8DE] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${stats.successRate}%`,
                              backgroundColor: isGood ? '#7D9D7F' : '#C06C54'
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-[#6E5D4F]">
                          <span>{stats.summaryLabel}</span>
                          <span className="font-extrabold text-[#2C2C2C]">{stats.successRate}% taxa</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CARD 6: PRINCIPAIS INSIGHTS DA ASSISTENTE IA
           ======================================================== */}
        <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#B78A58]">
              <Sparkles className="w-4 h-4 text-[#B78A58]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C2C2C]">Principais Insights da IA</h3>
              <p className="text-[11px] text-[#8C7A6B]">
                Padrões acolhedores identificados a partir dos seus registros
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#5C4F44]">
              <Smile className="w-4 h-4 text-[#7D9D7F] shrink-0 mt-0.5" />
              <p>
                Seu humor melhorou <strong>18% neste mês</strong>, especialmente nos dias com sono adequado. Tente manter uma rotina de sono consistente aos fins de semana.
              </p>
            </div>

            <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#5C4F44]">
              <Heart className="w-4 h-4 text-[#B78A58] shrink-0 mt-0.5" />
              <p>
                Você manteve a calma com as crianças em <strong>93% dos dias</strong>! A sua dedicação aos momentos individuais com Bryan e Benício gerou grande harmonia.
              </p>
            </div>

            <div className="bg-[#FDFBF7] border border-[#EFE8DE] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#5C4F44]">
              <Clock className="w-4 h-4 text-[#8C7A6B] shrink-0 mt-0.5" />
              <p>
                O almoço foi preparado no horário planejado em <strong>26 de 30 dias</strong> (86% de taxa de sucesso).
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAiWithAnalysis}
            className="w-full py-2.5 rounded-xl bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <Bot className="w-4 h-4 text-[#8C7A6B]" />
            <span>Ver análise completa com a Assistente IA</span>
          </button>
        </div>

        {/* ========================================================
            CARD 7: SEÇÃO ESPECIAL — REVISÃO DO MÊS
            (Retrato dos seus registros, sem julgamento)
            [Conforme Screenshot c795228e-6137-4b6f-994e-c316d440b561.png]
           ======================================================== */}
        <div
          id="secao-revisao-mes"
          className="bg-[#FAF8F5] border-2 border-[#E4DACD] rounded-3xl overflow-hidden shadow-[0_6px_24px_rgba(140,122,107,0.08)] transition-all"
        >
          <button
            onClick={() => toggleSection('revisaoMes')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none bg-[#F7F2EA]"
            aria-expanded={openSections.revisaoMes}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#EFE8DE] flex items-center justify-center text-lg shadow-2xs">
                📜
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#2C2C2C]">
                    Revisão do Mês
                  </h2>
                  <span className="text-[10px] font-bold text-[#8C7A6B] bg-[#EAE0D2] px-2 py-0.5 rounded-full">
                    {monthlyReview.period}
                  </span>
                </div>
                <p className="text-xs text-[#8C7A6B]">
                  Fechamento mensal consolidado • Sem julgamento
                </p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-full bg-[#EFE8DE] flex items-center justify-center text-[#8C7A6B]">
              {openSections.revisaoMes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {openSections.revisaoMes && (
            <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#EFE8DE] space-y-4">
              {/* Warm Non-Judgmental Manifesto Banner */}
              <div className="bg-[#FAF5ED] border border-[#EAE0D2] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-[#5C4F44] leading-relaxed">
                <Heart className="w-4 h-4 text-[#B78A58] shrink-0 mt-0.5 fill-[#B78A58]/20" />
                <p>
                  <em>
                    &quot;Não é uma nota para avaliar se você foi uma boa mãe, uma boa dona de casa ou uma pessoa produtiva. É um retrato acolhedor dos seus passos, sem julgamento.&quot;
                  </em>
                </p>
              </div>

              {/* 7 Pillars of Monthly Review */}
              <div className="space-y-3">
                {/* Pilar 1: Meu Mapa */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>1.</span>
                      <span>Indicadores do Meu Mapa</span>
                    </span>
                    <span className="font-extrabold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                      {monthlyReview.positiveRate}% Positivo
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    Destaque especial na área de <strong>{monthlyReview.mapSummary.topArea}</strong> com {monthlyReview.mapSummary.topAreaScore}% de consistência positiva.
                  </p>
                </div>

                {/* Pilar 2: Regularidade nas Rotinas */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>2.</span>
                      <span>Regularidade nas Rotinas</span>
                    </span>
                    <span className="font-extrabold text-[#5C4F44]">
                      {monthlyReview.routineRegularity.completionRate}% cumpridas
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    O período da <strong>{monthlyReview.routineRegularity.bestPeriod}</strong> teve a maior consistência, impulsionando a sensação de calma pelo resto do dia.
                  </p>
                </div>

                {/* Pilar 3: Compromissos da Agenda */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>3.</span>
                      <span>Compromissos da Agenda</span>
                    </span>
                    <span className="font-extrabold text-[#5C4F44]">
                      {monthlyReview.agendaSummary.completedEvents} de {monthlyReview.agendaSummary.totalEvents} cumpridos
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    Eventos como futebol das crianças, aniversário da vovó e momentos em família foram acolhidos e realizados.
                  </p>
                </div>

                {/* Pilar 4: Medicamentos e Suplementos */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>4.</span>
                      <span>Medicamentos & Suplementos</span>
                    </span>
                    <span className="font-extrabold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                      {monthlyReview.healthCompliance.confirmedDoses}/{monthlyReview.healthCompliance.totalDoses} confirmados
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    Administração regular de Ômega 3 e Ferro com 87% de adesão nos dias programados.
                  </p>
                </div>

                {/* Pilar 5: Metas Concluídas */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>5.</span>
                      <span>Metas Concluídas</span>
                    </span>
                    <span className="font-extrabold text-[#2C5230]">
                      {monthlyReview.goalsSummary.completedGoals} de {monthlyReview.goalsSummary.totalGoals} concluídas
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D4F]">
                    Meta finalizada: <strong>{monthlyReview.goalsSummary.completedNames.join(', ')}</strong>. A meta &quot;Pintar o quarto&quot; avançou para 40%.
                  </p>
                </div>

                {/* Pilar 6: Atividades Pendentes */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      <span>6.</span>
                      <span>Atividades Pendentes a Replanejar</span>
                    </span>
                    <span className="text-[11px] text-[#8C7A6B]">
                      {monthlyReview.pendingTasks.length} itens
                    </span>
                  </div>
                  <ul className="text-xs text-[#6E5D4F] space-y-0.5 list-disc list-inside">
                    {monthlyReview.pendingTasks.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Pilar 7: Padrões Notados */}
                <div className="bg-white border border-[#EFE8DE] rounded-2xl p-3.5 space-y-2">
                  <div className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                    <span>7.</span>
                    <span>Padrões Identificados entre Sono, Humor e Família</span>
                  </div>
                  <div className="space-y-1.5">
                    {monthlyReview.patternsDetected.map((pattern, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#5C4F44]">
                        <span className="text-[#8C7A6B]">•</span>
                        <span>{pattern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions for Next Month */}
              <div className="bg-[#FAF5ED] border border-[#EAE0D2] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-[#2C2C2C] block">
                  Sugestões Carinhosas para o Próximo Mês:
                </span>
                <ul className="space-y-1 text-xs text-[#5C4F44]">
                  {monthlyReview.suggestionsNextMonth.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#B78A58]">✦</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Review Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopyReview}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2ECE0] border border-[#E4DACD] text-[#5C4F44] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  {copiedReview ? (
                    <>
                      <Check className="w-4 h-4 text-[#2C5230]" />
                      <span className="text-[#2C5230]">Revisão Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#8C7A6B]" />
                      <span>Copiar Retrato do Mês</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenAiWithAnalysis}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Bot className="w-4 h-4 text-white" />
                  <span>Conversar sobre a Revisão</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

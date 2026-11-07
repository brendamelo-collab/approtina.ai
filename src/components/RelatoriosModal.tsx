import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, BarChart2, Info, Calendar, Sparkles } from 'lucide-react';
import {
  calculatePerformanceMetrics,
  calculateAreaPerformance
} from '../utils/routineCalculations';

export const RelatoriosModal: React.FC = () => {
  const {
    isRelatoriosModalOpen,
    setIsRelatoriosModalOpen,
    setActiveTab,
    questions,
    questionResponses,
    lifeAreas,
    selectedDate
  } = useApp();

  const [period, setPeriod] = useState<'semanal' | 'mensal' | 'anual'>('mensal');

  if (!isRelatoriosModalOpen) return null;

  // General metrics for the current dataset
  const metrics = calculatePerformanceMetrics(questionResponses, questions);

  const positivePercent = metrics.hasEvaluatedAnswers ? metrics.positivePercentage : 78;
  const negativePercent = 100 - positivePercent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-[#FDFBF7] rounded-3xl p-5 shadow-2xl border border-[#EFE8DE] max-h-[92vh] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#8C7A6B]">
              <BarChart2 className="w-5 h-5 text-[#8C7A6B]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2C2C2C]">
                Relatórios de Evolução & Hábitos
              </h2>
              <p className="text-xs text-[#8C7A6B]">
                Métricas comportamentais consolidadas
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRelatoriosModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#5C4F44]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-4 pr-1">
          {/* Period selector */}
          <div className="flex justify-center">
            <div className="bg-[#FAF8F5] border border-[#EFE8DE] p-1 rounded-2xl flex gap-1">
              {(['semanal', 'mensal', 'anual'] as const).map((p) => {
                const isSelected = period === p;
                const labels = {
                  semanal: 'Semanal',
                  mensal: 'Mensal',
                  anual: 'Anual'
                };
                return (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#8C7A6B] text-white shadow-xs'
                        : 'text-[#8C7A6B] hover:text-[#2C2C2C]'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD 1: Relatório Geral (Matching reference image 9c344603...) */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#2C2C2C]">Relatório geral</h3>
                <span className="text-[11px] text-[#8C7A6B]">Período ilustrativo</span>
              </div>
              <span className="text-[11px] font-bold text-[#5C4F44] bg-[#EAE0D2] px-3 py-1 rounded-full capitalize">
                {period}
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-[#2C2C2C] tracking-tight">
                {positivePercent}%
              </div>
              <p className="text-xs text-[#6E5D4F] mt-0.5">
                Registros positivos entre os registros válidos
              </p>
            </div>

            {/* Dual Progress Bar (Sage Green + Terracotta) */}
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

            {/* Legend */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center gap-1.5 font-bold text-[#2C5230]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7D9D7F]" />
                Positivos: {positivePercent}%
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#8C3A24]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C06C54]" />
                Negativos: {negativePercent}%
              </span>
            </div>
          </div>

          {/* CARD 2: Por Área (Matching reference image 9c344603...) */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-[#2C2C2C]">Por área</h3>

            <div className="space-y-3">
              {lifeAreas.map((area) => {
                const areaPerf = calculateAreaPerformance(area.id, questionResponses, questions);
                const score = areaPerf.hasEvaluatedAnswers ? areaPerf.positivePercentage : 80;

                return (
                  <div key={area.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#2C2C2C] flex items-center gap-1.5">
                        <span>{area.icon || '📌'}</span>
                        <span>{area.name}</span>
                      </span>
                      <span className="font-extrabold text-[#2C2C2C]">{score}%</span>
                    </div>

                    <div className="w-full bg-[#EFE8DE] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#7D9D7F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: Acompanhamento de Hábitos & Contagens Absolutas (Matching reference image 19c7dfbe...) */}
          <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-xs space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-[#2C2C2C]">
                Acompanhamento de Hábitos e Comportamentos
              </h3>
              <p className="text-[11px] text-[#8C7A6B]">
                {period === 'mensal' ? 'Consolidado do Mês (30 dias)' : 'Total de Ocorrências'}
              </p>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-[#2C2C2C]">
                {metrics.positivoCount}/{metrics.evaluatedCount || 30}
              </div>
              <p className="text-xs text-[#6E5D4F]">Ocorrências positivas confirmadas</p>
            </div>

            {/* Green progress bar */}
            <div className="w-full bg-[#EFE8DE] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#7D9D7F] h-full rounded-full transition-all duration-500"
                style={{ width: `${positivePercent}%` }}
              />
            </div>

            {/* 4 Summary metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-white border border-[#EFE8DE] p-2 rounded-xl">
                <span className="text-base font-extrabold text-[#2C5230] block">
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
                <span className="text-base font-extrabold text-[#5C4F44] block">
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

            {/* Individual Habit Counts list */}
            <div className="pt-2 border-t border-[#EFE8DE] space-y-2">
              <span className="text-xs font-bold text-[#4A3E34] block">
                Frequência por Pergunta / Hábito:
              </span>
              <div className="space-y-1.5">
                {questions.map((q) => {
                  const isGood = (q.habitType || (q.positiveIf === 'sim' ? 'bom' : 'ruim')) === 'bom';
                  return (
                    <div
                      key={q.id}
                      className="bg-white border border-[#EFE8DE] rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="pr-2">
                        <span className="font-semibold text-[#2C2C2C] block">{q.title}</span>
                        <span className="text-[10px] text-[#8C7A6B]">
                          {isGood ? 'Hábito Desejável' : 'Comportamento a Evitar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isGood ? (
                          <span className="text-[11px] font-bold text-[#2C5230] bg-[#EEF5EF] px-2 py-0.5 rounded-full border border-[#B7D2B9]">
                            {q.id === 'q-tempo-afeto' ? '28/30' : '26/30'} Positivo
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-[#8C3A24] bg-[#FDF2EE] px-2 py-0.5 rounded-full border border-[#E8C2B8]">
                            {q.id === 'q-paciencia' ? '2x Ocorreu' : '1x Ocorreu'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mathematical Rule Disclaimer */}
            <div className="bg-[#FAF5ED] p-3 rounded-2xl border border-[#EAE0D2] flex items-start gap-2 text-[11px] text-[#6E5D4F]">
              <Info className="w-3.5 h-3.5 text-[#8C7A6B] shrink-0 mt-0.5" />
              <span>
                Regra Matemática: Apenas registros avaliados (Positivos e Negativos) entram no percentual. Respostas neutras (&quot;Não se aplica&quot; e &quot;Não lembro&quot;) nunca penalizam seu progresso.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EFE8DE] flex gap-2">
          <button
            onClick={() => {
              setIsRelatoriosModalOpen(false);
              setActiveTab('relatorios');
            }}
            className="flex-1 py-3 rounded-2xl bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] text-xs font-bold text-center transition-colors shadow-2xs"
          >
            Abrir Tela Completa
          </button>
          <button
            onClick={() => setIsRelatoriosModalOpen(false)}
            className="flex-1 py-3 rounded-2xl bg-[#8C7A6B] hover:bg-[#786657] text-white text-xs font-bold text-center transition-colors shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

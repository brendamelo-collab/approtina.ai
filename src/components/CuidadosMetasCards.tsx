import React from 'react';
import { useApp } from '../context/AppContext';
import { Pill, Target, ChevronRight, CheckCircle2, Heart } from 'lucide-react';
import { calculateHealthCompliance, calculateGoalSummary } from '../utils/routineCalculations';

export const CuidadosMetasCards: React.FC = () => {
  const {
    healthItems,
    goals,
    setActiveTab,
    recurringTasks,
    completeRecurringTask
  } = useApp();

  const { percent: healthPercent } = calculateHealthCompliance(healthItems);
  const { completed, total, averageProgress } = calculateGoalSummary(goals);

  // Next pending recurring task from Screen 1 (e.g. "Lavar os sapatos")
  const pendingRecurring =
    recurringTasks.find((t) => t.status === 'hoje') ||
    recurringTasks.find((t) => t.status === 'pendente') ||
    recurringTasks[0];

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5 select-none space-y-3.5">
      {/* 2 Grid Cards: Cuidados e Saúde & Minhas Metas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Cuidados e Saúde */}
        <div
          onClick={() => setActiveTab('cuidados')}
          className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)] hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)] cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#F7EEE3] flex items-center justify-center text-[#B78A58] group-hover:scale-105 transition-transform">
                <Pill className="w-4 h-4 text-[#B78A58]" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-snug">
              Cuidados e Saúde
            </h3>
            <p className="text-[10px] text-[#8C7A6B] mt-0.5 line-clamp-1">
              Medicamentos e suplementos
            </p>
          </div>

          <div className="mt-3.5 pt-2 border-t border-[#EFE8DE]/60 flex items-center gap-2">
            {/* Soft terracotta ring */}
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 transform -rotate-90">
                <circle
                  stroke="#EFE8DE"
                  strokeWidth="3"
                  fill="transparent"
                  r="10"
                  cx="14"
                  cy="14"
                />
                <circle
                  stroke="#B78A58"
                  strokeWidth="3"
                  strokeDasharray="63"
                  strokeDashoffset={63 - (healthPercent / 100) * 63}
                  strokeLinecap="round"
                  fill="transparent"
                  r="10"
                  cx="14"
                  cy="14"
                />
              </svg>
              <span className="absolute text-[8px] font-bold text-[#5C4F44]">
                {healthPercent}%
              </span>
            </div>
            <div className="text-[10px] font-medium text-[#4A3E34] leading-tight">
              {healthPercent === 100 ? '100% Em dia' : `${healthPercent}% Feito`}
            </div>
          </div>
        </div>

        {/* Card 2: Minhas Metas */}
        <div
          onClick={() => setActiveTab('metas')}
          className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)] hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)] cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#F7EDE4] flex items-center justify-center text-[#9E6C52] group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4 text-[#9E6C52]" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B] group-hover:translate-x-0.5 transition-transform" />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-snug">
              Minhas Metas
            </h3>
            <p className="text-[10px] text-[#8C7A6B] mt-0.5 line-clamp-1">
              Seus objetivos
            </p>
          </div>

          <div className="mt-3.5 pt-2 border-t border-[#EFE8DE]/60 flex items-center gap-2">
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 transform -rotate-90">
                <circle
                  stroke="#EFE8DE"
                  strokeWidth="3"
                  fill="transparent"
                  r="10"
                  cx="14"
                  cy="14"
                />
                <circle
                  stroke="#9E6C52"
                  strokeWidth="3"
                  strokeDasharray="63"
                  strokeDashoffset={63 - (averageProgress / 100) * 63}
                  strokeLinecap="round"
                  fill="transparent"
                  r="10"
                  cx="14"
                  cy="14"
                />
              </svg>
              <span className="absolute text-[8px] font-bold text-[#5C4F44]">
                {averageProgress}%
              </span>
            </div>
            <div className="text-[10px] font-medium text-[#4A3E34] leading-tight">
              {completed} de {total} metas
            </div>
          </div>
        </div>
      </div>

      {/* Screen 1: Tarefas Pendentes & Dica do Dia */}
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-4 shadow-[0_4px_20px_rgba(140,122,107,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">Tarefas pendentes</h3>
          <button
            onClick={() => setActiveTab('recorrentes')}
            className="text-xs text-[#8C7A6B] hover:text-[#5C4F44] font-semibold"
          >
            Ver todas &gt;
          </button>
        </div>

        {pendingRecurring && (
          <div
            onClick={() => setActiveTab('recorrentes')}
            className="p-3 bg-[#F7F4EE] hover:bg-[#F2ECE0] border border-[#EAE3D6] rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👟</span>
              <div>
                <h4 className="text-xs font-bold text-[#2C2C2C]">
                  {pendingRecurring.title}
                </h4>
                <p className="text-[10px] text-[#8C7A6B]">
                  {pendingRecurring.recurrence} • Próximo: {pendingRecurring.nextDate}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-[#5C4F44] bg-[#EAE0D2] px-2.5 py-1 rounded-full">
              {pendingRecurring.status === 'hoje' ? 'Hoje' : 'Pendente'}
            </span>
          </div>
        )}

        {/* Dica do dia from Screen 1 */}
        <div className="bg-[#F7F2EA] border border-[#ECE3D5] rounded-2xl p-3 flex items-center justify-between text-xs text-[#5C4F44]">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#C58B68] fill-[#F6E9DC] shrink-0" />
            <span className="font-semibold">
              Dica do dia: Você já fez a diferença hoje! 💕
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8C7A6B] shrink-0" />
        </div>
      </div>
    </section>
  );
};

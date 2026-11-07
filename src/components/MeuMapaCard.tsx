import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, ChevronRight, Lightbulb } from 'lucide-react';
import { calculatePerformanceMetrics } from '../utils/routineCalculations';

export const MeuMapaCard: React.FC = () => {
  const { currentMood, questionResponses, questions, selectedDate, setIsMoodModalOpen, setActiveTab } = useApp();
  const dayResponses = questionResponses.filter((r) => r.date === selectedDate);
  const metrics = calculatePerformanceMetrics(dayResponses, questions);
  const positivePercent = metrics.hasEvaluatedAnswers ? metrics.positivePercentage : 80;

  // SVG Circular progress math (radius 40, circumference ~251.3)
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (positivePercent / 100) * circumference;

  const moodEmojis: Record<string, string> = {
    otimo: '😃',
    bem: '😊',
    neutro: '😐',
    triste: '😔',
    ansiosa: '🥺'
  };

  const currentEmoji = currentMood ? moodEmojis[currentMood.value || currentMood.mood] || '😊' : '😊';
  const currentLabel = currentMood ? currentMood.label : 'Bem';

  return (
    <section className="w-full max-w-xl mx-auto px-4 sm:px-6 my-3.5 select-none">
      <div className="bg-[#FAF8F5] border border-[#EFE8DE] rounded-3xl p-5 shadow-[0_4px_20px_rgba(140,122,107,0.05)] transition-all hover:shadow-[0_6px_24px_rgba(140,122,107,0.08)]">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4EDE2] flex items-center justify-center text-[#B78A58]">
              <BarChart2 className="w-5 h-5 text-[#B78A58]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#2C2C2C] tracking-tight flex items-center gap-1">
                <span>Meu Mapa</span>
              </h2>
              <p className="text-xs text-[#8C7A6B]">Seu bem-estar em foco</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('mapa')}
            className="w-8 h-8 rounded-full bg-[#F4EDE2] hover:bg-[#EAE0D2] flex items-center justify-center text-[#8C7A6B] transition-colors"
            aria-label="Abrir Meu Mapa completo"
          >
            <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
          </button>
        </div>

        {/* Card Content Row */}
        <div className="grid grid-cols-2 gap-3 items-center py-1">
          {/* Left: Circular gauge */}
          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg height="112" width="112" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  stroke="#EFE8DE"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx="56"
                  cy="56"
                />
                {/* Progress Arc in warm terracotta */}
                <circle
                  stroke="#C58B68"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx="56"
                  cy="56"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Inside Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-[#2C2C2C] leading-none">
                  {positivePercent}%
                </span>
                <span className="text-[11px] font-medium text-[#8C7A6B] mt-1">
                  Positivo
                </span>
              </div>
            </div>
          </div>

          {/* Right: How do you feel today */}
          <div className="flex flex-col items-start justify-center pl-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl filter drop-shadow-sm">{currentEmoji}</span>
              <span className="text-xs font-semibold text-[#3C3C3C] leading-tight">
                Como você se sentiu hoje?
              </span>
            </div>

            <button
              onClick={() => setIsMoodModalOpen(true)}
              className="w-full mt-1 bg-[#EFE8DE] hover:bg-[#E4DACD] text-[#5C4F44] py-2 px-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all active:scale-98 shadow-sm"
            >
              <span>{currentLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#8C7A6B]" />
            </button>
          </div>
        </div>

        {/* Bottom Insight Pill Banner */}
        <div className="mt-4 bg-[#F7F2EA] border border-[#ECE3D5] rounded-2xl p-3 flex items-start gap-2.5">
          <div className="p-1 rounded-lg bg-[#EFE5D5] text-[#B78A58] mt-0.5 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-[#B78A58]" />
          </div>
          <p className="text-xs text-[#5C4F44] leading-relaxed">
            Você foi mais paciente com as crianças nesta semana. Parabéns! 💛
          </p>
        </div>
      </div>
    </section>
  );
};
